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
};

const _store = new Store<StoreShape>({ name: STORE_KEY.LLM_PROVIDERS, defaults: {} });
const llmProvidersStore = { get, set, del } as const;

function get<T extends ProviderName>(provider: T): StoreShape[T] | undefined {
    switch (provider) {
        case "copilot":
            return getCopilot();
    }
}

function set<T extends ProviderName>(provider: T, value: NonNullable<StoreShape[T]>): void {
    switch (provider) {
        case "copilot":
            return setCopilot(value);
    }
}

function del(provider: ProviderName): void {
    switch (provider) {
        case "copilot":
            return _store.delete("copilot");
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

export { llmProvidersStore };
