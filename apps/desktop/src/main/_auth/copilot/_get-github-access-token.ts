import { z } from "zod";
import { REVERSE_COPILOT_API } from "./_consts";

const originalSchema = z.union([
    z.object({
        access_token: z.string(),
        token_type: z.string(),
        scope: z.string(),
    }),
    z.object({
        error_description: z.string(),
        error_uri: z.string(),
        error: z.literal("slow_down"),
        interval: z.number(),
    }),
    z.object({
        error_description: z.string(),
        error_uri: z.string(),
        error: z.enum([
            "authorization_pending",
            "expired_token",
            "unsupported_grant_type",
            "incorrect_client_credentials",
            "incorrect_device_code",
            "access_denied",
            "device_flow_disabled",
        ]),
    }),
]);

const schema = originalSchema.transform((arg) => {
    if ("access_token" in arg) return { state: "RESOLVED", detail: { token: arg.access_token } } as const;

    switch (arg.error) {
        case "authorization_pending":
            return { state: "PENDING" } as const;

        case "slow_down":
            return { state: "SLOW_DOWN", detail: { interval: arg.interval } } as const;

        default:
            throw new Error(arg.error_description);
    }
});

async function getGithubAccessToken(githubDeviceCode: string): Promise<z.infer<typeof schema>> {
    const res = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": REVERSE_COPILOT_API.HEADER["User-Agent"],
        },
        body: new URLSearchParams({
            device_code: githubDeviceCode,
            client_id: REVERSE_COPILOT_API.CLIENT_ID,
            grant_type: "urn:ietf:params:oauth:grant-type:device_code",
        }),
    });

    const raw = await res.json();
    const data = schema.parse(raw);

    return data;
}

export { getGithubAccessToken };
