import { Route, Router, Switch } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";

import { Island } from "./island";
import { Settings } from "./settings";

function App() {
    return (
        <Router hook={useHashLocation}>
            <Switch>
                <Route path="/settings" component={Settings} />
                <Route component={Island} />
            </Switch>
        </Router>
    );
}

export { App };
