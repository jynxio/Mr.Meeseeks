import { contextBridge, ipcRenderer } from "electron";
import { IPC } from "@/_consts";

function exposeIPCInvoker() {
    contextBridge.exposeInMainWorld(
        IPC.NAMESPACE,
        Object.fromEntries(
            [...IPC.CHANNEL.values()].map((channel) => {
                return [channel, (...args: unknown[]) => ipcRenderer.invoke(channel, ...args)];
            }),
        ),
    );
}

export { exposeIPCInvoker };
