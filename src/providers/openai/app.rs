#[derive(Debug, thiserror::Error)]
pub(super) enum Error {
    #[error("@todo")]
    Transport(#[from] reqwest::Error),

    #[error("@todo")]
    InvalidRes(String),

    #[error("@todo")]
    AuthPending,

    #[error("@todo")]
    AuthTimedOut,

    #[error("@todo")]
    AuthDenied,

    #[error("@todo")]
    Expired,
}
