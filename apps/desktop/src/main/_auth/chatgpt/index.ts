import { sleep } from "@/_utils";
import { llmProvidersStore } from "@/main/_stores/llm-providers";

import { exchangeChatGPTCode } from "./_exchange-chatgpt-code";
import { getChatGPTAuthorizationCode } from "./_get-chatgpt-authorization-code";
import { getChatGPTDeviceFlow } from "./_get-chatgpt-device-flow";

export * from "./_consts";
export * from "./_exchange-chatgpt-code";
export * from "./_extract-chatgpt-account-id";
export * from "./_get-chatgpt-authorization-code";
export * from "./_get-chatgpt-device-flow";
export * from "./_refresh-chatgpt-token";

let abortController = new AbortController();
let deviceAuthId: undefined | string = undefined;
let userCode: undefined | string = undefined;
let intervalMs: undefined | number = undefined;

async function retrieveUserCode() {
    abortController = new AbortController();
    const res = await getChatGPTDeviceFlow();

    if (abortController.signal.aborted) throw new Error("@todo");

    deviceAuthId = res.deviceAuthId;
    userCode = res.userCode;
    intervalMs = res.intervalMs;

    return { userCode: res.userCode, verificationURI: res.verificationURI };
}

async function validateUserCode() {
    if (deviceAuthId === undefined) return;
    if (userCode === undefined) return;
    if (intervalMs === undefined) return;

    while (true) {
        await sleep(intervalMs);

        const res = await getChatGPTAuthorizationCode({ deviceAuthId, userCode });
        if (abortController.signal.aborted) throw new Error("@todo");

        if (res.state === "PENDING") continue;

        const tokens = await exchangeChatGPTCode(res.detail);
        if (abortController.signal.aborted) throw new Error("@todo");

        llmProvidersStore.set("chatgpt", tokens);
        return;
    }
}

function cancelOrSignOut() {
    abortController.abort();
    llmProvidersStore.del("chatgpt");
}

function getState(): { isAuth: boolean } {
    const isAuth = llmProvidersStore.get("chatgpt")?.accessToken !== undefined;

    return { isAuth };
}

export { cancelOrSignOut, retrieveUserCode, validateUserCode, getState };
