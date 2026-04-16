import { safeStorage } from "electron";
import Store from "electron-store";
import { STORE_KEY } from "@/main/_consts";
import type { UserSettings } from "@/_consts/schemas";

const store = new Store<UserSettings>({ name: STORE_KEY.USER_SETTINGS });

function clear(): void {
    store.clear();
}

function del(key: keyof UserSettings): void {
    store.delete(key);
}

function set<K extends keyof UserSettings>(key: K, value: NonNullable<UserSettings[K]>): void {
    if (key !== "apiKey") return store.set(key, value);

    store.set(key, safeStorage.encryptString(value).toString("base64"));
}

function get(): string | undefined {
    const rawAPIKey = store.get("apiKey");

    if (!rawAPIKey) return undefined;

    return safeStorage.decryptString(Buffer.from(rawAPIKey, "base64"));
}

function list(): UserSettings {
    return { ...store.store, apiKey: get() };
}

export { set, get, del, list, clear };
