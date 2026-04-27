import { BrowserWindow } from "electron";
import { is } from "@electron-toolkit/utils";
import { RENDERER_URL, PRELOAD_FILE, RENDERER_FILE } from "../_consts";

let settingsWindow: undefined | BrowserWindow;

async function openSettingsWindow() {
    if (settingsWindow) return settingsWindow.focus();

    settingsWindow = new BrowserWindow({
        width: 640,
        height: 480,
        show: false,
        title: "Settings",
        autoHideMenuBar: true,
        webPreferences: { sandbox: false, preload: PRELOAD_FILE },
    });

    settingsWindow.on("closed", () => (settingsWindow = undefined));
    settingsWindow.on("ready-to-show", () => settingsWindow?.show());

    if (is.dev && RENDERER_URL) {
        const settingsURL = new URL(RENDERER_URL);
        settingsURL.hash = "/settings";
        await settingsWindow.loadURL(settingsURL.toString());
    } else {
        await settingsWindow.loadFile(RENDERER_FILE, { hash: "/settings" });
    }
}

export { openSettingsWindow };
