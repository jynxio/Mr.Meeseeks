import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ipcInvoker } from "../_ipc";

const translationKeys = {
    all: ["translations"] as const,
};

function useTranslations() {
    const queryClient = useQueryClient();

    const list = useQuery({
        queryKey: translationKeys.all,
        queryFn: () => ipcInvoker["translation:list"](),
    });

    const del = useMutation({
        mutationFn: (id: string) => ipcInvoker["translation:del"](id),
        onSuccess: () => void queryClient.invalidateQueries({ queryKey: translationKeys.all }),
    });

    const clear = useMutation({
        mutationFn: () => ipcInvoker["translation:clear"](),
        onSuccess: () => void queryClient.invalidateQueries({ queryKey: translationKeys.all }),
    });

    return { list, del, clear };
}

// ------------------------------------------------------------------
// Component — just reads/mutates through the hook above.
// ------------------------------------------------------------------
function TranslationHistory() {
    const { list, del, clear } = useTranslations();

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
                            {record.sourceText} → {record.targetText}
                        </span>
                        <button onClick={() => del.mutate(record.id)}>Delete</button>
                    </li>
                ))}
            </ul>
        </section>
    );
}

// ------------------------------------------------------------------
// How to wire query+save into your translate flow:
//
//   const translation = await ipcInvoker["translation:query"](sourceText);
//   if (translation?.type === "word") {
//     await ipcInvoker["translation:set"](translation.id, translation);
//   }
// ------------------------------------------------------------------

export { TranslationHistory, useTranslations };
