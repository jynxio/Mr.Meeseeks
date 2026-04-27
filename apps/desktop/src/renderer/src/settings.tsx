import React from "react";
import { useTranslation } from "../_hooks/use-translation";
import { CopilotAuth } from "./copilot-auth";

function Settings() {
    const [input, setInput] = React.useState("");
    const translationQuery = useTranslation().query;
    const translationStatus = getTranslationStatus();

    return (
        <div>
            <CopilotAuth />
            <form onSubmit={onSubmit}>
                <input value={input} onChange={(event) => setInput(event.target.value)} />
            </form>

            <pre>State: {translationStatus}</pre>
            <pre>{JSON.stringify(translationQuery.data, null, 2)}</pre>
        </div>
    );

    function onSubmit(event: React.SubmitEvent<HTMLFormElement>) {
        event.preventDefault();
        void translationQuery.trigger(input);
    }

    function getTranslationStatus() {
        if (translationQuery.isMutating) return "pending";
        if (translationQuery.error) return "rejected";
        if (translationQuery.data) return "resolved";

        return "idle";
    }
}

export { Settings };
