import SwiftUI

// Enhanced main view with tabs for OCR capture and vault access
struct EnhancedContentView: View {
    @StateObject private var webSocketClient = WebSocketClient()
    @StateObject private var pushManager = PushNotificationManager.shared
    @State private var selectedTab = 0
    @State private var userID: String = UUID().uuidString
    @State private var serverURL: String = "ws://localhost:8080/ws"
    @State private var showSettings = false
    
    var body: some View {
        TabView(selection: $selectedTab) {
            // OCR Capture Tab
            ContentView()
                .tabItem {
                    Label("Capture", systemImage: "camera.viewfinder")
                }
                .tag(0)
            
            // Vault Tab
            VaultView(userID: userID)
                .tabItem {
                    Label("Vault", systemImage: "square.stack.3d.up.fill")
                }
                .tag(1)
            
            // Settings Tab
            SettingsView(
                userID: $userID,
                serverURL: $serverURL,
                webSocketClient: webSocketClient,
                pushManager: pushManager
            )
            .tabItem {
                Label("Settings", systemImage: "gear")
            }
            .tag(2)
        }
        .onAppear {
            // Request push notification permissions
            pushManager.requestAuthorization()
            
            // Load saved user ID if exists
            if let savedUserID = UserDefaults.standard.string(forKey: "userID") {
                userID = savedUserID
            } else {
                UserDefaults.standard.set(userID, forKey: "userID")
            }
            
            if let savedURL = UserDefaults.standard.string(forKey: "serverURL") {
                serverURL = savedURL
            }
        }
    }
}

// Settings view for configuration
struct SettingsView: View {
    @Binding var userID: String
    @Binding var serverURL: String
    @ObservedObject var webSocketClient: WebSocketClient
    @ObservedObject var pushManager: PushNotificationManager
    
    @State private var showingResetAlert = false
    
    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("User Configuration")) {
                    HStack {
                        Text("User ID")
                        Spacer()
                        Text(userID.prefix(8) + "...")
                            .foregroundColor(.gray)
                            .font(.caption)
                    }
                    
                    Button("Generate New User ID") {
                        showingResetAlert = true
                    }
                }
                
                Section(header: Text("Server Configuration")) {
                    TextField("WebSocket URL", text: $serverURL)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .onChange(of: serverURL) { newValue in
                            UserDefaults.standard.set(newValue, forKey: "serverURL")
                        }
                }
                
                Section(header: Text("WebSocket Connection")) {
                    HStack {
                        Text("Status")
                        Spacer()
                        Circle()
                            .fill(webSocketClient.isConnected ? Color.green : Color.gray)
                            .frame(width: 10, height: 10)
                        Text(webSocketClient.isConnected ? "Connected" : "Disconnected")
                            .foregroundColor(.gray)
                    }
                    
                    if webSocketClient.isConnected {
                        Button("Disconnect") {
                            webSocketClient.disconnect()
                        }
                        .foregroundColor(.red)
                    } else {
                        Button("Connect") {
                            webSocketClient.disconnect()
                            let client = WebSocketClient(serverURL: serverURL)
                            client.connect()
                        }
                    }
                    
                    if let error = webSocketClient.lastError {
                        Text("Error: \(error)")
                            .foregroundColor(.red)
                            .font(.caption)
                    }
                }
                
                Section(header: Text("Push Notifications")) {
                    HStack {
                        Text("Status")
                        Spacer()
                        Text(pushManager.isAuthorized ? "Enabled" : "Disabled")
                            .foregroundColor(pushManager.isAuthorized ? .green : .gray)
                    }
                    
                    if !pushManager.isAuthorized {
                        Button("Enable Notifications") {
                            pushManager.requestAuthorization()
                        }
                    }
                    
                    if let token = pushManager.deviceToken {
                        VStack(alignment: .leading) {
                            Text("Device Token")
                                .font(.caption)
                                .foregroundColor(.gray)
                            Text(token.prefix(20) + "...")
                                .font(.caption)
                                .foregroundColor(.gray)
                        }
                    }
                }
                
                Section(header: Text("About")) {
                    HStack {
                        Text("Version")
                        Spacer()
                        Text("1.0.0")
                            .foregroundColor(.gray)
                    }
                    
                    HStack {
                        Text("Build")
                        Spacer()
                        Text("2026.01")
                            .foregroundColor(.gray)
                    }
                }
            }
            .navigationTitle("Settings")
            .alert("Reset User ID", isPresented: $showingResetAlert) {
                Button("Cancel", role: .cancel) {}
                Button("Reset", role: .destructive) {
                    userID = UUID().uuidString
                    UserDefaults.standard.set(userID, forKey: "userID")
                }
            } message: {
                Text("This will generate a new user ID. Your vault data will not be accessible with the new ID.")
            }
        }
    }
}

// Preview
struct EnhancedContentView_Previews: PreviewProvider {
    static var previews: some View {
        EnhancedContentView()
    }
}
