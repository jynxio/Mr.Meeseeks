import { CHATGPT_OAUTH } from "./_consts";
import { ChatGPTTokenResponseSchema, normalizeChatGPTTokenResponse } from "./_exchange-chatgpt-code";

async function refreshChatGPTToken(
    refreshToken: string,
): Promise<ReturnType<typeof normalizeChatGPTTokenResponse>> {
    const res = await fetch(`${CHATGPT_OAUTH.ISSUER}/oauth/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            grant_type: "refresh_token",
            refresh_token: refreshToken,
            client_id: CHATGPT_OAUTH.CLIENT_ID,
        }).toString(),
    });

    if (!res.ok) throw new Error(`Token refresh failed: ${res.status}`);

    return normalizeChatGPTTokenResponse(ChatGPTTokenResponseSchema.parse(await res.json()));
}

export { refreshChatGPTToken };
