import "./reset.css";
import "./index.css";

import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app";
import { Query } from "./query";

createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <Query>
            <App />
        </Query>
    </React.StrictMode>,
);
