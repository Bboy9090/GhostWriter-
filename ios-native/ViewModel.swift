import Foundation
import PhotosUI
import SwiftUI
import AVFoundation
import ImageIO

@MainActor
final class IOSCaptureViewModel: ObservableObject {
    @Published var inputMode: InputMode = .screenshots
    @Published var outputFormat: OutputFormat = .plain
    @Published var sourceApp: String = "ChatGPT"
    @Published var sessionName: String = ""
    @Published var includeHeader: Bool = true
    @Published var includeSegmentTimestamps: Bool = true
    @Published var autoHeadingEnabled: Bool = true
    @Published var headingWordCount: Int = 8

    @Published var lineHealEnabled: Bool = true
    @Published var noiseFilterEnabled: Bool = true
    @Published var noisePhraseInput: String = TextPipeline.defaultNoisePhrases.joined(separator: "\n")
    @Published var roleNormalizeEnabled: Bool = false
    @Published var userPatternInput: String = TextPipeline.defaultUserPatterns.joined(separator: ", ")
    @Published var assistantPatternInput: String = TextPipeline.defaultAssistantPatterns.joined(separator: ", ")

    @Published var autoSegmentEnabled: Bool = true
    @Published var segmentGapMinutes: Int = 8

    @Published var minChars: Int = 40
    @Published var dedupeEnabled: Bool = true
    @Published var dedupeWindow: Int = 8
    @Published var similarityThreshold: Double = 0.85

    @Published var enhanceEnabled: Bool = true
    @Published var grayscaleEnabled: Bool = true
    @Published var contrastBoost: Double = 20
    @Published var imageMaxWidth: CGFloat = 1600
    @Published var videoMaxWidth: CGFloat = 1280
    @Published var videoFrameInterval: Double = 0.9
    @Published var maxFrames: Int = 140
    @Published var motionDelta: Double = 0.012

    @Published var language: String = "en-US"

    @Published var images: [ImageAsset] = []
    @Published var videoURL: URL?
    @Published var results: [CaptureResult] = []
    @Published var consolidated: String = ""
    @Published var summary = CaptureSummary()
    @Published var progress: Double = 0
    @Published var isProcessing: Bool = false
    @Published var currentStatus: String?
    @Published var cancelRequested: Bool = false

    private let ocrService = OCRService()
    private let frameExtractor = VideoFrameExtractor()
    private var recentParagraphs: [String] = []

    func handleImages(items: [PhotosPickerItem]) async {
        images.removeAll()
        videoURL = nil
        currentStatus = "Loading images..."

        for item in items {
            if let data = try? await item.loadTransferable(type: Data.self),
               let image = UIImage(data: data) {
                let name = item.itemIdentifier ?? UUID().uuidString
                let timestamp = extractTimestamp(from: data) ?? Date()
                images.append(ImageAsset(image: image, name: name, timestamp: timestamp))
            }
        }

        images.sort { ($0.timestamp ?? Date()) < ($1.timestamp ?? Date()) }
        currentStatus = "Ready"
    }

    func handleVideo(item: PhotosPickerItem) async {
        images.removeAll()
        currentStatus = "Loading video..."
        if let url = try? await item.loadTransferable(type: URL.self) {
            videoURL = url
        }
        currentStatus = "Ready"
    }

    func runOCR() async {
        guard !isProcessing else { return }
        isProcessing = true
        cancelRequested = false
        progress = 0
        summary = CaptureSummary()
        results.removeAll()
        consolidated = ""
        recentParagraphs.removeAll()

        if inputMode == .screenshots {
            await runImageOCR()
        } else {
            await runVideoOCR()
        }

        isProcessing = false
        cancelRequested = false
    }

    func stop() {
        cancelRequested = true
    }

    private func runImageOCR() async {
        var segments: [Segment] = []
        var activeSegment: Segment?
        var lastTimestamp: Date?

        for (index, asset) in images.enumerated() {
            if cancelRequested { break }
            currentStatus = "OCR \(index + 1) / \(images.count)"
            if autoSegmentEnabled, let timestamp = asset.timestamp, let last = lastTimestamp {
                let gap = timestamp.timeIntervalSince(last) / 60
                if gap >= Double(segmentGapMinutes) {
                    activeSegment = Segment(title: nil, capturedAt: timestamp.formatted(), paragraphs: [])
                    segments.append(activeSegment!)
                }
            }

            if let timestamp = asset.timestamp {
                lastTimestamp = timestamp
            }

            if activeSegment == nil {
                activeSegment = Segment(title: nil, capturedAt: asset.timestamp?.formatted(), paragraphs: [])
                segments.append(activeSegment!)
            }

            guard let cgImage = ocrService.enhance(
                image: asset.image,
                grayscale: grayscaleEnabled,
                contrast: contrastBoost,
                maxWidth: imageMaxWidth
            ) else { continue }

            let result = try? await ocrService.recognizeText(in: cgImage, language: language)
            let rawText = result?.text ?? ""
            ingest(
                rawText: rawText,
                label: asset.name,
                confidence: result?.confidence,
                capturedAt: asset.timestamp?.formatted() ?? asset.name,
                activeSegment: &activeSegment,
                segments: &segments
            )

            summary.processed += 1
            progress = Double(index + 1) / Double(max(images.count, 1))
        }

        finalizeSegments(segments)
    }

    private func runVideoOCR() async {
        guard let url = videoURL else { return }

        do {
            let frames = try await frameExtractor.extractFrames(
                from: url,
                maxFrames: maxFrames,
                intervalSeconds: videoFrameInterval
            )

            var segments: [Segment] = []
            var activeSegment = Segment(title: nil, capturedAt: nil, paragraphs: [])
            segments.append(activeSegment)

            var prevFrame: CGImage?
            for (index, frame) in frames.enumerated() {
                if cancelRequested { break }
                currentStatus = "Frame \(index + 1) / \(frames.count)"
                let motionScore = frameExtractor.motionScore(previous: prevFrame, current: frame.image)
                prevFrame = frame.image
                if motionScore < motionDelta {
                    summary.skippedMotion += 1
                    continue
                }

                guard let cgImage = ocrService.enhance(
                    image: UIImage(cgImage: frame.image),
                    grayscale: grayscaleEnabled,
                    contrast: contrastBoost,
                    maxWidth: videoMaxWidth
                ) else { continue }

                let result = try? await ocrService.recognizeText(in: cgImage, language: language)
                let rawText = result?.text ?? ""
                ingest(
                    rawText: rawText,
                    label: "Frame \(index + 1)",
                    confidence: result?.confidence,
                    capturedAt: frame.timestamp,
                    activeSegment: &activeSegment,
                    segments: &segments
                )
                summary.processed += 1
                progress = Double(index + 1) / Double(max(frames.count, 1))
            }

            finalizeSegments(segments)
        } catch {
            currentStatus = "Video processing failed."
        }
    }

    private func ingest(
        rawText: String,
        label: String,
        confidence: Double?,
        capturedAt: String,
        activeSegment: inout Segment?,
        segments: inout [Segment]
    ) {
        let cleanedText = lineHealEnabled ? TextPipeline.heal(rawText) : rawText.trimmingCharacters(in: .whitespacesAndNewlines)
        let paragraphs = TextPipeline.splitParagraphs(cleanedText)
        var kept = 0
        var dropped = 0

        let noisePhrases = noisePhraseInput.split(separator: "\n").map { $0.trimmingCharacters(in: .whitespaces) }
        let userPatterns = userPatternInput.split(separator: ",").map { $0.trimmingCharacters(in: .whitespaces) }
        let assistantPatterns = assistantPatternInput.split(separator: ",").map { $0.trimmingCharacters(in: .whitespaces) }

        if activeSegment == nil {
            activeSegment = Segment(title: nil, capturedAt: capturedAt, paragraphs: [])
            segments.append(activeSegment!)
        }

        for paragraph in paragraphs {
            if paragraph.count < minChars {
                dropped += 1
                summary.skippedText += 1
                continue
            }

            if noiseFilterEnabled {
                let lowered = paragraph.lowercased()
                let isNoise = noisePhrases.contains { !($0.isEmpty) && lowered.contains($0.lowercased()) }
                if isNoise {
                    dropped += 1
                    summary.skippedNoise += 1
                    continue
                }
            }

            var normalized = paragraph
            if roleNormalizeEnabled {
                let updated = TextPipeline.normalizeRolePrefix(paragraph, userPatterns: userPatterns, assistantPatterns: assistantPatterns)
                if updated != paragraph {
                    summary.roleTagged += 1
                }
                normalized = updated
            }

            if dedupeEnabled && dedupeWindow > 0 {
                let isDuplicate = recentParagraphs.contains {
                    TextPipeline.jaccardSimilarity($0, normalized) >= similarityThreshold
                }
                if isDuplicate {
                    dropped += 1
                    summary.skippedDuplicate += 1
                    continue
                }
            }

            recentParagraphs.insert(normalized, at: 0)
            if recentParagraphs.count > dedupeWindow {
                recentParagraphs.removeLast()
            }

            activeSegment?.paragraphs.append(normalized)
            kept += 1
        }

        results.append(CaptureResult(
            name: label,
            text: cleanedText,
            confidence: confidence,
            keptParagraphs: kept,
            droppedParagraphs: dropped,
            capturedAt: capturedAt
        ))
        summary.emitted += kept
    }

    private func finalizeSegments(_ segments: [Segment]) {
        summary.segments = segments.count
        consolidated = TextPipeline.formatOutput(
            segments: segments,
            outputFormat: outputFormat,
            includeHeader: includeHeader,
            sessionName: sessionName,
            sourceApp: sourceApp,
            includeSegmentTimestamps: includeSegmentTimestamps,
            autoHeadingEnabled: autoHeadingEnabled,
            headingWordCount: headingWordCount
        )
        currentStatus = "Complete"
    }

    private func extractTimestamp(from data: Data) -> Date? {
        guard let source = CGImageSourceCreateWithData(data as CFData, nil),
              let properties = CGImageSourceCopyPropertiesAtIndex(source, 0, nil) as? [CFString: Any] else {
            return nil
        }

        if let exif = properties[kCGImagePropertyExifDictionary] as? [CFString: Any],
           let dateString = exif[kCGImagePropertyExifDateTimeOriginal] as? String {
            return parseExifDate(dateString)
        }

        if let tiff = properties[kCGImagePropertyTIFFDictionary] as? [CFString: Any],
           let dateString = tiff[kCGImagePropertyTIFFDateTime] as? String {
            return parseExifDate(dateString)
        }

        return nil
    }

    private func parseExifDate(_ value: String) -> Date? {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy:MM:dd HH:mm:ss"
        return formatter.date(from: value)
    }
}
