// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
  if let Err(e) = app_lib::run() {
    tauri::api::dialog::message(
      None::<&tauri::Window>,
      "Error",
      e.to_string(),
    );
  }
}
