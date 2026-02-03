import Foundation
import Combine

// WebSocket client for real-time text syncing
class WebSocketClient: ObservableObject {
    @Published var isConnected: Bool = false
    @Published var lastError: String?
    
    private var webSocketTask: URLSessionWebSocketTask?
    private var session: URLSession?
    private let serverURL: URL
    private var pingTimer: Timer?
    
    init(serverURL: String = "ws://localhost:8080/ws") {
        guard let url = URL(string: serverURL) else {
            fatalError("Invalid WebSocket URL")
        }
        self.serverURL = url
        self.session = URLSession(configuration: .default)
    }
    
    // Connect to WebSocket server
    func connect() {
        guard let session = session else { return }
        
        webSocketTask = session.webSocketTask(with: serverURL)
        webSocketTask?.resume()
        isConnected = true
        
        // Start receiving messages
        receiveMessage()
        
        // Start ping timer to keep connection alive
        startPingTimer()
        
        print("WebSocket connected to \(serverURL)")
    }
    
    // Disconnect from WebSocket server
    func disconnect() {
        webSocketTask?.cancel(with: .goingAway, reason: nil)
        webSocketTask = nil
        isConnected = false
        stopPingTimer()
        print("WebSocket disconnected")
    }
    
    // Send text content to server
    func sendText(userID: String, textContent: String, deviceToken: String? = nil) {
        guard isConnected else {
            print("WebSocket not connected")
            return
        }
        
        let message: [String: Any] = [
            "type": "text_sync",
            "user_id": userID,
            "text_content": textContent,
            "device_token": deviceToken ?? "",
            "timestamp": ISO8601DateFormatter().string(from: Date())
        ]
        
        guard let jsonData = try? JSONSerialization.data(withJSONObject: message),
              let jsonString = String(data: jsonData, encoding: .utf8) else {
            print("Failed to serialize message")
            return
        }
        
        let wsMessage = URLSessionWebSocketTask.Message.string(jsonString)
        webSocketTask?.send(wsMessage) { [weak self] error in
            if let error = error {
                print("WebSocket send error: \(error)")
                self?.lastError = error.localizedDescription
            } else {
                print("Message sent successfully")
            }
        }
    }
    
    // Receive messages from server
    private func receiveMessage() {
        webSocketTask?.receive { [weak self] result in
            guard let self = self else { return }
            
            switch result {
            case .failure(let error):
                print("WebSocket receive error: \(error)")
                self.lastError = error.localizedDescription
                self.isConnected = false
                
            case .success(let message):
                switch message {
                case .string(let text):
                    print("Received text: \(text)")
                    self.handleReceivedMessage(text)
                    
                case .data(let data):
                    print("Received data: \(data.count) bytes")
                    
                @unknown default:
                    break
                }
                
                // Continue receiving messages
                self.receiveMessage()
            }
        }
    }
    
    // Handle received message
    private func handleReceivedMessage(_ text: String) {
        guard let data = text.data(using: .utf8),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            print("Failed to parse received message")
            return
        }
        
        if let status = json["status"] as? String {
            print("Server status: \(status)")
        }
    }
    
    // Send ping to keep connection alive
    private func startPingTimer() {
        pingTimer = Timer.scheduledTimer(withTimeInterval: 30, repeats: true) { [weak self] _ in
            self?.ping()
        }
    }
    
    private func stopPingTimer() {
        pingTimer?.invalidate()
        pingTimer = nil
    }
    
    private func ping() {
        webSocketTask?.sendPing { [weak self] error in
            if let error = error {
                print("Ping failed: \(error)")
                self?.isConnected = false
            }
        }
    }
    
    deinit {
        disconnect()
    }
}
