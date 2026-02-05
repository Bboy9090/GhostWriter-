# 🖥️ Platform Setup Guide - Automatic Screen Capture

This guide explains how to set up automatic screen capture for all platforms.

## 📱 Platform Support

| Platform | Method | Status | Notes |
|----------|-------|--------|-------|
| **Windows** | Desktop Capture | ✅ Ready | Uses screenshot-desktop or PowerShell |
| **macOS** | Desktop Capture | ✅ Ready | Uses screencapture command |
| **Linux** | Desktop Capture | ✅ Ready | Requires ImageMagick or gnome-screenshot |
| **Android** | ADB Capture | ✅ Ready | Requires USB debugging enabled |
| **iOS** | Manual Upload | ✅ Ready | Upload screenshots via web UI |

## 🚀 Quick Start

### Unified Capture (Auto-Detect)

```bash
# Auto-detect and start capture
npm run capture:all

# Continuous watch mode
npm run capture:all -- --watch

# With custom settings
npm run capture:all -- --interval 500 --duration 60000 --output capture.log
```

### Platform-Specific

#### Windows/Mac/Linux Desktop

```bash
# One-time capture
npm run ocr:desktop

# Continuous watch mode
npm run ocr:desktop:watch

# With options
npm run ocr:desktop -- --interval 1000 --delta 0.02 --output desktop-capture.log
```

#### Android (via ADB)

```bash
# Connect device via USB first, then:
npm run ocr:live -- --interval 750 --duration 30000

# Continuous mode
npm run ocr:live -- --interval 750
```

#### iOS (Manual)

1. Start the web app: `npm run dev`
2. Open in Safari on iPhone
3. Go to "iPhone Capture" section
4. Upload screenshots or screen recording
5. Click "Run OCR"

## 🔧 Platform-Specific Setup

### Windows

**Requirements:**
- Node.js installed
- PowerShell (built-in)

**Setup:**
```bash
# No additional setup needed!
npm run ocr:desktop
```

**Permissions:**
- No special permissions required
- Works with standard user account

### macOS

**Requirements:**
- Node.js installed
- `screencapture` command (built-in)

**Setup:**
```bash
# No additional setup needed!
npm run ocr:desktop
```

**Permissions:**
- May need Screen Recording permission:
  1. System Settings → Privacy & Security → Screen Recording
  2. Enable for Terminal/Node

### Linux

**Requirements:**
- Node.js installed
- ImageMagick OR gnome-screenshot

**Setup:**

**Option 1: ImageMagick (Recommended)**
```bash
# Ubuntu/Debian
sudo apt-get install imagemagick

# Fedora
sudo dnf install ImageMagick

# Arch
sudo pacman -S imagemagick
```

**Option 2: gnome-screenshot**
```bash
# Ubuntu/Debian
sudo apt-get install gnome-screenshot

# Fedora
sudo dnf install gnome-screenshot
```

Then run:
```bash
npm run ocr:desktop
```

### Android

**Requirements:**
- Android device
- USB cable
- ADB installed
- USB debugging enabled

**Setup:**

1. **Install ADB:**
   - Windows: Download [Android Platform Tools](https://developer.android.com/studio/releases/platform-tools)
   - macOS: `brew install android-platform-tools`
   - Linux: `sudo apt-get install android-tools-adb`

2. **Enable USB Debugging:**
   - Settings → About Phone → Tap "Build Number" 7 times
   - Settings → Developer Options → Enable "USB Debugging"

3. **Connect Device:**
   ```bash
   # Verify connection
   adb devices

   # Should show your device
   ```

4. **Run Capture:**
   ```bash
   npm run ocr:live
   ```

### iOS

**Requirements:**
- iPhone/iPad
- Safari browser
- Web app running

**Setup:**

1. **Start Web App:**
   ```bash
   npm run dev:host
   ```

2. **On iPhone:**
   - Open Safari
   - Navigate to `http://YOUR_IP:5173`
   - Tap Share → Add to Home Screen

3. **Capture:**
   - Take screenshots while scrolling
   - Open GhostWriter app
   - Upload screenshots
   - Run OCR

## ⚙️ Configuration Options

### Common Options

```bash
--interval <ms>        # Capture interval (default: 1000ms)
--duration <ms>        # Total duration (0 = infinite)
--delta <threshold>    # Motion threshold (default: 0.012)
--sample <step>        # Pixel sampling step (default: 12)
--dedupe <threshold>   # Duplicate threshold (default: 0.88)
--min-chars <count>    # Minimum characters (default: 20)
--region x,y,w,h       # Crop region
--output <file>        # Output log file
--json                 # JSON output format
--watch                # Continuous mode
```

### Examples

```bash
# Fast capture (500ms interval)
npm run ocr:desktop -- --interval 500

# High sensitivity (lower delta)
npm run ocr:desktop -- --delta 0.005

# Capture specific region (top-left 800x600)
npm run ocr:desktop -- --region 0,0,800,600

# Save to file
npm run ocr:desktop -- --output my-capture.log --json

# Continuous watch mode
npm run ocr:desktop:watch
```

## 🔍 Troubleshooting

### Desktop Capture Not Working

**Windows:**
- Ensure PowerShell is available
- Try running as administrator

**macOS:**
- Check Screen Recording permissions
- System Settings → Privacy & Security → Screen Recording

**Linux:**
- Install ImageMagick: `sudo apt-get install imagemagick`
- Or install gnome-screenshot: `sudo apt-get install gnome-screenshot`

### Android ADB Issues

```bash
# Check if device is connected
adb devices

# Restart ADB server
adb kill-server
adb start-server

# Check USB debugging is enabled
# Settings → Developer Options → USB Debugging
```

### iOS Upload Issues

- Ensure web app is running: `npm run dev:host`
- Check iPhone and computer are on same network
- Use Safari (not Chrome) for best compatibility
- Try "Add to Home Screen" for full-screen experience

## 📊 Performance Tips

1. **Adjust Interval:** Lower = more captures, higher CPU
2. **Motion Threshold:** Lower = more sensitive, more processing
3. **Region Cropping:** Crop to important area for faster processing
4. **Deduplication:** Increase window size to reduce duplicates

## 🔒 Privacy & Security

- All processing happens locally
- Screenshots are processed in memory (not saved)
- No data sent to external servers
- OCR runs entirely on your device

## 🎯 Best Practices

1. **Start with defaults:** Use default settings first
2. **Tune for your use case:** Adjust based on content type
3. **Monitor resources:** Watch CPU/memory usage
4. **Use watch mode:** For continuous monitoring
5. **Save logs:** Use `--output` for important captures

---

**Need Help?** Check the main README or open an issue on GitHub.
