import { safeStorage } from "electron";

function encryptString(input: string): string;
function encryptString(input: undefined): undefined;
function encryptString(input?: string): string | undefined {
    if (input === undefined) return;

    return safeStorage.encryptString(input).toString("base64");
}

function decryptString(input: string): string;
function decryptString(input: undefined): undefined;
function decryptString(input?: string): string | undefined {
    if (input === undefined) return;

    return safeStorage.decryptString(Buffer.from(input, "base64"));
}

export { encryptString, decryptString };
