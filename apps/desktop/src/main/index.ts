import { app, BrowserWindow, globalShortcut } from "electron";
import { electronApp, optimizer } from "@electron-toolkit/utils";
import { registerIPCHandler } from "./_ipc";
import { openIslandWindow } from "./windows/island";

main();

function main() {
    app.on("will-quit", () => globalShortcut.unregisterAll());

    void app.whenReady().then(async () => {
        electronApp.setAppUserModelId("com.buzz");
        app.on("browser-window-created", (_, window) => optimizer.watchWindowShortcuts(window));
        app.on("activate", () => BrowserWindow.getAllWindows().length || openIslandWindow());

        registerIPCHandler();
        await openIslandWindow();
    });
}
