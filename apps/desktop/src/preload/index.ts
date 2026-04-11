import { contextBridge, ipcRenderer } from "electron";
import { IPC } from "@/_consts";

const ipcInfer = registerIPC(IPC.KEY, {
    translate,

    expandIsland,
    collapseIsland,
    onToggleIsland,

    getApiKey,
    setApiKey,
    deleteApiKey,
});

function translate(i: string) {
    return ipcRenderer.invoke(IPC.API.TRANSLATE, i);
}

function expandIsland() {
    return ipcRenderer.invoke(IPC.API.EXPAND_ISLAND);
}

function collapseIsland() {
    return ipcRenderer.invoke(IPC.API.COLLAPSED_ISLAND);
}

function onToggleIsland(callback: () => void) {
    const handler = () => callback();
    ipcRenderer.on(IPC.API.TOGGLE_ISLAND, handler);
    return (): void => {
        ipcRenderer.off(IPC.API.TOGGLE_ISLAND, handler);
    };
}

function getApiKey(): Promise<string | undefined> {
    return ipcRenderer.invoke(IPC.API.GET_API_KEY);
}

function setApiKey(key: string): Promise<void> {
    return ipcRenderer.invoke(IPC.API.SET_API_KEY, key);
}

function deleteApiKey(): Promise<void> {
    return ipcRenderer.invoke(IPC.API.DELETE_API_KEY);
}

function registerIPC<Key extends string, API extends object>(key: Key, api: API) {
    contextBridge.exposeInMainWorld(key, api);

    return undefined as unknown as Record<Key, API>;
}

export type IPCInfer = typeof ipcInfer;
