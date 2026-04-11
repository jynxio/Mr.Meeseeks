const getScreenInfo = `
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
    let screenFrame: RectPayload
    let safeAreaInsets: SafeAreaInsetsPayload
    let auxiliaryTopLeftArea: RectPayload?
    let auxiliaryTopRightArea: RectPayload?
}

guard let screen = NSScreen.main else {
    exit(1)
}

let payload = ScreenInfoPayload(
    screenFrame: RectPayload(screen.frame),
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
    FileHandle.standardError.write(Data("(error)\n".utf8))
    exit(1)
}
`;

export { getScreenInfo };
