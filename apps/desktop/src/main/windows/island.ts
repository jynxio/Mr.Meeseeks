import { is } from "@electron-toolkit/utils";
import { BrowserWindow } from "electron";

import { RENDERER_URL, PRELOAD_FILE, RENDERER_FILE } from "../_consts";
import { getIslandRect, toBounds } from "../_helpers/island";

let islandWindow: undefined | BrowserWindow;

async function openIslandWindow() {
    if (islandWindow) return islandWindow.focus();

    // const [collapsedRect, expandedRect] = await getIslandRect(); // @todo
    const [collapsedRect] = await getIslandRect();
    const collapsedBounds = toBounds(collapsedRect);
    // const expandedBounds = toBounds(expandedRect); // @todo

    islandWindow = new BrowserWindow({
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

    islandWindow.setAlwaysOnTop(true, "pop-up-menu");
    islandWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

    // @todo
    // ipcMain.handle("islandWindow:expand", () => islandWindow.setBounds(expandedBounds));
    // ipcMain.handle("islandWindow:collapse", () => islandWindow.setBounds(collapsedBounds));
    islandWindow.on("closed", () => (islandWindow = undefined));
    islandWindow.on("ready-to-show", () => {
        if (!islandWindow) return;

        islandWindow.setPosition(collapsedRect.x, 0);
        islandWindow.setBounds(collapsedBounds);
        islandWindow.show();
    });

    if (is.dev && RENDERER_URL) await islandWindow.loadURL(RENDERER_URL);
    else await islandWindow.loadFile(RENDERER_FILE);
}

export { openIslandWindow };
