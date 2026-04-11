const IPC = {
    KEY: "_@jynxio/buzz",

    API: {
        TRANSLATE: "translate",

        EXPAND_ISLAND: "island:expand",
        COLLAPSED_ISLAND: "island:collapse",
        TOGGLE_ISLAND: "island:toggle",

        GET_API_KEY: "settings:get-api-key",
        SET_API_KEY: "settings:set-api-key",
        DELETE_API_KEY: "settings:delete-api-key",
    },
} as const;

export { IPC };
