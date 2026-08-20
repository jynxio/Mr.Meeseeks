use reqwest::{Client, StatusCode};
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::time::{Duration, Instant};

// Copied from Codex
// See https://github.com/openai/codex/blob/9ded177ce7c1c0bd2047f902936c177612ab3434/codex-rs/login/src/auth/manager.rs#L1668
const CLIENT_ID: &str = "app_EMoamEEZ73f0CkXaXp7hrann";

const DEVICE_AUTH_URL: &str = "https://auth.openai.com/api/accounts/deviceauth/usercode";
const USER_VERIFICATION_URL: &str = "https://auth.openai.com/codex/device";
const AUTH_CODE_URL: &str = "https://auth.openai.com/api/accounts/deviceauth/token";
const ACCESS_TOKEN_URL: &str = "https://auth.openai.com/oauth/token";

#[derive(Debug, Deserialize)]
pub(super) struct DeviceAuth {
    #[serde(deserialize_with = "crate::de::u64_from_str")]
    pub(super) interval: u64,
    pub(super) user_code: String,
    pub(super) device_auth_id: String,
}

pub(super) async fn req_device_auth(http: &Client) -> Result<DeviceAuth, crate::error::Error> {
    let req_body = json!({ "client_id": CLIENT_ID });
    let res = http.post(DEVICE_AUTH_URL).json(&req_body).send().await?;
    let res = res.error_for_status()?;
    let res = res.json::<DeviceAuth>().await?;

    Ok(res)
}

pub(super) fn log_user_auth(user_code: &str) {
    let msg = format!("\n1. Open link: {USER_VERIFICATION_URL}\n\n2. Enter code: {user_code}\n");

    println!("{msg}");
}

#[derive(Debug, Deserialize)]
pub(super) struct AuthCode {
    pub(super) code_verifier: String,
    pub(super) code_challenge: String,
    pub(super) authorization_code: String,
}

pub(super) async fn poll_auth_code(
    http: &Client,
    interval: u64,
    user_code: &str,
    device_auth_id: &str,
) -> Result<AuthCode, crate::error::Error> {
    enum Poll<T> {
        Pending,
        Ready(T),
    }

    let start = Instant::now();
    let timeout = Duration::from_secs(10 * 60);

    loop {
        let res = req_auth_code(http, user_code, device_auth_id).await?;

        // Fulfilled
        if let Poll::Ready(res) = res {
            return Ok(res);
        }

        // Timed out
        let elapsed_time = start.elapsed();
        if elapsed_time >= timeout {
            return Err(crate::error::Error::AuthTimedOut);
        }

        let sleep_time = Duration::from_secs(interval);
        if sleep_time >= timeout - elapsed_time {
            return Err(crate::error::Error::AuthTimedOut);
        }

        // Retry delay
        tokio::time::sleep(sleep_time).await;
    }

    async fn req_auth_code(
        http: &Client,
        user_code: &str,
        device_auth_id: &str,
    ) -> Result<Poll<AuthCode>, crate::error::Error> {
        let req_body = json!({ "user_code": user_code, "device_auth_id": device_auth_id, });
        let res = http.post(AUTH_CODE_URL).json(&req_body).send().await?;
        let status = res.status();

        // Pending
        if matches!(status, StatusCode::FORBIDDEN | StatusCode::NOT_ACCEPTABLE) {
            return Ok(Poll::Pending);
        }

        // Rejected
        if !status.is_success() {
            return Err(crate::error::Error::AuthDenied);
        }

        // Fulfilled
        Ok(Poll::Ready(res.json::<AuthCode>().await?))
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub(super) struct AccessToken {
    pub(super) id_token: String,
    pub(super) access_token: String,
    pub(super) refresh_token: String,
}

pub(super) async fn req_access_token(
    http: &Client,
    auth_code: &str,
    code_verifier: &str,
) -> Result<AccessToken, crate::error::Error> {
    let input = [
        ("grant_type", "authorization_code"),
        ("code", auth_code),
        ("redirect_uri", "https://auth.openai.com/deviceauth/callback"),
        ("client_id", CLIENT_ID),
        ("code_verifier", code_verifier),
    ];

    let res = http.post(ACCESS_TOKEN_URL).form(&input).send().await?;
    let res = res.error_for_status()?.json::<AccessToken>().await?;

    Ok(res)
}
