import { defineConfig } from "electron-vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
    main: {},
    preload: {},
    renderer: {
        plugins: [react()],
        resolve: {
            alias: {
                "@": path.resolve(__dirname, "src"),
                $: path.resolve(__dirname, "./"),
            },
        },
    },
});
