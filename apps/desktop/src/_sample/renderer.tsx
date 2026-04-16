// --------------------------------------------------------------------------
// SAMPLE: Preload bridge + Renderer component
// --------------------------------------------------------------------------
// This file shows two things:
//   1. How to expose IPC calls to the renderer via contextBridge (preload).
//   2. How the renderer reads and mutates translation records (React).
//
// In your project split these into their respective files:
//   preload/index.ts  ← the contextBridge part
//   renderer/src/translation-history.tsx  ← the React component
// --------------------------------------------------------------------------

// ══════════════════════════════════════════════════════════════════════════
// PART 1 — Preload (runs in a privileged context, can use ipcRenderer)
// ══════════════════════════════════════════════════════════════════════════

import { contextBridge, ipcRenderer } from "electron";
import { TRANSLATION_IPC } from "./main-ipc";
import type { TranslationRecord } from "./types";

// Expose a typed API on window so the renderer never touches ipcRenderer directly.
contextBridge.exposeInMainWorld("translationApi", {
    save: (source: string, result: string): Promise<TranslationRecord> =>
        ipcRenderer.invoke(TRANSLATION_IPC.SAVE, source, result),

    list: (): Promise<TranslationRecord[]> => ipcRenderer.invoke(TRANSLATION_IPC.LIST),

    delete: (id: string): Promise<void> => ipcRenderer.invoke(TRANSLATION_IPC.DELETE, id),

    clear: (): Promise<void> => ipcRenderer.invoke(TRANSLATION_IPC.CLEAR),
});

// Add this declaration to a .d.ts file so TypeScript knows about window.translationApi.
declare global {
    interface Window {
        translationApi: {
            save: (source: string, result: string) => Promise<TranslationRecord>;
            list: () => Promise<TranslationRecord[]>;
            delete: (id: string) => Promise<void>;
            clear: () => Promise<void>;
        };
    }
}

// ══════════════════════════════════════════════════════════════════════════
// PART 2 — Renderer (plain React + TanStack Query, no ipcRenderer)
// ══════════════════════════════════════════════════════════════════════════

import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// ------------------------------------------------------------------
// Key factory — keeps query keys consistent across the component.
// ------------------------------------------------------------------
const translationKeys = {
    all: ["translations"] as const,
};

// ------------------------------------------------------------------
// Custom hook — wraps all data access so the component stays clean.
// ------------------------------------------------------------------
function useTranslations() {
    const queryClient = useQueryClient();
    const api = window.translationApi;

    const list = useQuery({
        queryKey: translationKeys.all,
        queryFn: () => api.list(),
    });

    const save = useMutation({
        mutationFn: ({ source, result }: { source: string; result: string }) => api.save(source, result),
        // Refetch the list after a successful save.
        onSuccess: () => queryClient.invalidateQueries({ queryKey: translationKeys.all }),
    });

    const remove = useMutation({
        mutationFn: (id: string) => api.delete(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: translationKeys.all }),
    });

    const clear = useMutation({
        mutationFn: () => api.clear(),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: translationKeys.all }),
    });

    return { list, save, remove, clear };
}

// ------------------------------------------------------------------
// Component — just reads/mutates through the hook above.
// ------------------------------------------------------------------
function TranslationHistory() {
    const { list, remove, clear } = useTranslations();

    if (list.isPending) return <p>Loading…</p>;
    if (list.isError) return <p>Error loading history.</p>;

    return (
        <section>
            <header>
                <h2>History ({list.data.length})</h2>
                <button onClick={() => clear.mutate()}>Clear all</button>
            </header>

            <ul>
                {list.data.map((record) => (
                    <li key={record.id}>
                        <span>
                            {record.source} → {record.result}
                        </span>
                        <button onClick={() => remove.mutate(record.id)}>Delete</button>
                    </li>
                ))}
            </ul>
        </section>
    );
}

// ------------------------------------------------------------------
// How to wire save() into your existing translate flow:
//
//   const { save } = useTranslations();
//
//   // After the AI returns a result:
//   save.mutate({ source: inputText, result: translatedText });
// ------------------------------------------------------------------

export { TranslationHistory, useTranslations };
