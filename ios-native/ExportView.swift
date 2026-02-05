import SwiftUI
import UIKit

// Document picker for saving to Files app / iCloud
struct DocumentPicker: UIViewControllerRepresentable {
    let fileURL: URL
    let onDismiss: () -> Void
    
    func makeUIViewController(context: Context) -> UIDocumentPickerViewController {
        let picker = UIDocumentPickerViewController(forExporting: [fileURL])
        picker.delegate = context.coordinator
        return picker
    }
    
    func updateUIViewController(_ uiViewController: UIDocumentPickerViewController, context: Context) {}
    
    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }
    
    class Coordinator: NSObject, UIDocumentPickerDelegate {
        let parent: DocumentPicker
        
        init(_ parent: DocumentPicker) {
            self.parent = parent
        }
        
        func documentPickerWasCancelled(_ controller: UIDocumentPickerViewController) {
            parent.onDismiss()
        }
        
        func documentPicker(_ controller: UIDocumentPickerViewController, didPickDocumentsAt urls: [URL]) {
            parent.onDismiss()
        }
    }
}

// File manager for saving content
class FileManager: ObservableObject {
    @Published var showingDocumentPicker = false
    @Published var fileURL: URL?
    
    // Save text to temporary file
    func saveToFile(content: String, filename: String) -> URL? {
        let tempDir = Foundation.FileManager.default.temporaryDirectory
        let fileURL = tempDir.appendingPathComponent(filename)
        
        do {
            try content.write(to: fileURL, atomically: true, encoding: .utf8)
            return fileURL
        } catch {
            print("Error saving file: \(error)")
            return nil
        }
    }
    
    // Save to Files app
    func saveToFilesApp(content: String, filename: String) {
        if let url = saveToFile(content: content, filename: filename) {
            fileURL = url
            showingDocumentPicker = true
        }
    }
    
    // Save to iCloud Drive
    func saveToiCloud(content: String, filename: String) {
        guard let iCloudURL = Foundation.FileManager.default.url(
            forUbiquityContainerIdentifier: nil
        )?.appendingPathComponent("Documents") else {
            print("iCloud not available")
            return
        }
        
        let fileURL = iCloudURL.appendingPathComponent(filename)
        
        do {
            // Create directory if needed
            try Foundation.FileManager.default.createDirectory(
                at: iCloudURL,
                withIntermediateDirectories: true
            )
            
            // Write file
            try content.write(to: fileURL, atomically: true, encoding: .utf8)
            print("Saved to iCloud: \(fileURL)")
        } catch {
            print("Error saving to iCloud: \(error)")
        }
    }
}

// Export options view
struct ExportOptionsView: View {
    let content: String
    let filename: String
    @StateObject private var fileManager = FileManager()
    @State private var showingShareSheet = false
    @State private var showingAlert = false
    @State private var alertMessage = ""
    
    var body: some View {
        VStack(spacing: 20) {
            Text("Export Options")
                .font(.title2)
                .fontWeight(.bold)
                .padding(.top)
            
            // Share sheet
            Button(action: {
                showingShareSheet = true
            }) {
                HStack {
                    Image(systemName: "square.and.arrow.up")
                    Text("Share")
                    Spacer()
                    Image(systemName: "chevron.right")
                }
                .padding()
                .background(Color(.systemGray6))
                .cornerRadius(10)
            }
            
            // Save to Files
            Button(action: {
                fileManager.saveToFilesApp(content: content, filename: filename)
            }) {
                HStack {
                    Image(systemName: "folder")
                    Text("Save to Files")
                    Spacer()
                    Image(systemName: "chevron.right")
                }
                .padding()
                .background(Color(.systemGray6))
                .cornerRadius(10)
            }
            
            // Save to iCloud
            Button(action: {
                fileManager.saveToiCloud(content: content, filename: filename)
                alertMessage = "Saved to iCloud Drive"
                showingAlert = true
            }) {
                HStack {
                    Image(systemName: "icloud")
                    Text("Save to iCloud Drive")
                    Spacer()
                    Image(systemName: "chevron.right")
                }
                .padding()
                .background(Color(.systemGray6))
                .cornerRadius(10)
            }
            
            // Copy to clipboard
            Button(action: {
                UIPasteboard.general.string = content
                alertMessage = "Copied to clipboard"
                showingAlert = true
            }) {
                HStack {
                    Image(systemName: "doc.on.doc")
                    Text("Copy to Clipboard")
                    Spacer()
                    Image(systemName: "chevron.right")
                }
                .padding()
                .background(Color(.systemGray6))
                .cornerRadius(10)
            }
            
            Spacer()
        }
        .padding()
        .sheet(isPresented: $showingShareSheet) {
            ShareSheet(items: [content])
        }
        .sheet(isPresented: $fileManager.showingDocumentPicker) {
            if let url = fileManager.fileURL {
                DocumentPicker(fileURL: url) {
                    fileManager.showingDocumentPicker = false
                }
            }
        }
        .alert("Success", isPresented: $showingAlert) {
            Button("OK", role: .cancel) {}
        } message: {
            Text(alertMessage)
        }
    }
}

// Preview
struct ExportOptionsView_Previews: PreviewProvider {
    static var previews: some View {
        ExportOptionsView(
            content: "Sample text content",
            filename: "ghostwriter_export.txt"
        )
    }
}
