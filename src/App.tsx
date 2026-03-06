import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { Box, Button, Text, VStack, Center, HStack } from "@chakra-ui/react";

type FileInfo = {
  name: string;
  path: string;
  size: number;
  createdAt: string | null;
  modifiedAt: string | null;
  isImage: boolean;
  file_type: string;
};

function App() {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalMb, setTotalMb] = useState(0);
  const [totalFilesDeleted, setTotalFilesDeleted] = useState(0);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [folder, setFolder] = useState<string | null>(null);

  // Charger les fichiers
  useEffect(() => {
    invoke<FileInfo[]>("get_downloads", { folder })
      .then(setFiles)
      .catch((err) => console.error("Failed to get downloads:", err));
  }, [folder]);

  // Ouvrir le Finder pour choisir un dossier
  const handleSelectFolder = async () => {
    const selected = await open({ directory: true });
    if (selected && typeof selected === "string") {
      setFolder(selected);
      setCurrentIndex(0);
      setTotalMb(0);
      setTotalFilesDeleted(0);
    }
  };

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
        <VStack>
          <Button colorScheme="purple" onClick={handleSelectFolder}>
            Choose a folder
          </Button>
          <Text fontSize="lg" color="gray.500">
            No files to display.
          </Text>
        </VStack>
      </Center>
    );

  // Affichage si tous les fichiers traités
  if (currentIndex >= files.length)
    return (
      <Center h="100vh" bg="gray.100">
        <VStack>
          <Button colorScheme="purple" onClick={handleSelectFolder}>
            Choose another folder
          </Button>
          <Text fontSize="lg" color="gray.500">
            Finished! All files have been reviewed.
          </Text>
          <Text fontSize="sm" color="blackAlpha.800" fontWeight="bold">
            Total Deleted: {totalMb.toFixed(2)} MB
          </Text>
          <Text fontSize="sm" color="blackAlpha.800" fontWeight="bold">
            Total Files Deleted: {totalFilesDeleted}
          </Text>
        </VStack>
      </Center>
    );

  const currentFile = files[currentIndex];

  const getCurrentFileIcon = () => {
    switch (currentFile.file_type) {
      case "folder":
        return "/folder.svg";
      case "pdf":
        return "/pdf.svg";
      case "icns":
        return "/file.svg";
      case "pptx":
        return "/file.svg";
      case "txt":
        return "/file.svg";
      case "svg":
        return "/file.svg";
      case "mp3":
        return "/file.svg";
      case "HEIC":
        return "/file.svg";
      default:
        return "/file.svg";
    }
  };

  return (
  <VStack
    h="100vh"
    w="100%"
    bgGradient="linear(to-br, purple.700, pink.500)"
    p={4}
  >
    {/* Header */}
    <HStack w="100%" justify="space-between">
      <VStack align="flex-start">
        <Button colorScheme="purple" size="sm" onClick={handleSelectFolder}>
          Choose a folder
        </Button>

        {folder && (
          <Text fontSize="xs" color="blackAlpha.800">
            Folder: {folder}
          </Text>
        )}
      </VStack>

      <VStack align="flex-end">
        <Text fontSize="sm" color="black" fontWeight="bold">
          Total Deleted: {totalMb.toFixed(2)} MB
        </Text>

        <Text fontSize="sm" color="black">
          Remaining: {files.length - currentIndex} files
        </Text>
      </VStack>
    </HStack>

    {/* Main content */}
    <Center flex={1} w="100%">
      <VStack w={{ base: "90%", md: "400px" }} align="center">
        <Box
          w="100%"
          height="500px"
          mb={6}
          p={6}
          bg="whiteAlpha.800"
          borderRadius="xl"
          boxShadow="xl"
          transition="transform 0.2s"
          _hover={{ transform: "scale(1.03)" }}
        >
          <VStack height="100%" alignItems="flex-start" justify="flex-end">
            {/* IMAGE */}
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
                  height="100%"
                  width="100%"
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                  justifyContent="center"
                >
                  <img
                    src={getCurrentFileIcon()}
                    alt="file"
                    style={{ width: "50%", height: "50%" }}
                  />
                </Box>
              )}
            </Box>

            {/* Infos */}
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

            <Text fontSize="sm" color="gray.400">
              {currentIndex + 1} / {files.length}
            </Text>
          </VStack>
        </Box>

        {/* Actions */}
        <HStack w="100%" justify="center" gap={6}>
          <Button
            size="lg"
            w="60px"
            h="60px"
            borderRadius="full"
            bg="red"
            onClick={() => handleSwipe(false)}
            _hover={{ transform: "scale(1.05)" }}
            p={0}
          >
            <img src="/cross.svg" style={{ width: "50%", height: "50%" }} />
          </Button>

          <Button
            w="50px"
            h="50px"
            borderRadius="full"
            bg="gray"
            onClick={() => handleOpenFinder(currentFile.path)}
            _hover={{ transform: "scale(1.05)" }}
            p={0}
          >
            <img src="/finder.svg" style={{ width: "60%", height: "60%" }} />
          </Button>

          <Button
            size="lg"
            w="60px"
            h="60px"
            borderRadius="full"
            bg="green"
            onClick={() => handleSwipe(true)}
            _hover={{ transform: "scale(1.05)" }}
            p={0}
          >
            <img src="/heart.svg" style={{ width: "50%", height: "50%" }} />
          </Button>
        </HStack>
      </VStack>
    </Center>
  </VStack>
);
}

export default App;
