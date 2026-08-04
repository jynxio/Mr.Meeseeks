import * as $ from "@base-ui/react/toast";

import { mergeClassNames } from "../../_utils";
import css from "./_index.module.css";

const Toast = { ...$.Toast, Root, Title, Content, Viewport, Description } as (typeof $)["Toast"];

function Viewport(props: $.Toast.Viewport.Props) {
    const className = mergeClassNames(props.className, css["viewport"]);

    return <$.Toast.Viewport {...props} className={className} />;
}

function Root(props: $.Toast.Root.Props) {
    const className = mergeClassNames(props.className, css["root"]);

    return <$.Toast.Root {...props} className={className} />;
}

function Content(props: $.Toast.Content.Props) {
    const className = mergeClassNames(props.className, css["content"]);

    return <$.Toast.Content {...props} className={className} />;
}

function Title(props: $.Toast.Title.Props) {
    const className = mergeClassNames(props.className, css["title"]);

    return <$.Toast.Title {...props} className={className} />;
}

function Description(props: $.Toast.Description.Props) {
    const className = mergeClassNames(props.className, css["description"]);

    return <$.Toast.Description {...props} className={className} />;
}

export type * from "@base-ui/react/toast";
export { Toast };
