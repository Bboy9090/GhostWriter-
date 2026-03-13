# GhostWriter Browser Extension

Side-panel portal for capturing text from web pages. **No focus switching** – the main page stays in focus so you can scroll while the portal captures in the side panel.

## Desktop (Chrome / Edge)

1. Open `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the `extension` folder
5. Click the extension icon or use `Ctrl+Shift+G` (Mac: `Cmd+Shift+G`)

## Mobile

### Option A: Add GhostWriter to Home Screen (recommended)

The main GhostWriter app works as a PWA on mobile:

1. Open [GhostWriter](https://your-ghostwriter-url.vercel.app) in Safari/Chrome
2. **Safari:** Share → Add to Home Screen  
   **Chrome Android:** Menu → Add to Home screen
3. Use **Upload** (screenshots/recordings) for capture – iOS/Android don’t allow extensions to read other apps

### Option B: Chrome on Android (limited)

- Chrome Android supports some extensions
- Install the extension the same way (e.g. load unpacked via desktop, sync)
- Side panel may appear as a bottom sheet or overlay
- Only works for browser tabs, not other apps

### Option C: Kiwi / Firefox on Android

- Kiwi Browser supports Chrome extensions
- Firefox Android has add-on support (different APIs)

## Usage

1. Open a page (ChatGPT, Gemini, docs, etc.)
2. Click the GhostWriter icon or `Ctrl+Shift+G`
3. In the side panel, click **Start capture**
4. Scroll the main page – text is captured without switching focus
5. Entries appear in the side panel; click **Open vault** for the full app

## Adding Icons (optional)

To add custom icons, create:

- `extension/icons/icon16.png` (16×16)
- `extension/icons/icon48.png` (48×48)
- `extension/icons/icon128.png` (128×128)

Then add this to `manifest.json`:

```json
"icons": {
  "16": "icons/icon16.png",
  "48": "icons/icon48.png",
  "128": "icons/icon128.png"
}
```
