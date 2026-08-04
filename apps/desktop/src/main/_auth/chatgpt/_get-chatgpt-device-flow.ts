import z from "zod";

import { CHATGPT_OAUTH } from "./_consts";

const originalSchema = z.object({
    device_auth_id: z.string(),
    user_code: z.string(),
    interval: z.union([z.string(), z.number()]),
});

const schema = originalSchema.transform((arg) => ({
    deviceAuthId: arg.device_auth_id,
    userCode: arg.user_code,
    intervalMs: Math.max(Number(arg.interval) || 5, 1) * 1000,
    verificationURI: CHATGPT_OAUTH.DEVICE_VERIFICATION_URL,
}));

async function getChatGPTDeviceFlow(): Promise<z.infer<typeof schema>> {
    const res = await fetch(`${CHATGPT_OAUTH.ISSUER}/api/accounts/deviceauth/usercode`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...CHATGPT_OAUTH.HEADER,
        },
        body: JSON.stringify({ client_id: CHATGPT_OAUTH.CLIENT_ID }),
    });

    if (!res.ok) throw new Error(`Failed to initiate device authorization: ${res.status}`);

    return schema.parse(await res.json());
}

export { getChatGPTDeviceFlow, schema as ChatGPTDeviceFlowSchema };
