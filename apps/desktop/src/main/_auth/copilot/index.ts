import { pick } from "remeda";

import { sleep } from "@/_utils";
import { llmProvidersStore } from "@/main/_stores/llm-providers";

import { getCopilotAccessToken } from "./_get-copilot-access-token";
import { getGithubAccessToken } from "./_get-github-access-token";
import { getGithubDeviceFlow } from "./_get-github-device-flow";

let abortController = new AbortController();
let interval: undefined | number = undefined;
let deviceCode: undefined | string = undefined;

async function retrieveUserCode() {
    abortController = new AbortController();
    const res = await getGithubDeviceFlow();

    if (abortController.signal.aborted) throw new Error("@todo");

    deviceCode = res.deviceCode;
    interval = res.interval;

    return pick(res, ["userCode", "verificationURI"]);
}

async function validateUserCode() {
    if (interval === undefined) return;
    if (deviceCode === undefined) return;

    let currPollInterval = interval;
    let githubAccessToken: undefined | string = undefined;

    while (githubAccessToken === undefined) {
        await sleep(currPollInterval * 1000);

        const res = await getGithubAccessToken(deviceCode);
        if (abortController.signal.aborted) throw new Error("@todo");

        if (res.state === "SLOW_DOWN") currPollInterval = res.detail.interval;
        if (res.state === "RESOLVED") githubAccessToken = res.detail.token;
    }

    const res = await getCopilotAccessToken(githubAccessToken);
    if (abortController.signal.aborted) throw new Error("@todo");

    llmProvidersStore.set("copilot", {
        copilotToken: res.token,
        githubToken: githubAccessToken,
        copilotTokenExpiresAt: res.expiresAt,
    });
}

function cancelOrSignOut() {
    abortController.abort();
    llmProvidersStore.del("copilot");
}

function getState(): { isAuth: boolean } {
    /**
     * @todo  g=GitHub, c=Copilot
     * no g, no c: full device auth
     * both g and c present:
     *   g & c ok: noop
     *   g ok, c expired: refresh c on use
     *   g ok, c bad: refresh c on error
     *   c ok, g expired: refresh err → full auth
     *   c ok, g bad: refresh err → full auth
     *   neither ok: same as the two above
     */

    const isAuth = llmProvidersStore.get("copilot")?.copilotToken !== undefined;

    return { isAuth };
}

export { cancelOrSignOut, retrieveUserCode, validateUserCode, getState };
