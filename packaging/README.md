# Ghost Writer - Packaging Guide

This guide covers packaging Ghost Writer for different platforms, with a focus on Windows MSIX, Blue Phoenix OS, and web deployment.

---

## 🎯 Overview

Ghost Writer can be packaged for:
1. **Windows** - MSIX package for Microsoft Store and sideloading
2. **Blue Phoenix OS** - Native integration with Bobby's World ecosystem
3. **Web** - Static deployment to any hosting provider
4. **Desktop** - Electron wrapper (future)

---

## 📦 Windows MSIX Packaging

MSIX is the modern Windows app package format, replacing AppX. It provides:
- Easy installation/uninstallation
- Automatic updates
- Sandboxed execution
- Microsoft Store distribution

### Prerequisites

**Windows 10/11:**
- Windows SDK (10.0.19041.0 or later)
- Visual Studio 2019+ with "Universal Windows Platform development" workload
- OR Windows App SDK standalone tools

**Install Windows App SDK:**
```powershell
winget install Microsoft.WindowsAppSDK.CLI
```

### Build the Web App

First, create an optimized production build:

```bash
npm install
npm run build
```

This creates a `dist/` folder with all static assets.

### Create MSIX Package

#### Option 1: Using MSIX Packaging Tool (GUI)

1. **Download MSIX Packaging Tool** from Microsoft Store
2. **Launch the tool** and select "Application package"
3. **Select "Create package from files"**
4. **Configure package:**
   - Package name: `GhostWriter`
   - Publisher: `CN=Bobby's World` (use your certificate)
   - Version: `1.0.0.0`
   - Package display name: `Ghost Writer`
5. **Add files:**
   - Point to `dist/` directory
   - Set entry point: `index.html`
6. **Configure capabilities:**
   - None required for web app (sandboxed)
7. **Create package**

#### Option 2: Using CLI (makeappx)

**Create AppxManifest.xml:**

```xml
<?xml version="1.0" encoding="utf-8"?>
<Package
  xmlns="http://schemas.microsoft.com/appx/manifest/foundation/windows10"
  xmlns:uap="http://schemas.microsoft.com/appx/manifest/uap/windows10"
  xmlns:rescap="http://schemas.microsoft.com/appx/manifest/foundation/windows10/restrictedcapabilities"
  IgnorableNamespaces="uap rescap">

  <Identity
    Name="com.bobbysworld.ghostwriter"
    Publisher="CN=Bobby's World"
    Version="1.0.0.0" />

  <Properties>
    <DisplayName>Ghost Writer</DisplayName>
    <PublisherDisplayName>Bobby's World</PublisherDisplayName>
    <Logo>Assets\StoreLogo.png</Logo>
    <Description>AI-powered writing and publishing studio</Description>
  </Properties>

  <Dependencies>
    <TargetDeviceFamily Name="Windows.Universal" MinVersion="10.0.19041.0" MaxVersionTested="10.0.22000.0" />
  </Dependencies>

  <Resources>
    <Resource Language="x-generate"/>
  </Resources>

  <Applications>
    <Application Id="GhostWriter" Executable="index.html" EntryPoint="Windows.FullTrustApplication">
      <uap:VisualElements
        DisplayName="Ghost Writer"
        Description="AI-powered writing and publishing studio"
        BackgroundColor="transparent"
        Square150x150Logo="Assets\Square150x150Logo.png"
        Square44x44Logo="Assets\Square44x44Logo.png">
        <uap:DefaultTile Wide310x150Logo="Assets\Wide310x150Logo.png" />
        <uap:SplashScreen Image="Assets\SplashScreen.png" />
      </uap:VisualElements>
    </Application>
  </Applications>

  <Capabilities>
    <Capability Name="internetClient" />
  </Capabilities>
</Package>
```

**Create package:**

```powershell
# Create package
makeappx pack /d dist /p GhostWriter.msix /l

# Sign package (requires certificate)
signtool sign /fd SHA256 /a /f MyCertificate.pfx /p password GhostWriter.msix
```

### Testing MSIX Package

**Install locally:**
```powershell
Add-AppxPackage -Path GhostWriter.msix
```

**Uninstall:**
```powershell
Remove-AppxPackage com.bobbysworld.ghostwriter
```

### Distribution

**Microsoft Store:**
1. Create Partner Center account
2. Reserve app name "Ghost Writer"
3. Upload MSIX package
4. Complete store listing
5. Submit for certification

**Sideloading:**
1. Sign MSIX with trusted certificate
2. Distribute .msix file
3. Users double-click to install

---

## 🔵 Blue Phoenix OS Packaging

Blue Phoenix OS is Bobby's World custom operating system. Ghost Writer integrates natively.

### Package Structure

```
ghostwriter-bp/
├── app.metadata.json          # App metadata (already created)
├── manifest.json               # Blue Phoenix manifest
├── dist/                       # Web app build
├── icons/
│   ├── icon-44x44.png
│   ├── icon-150x150.png
│   └── icon-310x310.png
└── integration/
    ├── shortcuts.json          # System shortcuts
    └── file-associations.json  # .md, .txt associations
```

### Create Blue Phoenix Manifest

**manifest.json:**
```json
{
  "schema_version": "1.0",
  "package_id": "com.bobbysworld.ghostwriter",
  "name": "Ghost Writer",
  "version": "1.0.0",
  "type": "web-app",
  "entry_point": "index.html",
  "capabilities": {
    "file_system": true,
    "local_storage": true,
    "offline": true
  },
  "integration": {
    "file_associations": [".md", ".txt", ".markdown"],
    "quick_actions": [
      {
        "id": "new-document",
        "label": "New Document",
        "shortcut": "Ctrl+N"
      }
    ]
  },
  "auto_update": {
    "enabled": true,
    "check_url": "https://updates.bobbysworld.com/ghostwriter"
  }
}
```

### Build for Blue Phoenix OS

```bash
# Build web app
npm run build

# Create BP package
mkdir -p ghostwriter-bp
cp -r dist ghostwriter-bp/
cp app.metadata.json ghostwriter-bp/
cp manifest.json ghostwriter-bp/
cp -r public/icons ghostwriter-bp/

# Create archive
tar -czf ghostwriter-bp-1.0.0.tar.gz ghostwriter-bp/
```

### Installation on Blue Phoenix OS

```bash
bp-install ghostwriter-bp-1.0.0.tar.gz
```

---

## 🌐 Web Deployment

Deploy Ghost Writer as a static web app to any hosting provider.

### Build for Production

```bash
npm install
npm run build
```

Output in `dist/` folder.

### Deployment Options

#### Vercel (Recommended)

**One-click deploy:**
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FBboy9090%2FGhostWriter-)

**Or using CLI:**
```bash
npm install -g vercel
vercel --prod
```

#### Netlify

```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

**netlify.toml:**
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### GitHub Pages

```bash
npm run build
gh-pages -d dist
```

#### Render.com

**render.yaml** (already included):
```yaml
services:
  - type: web
    name: ghostwriter
    env: static
    buildCommand: npm install && npm run build
    staticPublishPath: ./dist
```

#### Self-Hosted (Nginx)

**nginx.conf:**
```nginx
server {
    listen 80;
    server_name ghostwriter.example.com;
    root /var/www/ghostwriter/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Deploy:
```bash
npm run build
rsync -avz dist/ user@server:/var/www/ghostwriter/dist/
```

---

## 🖥️ Desktop App (Electron - Future)

Wrap Ghost Writer in Electron for true desktop experience.

### Prerequisites

```bash
npm install --save-dev electron electron-builder
```

### Electron Main Process

**electron/main.js:**
```javascript
const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:5173');
  } else {
    win.loadFile('dist/index.html');
  }
}

app.whenReady().then(createWindow);
```

### Build Desktop App

```bash
npm run build
electron-builder
```

**package.json:**
```json
{
  "build": {
    "appId": "com.bobbysworld.ghostwriter",
    "productName": "Ghost Writer",
    "files": ["dist/**/*", "electron/**/*"],
    "win": {
      "target": "nsis",
      "icon": "public/icon.ico"
    },
    "mac": {
      "target": "dmg",
      "icon": "public/icon.icns"
    },
    "linux": {
      "target": "AppImage",
      "icon": "public/icon.png"
    }
  }
}
```

---

## 📋 Pre-Packaging Checklist

Before creating any package:

- [ ] Run `npm run check-all` (lint, type-check, test)
- [ ] Run `npm run build` successfully
- [ ] Test production build (`npm run preview`)
- [ ] Run `scripts/healthcheck.sh`
- [ ] Run `scripts/smoke-test.sh`
- [ ] Update version in:
  - [ ] package.json
  - [ ] app.metadata.json
  - [ ] AppxManifest.xml (Windows)
  - [ ] manifest.json (Blue Phoenix)
- [ ] Create release notes
- [ ] Tag git commit (`git tag v1.0.0`)

---

## 🔐 Code Signing

### Windows

**Get certificate:**
1. Generate self-signed cert (testing):
   ```powershell
   New-SelfSignedCertificate -Type Custom -Subject "CN=Bobby's World" -KeyUsage DigitalSignature -FriendlyName "Bobby's World Code Signing" -CertStoreLocation "Cert:\CurrentUser\My"
   ```

2. Or purchase code signing certificate from:
   - DigiCert
   - Sectigo
   - GlobalSign

**Sign package:**
```powershell
signtool sign /fd SHA256 /a /f cert.pfx /p password GhostWriter.msix
```

### macOS (Future)

Requires Apple Developer account:
```bash
codesign --deep --force --verify --verbose --sign "Developer ID Application: Bobby's World" GhostWriter.app
```

---

## 📊 Analytics & Updates

### Update Mechanism

**For MSIX:**
- Automatic via Microsoft Store
- Or implement update check in app

**For Web:**
- Service worker for offline updates
- Version check on load

**For Blue Phoenix OS:**
- Native update system

### Usage Analytics

**Privacy-friendly options:**
- Plausible Analytics (privacy-focused)
- Self-hosted Matomo
- No analytics (respect user privacy)

**Do NOT use:**
- Google Analytics (privacy concerns)
- Any tracker without user consent

---

## 🆘 Troubleshooting

### MSIX Installation Fails

**Error: "This app package is not supported"**
- Check Windows version (need 19041+)
- Verify certificate is trusted
- Try developer mode: `Settings > Update & Security > For developers`

**Error: "Certificate validation failed"**
- Sign with trusted certificate
- Or install cert to Trusted Root: `certutil -addstore Root cert.cer`

### Build Size Too Large

- Enable tree-shaking in Vite
- Remove unused dependencies
- Compress assets
- Use code splitting

### App Won't Load After Packaging

- Check index.html paths (use relative paths)
- Verify all assets copied to dist/
- Check Content-Security-Policy
- Test with `npm run preview` first

---

## 📚 Resources

- [MSIX Documentation](https://docs.microsoft.com/en-us/windows/msix/)
- [Windows App SDK](https://docs.microsoft.com/en-us/windows/apps/windows-app-sdk/)
- [Electron Documentation](https://www.electronjs.org/docs)
- [Vite Build Guide](https://vitejs.dev/guide/build.html)

---

**Last Updated**: 2026-05-23
**Version**: 1.0.0-mvp
