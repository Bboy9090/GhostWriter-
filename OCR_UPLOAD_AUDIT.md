# OCR & Upload Path Audit

All systems connected to the capture-store → vault → render pipeline.

## Connected Paths

| Path                      | Trigger                          | Flow                                                                   | Render Target              |
| ------------------------- | -------------------------------- | ---------------------------------------------------------------------- | -------------------------- |
| **IOSCapture OCR**        | Run OCR (screenshots/recordings) | `onSyncToVault` → `addCaptureEntry` → capture-store → BroadcastChannel | Vault, Capture log, Portal |
| **Hero "Upload" button**  | Click                            | `setActiveTab('ios')` + scroll to upload section                       | IOSCapture tab             |
| **Nav "Upload" tab**      | Click (mobile + desktop)         | `setActiveTab('ios')`                                                  | IOSCapture tab             |
| **More → iPhone Capture** | Dropdown select                  | `setActiveTab('ios')`                                                  | IOSCapture tab             |
| **Live demo capture**     | Portal active                    | `startDemoCapture` → `addCaptureEntry`                                 | Capture log                |
| **Manual text input**     | Telemetry card paste             | `addCaptureEntry`                                                      | Capture log                |

## Upload Entry Points (all → IOSCapture)

1. **Hero CTA** – "Upload Screenshots & Recordings" button
2. **Nav "Upload"** – Direct tab (mobile + desktop)
3. **More menu** – "iPhone Capture" (fallback)
4. **IOSCapture drop zone** – Label + file inputs (screenshots, video)
5. **Paste** – Ctrl+V when on Upload tab

## OCR Output Flow

```
IOSCapture runOcr()
  → tesseract.recognize()
  → setResults, setConsolidated
  → onSyncToVault(outputText)
    → addCaptureEntry() [in App]
      → capture-store (localStorage + BroadcastChannel)
        → useCaptureLog (Vault, Portal)
```

All paths above are wired and render through React state + capture-store listeners.
