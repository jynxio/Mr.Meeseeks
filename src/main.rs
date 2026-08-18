mod de;
mod error;
mod http;
mod providers;

use std::error::Error;

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    providers::openai::login().await?;

    Ok(())
}
