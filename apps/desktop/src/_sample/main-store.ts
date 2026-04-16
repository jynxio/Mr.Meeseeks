// --------------------------------------------------------------------------
// SAMPLE: Translation storage service (main process only)
// --------------------------------------------------------------------------
// Runs exclusively in the main process. electron-store writes a JSON file
// to the user's app data directory — no database setup needed.
//
// File location (macOS):  ~/Library/Application Support/<AppName>/config.json
// --------------------------------------------------------------------------

import crypto from "node:crypto";
import Store from "electron-store";
import type { TranslationRecord } from "./types";

// Typed schema so TypeScript knows what shape the JSON file has.
type Schema = {
    records: TranslationRecord[];
};

const store = new Store<Schema>({
    defaults: { records: [] },
});

// --------------------------------------------------------------------------
// CRUD operations
// --------------------------------------------------------------------------

/** Save a new translation and return the created record. */
function saveTranslation(source: string, result: string): TranslationRecord {
    const record: TranslationRecord = {
        id: crypto.randomUUID(),
        source,
        result,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        syncStatus: "local",
    };

    const existing = store.get("records");
    store.set("records", [record, ...existing]); // newest first
    return record;
}

/** Return all records, newest first. */
function listTranslations(): TranslationRecord[] {
    return store.get("records");
}

/** Delete a single record by id. */
function deleteTranslation(id: string): void {
    const filtered = store.get("records").filter((r) => r.id !== id);
    store.set("records", filtered);
}

/** Wipe every record. */
function clearTranslations(): void {
    store.set("records", []);
}

export { saveTranslation, listTranslations, deleteTranslation, clearTranslations };
