import Foundation
import SwiftUI

enum InputMode: String, CaseIterable {
    case screenshots = "Screenshots"
    case recording = "Recording"
}

enum OutputFormat: String, CaseIterable {
    case plain = "Plain"
    case markdown = "Markdown"
    case json = "JSON"
}

struct CaptureResult: Identifiable {
    let id = UUID()
    let name: String
    let text: String
    let confidence: Double?
    let keptParagraphs: Int
    let droppedParagraphs: Int
    let capturedAt: String?
}

struct Segment: Identifiable {
    let id = UUID()
    var title: String?
    var capturedAt: String?
    var paragraphs: [String]
}

struct CaptureSummary {
    var processed: Int = 0
    var emitted: Int = 0
    var skippedMotion: Int = 0
    var skippedText: Int = 0
    var skippedDuplicate: Int = 0
    var skippedNoise: Int = 0
    var roleTagged: Int = 0
    var segments: Int = 1
}

struct ImageAsset: Identifiable {
    let id = UUID()
    let image: UIImage
    let name: String
    let timestamp: Date?
}
