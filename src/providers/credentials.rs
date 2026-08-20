#[cfg(unix)]
use std::io::Write;
use std::{fs, io, path::Path, path::PathBuf};

use age::{secrecy::ExposeSecret, x25519::Identity};
use keyring::Entry;
use tempfile::NamedTempFile;

pub(super) fn get(provider: &str) -> anyhow::Result<Option<String>> {
    let identity = get_identity(provider)?;
    let ciphertext = fs::read(get_path(provider))?;
    let plaintext = age::decrypt(&identity, &ciphertext)?;

    Ok(Some(String::from_utf8(plaintext)?))
}

pub(super) fn set(provider: &str, plaintext: &[u8]) -> anyhow::Result<()> {
    let identity = get_identity(provider)?;
    let recipient = &identity.to_public();
    let ciphertext = age::encrypt(recipient, plaintext)?;

    write(&get_path(provider), &ciphertext)?;
    Ok(())
}

fn write(path: &Path, data: &[u8]) -> anyhow::Result<()> {
    let dir = path.parent().ok_or_else(|| io::Error::other("@todo"))?;
    fs::create_dir_all(dir)?;

    let mut tmp = NamedTempFile::new_in(dir)?;

    tmp.write_all(data)?;
    tmp.as_file().sync_all()?;
    tmp.persist(path).map_err(|err| err.error)?;
    sync_dir(dir)?;

    return Ok(());

    #[cfg(unix)]
    fn sync_dir(dir: &Path) -> io::Result<()> {
        fs::File::open(dir)?.sync_all()
    }

    #[cfg(not(unix))]
    fn sync_dir(dir: &Path) -> io::Result<()> {
        Ok(())
    }
}

fn get_path(provider: &str) -> PathBuf {
    crate::consts::CREDENTIALS_PATH.join(format!("{provider}.enc"))
}

fn get_identity(provider: &str) -> Result<Identity, crate::error::Error> {
    let user = format!("{provider}-credentials");
    let entry = Entry::new(crate::consts::APP_ID, &user).map_err(|_| crate::error::Error::Credential)?;

    match entry.get_password() {
        Ok(secret) => secret.parse().map_err(|_| crate::error::Error::Credential),

        Err(keyring::Error::NoEntry) => {
            let identity = Identity::generate();

            entry
                .set_password(identity.to_string().expose_secret())
                .map_err(|_| crate::error::Error::Credential)?;
            Ok(identity)
        }
        Err(_) => Err(crate::error::Error::Credential),
    }
}
