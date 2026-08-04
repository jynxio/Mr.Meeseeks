import { defineConfig } from "vite-plus";

import rootConfig from "../../vite.config.ts";

export default defineConfig({
    ...(rootConfig.fmt === undefined ? {} : { fmt: rootConfig.fmt }),
    ...(rootConfig.lint === undefined ? {} : { lint: rootConfig.lint }),

    pack: {
        exports: true,
        dts: { tsgo: true },
    },
});
