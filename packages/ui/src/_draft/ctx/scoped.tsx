// @todo
/* oxlint-disable */

import { useMemo, useRef, type ReactNode } from "react";

import { InternalCtx } from "../_internal-ctx/scoped";

type CtxProps = {
    /**
     * @default false
     */
    dirty?: boolean;
    children?: ReactNode;
    host: Document | ShadowRoot;
};

function Ctx({ host, dirty, children }: CtxProps) {
    type Registry = Map<unknown, { sheet: CSSStyleSheet; count: number }>;

    const registryRef = useRef<Registry>(useMemo(() => new Map(), []));

    return <InternalCtx value={{ adopt }}>{children}</InternalCtx>;

    function adopt(key: unknown, css: string) {
        const record = registryRef.current.get(key);
        if (record) return (record.count++, () => discard(key));

        const newRecord = { sheet: new CSSStyleSheet(), count: 0 };

        newRecord.count++;
        newRecord.sheet.replace(css);
        registryRef.current.set(key, newRecord);
        host.adoptedStyleSheets = [...host.adoptedStyleSheets, newRecord.sheet];

        return () => discard(key);
    }

    function discard(key: unknown) {
        const record = registryRef.current.get(key);
        if (!record) return;

        record.count--;
        if (dirty) return;
        if (record.count > 0) return;

        registryRef.current.delete(key);
        host.adoptedStyleSheets = host.adoptedStyleSheets.filter((i) => i !== record.sheet);
    }
}

export { Ctx };
export type { CtxProps };
