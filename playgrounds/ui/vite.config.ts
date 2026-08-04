import { defineConfig } from "vite-plus";

import rootConfig from "../../vite.config.ts";

export default defineConfig({
    fmt: rootConfig.fmt,
    lint: rootConfig.lint,

    resolve: {
        conditions: ["source"],
    },
});
