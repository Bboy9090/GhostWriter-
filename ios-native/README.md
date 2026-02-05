# GhostWriter iOS (Native)

This folder contains a full native SwiftUI app for iPhone that integrates with the GhostWriter backend.
It uses Vision OCR, PhotosPicker, and AVFoundation to extract text from screenshots or screen recordings
and syncs with the backend for semantic search and storage.

## Features

1. **OCR Screen Capture**: Extract text from screenshots and screen recordings using Vision framework
2. **WebSocket Integration**: Real-time text syncing with backend server
3. **Push Notifications**: Receive notifications when text processing is complete via APNs
4. **Vault Access**: Search and retrieve stored texts from the backend
5. **Export Options**: Save to iCloud Drive, Files app, or share with other apps

## Build Steps

1. Open Xcode and create a new iOS App (SwiftUI).
2. Copy all Swift files from this folder to your Xcode project:
   - GhostWriterApp.swift
   - ContentView.swift
   - EnhancedContentView.swift (use as main view)
   - ViewModel.swift
   - Models.swift
   - TextPipeline.swift
   - VideoFrameExtractor.swift
   - ShareSheet.swift
   - WebSocketClient.swift
   - APIClient.swift
   - PushNotificationManager.swift
   - VaultView.swift
   - ExportView.swift

3. In Xcode, ensure these frameworks are available:
   - Vision
   - PhotosUI
   - AVFoundation
   - UserNotifications

4. Configure app capabilities:
   - Enable Push Notifications
   - Enable Background Modes (Remote notifications)
   - Enable iCloud (iCloud Documents)

5. Update Info.plist with required permissions:
   - Privacy - Photo Library Usage Description
   - Privacy - Notifications Usage Description

6. Configure your backend server URL in Settings tab

7. Build and run on your iPhone

## Usage

### OCR Capture
1. Switch to "Capture" tab
2. Select screenshots or screen recording
3. Configure OCR settings
4. Run OCR to extract text
5. Text is automatically synced to backend (if WebSocket is connected)

### Vault Access
1. Switch to "Vault" tab
2. Search for text using semantic search
3. View, share, or export entries
4. Pull to refresh for latest entries

### Settings
1. Configure your User ID (auto-generated)
2. Set backend server URL
3. Connect/disconnect WebSocket
4. Enable push notifications
5. View device token for APNS

## Configuration

### Backend Server
Default: `ws://localhost:8080/ws`

For production, update to your server URL:
- Format: `ws://your-server.com/ws` or `wss://your-server.com/ws` (secure)

### Push Notifications
To enable push notifications:
1. Configure APNS in your Apple Developer account
2. Add your device token in the backend
3. Backend will send notifications when text processing completes

## Notes
- iOS cannot capture other apps live. Use screenshots or screen recordings.
- Vision OCR runs fully on-device (privacy-first)
- WebSocket connection is optional - app works offline
- All extracted text is synced to backend for semantic search
- Use semantic search to find text by meaning, not just keywords

## Architecture

```
ios-native/
├── GhostWriterApp.swift          # App entry point
├── ContentView.swift              # Original OCR capture UI
├── EnhancedContentView.swift     # Main tabbed interface (use this)
├── VaultView.swift               # Vault browsing and search
├── ExportView.swift              # Export to Files/iCloud
├── WebSocketClient.swift         # WebSocket connection
├── APIClient.swift               # REST API client
├── PushNotificationManager.swift # Push notifications
├── ViewModel.swift               # OCR view model
├── Models.swift                  # Data models
├── TextPipeline.swift            # Text processing
├── VideoFrameExtractor.swift     # Video frame extraction
└── ShareSheet.swift              # Share functionality
```
