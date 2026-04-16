import { spawn } from "node:child_process";
import { type } from "arktype";

const Rect = type({ x: "number", y: "number", w: "number", h: "number" });
const SafeAreaInsets = type({ t: "number", l: "number", b: "number", r: "number" });
const Screen = type({
    frame: Rect,
    safeAreaInsets: SafeAreaInsets,
    auxiliaryTopLeftArea: Rect,
    auxiliaryTopRightArea: Rect,
});

console.log(await getNotch());

async function getNotch(): Promise<typeof Rect.infer | undefined> {
    const [isOk, rawData] = await runSwiftCode(getSwiftCode());
    if (!isOk) return undefined;

    try {
        const screen = Screen.assert(JSON.parse(rawData.trim()));

        const notchLeftMargin = screen.auxiliaryTopLeftArea.w;
        const notchRightMargin = screen.auxiliaryTopRightArea.w;

        const notchHeight = screen.auxiliaryTopLeftArea.h;
        const notchWidth = screen.frame.w - notchLeftMargin - notchRightMargin;

        return { w: notchWidth, h: notchHeight, x: notchLeftMargin, y: notchHeight };
    } catch {
        return undefined;
    }
}

function runSwiftCode(swiftCode: string) {
    type R = [isOk: true, data: string] | [isOk: false];

    const { promise, resolve } = Promise.withResolvers<R>();
    const child = spawn("swift", ["-"], { signal: AbortSignal.timeout(5000) });

    let out = "";

    child.stdout.setEncoding("utf-8").on("data", (d: string) => (out += d));
    child.on("error", () => resolve([false]));
    child.on("close", (code: number | null) => (code === 0 ? resolve([true, out]) : resolve([false])));
    child.stdin.end(swiftCode);

    return promise;
}

function getSwiftCode() {
    return `
import AppKit
import Foundation

struct RectPayload: Codable {
    let x: Double
    let y: Double
    let w: Double
    let h: Double

    init(_ rect: NSRect) {
        x = rect.origin.x
        y = rect.origin.y
        w = rect.size.width
        h = rect.size.height
    }
}

struct SafeAreaInsetsPayload: Codable {
    let t: Double
    let l: Double
    let b: Double
    let r: Double

    init(_ insets: NSEdgeInsets) {
        t = insets.top
        l = insets.left
        b = insets.bottom
        r = insets.right
    }
}

struct ScreenInfoPayload: Codable {
    let frame: RectPayload
    let safeAreaInsets: SafeAreaInsetsPayload
    let auxiliaryTopLeftArea: RectPayload?
    let auxiliaryTopRightArea: RectPayload?
}

guard let screen = NSScreen.main else {
    exit(1)
}

let payload = ScreenInfoPayload(
    frame: RectPayload(screen.frame),
    safeAreaInsets: SafeAreaInsetsPayload(screen.safeAreaInsets),
    auxiliaryTopLeftArea: screen.auxiliaryTopLeftArea.map(RectPayload.init),
    auxiliaryTopRightArea: screen.auxiliaryTopRightArea.map(RectPayload.init)
)

do {
    let data = try JSONEncoder().encode(payload)
    guard let json = String(data: data, encoding: .utf8) else {
        exit(1)
    }
    print(json)
} catch {
    FileHandle.standardError.write(Data("\\(error)\\n".utf8))
    exit(1)
}
`;
}
