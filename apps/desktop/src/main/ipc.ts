import { IPC } from "@/_consts";
import { ipcMain } from "electron";
import { translate } from "./services/ai";
import { getApiKey, setApiKey, deleteApiKey } from "./services/store";

function registerIpcHandlers(): void {
    ipcMain.handle(IPC.API.TRANSLATE, (_, i: string) => safe(translate)(i));

    ipcMain.handle(IPC.API.GET_API_KEY, () => getApiKey());
    ipcMain.handle(IPC.API.SET_API_KEY, (_, key: string) => setApiKey(key));
    ipcMain.handle(IPC.API.DELETE_API_KEY, () => deleteApiKey());
}

function safe<Args extends unknown[], Data>(fn: (...args: Args) => Promise<Data>) {
    type ResolvedR = { ok: true; data: Data; error?: never };
    type RejectedR = { ok: false; data?: never; error: Error };

    return function (...args: Args) {
        return fn(...args)
            .then<ResolvedR>((data) => ({ ok: true, data }))
            .catch<RejectedR>((error: Error) => ({ ok: false, error }));
    };
}

export { registerIpcHandlers };
