// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
  match app_lib::run() {
    Ok(_) => {}
    Err(e) => tauri::api::dialog::message(None, "Error", e.to_string()),
  }
}
