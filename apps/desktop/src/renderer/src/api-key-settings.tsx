import React from "react";
import { useUserSettings } from "../_hooks/use-user-settings";

function APIKeySettings() {
    const [input, setInput] = React.useState("");
    const { list, set, del } = useUserSettings();

    const isPending = list.isPending || set.isPending || del.isPending;

    return (
        <form onSubmit={onSubmit}>
            <fieldset disabled={isPending}>
                <input value={input} onChange={(event) => setInput(event.target.value)} />
            </fieldset>
        </form>
    );

    function onSubmit(event: React.SubmitEvent<HTMLFormElement>) {
        event.preventDefault();

        if (input) set.mutate({ key: "apiKey", value: input });
        else del.mutate("apiKey");
    }
}

export { APIKeySettings };
