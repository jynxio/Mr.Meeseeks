mod app;
mod auth;
mod http;

pub async fn login() -> Result<(), app::Error> {
    let http_impl = http::new()?;

    // Device auth request
    let device_auth = auth::req_device_auth(&http_impl).await?;

    // User auth
    auth::log_user_auth(&device_auth.user_code);

    // Auth code polling
    let auth_code = auth::poll_auth_code(
        &http_impl,
        device_auth.interval,
        &device_auth.user_code,
        &device_auth.device_auth_id,
    )
    .await?;

    // Access token request
    let access_token = auth::req_access_token(
        &http_impl,
        &auth_code.authorization_code,
        &auth_code.code_verifier,
    )
    .await?;

    Ok(())
}
