import { safeStorage } from "electron";
import Store from "electron-store";

const store = new Store();
const TEMP = "apiKey";

function getApiKey() {
    const raw = store.get(TEMP);
    const hasKey = typeof raw === "string";

    if (!hasKey) return;

    return safeStorage.decryptString(Buffer.from(raw, "base64"));
}

function setApiKey(apiKey: string): void {
    const encrypted = safeStorage.encryptString(apiKey);

    store.set(TEMP, encrypted.toString("base64"));
}

function deleteApiKey(): void {
    store.delete(TEMP);
}

export { getApiKey, setApiKey, deleteApiKey };
