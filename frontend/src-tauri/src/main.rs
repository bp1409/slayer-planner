#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default();
    let builder = if option_env!("TAURI_UPDATER_PUBLIC_KEY").is_some() {
        builder.plugin(tauri_plugin_updater::Builder::new().build())
    } else {
        builder
    };
    builder.run(tauri::generate_context!())
        .expect("error while running Slayer Planner");
}

fn main() {
    run();
}
