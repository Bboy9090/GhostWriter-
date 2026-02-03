# 👻 Floating Portal - Hover Guide

## ✨ Hover Feature Added!

The floating portal now has **hover interactions** that reveal controls and expand the portal!

## 🎯 How It Works

### Desktop (Hover)

1. **Hover over the portal**:
   - Portal slightly expands (scales up)
   - Control buttons appear (minimize/close)
   - Status text appears (if active)
   - Smooth spring animations

2. **Move mouse away**:
   - Portal returns to normal size
   - Controls hide (except on mobile)
   - Clean, minimal appearance

3. **When inactive**:
   - Shows "Hover to expand" hint after 1 second
   - Hint disappears on hover

### Mobile (Always Visible)

- Controls are always visible (no hover needed)
- Touch-friendly interface
- Larger touch targets

## 🎮 Interactions

### Desktop

- **Hover**: Expand portal, show controls
- **Click**: Toggle capture on/off
- **Drag**: Move portal around
- **Hover + Click Minimize**: Collapse portal
- **Hover + Click Close**: Remove portal

### Mobile

- **Tap**: Toggle capture on/off
- **Long Press + Drag**: Move portal
- **Tap Minimize**: Collapse portal
- **Tap Close**: Remove portal

## 🎨 Visual States

### Inactive + Not Hovered
- Small, muted appearance
- No controls visible
- "Hover to expand" hint (after 1s)

### Inactive + Hovered
- Slightly larger
- Controls appear
- Smooth expansion animation

### Active + Not Hovered
- Normal active size
- No controls visible
- Pulsing glow animation

### Active + Hovered
- Larger active size
- Controls appear
- Status text visible
- Full interactive state

## 💡 Tips

1. **Hover to see controls**: Move mouse over portal
2. **Click to toggle**: Click logo to start/stop capture
3. **Drag to move**: Click and drag to reposition
4. **Minimize when done**: Click minimize to save space

## 🔧 Technical Details

- **Hover detection**: `onMouseEnter` / `onMouseLeave`
- **Mobile detection**: Uses `useIsMobile()` hook
- **Animations**: Framer Motion spring animations
- **State management**: `isHovered` state controls visibility

---

**Hover over the portal to see it expand! 👻✨**
