import { z } from "zod";

import { REVERSE_COPILOT_API } from "./_consts";

const originalSchema = z.object({ token: z.string(), expires_at: z.number() });
const schema = originalSchema.transform((arg) => ({ token: arg.token, expiresAt: arg.expires_at }));

async function getCopilotAccessToken(githubAccessToken: string): Promise<z.infer<typeof schema>> {
    const res = await fetch("https://api.github.com/copilot_internal/v2/token", {
        method: "GET",
        headers: {
            Authorization: `token ${githubAccessToken}`,
            Accept: "application/json",
            ...REVERSE_COPILOT_API.HEADER,
        },
    });

    const raw = await res.json();
    const data = schema.parse(raw);

    return data;
}

export { getCopilotAccessToken };
