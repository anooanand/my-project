# 🔄 RESTORATION INSTRUCTIONS
## NSW Writing App - Revert to Original Light Theme

---

## 📦 Quick Rollback (Easiest Method)

If you don't like the new dark mode design and want to revert to the original light theme, follow these simple steps:

### **Option 1: Comment Out Dark Mode Import** (Recommended)
This is the fastest way to switch back without any file replacements.

1. Open: `/src/index.css`
2. Find line 5: `@import './styles/dark-mode-professional.css';`
3. Comment it out by adding `/*` and `*/`:
   ```css
   /* @import './styles/dark-mode-professional.css'; */
   ```
4. Save the file
5. Refresh your browser (or restart dev server)

✅ **Done!** Your app is now back to the original light theme.

---

## 📁 Complete File Restoration

If you prefer to completely restore the original files, follow these steps:

### **Step 1: Restore Original HomePage.tsx**

```bash
# Navigate to project directory
cd /tmp/cc-agent/53854438/project

# Copy original HomePage back
cp .backups/original-light-theme/HomePage-ORIGINAL.tsx src/components/HomePage.tsx
```

### **Step 2: Restore Original index.css**

```bash
# Copy original index.css back
cp .backups/original-light-theme/index-ORIGINAL.css src/index.css
```

### **Step 3: Restore Original App.css** (if needed)

```bash
# Copy original App.css back
cp .backups/original-light-theme/App-ORIGINAL.css src/App.css
```

### **Step 4: Remove Dark Mode CSS File** (optional)

```bash
# Delete the dark mode theme file
rm src/styles/dark-mode-professional.css
```

### **Step 5: Rebuild & Restart**

```bash
# Rebuild the application
npm run build

# Restart dev server (if running)
# Press Ctrl+C to stop, then:
npm run dev
```

✅ **Done!** All original files have been restored.

---

## 📋 Backup File Locations

All original files are safely stored in:
```
.backups/original-light-theme/
├── HomePage-ORIGINAL.tsx
├── index-ORIGINAL.css
├── App-ORIGINAL.css
└── RESTORATION_INSTRUCTIONS.md (this file)
```

**⚠️ IMPORTANT:** Do NOT delete the `.backups` folder! Keep it as a safety net.

---

## 🎨 What Was Changed?

### Files Modified:
1. **`src/components/HomePage.tsx`**
   - Enhanced hero section with better dark mode classes
   - Added gradient effects and animations
   - Improved button styling
   - Added background grid pattern

2. **`src/index.css`**
   - Added import for dark mode theme
   - One line change: `@import './styles/dark-mode-professional.css';`

3. **`src/styles/dark-mode-professional.css`** (NEW FILE)
   - Complete professional dark mode theme
   - Glass morphism effects
   - Modern button styles
   - Enhanced shadows and depth
   - Gradient overlays

### Files NOT Changed:
- All text content remains the same
- All functionality preserved
- All navigation working as before
- All child components untouched
- All data and logic unchanged

---

## 🧪 Testing After Restoration

After restoring, verify everything works:

1. ✅ Homepage loads correctly
2. ✅ All buttons work (View Pricing, See How It Works)
3. ✅ Navigation menu functions properly
4. ✅ All sections visible (Features, How It Works, etc.)
5. ✅ Forms and inputs work correctly
6. ✅ No console errors in browser

---

## 🆘 Troubleshooting

### Issue: "Page looks broken after restoration"
**Solution:** Clear browser cache and hard refresh
- **Chrome/Edge:** `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
- **Firefox:** `Ctrl + F5` (Windows) or `Cmd + Shift + R` (Mac)

### Issue: "Build fails after restoration"
**Solution:** Delete node_modules and reinstall
```bash
rm -rf node_modules
rm -rf dist
npm install
npm run build
```

### Issue: "Dark mode still showing"
**Solution:** Check if dark mode is enabled in your system settings
- The app respects system-level dark mode preferences
- Try toggling your OS dark mode setting

### Issue: "CSS not loading correctly"
**Solution:** Ensure file paths are correct
```bash
# Verify files exist
ls -la src/index.css
ls -la src/components/HomePage.tsx
ls -la .backups/original-light-theme/
```

---

## 🔍 Verification Checklist

Before considering restoration complete:

- [ ] HomePage displays correctly
- [ ] Colors match original design
- [ ] Buttons styled as before
- [ ] No console errors
- [ ] All links work
- [ ] Navigation functional
- [ ] Forms work properly
- [ ] Mobile responsive
- [ ] Build succeeds
- [ ] Dev server runs

---

## 💡 Alternative: Toggle Between Themes

Want the best of both worlds? You can easily switch between light and dark mode:

### **Create a Theme Toggle**

1. Keep the dark mode CSS import in `index.css`
2. The app already supports the `dark` class on the root element
3. Add a toggle button in your navigation to switch between themes

This way, users can choose their preferred theme!

---

## 📞 Support

If you encounter any issues during restoration:

1. Check this document first
2. Verify backup files exist in `.backups/original-light-theme/`
3. Try a clean rebuild: `npm run build`
4. Check browser console for errors (F12)

---

## ✨ Summary

**Quickest Restore:** Comment out dark mode import in `index.css` (Line 5)

**Complete Restore:** Copy all files from `.backups/original-light-theme/` back to their original locations

**Safety Net:** All original files preserved in `.backups/` folder

---

**Last Updated:** $(date)
**Backup Location:** `/tmp/cc-agent/53854438/project/.backups/original-light-theme/`
**Project:** NSW Writing App - Year 5-6 Student Platform

---

🎉 **You're all set!** Whether you love the new dark mode or prefer the original light theme, you can easily switch between them.
