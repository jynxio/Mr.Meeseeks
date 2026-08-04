export interface IdTokenClaims {
    chatgpt_account_id?: string;
    organizations?: Array<{ id: string }>;
    email?: string;
    "https://api.openai.com/auth"?: {
        chatgpt_account_id?: string;
    };
}

export interface ChatGPTTokenClaimsInput {
    id_token?: string;
    access_token?: string;
    refresh_token?: string;
    idToken?: string;
    accessToken?: string;
    refreshToken?: string;
}

export function parseJwtClaims(token: string): IdTokenClaims | undefined {
    const parts = token.split(".");
    if (parts.length !== 3) return undefined;
    const payload = parts[1];
    if (!payload) return undefined;

    try {
        const claims = JSON.parse(Buffer.from(payload, "base64url").toString());
        if (typeof claims !== "object" || claims === null) return undefined;

        return claims as IdTokenClaims;
    } catch {
        return undefined;
    }
}

export function extractAccountIdFromClaims(claims: IdTokenClaims): string | undefined {
    return (
        claims.chatgpt_account_id ||
        claims["https://api.openai.com/auth"]?.chatgpt_account_id ||
        claims.organizations?.[0]?.id
    );
}

export function extractAccountId(tokens: ChatGPTTokenClaimsInput): string | undefined {
    const idToken = tokens.id_token ?? tokens.idToken;
    if (idToken) {
        const claims = parseJwtClaims(idToken);
        const accountId = claims && extractAccountIdFromClaims(claims);
        if (accountId) return accountId;
    }

    const accessToken = tokens.access_token ?? tokens.accessToken;
    if (accessToken) {
        const claims = parseJwtClaims(accessToken);
        return claims ? extractAccountIdFromClaims(claims) : undefined;
    }

    return undefined;
}
