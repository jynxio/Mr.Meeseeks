use std::{path::PathBuf, sync::LazyLock};

use directories::ProjectDirs;

#[cfg(feature = "dev")]
pub(crate) const APP_ID: &str = concat!(env!("CARGO_PKG_NAME"), "-dev");
#[cfg(not(feature = "dev"))]
pub(crate) const APP_ID: &str = env!("CARGO_PKG_NAME");

pub(crate) static CREDENTIALS_PATH: LazyLock<PathBuf> = LazyLock::new(|| {
    ProjectDirs::from("com", "jynxio", APP_ID)
        .unwrap()
        .data_local_dir()
        .join("credentials")
});

#[derive(Debug, PartialEq, Eq, strum::Display, strum::EnumString, strum::AsRefStr)]
#[strum(serialize_all = "lowercase")]
pub(crate) enum ModelProvider {
    OpenAI,
    Anthropic,
}
