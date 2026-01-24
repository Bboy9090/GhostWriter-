import Foundation

enum TextPipeline {
    static let paragraphToken = "__GW_PARA__"
    static let defaultNoisePhrases = [
        "Regenerate response",
        "Stop generating",
        "Copy",
        "Share",
        "New chat",
        "Edit",
        "Retry",
        "Scroll to bottom",
        "Copied",
        "Feedback",
        "Thumbs up",
        "Thumbs down"
    ]

    static let defaultUserPatterns = ["User:", "You:", "Me:"]
    static let defaultAssistantPatterns = ["Assistant:", "ChatGPT:", "Gemini:", "AI:"]

    static func tokenize(_ text: String) -> [String] {
        text.lowercased()
            .replacingOccurrences(of: "[^\\w\\s]", with: " ", options: .regularExpression)
            .split(whereSeparator: { $0.isWhitespace })
            .map(String.init)
    }

    static func heal(_ text: String) -> String {
        guard !text.isEmpty else { return "" }
        var cleaned = text.replacingOccurrences(of: "-\n(\\w)", with: "$1", options: .regularExpression)
        cleaned = cleaned.replacingOccurrences(of: "\n\\s*\n+", with: paragraphToken, options: .regularExpression)
        cleaned = cleaned.replacingOccurrences(of: "\n+", with: " ", options: .regularExpression)
        cleaned = cleaned.replacingOccurrences(of: paragraphToken, with: "\n\n")
        return cleaned.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    static func splitParagraphs(_ text: String) -> [String] {
        text.split(separator: "\n\n")
            .map { $0.replacingOccurrences(of: "\\s+", with: " ", options: .regularExpression) }
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }
    }

    static func jaccardSimilarity(_ a: String, _ b: String) -> Double {
        let tokensA = Set(tokenize(a))
        let tokensB = Set(tokenize(b))
        guard !tokensA.isEmpty && !tokensB.isEmpty else { return 0 }

        let intersection = tokensA.intersection(tokensB).count
        let union = tokensA.count + tokensB.count - intersection
        return union == 0 ? 0 : Double(intersection) / Double(union)
    }

    static func normalizeRolePrefix(
        _ paragraph: String,
        userPatterns: [String],
        assistantPatterns: [String]
    ) -> String {
        let lower = paragraph.lowercased()
        if let match = userPatterns.first(where: { lower.hasPrefix($0.lowercased()) }) {
            let trimmed = paragraph.dropFirst(match.count).trimmingCharacters(in: .whitespaces)
            return "User: \(trimmed)"
        }
        if let match = assistantPatterns.first(where: { lower.hasPrefix($0.lowercased()) }) {
            let trimmed = paragraph.dropFirst(match.count).trimmingCharacters(in: .whitespaces)
            return "Assistant: \(trimmed)"
        }
        return paragraph
    }

    static func buildHeading(from paragraph: String, wordCount: Int) -> String {
        let tokens = tokenize(paragraph)
        if tokens.isEmpty { return "Session" }
        return tokens.prefix(max(3, wordCount)).joined(separator: " ")
    }

    static func formatParagraph(_ paragraph: String, format: OutputFormat) -> String {
        guard format == .markdown else { return paragraph }
        if paragraph.hasPrefix("User:") {
            return paragraph.replacingOccurrences(of: "User:", with: "**User:**")
        }
        if paragraph.hasPrefix("Assistant:") {
            return paragraph.replacingOccurrences(of: "Assistant:", with: "**Assistant:**")
        }
        return paragraph
    }

    static func formatOutput(
        segments: [Segment],
        outputFormat: OutputFormat,
        includeHeader: Bool,
        sessionName: String,
        sourceApp: String,
        includeSegmentTimestamps: Bool,
        autoHeadingEnabled: Bool,
        headingWordCount: Int
    ) -> String {
        if outputFormat == .json {
            let payload: [String: Any] = [
                "sessionName": sessionName.isEmpty ? NSNull() : sessionName,
                "sourceApp": sourceApp.isEmpty ? NSNull() : sourceApp,
                "generatedAt": ISO8601DateFormatter().string(from: Date()),
                "segments": segments.enumerated().map { index, segment in
                    [
                        "id": segment.id.uuidString,
                        "title": segment.title ?? (autoHeadingEnabled && !segment.paragraphs.isEmpty
                                                   ? buildHeading(from: segment.paragraphs[0], wordCount: headingWordCount)
                                                   : "Segment \(index + 1)"),
                        "capturedAt": segment.capturedAt ?? NSNull(),
                        "paragraphs": segment.paragraphs
                    ]
                }
            ]
            if let data = try? JSONSerialization.data(withJSONObject: payload, options: [.prettyPrinted]),
               let json = String(data: data, encoding: .utf8) {
                return json
            }
        }

        var lines: [String] = []
        if includeHeader {
            if !sessionName.isEmpty {
                lines.append(outputFormat == .markdown ? "# \(sessionName)" : "Session: \(sessionName)")
            }
            if !sourceApp.isEmpty {
                lines.append("Source: \(sourceApp)")
            }
            lines.append("Captured: \(DateFormatter.localizedString(from: Date(), dateStyle: .short, timeStyle: .short))")
            lines.append("")
        }

        for (index, segment) in segments.enumerated() {
            let title = segment.title ?? (autoHeadingEnabled && !segment.paragraphs.isEmpty
                                          ? buildHeading(from: segment.paragraphs[0], wordCount: headingWordCount)
                                          : "Segment \(index + 1)")
            if segments.count > 1 {
                lines.append(outputFormat == .markdown ? "## \(title)" : "=== \(title) ===")
                if includeSegmentTimestamps, let capturedAt = segment.capturedAt {
                    lines.append("Captured: \(capturedAt)")
                }
                lines.append("")
            }

            segment.paragraphs.forEach { paragraph in
                lines.append(formatParagraph(paragraph, format: outputFormat))
                lines.append("")
            }
        }

        return lines.joined(separator: "\n").trimmingCharacters(in: .whitespacesAndNewlines)
    }
}
