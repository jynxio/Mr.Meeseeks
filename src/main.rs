use std::error::Error;

mod model_catalog;

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    dotenvy::dotenv().ok();
    model_catalog::download().await?;

    Ok(())
}
