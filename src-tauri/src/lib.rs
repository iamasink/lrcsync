use std::{
    path::{Path, PathBuf},
    sync::Mutex,
};

use tauri::{Emitter, Manager};
use tauri_plugin_fs::FsExt;

#[derive(Default)]
struct OpenFiles(Mutex<Vec<String>>);

fn extract_paths(args: impl IntoIterator<Item = String>, cwd: &Path) -> Vec<PathBuf> {
    args.into_iter()
        .skip(1)
        .filter(|arg| !arg.starts_with('-'))
        .map(|arg| cwd.join(arg))
        .filter(|path| path.is_file())
        .collect()
}

fn queue_open(app: &tauri::AppHandle, paths: Vec<PathBuf>) {
    if paths.is_empty() {
        return;
    }

    let scope = app.fs_scope();
    for path in &paths {
        if let Some(parent) = path.parent() {
            let _ = scope.allow_directory(parent, false);
        }
        let _ = scope.allow_file(path);
    }

    let state = app.state::<OpenFiles>();
    state.0.lock().unwrap().extend(
        paths
            .into_iter()
            .map(|path| path.to_string_lossy().into_owned()),
    );
    let _ = app.emit("open-files", ());
}

#[tauri::command]
fn take_open_files(state: tauri::State<OpenFiles>) -> Vec<String> {
    std::mem::take(&mut *state.0.lock().unwrap())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, argv, cwd| {
            queue_open(app, extract_paths(argv, Path::new(&cwd)));
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.set_focus();
            }
        }))
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .manage(OpenFiles::default())
        .invoke_handler(tauri::generate_handler![take_open_files])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            if let Some(window) = app.get_webview_window("main") {
                window.open_devtools();
            }

            let cwd = std::env::current_dir()?;
            queue_open(app.handle(), extract_paths(std::env::args(), &cwd));

            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app_handle, event| {
            let _ = (app_handle, event);
        });
}
