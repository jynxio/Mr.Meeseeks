import { defineConfig } from "vite-plus";

export default defineConfig({
    staged: { "*": "vp check --fix" },

    fmt: {
        tabWidth: 4,
        printWidth: 110,

        sortImports: {
            groups: [
                "type-import",
                ["value-builtin", "value-external"],
                "type-internal",
                "value-internal",
                ["type-parent", "type-sibling", "type-index"],
                ["value-parent", "value-sibling", "value-index"],
                "unknown",
            ],
        },
    },
    lint: {
        options: { typeAware: true, typeCheck: true },
        rules: {
            "no-unused-vars": [
                "error",
                {
                    argsIgnorePattern: "^_",
                    caughtErrorsIgnorePattern: "^_",
                    destructuredArrayIgnorePattern: "^_",
                    varsIgnorePattern: "^_",
                    fix: { imports: "safe-fix", variables: "suggestion" },
                },
            ],
        },
    },
});
