// --------------------------------------------------------------------------
// SAMPLE: TranslationRecord type
// --------------------------------------------------------------------------
// This is the single source-of-truth type shared across main, preload,
// and renderer. In a real project you'd put this in a shared package.
// --------------------------------------------------------------------------

type SyncStatus =
    | "local" // saved locally, never synced
    | "pending" // queued to sync
    | "synced"; // confirmed synced with cloud

type TranslationRecord = {
    id: string; // crypto.randomUUID()
    source: string; // original text the user typed
    result: string; // translated text returned by AI
    createdAt: number; // Date.now() at creation
    updatedAt: number; // Date.now() at last edit
    syncStatus: SyncStatus;
};

export type { TranslationRecord, SyncStatus };
