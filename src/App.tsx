import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Box, Button, Text, VStack, Center, HStack } from "@chakra-ui/react";

type FileInfo = {
  name: string;
  path: string;
  size: number;
  createdAt: string | null;
  modifiedAt: string | null;
  isImage: boolean;
};

function App() {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalMb, setTotalMb] = useState(0);
  const [totalFilesDeleted, setTotalFilesDeleted] = useState(0);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  // Charger les fichiers
  useEffect(() => {
    invoke<FileInfo[]>("get_downloads")
      .then(setFiles)
      .catch((err) => console.error("Failed to get downloads:", err));
  }, []);

  // Mettre à jour l'image pour preview
  useEffect(() => {
    if (files[currentIndex]?.isImage === false) {
      setImageSrc(null);
      return;
    }
    const testPath = files[currentIndex]?.path;
    if (!testPath) return;

    invoke<string>("read_file_base64", { path: testPath })
      .then((dataUrl) => {
        setImageSrc(dataUrl);
      })
      .catch((err) => {
        console.error("Failed to read file:", err);
      });
  }, [files, currentIndex]);

  const handleSwipe = async (keep: boolean) => {
    const currentFile = files[currentIndex];
    if (!keep) {
      await invoke("delete_file", { path: currentFile.path }).then(() => {
        setTotalMb((prev) => prev + currentFile.size / 1024 / 1024);
        setTotalFilesDeleted((prev) => prev + 1);
      });
    }
    setCurrentIndex((prev) => prev + 1);
  };

  const handleOpenFinder = async (path: string) => {
    try {
      await invoke("open_in_finder", { path });
    } catch (err) {
      console.error("Failed to open Finder:", err);
    }
  };

  // Affichage si aucun fichier
  if (files.length === 0)
    return (
      <Center h="100vh" bg="gray.100">
        <Text fontSize="lg" color="gray.500">
          No files to display.
        </Text>
      </Center>
    );

  // Affichage si tous les fichiers traités
  if (currentIndex >= files.length)
    return (
      <Center h="100vh" bg="gray.100">
        <Text fontSize="lg" color="gray.500">
          Finished! All files have been reviewed.
        </Text>
        <Text fontSize="sm" color="blackAlpha.800" fontWeight="bold">
          Total Deleted: {totalMb.toFixed(2)} MB
        </Text>
        <Text fontSize="sm" color="blackAlpha.800" fontWeight="bold">
          Total Files Deleted: {totalFilesDeleted}
        </Text>
      </Center>
    );

  const currentFile = files[currentIndex];

  return (
    <Center h="100vh" bgGradient="linear(to-br, purple.700, pink.500)" p={4}>
      <Box position="absolute" top={4} right={4} textAlign="right">
        <Text fontSize="sm" color="blackAlpha.800" fontWeight="bold">
          Total Deleted: {totalMb.toFixed(2)} MB
        </Text>
        <Text fontSize="sm" color="whiteAlpha.800">
          Remaining: {files.length - currentIndex} files
        </Text>
      </Box>
      <VStack w={{ base: "90%", md: "400px" }} align="center">
        <Box
          w="100%"
          height={"500px"}
          mb={6}
          p={6}
          bg="whiteAlpha.800"
          borderRadius="xl"
          boxShadow="xl"
          transition="transform 0.2s"
          _hover={{ transform: "scale(1.03)" }}
        >
          <VStack height={"100%"} alignItems={"flex-start"} justify="flex-end">
            <Box h="70%" w="100%" bg="blackAlpha.100">
              {(imageSrc && currentFile.path.endsWith(".png")) ||
              currentFile.path.endsWith(".jpg") ||
              currentFile.path.endsWith(".jpeg") ||
              currentFile.path.endsWith(".gif") ||
              currentFile.path.endsWith(".webp") ? (
                <img
                  src={imageSrc ?? "/file.svg"}
                  alt={currentFile.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <Box
                  height={"100%"}
                  width={"100%"}
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                  justifyContent="center"
                >
                  <img
                    src="/file.svg"
                    alt="Delete"
                    style={{ width: "50%", height: "50%" }}
                  />
                </Box>
              )}
            </Box>
            <HStack justify="space-between" w="100%">
              <Text fontWeight="bold">
                {currentFile.name.length > 30
                  ? currentFile.name.slice(0, 20) + "..."
                  : currentFile.name}
              </Text>
              <Text fontSize="sm" color="gray.500">
                {(currentFile.size / 1024 / 1024).toFixed(2)} MB
              </Text>
            </HStack>
            <Text fontSize="sm" color="gray.500">
              📅 Added:{" "}
              {currentFile.createdAt
                ? new Date(currentFile.createdAt).toLocaleDateString()
                : "Unknown"}
            </Text>
            <Text fontSize="sm" color="gray.200">
              {currentIndex + 1} / {files.length}
            </Text>
          </VStack>
        </Box>

        <HStack w="100%" justify="center" gap={6}>
          <Button
            size="lg"
            width={"60px"}
            height={"60px"}
            borderRadius={"full"}
            bgColor={"red"}
            onClick={() => handleSwipe(false)}
            _hover={{ transform: "scale(1.05)" }}
            p={0}
          >
            <img
              src="/cross.svg"
              alt="Delete"
              style={{ width: "50%", height: "50%" }}
            />
          </Button>
          <Button
            width={"50px"}
            height={"50px"}
            borderRadius={"full"}
            bgColor={"gray"}
            onClick={() => handleOpenFinder(currentFile.path)}
            _hover={{ transform: "scale(1.05)" }}
            p={0}
          >
            <img
              src="/finder.svg"
              alt="Open in Finder"
              style={{ width: "60%", height: "60%" }}
            />
          </Button>
          <Button
            size="lg"
            width="60px"
            height="60px"
            borderRadius="full"
            bgColor="green"
            onClick={() => handleSwipe(true)}
            _hover={{ transform: "scale(1.05)" }}
            p={0}
          >
            <img
              src="/heart.svg"
              alt="Check"
              style={{ width: "50%", height: "50%" }}
            />
          </Button>
        </HStack>
      </VStack>
    </Center>
  );
}

export default App;
