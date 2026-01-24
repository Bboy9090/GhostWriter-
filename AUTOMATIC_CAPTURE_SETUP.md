# 🎯 Automatic Screen Capture - Complete Setup

## ✅ What's Now Available

GhostWriter now supports **automatic screen capture** on all platforms:

| Platform | Method | Command | Status |
|----------|--------|---------|--------|
| **Windows** | Desktop Capture | `npm run ocr:desktop` | ✅ Ready |
| **macOS** | Desktop Capture | `npm run ocr:desktop` | ✅ Ready |
| **Linux** | Desktop Capture | `npm run ocr:desktop` | ✅ Ready |
| **Android** | ADB Capture | `npm run ocr:live` | ✅ Ready |
| **iOS** | Manual Upload | Web UI | ✅ Ready |

## 🚀 Quick Start

### Option 1: Auto-Detect (Recommended)

```bash
# Automatically detects your platform and starts capture
npm run capture:all

# Continuous watch mode
npm run capture:all -- --watch
```

### Option 2: Platform-Specific

**Windows/Mac/Linux:**
```bash
npm run ocr:desktop          # One-time capture
npm run ocr:desktop:watch    # Continuous capture
```

**Android:**
```bash
# Connect device via USB, enable USB debugging, then:
npm run ocr:live -- --interval 750
```

**iOS:**
1. Run `npm run dev:host`
2. Open on iPhone Safari
3. Upload screenshots via web UI

## 📋 What Was Added

### New Scripts
- ✅ `scripts/ocr-desktop.mjs` - Cross-platform desktop capture
- ✅ `scripts/capture-unified.mjs` - Unified capture system with auto-detection

### New Dependencies
- ✅ `screenshot-desktop` - Cross-platform screenshot library

### New Documentation
- ✅ `scripts/PLATFORM_SETUP.md` - Complete platform setup guide
- ✅ Updated README with capture instructions

### New npm Scripts
```json
{
  "ocr:desktop": "Desktop capture",
  "ocr:desktop:watch": "Continuous desktop capture",
  "capture:all": "Auto-detect and start capture"
}
```

## 🎛️ Configuration Options

All capture scripts support these options:

```bash
--interval <ms>        # Capture interval (default: 1000ms)
--duration <ms>        # Total duration (0 = infinite)
--delta <threshold>    # Motion threshold (default: 0.012)
--sample <step>        # Pixel sampling step (default: 12)
--dedupe <threshold>   # Duplicate threshold (default: 0.88)
--min-chars <count>    # Minimum characters (default: 20)
--region x,y,w,h       # Crop region (optional)
--output <file>        # Output log file
--json                 # JSON output format
--watch                # Continuous mode
```

## 💡 Usage Examples

### Basic Desktop Capture
```bash
# Windows/Mac/Linux
npm run ocr:desktop
```

### Continuous Monitoring
```bash
# Watch mode - runs until stopped (Ctrl+C)
npm run ocr:desktop:watch
```

### Custom Settings
```bash
# Fast capture with high sensitivity
npm run ocr:desktop -- --interval 500 --delta 0.005

# Capture specific screen region
npm run ocr:desktop -- --region 0,0,1920,1080

# Save output to file
npm run ocr:desktop -- --output my-capture.log --json
```

### Android Capture
```bash
# Connect device first, then:
npm run ocr:live -- --interval 750 --duration 60000
```

## 🔧 Platform Requirements

### Windows
- ✅ No additional setup needed
- Uses PowerShell (built-in) or screenshot-desktop

### macOS
- ✅ No additional setup needed
- Uses `screencapture` command (built-in)
- May need Screen Recording permission

### Linux
- Requires ImageMagick OR gnome-screenshot
- Install: `sudo apt-get install imagemagick`

### Android
- Requires ADB installed
- USB debugging enabled
- Device connected via USB

### iOS
- Web app running (`npm run dev:host`)
- Safari browser
- Manual screenshot upload

## 🎯 How It Works

1. **Desktop Capture:**
   - Takes screenshots at specified interval
   - Detects motion/changes
   - Runs OCR on changed regions
   - Deduplicates text
   - Outputs extracted text

2. **Android Capture:**
   - Uses ADB to capture screen frames
   - Same motion detection and OCR pipeline
   - Works with any Android device

3. **iOS Capture:**
   - Manual screenshot upload
   - Batch OCR processing
   - Text extraction and deduplication

## 📊 Output Format

### Console Output
```
🖥️  GhostWriter Desktop Capture - win32
📊 Interval: 1000ms, Motion threshold: 0.012
[2026-01-23T23:30:00.000Z] Frame 1 extracted 245 chars
[2026-01-23T23:30:01.000Z] Frame 2 duplicate suppressed
✅ Capture complete!
```

### JSON Output (with --json)
```json
{
  "type": "text",
  "level": "success",
  "message": "[timestamp] Frame 1 extracted 245 chars",
  "text": "Extracted text content...",
  "motionScore": 0.0234,
  "frameCount": 1
}
```

## 🔒 Privacy & Security

- ✅ All processing happens locally
- ✅ Screenshots processed in memory (not saved)
- ✅ No external servers
- ✅ OCR runs on your device
- ✅ No data leaves your machine

## 🐛 Troubleshooting

### Desktop Capture Not Working

**Windows:**
- Try running as administrator
- Check PowerShell is available

**macOS:**
- System Settings → Privacy & Security → Screen Recording
- Enable for Terminal/Node

**Linux:**
- Install ImageMagick: `sudo apt-get install imagemagick`
- Or gnome-screenshot: `sudo apt-get install gnome-screenshot`

### Android Issues
```bash
# Check device connection
adb devices

# Restart ADB
adb kill-server && adb start-server
```

## 📖 Full Documentation

See `scripts/PLATFORM_SETUP.md` for:
- Detailed platform setup
- Advanced configuration
- Troubleshooting guides
- Best practices

---

**🎉 You're all set!** Start capturing with `npm run capture:all` or platform-specific commands.
