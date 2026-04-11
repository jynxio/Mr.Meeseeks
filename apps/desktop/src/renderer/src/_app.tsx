import { useEffect, useRef, useState } from "react";
import { ipc } from "./ipc";

type TranslationResult =
    | { type: "sentence"; translation: string }
    | { type: "word"; translation: string; us: string; uk: string };

function App() {
    const [input, setInput] = useState("");
    const [translating, setTranslating] = useState(false);
    const [result, setResult] = useState<TranslationResult | null>(null);
    const [error, setError] = useState("");

    const [pinned, setPinned] = useState(false);
    const [hovering, setHovering] = useState(false);
    const leaveTimer = useRef<number>(0);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const expanded = pinned || hovering;

    useEffect(() => {
        return ipc.onToggleIsland(() => setPinned((p) => !p));
    }, []);

    useEffect(() => {
        if (expanded) {
            void ipc.expandIsland();
            const id = window.setTimeout(() => inputRef.current?.focus(), 200);
            return () => clearTimeout(id);
        }
        void ipc.collapseIsland();
        return undefined;
    }, [expanded]);

    async function handleTranslate() {
        const text = input.trim();
        if (!text) return;
        setTranslating(true);
        setError("");
        setResult(null);

        const res = await ipc.translate(text);
        setTranslating(false);
        if (!res.ok) return setError(res.error);
        if (res.data) setResult(res.data);
    }

    return (
        <div
            className={`island ${expanded ? "expanded" : "collapsed"}`}
            onMouseEnter={() => {
                clearTimeout(leaveTimer.current);
                setHovering(true);
            }}
            onMouseLeave={() => {
                leaveTimer.current = window.setTimeout(() => setHovering(false), 300);
            }}
        >
            <div className="island-body">
                <textarea
                    ref={inputRef}
                    className="island-input"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                            e.preventDefault();
                            void handleTranslate();
                        }
                    }}
                    placeholder="Type to translate..."
                    rows={1}
                />

                {error && <div>{error}</div>}
                {result && !translating && (
                    <div>
                        <div>{result.translation}</div>
                        {result.type === "word" && (
                            <div>
                                <span>US {result.us}</span>
                                <span>UK {result.uk}</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export { App };
