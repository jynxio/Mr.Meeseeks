import { app, BrowserWindow, globalShortcut, ipcMain } from "electron";
import { electronApp, is, optimizer } from "@electron-toolkit/utils";
import { registerIpcHandlers } from "./ipc";
import { getIslandRect, toBounds } from "./_helpers/get-island-bounds";
import { fileURLToPath } from "node:url";
import path from "node:path";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const RENDERER_URL = process.env["ELECTRON_RENDERER_URL"];
const PRELOAD_FILE = path.join(DIR, "../preload/index.mjs");
const RENDERER_FILE = path.join(DIR, "../renderer/index.html");

main();

function main() {
    app.on("activate", () => BrowserWindow.getAllWindows().length || createIsland());
    app.on("will-quit", () => globalShortcut.unregisterAll());

    void app.whenReady().then(async () => {
        electronApp.setAppUserModelId("com.buzz");
        app.on("browser-window-created", (_, window) => optimizer.watchWindowShortcuts(window));

        registerIpcHandlers();
        await createIsland();
    });
}

async function createIsland() {
    const [collapsedRect, expandedRect] = await getIslandRect();
    const collapsedBounds = toBounds(collapsedRect);
    const expandedBounds = toBounds(expandedRect);

    const island = new BrowserWindow({
        ...collapsedBounds,
        show: false,
        frame: false,
        movable: false,
        resizable: false,
        hasShadow: false,
        skipTaskbar: true,
        transparent: true,
        maximizable: false,
        minimizable: false,
        fullscreenable: false,
        autoHideMenuBar: true,
        enableLargerThanScreen: true,
        backgroundColor: "#00000000",
        webPreferences: { sandbox: false, preload: PRELOAD_FILE },
    });

    island.setAlwaysOnTop(true, "pop-up-menu");
    island.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

    ipcMain.handle("island:expand", () => {
        // island.setBounds(expandedBounds) // @todo
        island.setBounds({
            ...expandedBounds,
            x: expandedBounds.x * 2,
            y: expandedBounds.height,
        });
    });
    ipcMain.handle("island:collapse", () => island.setBounds(collapsedBounds));
    island.on("ready-to-show", () => {
        island.setPosition(collapsedRect.x, 0);
        island.setBounds(collapsedBounds);
        island.show();
    });

    if (is.dev && RENDERER_URL) await island.loadURL(RENDERER_URL);
    else await island.loadFile(RENDERER_FILE);
}
