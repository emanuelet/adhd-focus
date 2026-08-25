use tauri::{WebviewUrl, WebviewWindowBuilder};

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::default().build())
        .setup(|app| {
            let remote_url = "https://adhdfocus.etonello.work"
                .parse()
                .expect("configured remote URL must be valid");
            WebviewWindowBuilder::new(app, "main", WebviewUrl::External(remote_url))
                .title("ADHD Focus")
                .build()?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running ADHD Focus");
}
