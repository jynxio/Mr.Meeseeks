use directories::ProjectDirs;
use std::{env, error::Error, fs, io, path::PathBuf};

#[cfg(feature = "dev")]
const APP_ID: &str = concat!(env!("CARGO_PKG_NAME"), "-dev");
#[cfg(not(feature = "dev"))]
const APP_ID: &str = env!("CARGO_PKG_NAME");

const CATALOG_FILE: &str = "model-catalog.json";
const CATALOG_URL: &str = "https://models.dev/catalog.json";

pub async fn download() -> Result<(), Box<dyn Error>> {
    let data = req_data().await?;
    let file = get_file()?;

    fs::write(&file, data.as_bytes())?;
    Ok(())
}

async fn req_data() -> Result<String, Box<dyn Error>> {
    Ok(reqwest::get(CATALOG_URL)
        .await?
        .error_for_status()?
        .text()
        .await?)
}

fn get_file() -> Result<PathBuf, Box<dyn Error>> {
    let project_dirs = ProjectDirs::from("com", "jynxio", APP_ID)
        .ok_or_else(|| io::Error::other("failed to determine project directories"))?;
    let cache_dir = project_dirs.cache_dir();

    fs::create_dir_all(cache_dir)?;
    Ok(cache_dir.join(CATALOG_FILE))
}
