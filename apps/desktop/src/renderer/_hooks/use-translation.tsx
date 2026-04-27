import useSWR, { useSWRConfig } from "swr";
import useSWRMutation from "swr/mutation";
import { ipcInvoker } from "../_ipc";
import type { Word } from "@/_consts/schemas";

const LIST_KEY = "translation:list";

function useTranslation() {
    const { mutate } = useSWRConfig();

    function invalidateList() {
        void mutate(LIST_KEY);
    }

    const list = useSWR(LIST_KEY, () => ipcInvoker["translation:list"]());

    const set = useSWRMutation(
        "translation:set",
        (_key: string, { arg: { id, value } }: { arg: { id: Word["id"]; value: Word } }) =>
            ipcInvoker["translation:set"](id, value),
        { onSuccess: invalidateList },
    );

    const del = useSWRMutation(
        "translation:del",
        (_key: string, { arg }: { arg: Word["id"] }) => ipcInvoker["translation:del"](arg),
        { onSuccess: invalidateList },
    );

    const clear = useSWRMutation("translation:clear", () => ipcInvoker["translation:clear"](), {
        onSuccess: invalidateList,
    });

    const query = useSWRMutation("translation:query", (_key: string, { arg }: { arg: string }) =>
        ipcInvoker["translation:query"](arg),
    );

    return { list, set, del, clear, query };
}

export { useTranslation };
