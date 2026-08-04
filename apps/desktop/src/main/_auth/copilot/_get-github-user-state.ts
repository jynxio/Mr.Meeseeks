import { z } from "zod";

import { REVERSE_COPILOT_API } from "./_consts";

const originalSchema = z.object({ authenticated: z.boolean(), login: z.string().optional() });
const schema = originalSchema.transform((arg) => ({ isAuth: arg.authenticated, username: arg.login }));

async function getGithubUserStatus(githubAccessToken: string) {
    const res = await fetch("https://api.github.com/user", {
        headers: {
            Accept: "application/json",
            "User-Agent": REVERSE_COPILOT_API.HEADER["User-Agent"],
            Authorization: `token ${githubAccessToken}`,
        },
    });

    const raw = await res.json();
    const data = schema.parse(raw);

    return data;
}

export { getGithubUserStatus };
