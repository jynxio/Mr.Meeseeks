// --------------------------------------------------------------------------
// SAMPLE: IPC handlers (main process)
// --------------------------------------------------------------------------
// Call registerTranslationIpcHandlers() once at app startup, alongside
// your existing registerIpcHandlers().
//
// Each handler receives arguments from the renderer and returns a value
// that the renderer awaits via ipcRenderer.invoke().
// --------------------------------------------------------------------------

import { ipcMain } from "electron";
import { saveTranslation, listTranslations, deleteTranslation, clearTranslations } from "./main-store";

// Keep channel names in one place so preload and main stay in sync.
const TRANSLATION_IPC = {
    SAVE: "translation:save",
    LIST: "translation:list",
    DELETE: "translation:delete",
    CLEAR: "translation:clear",
} as const;

function registerTranslationIpcHandlers(): void {
    // (_, ...args) — first arg is always the Electron IpcMainInvokeEvent, ignore it.
    ipcMain.handle(TRANSLATION_IPC.SAVE, (_, source: string, result: string) =>
        saveTranslation(source, result),
    );

    ipcMain.handle(TRANSLATION_IPC.LIST, () => listTranslations());

    ipcMain.handle(TRANSLATION_IPC.DELETE, (_, id: string) => deleteTranslation(id));

    ipcMain.handle(TRANSLATION_IPC.CLEAR, () => clearTranslations());
}

export { TRANSLATION_IPC, registerTranslationIpcHandlers };
