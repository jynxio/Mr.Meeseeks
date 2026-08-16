use reqwest::{Client, Error};

#[cfg(feature = "dev")]
const USER_AGENT: &str = concat!(env!("CARGO_PKG_NAME"), "/dev");
#[cfg(not(feature = "dev"))]
const USER_AGENT: &str = concat!(env!("CARGO_PKG_NAME"), env!("CARGO_PKG_VERSION"));

pub fn new() -> Result<Client, Error> {
    Client::builder().user_agent(USER_AGENT).build()
}
