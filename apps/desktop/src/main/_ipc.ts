import { ipcMain } from "electron";
import { IPC } from "@/_consts";
import * as userSettingsStore from "@/main/_stores/user-settings";
import * as translationStore from "@/main/_stores/word";
import { translate } from "@/_services/main-process/translate";

const ipcHandler = {
    // Appearance
    "appearance:expand-island": () => {},
    "appearance:collapse-island": () => {},

    // User Settings
    "user-settings:clear": userSettingsStore.clear,
    "user-settings:list": userSettingsStore.list,
    "user-settings:get": userSettingsStore.get,
    "user-settings:del": userSettingsStore.del,
    "user-settings:set": userSettingsStore.set,

    // Translation
    "translation:clear": translationStore.clear,
    "translation:list": translationStore.list,
    "translation:del": translationStore.del,
    "translation:get": translationStore.get,
    "translation:set": translationStore.set,
    "translation:query": async (sourceText: string) => {
        const apiKey = userSettingsStore.get();

        return apiKey ? translate({ sourceText, apiKey }) : undefined;
    },
} satisfies (typeof IPC)["infer"]["handler"];

function registerIPCHandler() {
    const entries = Object.entries(ipcHandler);

    for (const [channel, handler] of entries) {
        type UnsafeFn = (...args: unknown[]) => unknown;

        ipcMain.handle(channel, (_event, ...args) => (handler as UnsafeFn)(...args));
    }
}

export { registerIPCHandler };
