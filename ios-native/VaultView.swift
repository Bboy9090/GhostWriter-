import SwiftUI

// View for displaying and managing vault entries
struct VaultView: View {
    @StateObject private var apiClient = APIClient()
    @State private var entries: [PortalEntry] = []
    @State private var searchQuery: String = ""
    @State private var isLoading: Bool = false
    @State private var errorMessage: String?
    @State private var showingShareSheet = false
    @State private var shareContent: String = ""
    
    // User settings
    let userID: String
    
    var body: some View {
        NavigationView {
            VStack {
                // Search bar
                HStack {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(.gray)
                    
                    TextField("Search vault...", text: $searchQuery)
                        .textFieldStyle(.plain)
                    
                    if !searchQuery.isEmpty {
                        Button(action: { searchQuery = "" }) {
                            Image(systemName: "xmark.circle.fill")
                                .foregroundColor(.gray)
                        }
                    }
                }
                .padding()
                .background(Color(.systemGray6))
                .cornerRadius(10)
                .padding(.horizontal)
                
                // Search button
                Button(action: performSearch) {
                    HStack {
                        if isLoading {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                        }
                        Text(isLoading ? "Searching..." : "Search")
                            .fontWeight(.semibold)
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(10)
                }
                .padding(.horizontal)
                .disabled(isLoading)
                
                // Error message
                if let errorMessage = errorMessage {
                    Text(errorMessage)
                        .foregroundColor(.red)
                        .font(.caption)
                        .padding()
                }
                
                // Entries list
                List {
                    ForEach(entries) { entry in
                        VaultEntryRow(entry: entry) {
                            shareEntry(entry)
                        }
                    }
                }
                .listStyle(.plain)
                .refreshable {
                    performSearch()
                }
            }
            .navigationTitle("Vault")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: loadRecentEntries) {
                        Image(systemName: "arrow.clockwise")
                    }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: exportAllEntries) {
                        Image(systemName: "square.and.arrow.up")
                    }
                }
            }
            .sheet(isPresented: $showingShareSheet) {
                ShareSheet(items: [shareContent])
            }
            .onAppear {
                loadRecentEntries()
            }
        }
    }
    
    // Perform search
    private func performSearch() {
        isLoading = true
        errorMessage = nil
        
        apiClient.searchVault(
            userID: userID,
            query: searchQuery.isEmpty ? nil : searchQuery,
            limit: 50
        ) { result in
            DispatchQueue.main.async {
                isLoading = false
                
                switch result {
                case .success(let results):
                    entries = results
                    
                case .failure(let error):
                    errorMessage = "Search failed: \(error.localizedDescription)"
                }
            }
        }
    }
    
    // Load recent entries
    private func loadRecentEntries() {
        isLoading = true
        errorMessage = nil
        
        apiClient.getEntries(userID: userID, limit: 100) { result in
            DispatchQueue.main.async {
                isLoading = false
                
                switch result {
                case .success(let results):
                    entries = results
                    
                case .failure(let error):
                    errorMessage = "Failed to load entries: \(error.localizedDescription)"
                }
            }
        }
    }
    
    // Share single entry
    private func shareEntry(_ entry: PortalEntry) {
        shareContent = """
        Captured: \(entry.createdAt)
        
        \(entry.textContent)
        """
        showingShareSheet = true
    }
    
    // Export all entries
    private func exportAllEntries() {
        let content = entries.map { entry in
            """
            === Entry \(entry.id) ===
            Captured: \(entry.createdAt)
            
            \(entry.textContent)
            
            """
        }.joined(separator: "\n")
        
        shareContent = content
        showingShareSheet = true
    }
}

// Row view for a vault entry
struct VaultEntryRow: View {
    let entry: PortalEntry
    let onShare: () -> Void
    
    @State private var isExpanded: Bool = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Entry #\(entry.id)")
                        .font(.headline)
                    
                    Text(formatDate(entry.createdAt))
                        .font(.caption)
                        .foregroundColor(.gray)
                }
                
                Spacer()
                
                Button(action: onShare) {
                    Image(systemName: "square.and.arrow.up")
                        .foregroundColor(.blue)
                }
            }
            
            Text(entry.textContent)
                .font(.body)
                .lineLimit(isExpanded ? nil : 3)
                .onTapGesture {
                    withAnimation {
                        isExpanded.toggle()
                    }
                }
        }
        .padding(.vertical, 4)
    }
    
    private func formatDate(_ dateString: String) -> String {
        let formatter = ISO8601DateFormatter()
        guard let date = formatter.date(from: dateString) else {
            return dateString
        }
        
        let displayFormatter = DateFormatter()
        displayFormatter.dateStyle = .medium
        displayFormatter.timeStyle = .short
        return displayFormatter.string(from: date)
    }
}

// Preview
struct VaultView_Previews: PreviewProvider {
    static var previews: some View {
        VaultView(userID: "test-user-id")
    }
}
