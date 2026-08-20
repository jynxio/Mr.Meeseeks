mod auth;

pub async fn login() -> Result<(), anyhow::Error> {
    let http = crate::http::new()?;

    // Device auth request
    let device_auth = auth::req_device_auth(&http).await?;

    // User auth
    auth::log_user_auth(&device_auth.user_code);

    // Auth code polling
    let auth_code = auth::poll_auth_code(
        &http,
        device_auth.interval,
        &device_auth.user_code,
        &device_auth.device_auth_id,
    )
    .await?;

    // Access token request
    let access_token =
        auth::req_access_token(&http, &auth_code.authorization_code, &auth_code.code_verifier).await?;

    // Access token persist
    let plaintext = serde_json::to_vec(&access_token)?;
    let provider = crate::consts::ModelProvider::OpenAI.as_ref();

    super::credentials::set(provider, &plaintext)?;

    // Done
    Ok(())
}
