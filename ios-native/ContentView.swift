import SwiftUI
import PhotosUI

struct ContentView: View {
    @StateObject private var viewModel = IOSCaptureViewModel()
    @State private var imageSelection: [PhotosPickerItem] = []
    @State private var videoSelection: PhotosPickerItem?
    @State private var showShareSheet = false
    @State private var shareText = ""

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 16) {
                    headerCard
                    inputCard
                    settingsCard
                    outputCard
                    breakdownCard
                }
                .padding()
            }
            .navigationTitle("GhostWriter")
            .sheet(isPresented: $showShareSheet) {
                ShareSheet(items: [shareText])
            }
        }
        .task {
            await handleSelections()
        }
        .onChange(of: imageSelection) { _ in
            Task { await handleSelections() }
        }
        .onChange(of: videoSelection) { _ in
            Task { await handleSelections() }
        }
    }

    private var headerCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("iPhone Capture Vault")
                .font(.title3).bold()
            Text("Capture ChatGPT or Gemini threads using screenshots or recordings. OCR runs fully on-device.")
                .font(.footnote)
                .foregroundColor(.secondary)
            Text("iOS cannot read other apps live. Upload screenshots or screen recordings.")
                .font(.footnote)
                .foregroundColor(.orange)
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(12)
    }

    private var inputCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Picker("Mode", selection: $viewModel.inputMode) {
                ForEach(InputMode.allCases, id: \.self) { mode in
                    Text(mode.rawValue).tag(mode)
                }
            }
            .pickerStyle(.segmented)

            if viewModel.inputMode == .screenshots {
                PhotosPicker(selection: $imageSelection, maxSelectionCount: 200, matching: .images) {
                    Text("Select Screenshots")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
            } else {
                PhotosPicker(selection: $videoSelection, matching: .videos) {
                    Text("Select Screen Recording")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
            }

            HStack {
                Button("Run OCR") {
                    Task { await viewModel.runOCR() }
                }
                .buttonStyle(.borderedProminent)
                .disabled(viewModel.isProcessing)

                Button("Stop") {
                    viewModel.stop()
                }
                .buttonStyle(.bordered)
                .disabled(!viewModel.isProcessing)
            }

            if viewModel.isProcessing {
                ProgressView(value: viewModel.progress)
                Text(viewModel.currentStatus ?? "Processing...")
                    .font(.footnote)
                    .foregroundColor(.secondary)
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(12)
    }

    private var settingsCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Capture Settings")
                .font(.headline)

            TextField("Session name", text: $viewModel.sessionName)
                .textFieldStyle(.roundedBorder)

            TextField("Source app (ChatGPT, Gemini)", text: $viewModel.sourceApp)
                .textFieldStyle(.roundedBorder)

            Toggle("Include header", isOn: $viewModel.includeHeader)
            Toggle("Auto headings", isOn: $viewModel.autoHeadingEnabled)
            Toggle("Segment timestamps", isOn: $viewModel.includeSegmentTimestamps)

            HStack {
                Text("Output")
                Spacer()
                Picker("Output", selection: $viewModel.outputFormat) {
                    ForEach(OutputFormat.allCases, id: \.self) { format in
                        Text(format.rawValue).tag(format)
                    }
                }
                .pickerStyle(.segmented)
            }

            Divider()

            Toggle("Line heal", isOn: $viewModel.lineHealEnabled)
            Toggle("Noise filter", isOn: $viewModel.noiseFilterEnabled)
            Toggle("Role normalize", isOn: $viewModel.roleNormalizeEnabled)
            Toggle("Auto segment", isOn: $viewModel.autoSegmentEnabled)

            HStack {
                Text("Gap minutes")
                Spacer()
                Stepper(value: $viewModel.segmentGapMinutes, in: 1...60) {
                    Text("\(viewModel.segmentGapMinutes)")
                }
            }

            Divider()

            Toggle("Enhance", isOn: $viewModel.enhanceEnabled)
            Toggle("Grayscale", isOn: $viewModel.grayscaleEnabled)

            HStack {
                Text("Contrast")
                Spacer()
                Slider(value: $viewModel.contrastBoost, in: -30...80, step: 1)
            }

            if viewModel.inputMode == .recording {
                HStack {
                    Text("Frame interval")
                    Spacer()
                    Stepper(value: $viewModel.videoFrameInterval, in: 0.3...2.0, step: 0.1) {
                        Text(String(format: "%.1fs", viewModel.videoFrameInterval))
                    }
                }

                HStack {
                    Text("Max frames")
                    Spacer()
                    Stepper(value: $viewModel.maxFrames, in: 20...400) {
                        Text("\(viewModel.maxFrames)")
                    }
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(12)
    }

    private var outputCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Consolidated Thread")
                .font(.headline)

            HStack {
                Button("Copy") {
                    UIPasteboard.general.string = viewModel.consolidated
                }
                .buttonStyle(.bordered)

                Button("Share") {
                    shareText = viewModel.consolidated
                    showShareSheet = true
                }
                .buttonStyle(.bordered)
            }

            TextEditor(text: $viewModel.consolidated)
                .frame(minHeight: 220)
                .font(.footnote)
                .overlay(
                    RoundedRectangle(cornerRadius: 8)
                        .stroke(Color(.separator))
                )

            HStack(spacing: 12) {
                Text("Segments: \(viewModel.summary.segments)")
                Text("Emitted: \(viewModel.summary.emitted)")
                Text("Noise: \(viewModel.summary.skippedNoise)")
            }
            .font(.caption)
            .foregroundColor(.secondary)
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(12)
    }

    private var breakdownCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Capture Breakdown")
                .font(.headline)
            ForEach(viewModel.results) { result in
                VStack(alignment: .leading, spacing: 4) {
                    Text(result.name).font(.subheadline).bold()
                    Text(result.text).font(.caption).foregroundColor(.secondary).lineLimit(3)
                    HStack {
                        Text("Kept \(result.keptParagraphs)")
                        Text("Dropped \(result.droppedParagraphs)")
                        if let confidence = result.confidence {
                            Text(String(format: "%.0f%%", confidence * 100))
                        }
                    }
                    .font(.caption2)
                    .foregroundColor(.secondary)
                }
                .padding(.vertical, 6)
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(12)
    }

    private func handleSelections() async {
        if !imageSelection.isEmpty {
            await viewModel.handleImages(items: imageSelection)
        } else if let videoSelection {
            await viewModel.handleVideo(item: videoSelection)
        }
    }
}
