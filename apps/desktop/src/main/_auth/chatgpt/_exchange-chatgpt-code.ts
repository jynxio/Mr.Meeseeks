import z from "zod";

import { CHATGPT_OAUTH } from "./_consts";
import { extractAccountId } from "./_extract-chatgpt-account-id";

const tokenResponseSchema = z.object({
    id_token: z.string().optional(),
    access_token: z.string(),
    refresh_token: z.string(),
    expires_in: z.number().optional(),
});

const normalize = (tokens: z.infer<typeof tokenResponseSchema>) => {
    const claimTokens = {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        ...(tokens.id_token === undefined ? {} : { id_token: tokens.id_token }),
    };
    const accountId = extractAccountId(claimTokens);

    return {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: Date.now() + (tokens.expires_in ?? 3600) * 1000,
        ...(tokens.id_token === undefined ? {} : { idToken: tokens.id_token }),
        ...(accountId === undefined ? {} : { accountId }),
    };
};

async function exchangeChatGPTCode(input: {
    authorizationCode: string;
    codeVerifier: string;
    redirectUri?: string;
}): Promise<ReturnType<typeof normalize>> {
    const res = await fetch(`${CHATGPT_OAUTH.ISSUER}/oauth/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            grant_type: "authorization_code",
            code: input.authorizationCode,
            redirect_uri: input.redirectUri ?? CHATGPT_OAUTH.DEVICE_CALLBACK_URL,
            client_id: CHATGPT_OAUTH.CLIENT_ID,
            code_verifier: input.codeVerifier,
        }).toString(),
    });

    if (!res.ok) throw new Error(`Token exchange failed: ${res.status}`);

    return normalize(tokenResponseSchema.parse(await res.json()));
}

export {
    exchangeChatGPTCode,
    normalize as normalizeChatGPTTokenResponse,
    tokenResponseSchema as ChatGPTTokenResponseSchema,
};
