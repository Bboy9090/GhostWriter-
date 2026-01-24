import Foundation
import Vision
import UIKit

final class OCRService {
    struct Result {
        let text: String
        let confidence: Double?
    }

    func recognizeText(in image: CGImage, language: String) async throws -> Result {
        try await withCheckedThrowingContinuation { continuation in
            let request = VNRecognizeTextRequest { request, error in
                if let error = error {
                    continuation.resume(throwing: error)
                    return
                }

                let observations = request.results as? [VNRecognizedTextObservation] ?? []
                let lines: [String] = observations.compactMap { observation in
                    observation.topCandidates(1).first?.string
                }
                let confidence: Double? = observations.isEmpty
                    ? nil
                    : observations
                        .compactMap { $0.topCandidates(1).first?.confidence }
                        .map { Double($0) }
                        .reduce(0, +) / Double(observations.count)

                continuation.resume(returning: Result(text: lines.joined(separator: "\n"), confidence: confidence))
            }

            request.recognitionLevel = .accurate
            request.usesLanguageCorrection = true
            request.recognitionLanguages = [language]

            let handler = VNImageRequestHandler(cgImage: image, options: [:])
            do {
                try handler.perform([request])
            } catch {
                continuation.resume(throwing: error)
            }
        }
    }

    func enhance(image: UIImage, grayscale: Bool, contrast: Double, maxWidth: CGFloat) -> CGImage? {
        let scale = min(1.0, maxWidth / image.size.width)
        let targetSize = CGSize(width: image.size.width * scale, height: image.size.height * scale)

        let renderer = UIGraphicsImageRenderer(size: targetSize)
        let processed = renderer.image { ctx in
            image.draw(in: CGRect(origin: .zero, size: targetSize))
            if grayscale || contrast != 0 {
                let cgImage = ctx.cgContext.makeImage()
                if let cgImage {
                    let processed = processCGImage(cgImage, grayscale: grayscale, contrast: contrast)
                    if let processed {
                        ctx.cgContext.draw(processed, in: CGRect(origin: .zero, size: targetSize))
                    }
                }
            }
        }

        return processed.cgImage
    }

    private func processCGImage(_ image: CGImage, grayscale: Bool, contrast: Double) -> CGImage? {
        let width = image.width
        let height = image.height
        let bytesPerRow = width * 4
        let colorSpace = CGColorSpaceCreateDeviceRGB()
        var buffer = [UInt8](repeating: 0, count: width * height * 4)

        guard let context = CGContext(
            data: &buffer,
            width: width,
            height: height,
            bitsPerComponent: 8,
            bytesPerRow: bytesPerRow,
            space: colorSpace,
            bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
        ) else {
            return nil
        }

        context.draw(image, in: CGRect(x: 0, y: 0, width: width, height: height))
        let factor = (259 * (contrast + 255)) / (255 * (259 - contrast))

        for index in stride(from: 0, to: buffer.count, by: 4) {
            var r = Double(buffer[index])
            var g = Double(buffer[index + 1])
            var b = Double(buffer[index + 2])

            if grayscale {
                let luma = 0.2126 * r + 0.7152 * g + 0.0722 * b
                r = luma
                g = luma
                b = luma
            }

            if contrast != 0 {
                r = factor * (r - 128) + 128
                g = factor * (g - 128) + 128
                b = factor * (b - 128) + 128
            }

            buffer[index] = UInt8(max(0, min(255, Int(r))))
            buffer[index + 1] = UInt8(max(0, min(255, Int(g))))
            buffer[index + 2] = UInt8(max(0, min(255, Int(b))))
        }

        return context.makeImage()
    }
}
