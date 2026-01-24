# 📱 iPhone Floating Portal - Setup Guide

## ✅ What's Ready for iPhone

The Floating Portal is now **fully optimized for iPhone** with:

- ✅ **Touch Support**: Full touch drag and tap gestures
- ✅ **Mobile Optimized**: Larger touch targets (44px minimum)
- ✅ **Safe Areas**: Respects iPhone notch and home indicator
- ✅ **Haptic Feedback**: Vibration on toggle (if supported)
- ✅ **Responsive Sizing**: Adapts to iPhone screen sizes
- ✅ **PWA Ready**: Works as standalone app

## 🚀 Quick Start for iPhone

### Option 1: Add to Home Screen (Recommended)

1. **Start the dev server**:
   ```bash
   npm run dev:host
   ```

2. **Find your IP address** (e.g., `192.168.1.42`)

3. **On iPhone Safari**:
   - Open `http://YOUR_IP:5173`
   - Tap **Share** button (square with arrow)
   - Tap **Add to Home Screen**
   - Tap **Add**

4. **Open from Home Screen**:
   - Tap the GhostWriter icon
   - App opens full-screen
   - Floating portal appears!

### Option 2: Direct Browser Access

1. Open Safari on iPhone
2. Navigate to the app URL
3. Portal works in browser too!

## 🎮 How to Use on iPhone

### Basic Controls

- **Tap Logo**: Toggle capture on/off
- **Drag Logo**: Move portal around screen
- **Tap Minimize**: Collapse to small icon
- **Tap Restore**: Expand back to full size

### Touch Gestures

- **Single Tap**: Toggle capture
- **Long Press + Drag**: Move portal
- **Quick Tap**: Fast toggle

### Visual Feedback

- **Green Dot**: Portal active, capturing
- **Gray Dot**: Portal paused
- **Pulsing Glow**: Active state animation
- **"Capturing..." Text**: Status indicator

## 📐 iPhone-Specific Features

### Safe Area Support
- Portal respects iPhone notch
- Avoids home indicator area
- Stays within visible screen bounds

### Touch Optimizations
- **44px minimum** touch targets (Apple HIG)
- Larger buttons on mobile
- Smooth drag interactions
- Prevents accidental taps

### Haptic Feedback
- Vibration on toggle (if supported)
- Tactile confirmation
- Better user experience

### Responsive Sizing
- **Mobile**: 64px logo (minimized: 48px)
- **Desktop**: 56px logo (minimized: 40px)
- Adapts automatically

## 🎨 Mobile UI Enhancements

### Larger Touch Targets
- Buttons: 44px × 44px minimum
- Portal: 64px × 64px minimum
- Easy to tap with thumb

### Optimized Spacing
- More padding on mobile
- Better visual hierarchy
- Comfortable for one-handed use

### Status Indicators
- Larger status dot (5px on mobile)
- Clearer text labels
- Better visibility

## 🔧 Technical Details

### Touch Events
- `touchstart`: Begin drag
- `touchmove`: Update position
- `touchend`: End drag/tap
- Prevents default scrolling

### Safe Areas
- Uses CSS `env(safe-area-inset-*)`
- Respects iPhone X+ notches
- Works on all iPhone models

### Performance
- Optimized animations
- Smooth 60fps on mobile
- Minimal battery impact

## 💡 Tips for iPhone

1. **Position**: Place in bottom-right for easy thumb access
2. **Minimize**: Minimize when not actively capturing
3. **Home Screen**: Add to home screen for quick access
4. **Full Screen**: Use standalone mode for best experience

## 🐛 Troubleshooting

**Portal not visible?**
- Check if minimized (tap restore)
- Try refreshing the page
- Check browser console

**Can't drag?**
- Try tapping and holding, then drag
- Make sure you're not tapping the logo directly
- Check if another element is blocking

**Not capturing?**
- Ensure portal shows green dot
- Check browser permissions
- Verify capture system is running

**Safe area issues?**
- Update to latest iOS
- Use Safari (not Chrome)
- Check viewport meta tag

## 📱 iPhone Models Supported

- ✅ iPhone SE (all generations)
- ✅ iPhone 8/8 Plus
- ✅ iPhone X/XS/XR
- ✅ iPhone 11/11 Pro/11 Pro Max
- ✅ iPhone 12/12 mini/12 Pro/12 Pro Max
- ✅ iPhone 13/13 mini/13 Pro/13 Pro Max
- ✅ iPhone 14/14 Plus/14 Pro/14 Pro Max
- ✅ iPhone 15/15 Plus/15 Pro/15 Pro Max

## 🎯 Best Practices

1. **Add to Home Screen**: Best experience
2. **Use Standalone Mode**: Full-screen app
3. **Position Smart**: Bottom-right for thumb
4. **Minimize When Idle**: Save screen space
5. **Check Status Dot**: Quick visual check

---

**The floating portal is now iPhone-ready! 👻📱**
