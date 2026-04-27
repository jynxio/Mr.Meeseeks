import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const STORE_KEY = {
    LLM_PROVIDERS: "LLM_PROVIDERS",
    USER_SETTINGS: "USER_SETTINGS",
    TRANSLATION_WORDS: "TRANSLATION_WORDS",
} as const;

const DIR = dirname(fileURLToPath(import.meta.url));
const RENDERER_URL = process.env["ELECTRON_RENDERER_URL"];
const PRELOAD_FILE = join(DIR, "../preload/index.mjs");
const RENDERER_FILE = join(DIR, "../renderer/index.html");

export { STORE_KEY, RENDERER_URL, PRELOAD_FILE, RENDERER_FILE };
