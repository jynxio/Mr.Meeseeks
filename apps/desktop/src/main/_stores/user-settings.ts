import Store from "electron-store";
import { STORE_KEY } from "@/main/_consts";
import { decryptString, encryptString } from "@/main/_helpers/secure";
import type { UserSettings } from "@/_consts/schemas";

// @todo
type PersistedShape = {
    provider?: UserSettings["provider"];
    googleApiKey?: string;
    copilotModel?: string;
    apiKey?: string;
};

const store = new Store<PersistedShape>({ name: STORE_KEY.USER_SETTINGS });

migrateLegacyApiKey();

function clear(): void {
    store.clear();
}

function del(key: keyof UserSettings): void {
    store.delete(key);
}

function set<K extends keyof UserSettings>(key: K, value: NonNullable<UserSettings[K]>): void {
    if (key !== "googleApiKey") return store.set(key, value);

    store.set(key, encryptString(value as string));
}

function get<K extends keyof UserSettings>(key: K): UserSettings[K] | undefined {
    if (key === "googleApiKey") return decryptGoogleApiKey() as UserSettings[K] | undefined;

    return store.get(key) as UserSettings[K] | undefined;
}

function list(): UserSettings {
    const provider = (store.get("provider") ?? "google") as UserSettings["provider"];
    const copilotModel = store.get("copilotModel") ?? "gpt-4o";
    const googleApiKey = decryptGoogleApiKey();

    return { provider, copilotModel, googleApiKey };
}

function decryptGoogleApiKey(): string | undefined {
    const raw = store.get("googleApiKey");

    if (!raw) return undefined;

    return decryptString(raw);
}

function migrateLegacyApiKey(): void {
    const legacy = store.get("apiKey");

    if (!legacy) return;

    if (!store.get("googleApiKey")) store.set("googleApiKey", encryptString(legacy));
    store.delete("apiKey");
}

export { set, get, del, list, clear };
