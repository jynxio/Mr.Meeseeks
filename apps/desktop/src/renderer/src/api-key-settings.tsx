import React from "react";

import { useUserSettings } from "../_hooks/use-user-settings";

function APIKeySettings() {
    const [input, setInput] = React.useState("");
    const { list, set, del } = useUserSettings();

    const isPending = list.isLoading || set.isMutating || del.isMutating;

    return (
        <form onSubmit={onSubmit}>
            <fieldset disabled={isPending}>
                <input value={input} onChange={(event) => setInput(event.target.value)} />
            </fieldset>
        </form>
    );

    function onSubmit(event: React.SubmitEvent<HTMLFormElement>) {
        event.preventDefault();

        if (input) void set.trigger({ key: "googleApiKey", value: input });
        else void del.trigger("googleApiKey");
    }
}

export { APIKeySettings };
