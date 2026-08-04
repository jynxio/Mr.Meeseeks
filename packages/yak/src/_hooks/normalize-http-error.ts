import { YakError } from "../_err.ts";
import { safe } from "../_misc/safe.ts";
import { timeOut } from "../_misc/time-out.ts";

const TIMEOUT = 10_000;
const MAX_BYTES = 1024 * 1024;

function normalize(res: Response): Response {
    if (res.ok) return res;
    if (res.type === "opaque") return res;

    let cachedStatusError: undefined | Promise<unknown> = undefined;
    const clonedRes = safe(() => res.clone());
    const cause = {
        response: res,
        statusCode: res.status,
        statusText: res.statusText,
        statusError: async () => {
            if (!clonedRes) return;

            return (cachedStatusError ??= readResponse(clonedRes));
        },
    };

    throw new YakError("http", { cause });
}

async function readResponse(res: Response): Promise<unknown> {
    const text = await readResponseAsText(res);
    if (text === undefined) return;

    const contentType = res.headers.get("content-type") ?? "";
    const mimeType = (contentType.split(";", 1)[0] ?? "").trim().toLowerCase();

    const isJSON = /\/(?:.*[.+-])?json$/.test(mimeType);
    if (!isJSON) return text;

    return safe(() => JSON.parse(text) as unknown);
}

async function readResponseAsText(res: Response): Promise<string | undefined> {
    const body = res.body;
    if (!body) return await safe(() => timeOut(res.text(), TIMEOUT));

    const reader = safe(() => body.getReader());
    if (!reader) return;

    const result = await safe(() => timeOut(readStream(reader, MAX_BYTES), TIMEOUT));
    return (reader.cancel().catch(() => undefined), result);

    async function readStream(reader: ReadableStreamDefaultReader<Uint8Array>, maxBytes: number) {
        const chunks: string[] = [];
        const decoder = new TextDecoder();

        for (let bytes = 0; ; ) {
            const { done, value } = await reader.read();
            if (done) return chunks.concat(decoder.decode()).join("");

            bytes += value.byteLength;
            if (bytes > maxBytes) return void reader.cancel().catch(() => undefined);

            chunks.push(decoder.decode(value, { stream: true }));
        }
    }
}

export { normalize };
