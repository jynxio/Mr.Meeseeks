import "./reset.css";
import "./index.css";

import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <Query>
            <App />
        </Query>
    </React.StrictMode>,
);

function Query({ children }: React.PropsWithChildren) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
