import { defineConfig } from "vite-plus";

export default defineConfig({
    staged: { "*": "vp check --fix" },

    fmt: { tabWidth: 4, printWidth: 100 },
    lint: { options: { typeAware: true, typeCheck: true } },
});
