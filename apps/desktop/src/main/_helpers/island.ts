import { spawn } from "node:child_process";
import { z } from "zod";
import { screen } from "electron";

const EXPANDED_W = 300;
const EXPANDED_H = 400;

/**
 * Fallback size for collapsed island window if the screen has no notch.
 */
const FALLBACK_COLLAPSED_W = 185;
const FALLBACK_COLLAPSED_H = 32;

/**
 * The gap between the notch and the collapsed island window
 */
const NOTCH_GAP = 3;

const RectSchema = z.object({ x: z.number(), y: z.number(), w: z.number(), h: z.number() });
const ScreenSpecSchema = z.object({
    frame: RectSchema,
    auxiliaryTopLeftArea: RectSchema,
    auxiliaryTopRightArea: RectSchema,
    safeAreaInsets: z.object({ t: z.number(), l: z.number(), b: z.number(), r: z.number() }),
});

async function getIslandRect() {
    const screen = await getScreenSpec();
    const screenX = screen.frame.x;
    const screenW = screen.frame.w;

    const expandedSize = { w: EXPANDED_W, h: EXPANDED_H };
    const expandedCoords = { x: Math.round(screenX + (screenW - EXPANDED_W) / 2), y: 0 };

    const fallbackCollapsedSize = { w: FALLBACK_COLLAPSED_W, h: FALLBACK_COLLAPSED_H };
    const fallbackCollapsedCoords = {
        x: Math.round(screenX + (screenW - FALLBACK_COLLAPSED_W) / 2),
        y: 0,
    };

    const expandedRect = { ...expandedSize, ...expandedCoords };
    const fallbackCollapsedRect = { ...fallbackCollapsedSize, ...fallbackCollapsedCoords };

    const notch = getNotchRect(screen);
    const hasNotch = notch !== undefined;

    if (!hasNotch) return [fallbackCollapsedRect, expandedRect] as const;

    const collapsedSize = { w: notch.w + NOTCH_GAP * 2, h: notch.h + NOTCH_GAP };
    const collapsedCoords = { x: Math.round(screenX + notch.x - NOTCH_GAP), y: 0 };
    const collapsedRect = { ...collapsedSize, ...collapsedCoords };

    return [collapsedRect, expandedRect] as const;
}

function getNotchRect(screen: Awaited<ReturnType<typeof getScreenSpec>>) {
    const hasNotch = "safeAreaInsets" in screen;
    if (!hasNotch) return;

    const notchLeftMargin = screen.auxiliaryTopLeftArea.w;
    const notchRightMargin = screen.auxiliaryTopRightArea.w;

    const h = screen.auxiliaryTopLeftArea.h;
    const w = screen.frame.w - notchLeftMargin - notchRightMargin;

    return { w, h, x: notchLeftMargin, y: h };
}

async function getScreenSpec() {
    try {
        const swiftStdout = await runSwiftCode(getSwiftCode());
        const stdout = JSON.parse(swiftStdout?.trim() ?? "");

        return ScreenSpecSchema.parse(stdout);
    } catch {
        const { x, y, width, height } = screen.getPrimaryDisplay().bounds;

        return { frame: { w: width, h: height, x, y } };
    }
}

function runSwiftCode(swiftCode: string) {
    const { promise, resolve } = Promise.withResolvers<undefined | string>();
    const child = spawn("swift", ["-"], { signal: AbortSignal.timeout(5000) });

    let out = "";

    child.on("error", () => resolve(undefined));
    child.on("close", (code) => (code === 0 ? resolve(out) : resolve(undefined)));

    child.stdout.setEncoding("utf-8").on("data", (d) => (out += d));
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

function toBounds({ w, h, x, y }: z.infer<typeof RectSchema>) {
    return { width: w, height: h, x, y };
}

export { getIslandRect, toBounds };
