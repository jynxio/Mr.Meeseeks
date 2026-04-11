import type { IPCInfer } from "./index";

declare global {
    interface Window extends IPCInfer {}
}

export {};
