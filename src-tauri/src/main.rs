use std::fs;
use std::path::Path;
use chrono::{DateTime, Local};
use serde::Serialize;
use tauri::Manager;
use tauri::Window;
use std::process::Command;

#[derive(Serialize)]
struct FileInfo {
    name: String,
    path: String,
    size: u64,
    created_at: Option<String>,
    modified_at: Option<String>,
    is_image: bool,
}

#[tauri::command]
fn get_downloads() -> Vec<FileInfo> {
    let downloads = dirs::download_dir().unwrap();
    let mut files = Vec::new();

    for entry in fs::read_dir(downloads).unwrap() {
        if let Ok(entry) = entry {
            let path = entry.path();
            if let Ok(metadata) = fs::metadata(&path) {
                let name = path.file_name().unwrap().to_string_lossy().to_string();

                let created_at = metadata.created().ok().map(|t| {
                    let dt: DateTime<Local> = t.into();
                    dt.to_rfc3339()
                });

                let modified_at = metadata.modified().ok().map(|t| {
                    let dt: DateTime<Local> = t.into();
                    dt.to_rfc3339()
                });

                let is_image = matches!(
                    path.extension().and_then(|e| e.to_str()).map(|s| s.to_lowercase()).as_deref(),
                    Some("png") | Some("jpg") | Some("jpeg") | Some("gif") | Some("webp")
                );

                files.push(FileInfo {
                    name,
                    path: path.to_string_lossy().to_string(),
                    size: metadata.len(),
                    created_at,
                    modified_at,
                    is_image,
                });
            }
        }
    }

    files
}

#[tauri::command]
fn delete_file(path: String) -> bool {
    fs::remove_file(path).is_ok()
}

#[tauri::command]
fn read_file_base64(path: String) -> Result<String, String> {
    let bytes = fs::read(&path).map_err(|e| e.to_string())?;

    let mime = match Path::new(&path)
        .extension()
        .and_then(|e| e.to_str())
        .map(|s| s.to_lowercase())
        .as_deref()
    {
        Some("png") => "image/png",
        Some("jpg") | Some("jpeg") => "image/jpeg",
        Some("gif") => "image/gif",
        Some("webp") => "image/webp",
        _ => "application/octet-stream",
    };

    let base64_str = base64::encode(bytes);

    Ok(format!("data:{};base64,{}", mime, base64_str))
}



#[tauri::command]
fn open_in_finder(path: String) -> Result<(), String> {
    let path = std::path::Path::new(&path);

    if !path.exists() {
        return Err("Path does not exist".into());
    }

    // macOS : open le dossier parent et sélectionner le fichier
    Command::new("osascript")
        .arg("-e")
        .arg(format!(r#"tell application "Finder" to reveal POSIX file "{}""#, path.display()))
        .status()
        .map_err(|e: std::io::Error| e.to_string())?;

    // puis focus sur Finder
    Command::new("osascript")
        .arg("-e")
        .arg("tell application \"Finder\" to activate")
        .status()
        .map_err(|e: std::io::Error| e.to_string())?;

    Ok(())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![get_downloads, delete_file, read_file_base64, open_in_finder])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}