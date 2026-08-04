import z from "zod";

import { CHATGPT_OAUTH } from "./_consts";

const originalSchema = z.object({
    authorization_code: z.string(),
    code_verifier: z.string(),
});

const schema = originalSchema.transform((arg) => ({
    state: "RESOLVED" as const,
    detail: {
        authorizationCode: arg.authorization_code,
        codeVerifier: arg.code_verifier,
    },
}));

async function getChatGPTAuthorizationCode(input: {
    deviceAuthId: string;
    userCode: string;
}): Promise<z.infer<typeof schema> | { state: "PENDING" }> {
    const res = await fetch(`${CHATGPT_OAUTH.ISSUER}/api/accounts/deviceauth/token`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...CHATGPT_OAUTH.HEADER,
        },
        body: JSON.stringify({
            device_auth_id: input.deviceAuthId,
            user_code: input.userCode,
        }),
    });

    if (res.ok) return schema.parse(await res.json());
    if (res.status === 403 || res.status === 404) return { state: "PENDING" };
    throw new Error(`Device authorization failed: ${res.status}`);
}

export { getChatGPTAuthorizationCode, schema as ChatGPTAuthorizationCodeSchema };
