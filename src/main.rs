use std::error::Error;

mod infra;
mod providers;

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    Ok(())
}
