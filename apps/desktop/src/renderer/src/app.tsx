import React from "react";
import { ipcInvoker } from "../_ipc";
import { APIKeySettings } from "./api-key-settings";
import { useUserSettings } from "../_hooks/use-user-settings";
import { useTranslation } from "../_hooks/use-translation";

function App() {
    const [input, setInput] = React.useState("");

    const userSettings = useUserSettings();
    const translationQuery = useTranslation().query;

    const apiKey = userSettings.list.data?.apiKey;
    const canSubmit = Boolean(apiKey) && translationQuery.status !== "pending";

    const result = JSON.stringify(
        {
            "API Key": apiKey,
            "Translation State": translationQuery.status,
            "Translation Result": translationQuery.data,
        },
        null,
        2,
    );

    useExpansion();

    return (
        <div>
            <APIKeySettings />

            <hr />
            <form onSubmit={onSubmit}>
                <fieldset disabled={!canSubmit}>
                    <input value={input} onChange={(event) => setInput(event.target.value)} />
                </fieldset>
            </form>

            <hr />
            <pre>{result}</pre>
        </div>
    );

    function onSubmit(event: React.SubmitEvent<HTMLFormElement>) {
        event.preventDefault();
        translationQuery.mutate(input);
    }
}

function useExpansion() {
    React.useEffect(() => {
        void ipcInvoker["appearance:expand-island"]();
    }, []);
}

export { App };
