import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ipcInvoker } from "../_ipc";
import type { Word } from "@/_consts/schemas";

const LIST_QUERY_KEYS = [Symbol()];

function useTranslation() {
    const queryClient = useQueryClient();

    function invalidateList() {
        return queryClient.invalidateQueries({ queryKey: LIST_QUERY_KEYS });
    }

    const list = useQuery({
        queryKey: LIST_QUERY_KEYS,
        queryFn: () => ipcInvoker["translation:list"](),
    });

    const set = useMutation({
        mutationFn: ({ id, value }: { id: Word["id"]; value: Word }) =>
            ipcInvoker["translation:set"](id, value),
        onSuccess: invalidateList,
    });

    const del = useMutation({
        mutationFn: (id: Word["id"]) => ipcInvoker["translation:del"](id),
        onSuccess: invalidateList,
    });

    const clear = useMutation({
        mutationFn: () => ipcInvoker["translation:clear"](),
        onSuccess: invalidateList,
    });

    const query = useMutation({
        mutationFn: (sourceText: string) => ipcInvoker["translation:query"](sourceText),
    });

    return { list, set, del, clear, query };
}

export { useTranslation };
