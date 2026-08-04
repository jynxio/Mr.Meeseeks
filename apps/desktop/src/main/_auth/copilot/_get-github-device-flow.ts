import { z } from "zod";

import { REVERSE_COPILOT_API } from "./_consts";

const originalSchema = z.object({
    interval: z.number(),
    user_code: z.string(),
    expires_in: z.number(),
    device_code: z.string(),
    verification_uri: z.string(),
});

const schema = originalSchema.transform((arg) => ({
    interval: arg.interval,
    userCode: arg.user_code,
    expiresIn: arg.expires_in,
    deviceCode: arg.device_code,
    verificationURI: arg.verification_uri,
}));

async function getGithubDeviceFlow(): Promise<z.infer<typeof schema>> {
    const res = await fetch("https://github.com/login/device/code", {
        method: "POST",
        headers: {
            Accept: "application/json",
            "User-Agent": REVERSE_COPILOT_API.HEADER["User-Agent"],
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            scope: "read:user",
            client_id: REVERSE_COPILOT_API.CLIENT_ID,
        }),
    });

    const raw = await res.json();
    const data = schema.parse(raw);

    return data;
}

export { getGithubDeviceFlow };
