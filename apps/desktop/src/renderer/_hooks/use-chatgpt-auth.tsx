import { useActor } from "@xstate/react";
import { fromPromise, setup, assign } from "xstate";

import { ipcInvoker } from "../_ipc";

function useChatGPTAuth() {
    return useActor(fsm);
}

const fsm = setup({
    types: {
        context: {} as {} | { userCode: string; verificationURI: string; errorMsg?: string },
        events: {} as { type: "sign-in" | "sign-out" | "cancel" },
    },

    actors: {
        cancelOrSignOut: fromPromise(() => ipcInvoker["chatgpt-auth:cancel-or-sign-out"]()),
        retrieveUserCode: fromPromise(() => ipcInvoker["chatgpt-auth:retrieve-user-code"]()),
        validateUserCode: fromPromise(() => ipcInvoker["chatgpt-auth:validate-user-code"]()),
    },
}).createMachine({
    context: {},
    initial: "idle",

    states: {
        idle: { on: { "sign-in": "pending:retrieve-user-code" } },

        "pending:retrieve-user-code": {
            on: { cancel: "idle" },
            invoke: {
                src: "retrieveUserCode",
                onDone: {
                    target: "pending:validate-user-code",
                    actions: assign(({ event }) => event.output),
                },
                onError: {
                    target: "rejected",
                    actions: assign({ errorMsg: ({ event }) => String(event.error) }),
                },
            },
        },

        "pending:validate-user-code": {
            on: { cancel: "idle" },
            invoke: {
                src: "validateUserCode",
                onDone: { target: "resolved" },
                onError: {
                    target: "rejected",
                    actions: assign({ errorMsg: ({ event }) => String(event.error) }),
                },
            },
        },

        resolved: {
            type: "final",
            on: { "sign-out": "idle" },
        },

        rejected: {
            on: { "sign-in": "pending:retrieve-user-code" },
        },
    },
});

export { useChatGPTAuth };
