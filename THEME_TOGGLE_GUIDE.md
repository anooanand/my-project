# 🌓 Theme Toggle Guide

## Where to Find the Theme Toggle

### Desktop View
The theme toggle button is located in the **top navigation bar**, right before the user account/sign-in buttons.

```
┌─────────────────────────────────────────────────────────────┐
│  [Logo] Home Features About FAQ Learning Dashboard  [🌙][👤] │
└─────────────────────────────────────────────────────────────┘
                                                        ↑
                                              Theme Toggle Here
```

**Visual Appearance:**
- **Dark Mode Active** → Shows **Sun icon** (☀️) in yellow
- **Light Mode Active** → Shows **Moon icon** (🌙) in blue

**Location:** Between "Dashboard" and the user avatar/sign-in buttons

---

### Mobile View
The theme toggle appears at the **top of the mobile menu**, when you tap the hamburger menu (☰).

```
┌──────────────────────────────┐
│ ☰ Menu                    ✕  │
├──────────────────────────────┤
│ 🌙 Dark Mode                 │  ← Theme Toggle (First Item)
│   Switch to dark theme       │
├──────────────────────────────┤
│ 🏠 Home                      │
│ ✨ Features                  │
│ 👥 About                     │
│ ❓ FAQ                       │
└──────────────────────────────┘
```

**Location:** First item in the mobile menu dropdown

---

## How It Works

### Default Behavior
- **App starts in Dark Mode** by default
- Theme preference is **saved to localStorage**
- Persists across page refreshes
- Smooth transition animations

### Toggle Actions
1. **Click the toggle button**
2. Theme instantly switches
3. Preference is saved automatically
4. Works on all pages

---

## Theme Features

### Dark Mode (Default)
- Deep slate background (#0f172a)
- Purple/pink gradient accents
- Glass morphism effects
- High contrast text
- Glowing buttons
- Professional appearance

### Light Mode
- Clean white background
- Standard purple/indigo accents
- Traditional design
- High readability
- Classic look

---

## Technical Details

### Implementation
- Uses React Context API (`ThemeContext`)
- CSS variables for colors
- Tailwind dark mode classes
- localStorage persistence
- System preference detection (optional)

### Files Modified
1. `src/contexts/ThemeContext.tsx` - Theme state management
2. `src/components/NavBar.tsx` - Toggle button UI
3. `src/styles/dark-mode-professional.css` - Dark theme styles
4. `src/index.css` - Dark mode import

---

## Quick Test

### Desktop
1. Look at the top-right corner of the navigation bar
2. Find the moon/sun icon button
3. Click it to toggle between light and dark mode
4. Watch the smooth transition!

### Mobile
1. Tap the hamburger menu (☰) in the top-right
2. First item should be "Dark Mode" or "Light Mode"
3. Tap it to switch themes
4. Menu stays open to see the change

---

## Troubleshooting

### Toggle Not Visible?
- **Desktop:** Check top-right corner, between Dashboard and user avatar
- **Mobile:** Open hamburger menu, check first item
- Clear browser cache and refresh

### Theme Not Changing?
1. Clear localStorage: `localStorage.clear()`
2. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
3. Check browser console for errors

### Stuck in One Theme?
1. Open DevTools Console (F12)
2. Run: `localStorage.removeItem('theme')`
3. Refresh page
4. Try toggle again

---

## Need Help?

If you still can't see the toggle or it's not working:
1. Clear browser cache
2. Open in incognito/private window
3. Check if JavaScript is enabled
4. Ensure you're on the latest deployment

---

**Last Updated:** 2025-10-08
**Version:** 1.0
