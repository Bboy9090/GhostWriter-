# GhostWriter iOS (Native)

This folder contains a full native SwiftUI app for iPhone 15.
It uses Vision OCR, PhotosPicker, and AVFoundation to extract text
from screenshots or screen recordings and consolidate threads.

## Build Steps

1. Open Xcode and create a new iOS App (SwiftUI).
2. Replace the generated files with the contents of this folder:
   - GhostWriterApp.swift
   - ContentView.swift
   - ViewModel.swift
   - Models.swift
   - TextPipeline.swift
   - VideoFrameExtractor.swift
   - ShareSheet.swift
3. In Xcode, ensure these frameworks are available:
   - Vision
   - PhotosUI
   - AVFoundation
4. Build and run on your iPhone.

## Notes
- iOS cannot capture other apps live. Use screenshots or screen recordings.
- Vision OCR runs fully on-device.
