import AVFoundation
import UIKit

struct VideoFrameExtractor {
    struct Frame {
        let image: CGImage
        let timestamp: String
    }

    func motionScore(previous: CGImage?, current: CGImage, grid: Int = 12) -> Double {
        guard let previous else { return 1.0 }
        let width = max(1, grid)
        let height = max(1, grid)

        guard let prevData = downsample(image: previous, width: width, height: height),
              let nextData = downsample(image: current, width: width, height: height) else {
            return 1.0
        }

        var total: Double = 0
        for i in 0..<min(prevData.count, nextData.count) {
            total += abs(Double(prevData[i]) - Double(nextData[i])) / 255.0
        }
        return total / Double(min(prevData.count, nextData.count))
    }

    func extractFrames(
        from url: URL,
        maxFrames: Int,
        intervalSeconds: Double
    ) async throws -> [Frame] {
        let asset = AVAsset(url: url)
        let durationSeconds = asset.duration.seconds
        guard durationSeconds > 0 else { return [] }

        let generator = AVAssetImageGenerator(asset: asset)
        generator.appliesPreferredTrackTransform = true
        generator.requestedTimeToleranceBefore = .zero
        generator.requestedTimeToleranceAfter = .zero

        var frames: [Frame] = []
        let totalFrames = min(maxFrames, Int(ceil(durationSeconds / intervalSeconds)))

        for index in 0..<totalFrames {
            let time = min(durationSeconds, Double(index) * intervalSeconds)
            let cmTime = CMTime(seconds: time, preferredTimescale: 600)
            let cgImage = try generator.copyCGImage(at: cmTime, actualTime: nil)
            frames.append(Frame(image: cgImage, timestamp: formatTimestamp(time)))
        }

        return frames
    }

    private func formatTimestamp(_ seconds: Double) -> String {
        let mins = Int(seconds / 60)
        let secs = Int(seconds.truncatingRemainder(dividingBy: 60))
        let tenths = Int((seconds.truncatingRemainder(dividingBy: 1)) * 10)
        return String(format: "%02d:%02d.%01d", mins, secs, tenths)
    }

    private func downsample(image: CGImage, width: Int, height: Int) -> [UInt8]? {
        let colorSpace = CGColorSpaceCreateDeviceGray()
        let bytesPerRow = width
        var buffer = [UInt8](repeating: 0, count: width * height)

        guard let context = CGContext(
            data: &buffer,
            width: width,
            height: height,
            bitsPerComponent: 8,
            bytesPerRow: bytesPerRow,
            space: colorSpace,
            bitmapInfo: CGImageAlphaInfo.none.rawValue
        ) else {
            return nil
        }

        context.interpolationQuality = .low
        context.draw(image, in: CGRect(x: 0, y: 0, width: width, height: height))
        return buffer
    }
}
