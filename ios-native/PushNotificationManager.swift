import Foundation
import UserNotifications

// Push notification manager for APNS
class PushNotificationManager: NSObject, ObservableObject {
    @Published var deviceToken: String?
    @Published var isAuthorized: Bool = false
    
    static let shared = PushNotificationManager()
    
    private override init() {
        super.init()
        checkAuthorization()
    }
    
    // Request notification permissions
    func requestAuthorization() {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge, .sound]) { granted, error in
            DispatchQueue.main.async {
                self.isAuthorized = granted
                
                if granted {
                    print("Notification permission granted")
                    self.registerForRemoteNotifications()
                } else if let error = error {
                    print("Notification permission error: \(error)")
                }
            }
        }
    }
    
    // Check current authorization status
    func checkAuthorization() {
        UNUserNotificationCenter.current().getNotificationSettings { settings in
            DispatchQueue.main.async {
                self.isAuthorized = settings.authorizationStatus == .authorized
            }
        }
    }
    
    // Register for remote notifications
    private func registerForRemoteNotifications() {
        DispatchQueue.main.async {
            #if !targetEnvironment(simulator)
            UIApplication.shared.registerForRemoteNotifications()
            #else
            print("Push notifications not available in simulator")
            #endif
        }
    }
    
    // Handle device token registration
    func didRegisterForRemoteNotifications(deviceToken: Data) {
        let tokenParts = deviceToken.map { data in String(format: "%02.2hhx", data) }
        let token = tokenParts.joined()
        
        DispatchQueue.main.async {
            self.deviceToken = token
            print("Device token: \(token)")
        }
    }
    
    // Handle registration failure
    func didFailToRegisterForRemoteNotifications(error: Error) {
        print("Failed to register for remote notifications: \(error)")
    }
    
    // Handle received notification
    func handleNotification(userInfo: [AnyHashable: Any]) {
        print("Received notification: \(userInfo)")
        
        // Extract custom data
        if let entryID = userInfo["entry_id"] as? Int,
           let type = userInfo["type"] as? String {
            print("Notification for entry \(entryID), type: \(type)")
            
            // Post notification for app to handle
            NotificationCenter.default.post(
                name: .processingComplete,
                object: nil,
                userInfo: ["entry_id": entryID]
            )
        }
    }
    
    // Display local notification
    func scheduleLocalNotification(title: String, body: String, userInfo: [String: Any]? = nil) {
        let content = UNMutableNotificationContent()
        content.title = title
        content.body = body
        content.sound = .default
        
        if let userInfo = userInfo {
            content.userInfo = userInfo
        }
        
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 1, repeats: false)
        let request = UNNotificationRequest(
            identifier: UUID().uuidString,
            content: content,
            trigger: trigger
        )
        
        UNUserNotificationCenter.current().add(request) { error in
            if let error = error {
                print("Error scheduling notification: \(error)")
            }
        }
    }
}

// MARK: - Notification Names

extension Notification.Name {
    static let processingComplete = Notification.Name("processingComplete")
}
