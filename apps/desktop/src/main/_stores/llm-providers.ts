import Store from "electron-store";

import { STORE_KEY } from "@/main/_consts";
import { decryptString, encryptString } from "@/main/_helpers/secure";

type ProviderName = keyof StoreShape;
type StoreShape = {
    copilot?: {
        githubToken: string;
        copilotToken: string;
        copilotTokenExpiresAt: number;
    };
    chatgpt?: {
        accessToken: string;
        refreshToken: string;
        expiresAt: number;
        accountId?: string;
        idToken?: string;
    };
};

const _store = new Store<StoreShape>({ name: STORE_KEY.LLM_PROVIDERS, defaults: {} });
const llmProvidersStore = { get, set, del } as const;

function get(provider: "copilot"): StoreShape["copilot"] | undefined;
function get(provider: "chatgpt"): StoreShape["chatgpt"] | undefined;
function get(provider: ProviderName) {
    switch (provider) {
        case "copilot":
            return getCopilot();
        case "chatgpt":
            return getChatGPT();
    }
}

function set(provider: "copilot", value: NonNullable<StoreShape["copilot"]>): void;
function set(provider: "chatgpt", value: NonNullable<StoreShape["chatgpt"]>): void;
function set(provider: ProviderName, value: NonNullable<StoreShape[ProviderName]>): void {
    switch (provider) {
        case "copilot":
            return setCopilot(value as NonNullable<StoreShape["copilot"]>);
        case "chatgpt":
            return setChatGPT(value as NonNullable<StoreShape["chatgpt"]>);
    }
}

function del(provider: ProviderName): void {
    switch (provider) {
        case "copilot":
            return _store.delete("copilot");
        case "chatgpt":
            return _store.delete("chatgpt");
    }
}

function getCopilot(): StoreShape["copilot"] | undefined {
    const copilot = _store.get("copilot");
    if (!copilot) return;

    return {
        githubToken: decryptString(copilot.githubToken),
        copilotToken: decryptString(copilot.copilotToken),
        copilotTokenExpiresAt: copilot.copilotTokenExpiresAt,
    };
}

function setCopilot(copilot: NonNullable<StoreShape["copilot"]>): void {
    const githubToken = encryptString(copilot.githubToken);
    const copilotToken = encryptString(copilot.copilotToken);
    const copilotTokenExpiresAt = copilot.copilotTokenExpiresAt;

    _store.set("copilot", { githubToken, copilotToken, copilotTokenExpiresAt });
}

function getChatGPT(): StoreShape["chatgpt"] | undefined {
    const chatgpt = _store.get("chatgpt");
    if (!chatgpt) return;
    const idToken = chatgpt.idToken ? decryptString(chatgpt.idToken) : undefined;

    return {
        accessToken: decryptString(chatgpt.accessToken),
        refreshToken: decryptString(chatgpt.refreshToken),
        expiresAt: chatgpt.expiresAt,
        ...(chatgpt.accountId === undefined ? {} : { accountId: chatgpt.accountId }),
        ...(idToken === undefined ? {} : { idToken }),
    };
}

function setChatGPT(chatgpt: NonNullable<StoreShape["chatgpt"]>): void {
    _store.set("chatgpt", {
        accessToken: encryptString(chatgpt.accessToken),
        refreshToken: encryptString(chatgpt.refreshToken),
        expiresAt: chatgpt.expiresAt,
        ...(chatgpt.accountId === undefined ? {} : { accountId: chatgpt.accountId }),
        ...(chatgpt.idToken === undefined ? {} : { idToken: encryptString(chatgpt.idToken) }),
    });
}

export { llmProvidersStore };
