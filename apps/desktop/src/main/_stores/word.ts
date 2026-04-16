import Store from "electron-store";
import { STORE_KEY } from "@/main/_consts";
import type { Word } from "@/_consts/schemas";

const store = new Store<{ records: Word[] }>({
    name: STORE_KEY["TRANSLATION_WORDS"],
    defaults: { records: [] },
});

function list(): Word[] {
    return store.get("records");
}

function get(id: Word["id"]): undefined | Word {
    return store.get("records").find((item) => item.id === id);
}

function set(id: Word["id"], value: Word): void {
    const records = store.get("records");
    const idx = records.findIndex((r) => r.id === id);

    if (idx === -1) return store.set("records", [value, ...records]);

    records[idx] = value;
    store.set("records", records);
}

function del(id: Word["id"]): void {
    store.set(
        "records",
        store.get("records").filter((item) => item.id !== id),
    );
}

function clear(): void {
    store.set("records", []);
}

export { list, get, set, del, clear };
