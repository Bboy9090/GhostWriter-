# 👻 Floating Portal - User Guide

## Overview

The Floating Portal is a **draggable, clickable ghost logo** that floats on your screen and lets you toggle text capture on/off with a single click.

## ✨ Features

### 🎯 Core Functionality
- **Click to Toggle**: Click the ghost logo to start/stop text capture
- **Drag & Drop**: Drag the portal anywhere on your screen
- **Visual Feedback**: Portal animates and glows when active
- **Position Memory**: Remembers where you placed it
- **Minimize/Restore**: Minimize to save screen space

### 🎨 Visual States

**Active (Capturing):**
- ✅ Glowing emerald border
- ✅ Pulsing animation
- ✅ Rotating portal ring
- ✅ "Capturing..." status text
- ✅ Green status indicator

**Inactive (Paused):**
- ⏸️ Muted appearance
- ⏸️ Grayscale filter
- ⏸️ No animations
- ⏸️ Gray status indicator

## 🎮 How to Use

### Basic Usage

1. **Find the Portal**: Look for the floating ghost logo (usually top-right)
2. **Click to Toggle**: Click the logo to start/stop capture
3. **Drag to Move**: Click and drag to reposition anywhere on screen

### Controls

- **Click Logo**: Toggle capture on/off
- **Drag Logo**: Move portal around screen
- **Minimize Button**: Minimize to small icon
- **Close Button**: Hide portal (can be re-enabled)

### Status Indicators

- **Green Dot**: Portal is active, capturing text
- **Gray Dot**: Portal is paused
- **"Capturing..." Text**: Shows when actively capturing

## 🎨 Animations

### Active State
- **Pulse**: Portal gently pulses with emerald glow
- **Rotation**: Outer ring rotates slowly
- **Scale**: Subtle breathing effect
- **Glow**: Soft emerald shadow

### Inactive State
- **Static**: No animations
- **Muted**: Reduced opacity and grayscale
- **Dormant**: Ready to activate

## ⚙️ Customization

The portal automatically:
- Saves position to localStorage
- Remembers state across page reloads
- Adapts to light/dark themes
- Works on all screen sizes

## 🔧 Technical Details

### Position Management
- Position saved to `localStorage` as `ghostwriter-portal-position`
- Automatically constrained to viewport bounds
- Smooth drag interactions

### State Management
- Connected to `portalActive` state in App
- Triggers capture system when activated
- Shows toast notifications on toggle

### Performance
- Uses Framer Motion for smooth animations
- Optimized re-renders
- Minimal performance impact

## 💡 Tips

1. **Positioning**: Place in corner for minimal interference
2. **Quick Toggle**: Double-click for fast on/off
3. **Minimize**: Use minimize when not actively capturing
4. **Visual Cue**: Watch the status dot for quick status check

## 🐛 Troubleshooting

**Portal not visible?**
- Check if it's minimized (click restore button)
- Check browser console for errors
- Try refreshing the page

**Not capturing?**
- Ensure portal shows green dot (active state)
- Check browser permissions
- Verify capture system is running

**Can't drag?**
- Try clicking on the logo itself
- Check if another element is blocking
- Try refreshing the page

---

**Enjoy your floating portal! 👻✨**
