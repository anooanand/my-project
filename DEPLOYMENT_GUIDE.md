# Deployment Guide - Writing Mate Rebranding

## Build Verification Complete ✅

### Artifact Inspection Results

**HTML (index.html):**
```
✓ Title: "Writing Mate - AI Writing Coach for NSW Selective School Exams"
✓ Meta description: Contains "Writing Mate"
✓ Keywords: Contains "Writing Mate, writingmate.co"
✓ Open Graph tags: All updated
✓ Twitter Card tags: All updated
```

**JavaScript Bundle (index-oChOUSyB.js):**
```
✓ "Writing Mate" occurrences: 16
✓ "InstaChat AI" occurrences: 0
✓ "writingmate.co" occurrences: 2
✓ "instachatai.co" occurrences: 0
```

**CSS Bundle (index-DfJ9OzwC.css):**
```
✓ No old branding found
✓ Build size: 337KB (337K)
```

**Total Build Size:** 1.2MB

---

## Deployment Instructions

### Option 1: Netlify CLI Deployment (Recommended)

This is the fastest way to deploy and will invalidate caches automatically.

```bash
# 1. Install Netlify CLI globally (if not already installed)
npm install -g netlify-cli

# 2. Login to Netlify
netlify login

# 3. Link to your site (if not already linked)
netlify link

# 4. Deploy to production
netlify deploy --prod --dir=dist
```

**Expected Output:**
```
✔ Deploying to main site URL...
✔ Finished hashing 3 files
✔ CDN requesting 3 files
✔ Finished uploading 3 files
✔ Deploy is live!

Logs:              https://app.netlify.com/sites/[your-site]/deploys/[deploy-id]
Unique Deploy URL: https://[deploy-id]--vocal-kleicha-5b949e.netlify.app
Live URL:          https://vocal-kleicha-5b949e.netlify.app
```

---

### Option 2: Netlify Dashboard (Manual Upload)

1. **Go to Netlify Dashboard:**
   - Visit: https://app.netlify.com
   - Navigate to your site: `vocal-kleicha-5b949e`

2. **Navigate to Deploys:**
   - Click on the "Deploys" tab
   - Click "Deploy manually"

3. **Upload dist folder:**
   - Drag and drop the entire `/dist` folder
   - OR click "Browse" and select the `/dist` folder

4. **Wait for deployment:**
   - Netlify will process and deploy
   - Usually takes 30-60 seconds

5. **Verify deployment:**
   - Click "Preview" on the new deploy
   - Check that "Writing Mate" appears correctly

---

### Option 3: Git Push (If Connected to Repository)

If your Netlify site is connected to a Git repository:

```bash
# 1. Stage all changes
git add .

# 2. Commit with clear message
git commit -m "Rebrand from InstaChat AI to Writing Mate"

# 3. Push to your main branch
git push origin main
```

**Note:** Netlify will automatically detect the push and start a new build.

---

## Post-Deployment Verification

### 1. Check Live Site

Visit: https://vocal-kleicha-5b949e.netlify.app

**What to verify:**
- [ ] Navigation bar shows "Writing Mate" (not "InstaChat AI")
- [ ] Logo shows "WM" (not "AI")
- [ ] Browser tab title shows "Writing Mate - AI Writing Coach..."
- [ ] Footer shows "© 2025 Writing Mate. All rights reserved."
- [ ] Support email is support@writingmate.co
- [ ] FAQ page references "Writing Mate"
- [ ] About page references "Writing Mate"

### 2. Check Specific Pages

**Home Page:**
- Navigate to: https://vocal-kleicha-5b949e.netlify.app/
- Verify: Hero section, navigation, footer

**FAQ Page:**
- Navigate to: https://vocal-kleicha-5b949e.netlify.app/faq
- Verify: All Q&A mentions "Writing Mate"

**About Page:**
- Navigate to: https://vocal-kleicha-5b949e.netlify.app/about
- Verify: Content mentions "Writing Mate"

**Features Page:**
- Navigate to: https://vocal-kleicha-5b949e.netlify.app/features
- Verify: Feature comparisons show "Writing Mate"

### 3. SEO Verification

**View Page Source:**
```bash
# In browser, right-click → "View Page Source"
# Or press: Ctrl+U (Windows/Linux) or Cmd+Option+U (Mac)
```

**Verify meta tags:**
```html
<title>Writing Mate - AI Writing Coach for NSW Selective School Exams</title>
<meta name="description" content="Writing Mate is an AI-powered..." />
<meta property="og:title" content="Writing Mate - AI Writing Coach..." />
<meta property="og:url" content="https://writingmate.co" />
```

### 4. Test on Multiple Browsers

- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if available)
- [ ] Mobile browser

---

## Cache Invalidation

### Browser Cache

If you still see old branding after deployment:

**Hard Refresh:**
- **Windows/Linux:** Ctrl + Shift + R or Ctrl + F5
- **Mac:** Cmd + Shift + R
- **Mobile:** Clear browser cache in settings

**Clear Cache Manually:**
1. Open browser settings
2. Navigate to "Privacy" or "History"
3. Select "Clear browsing data"
4. Choose "Cached images and files"
5. Clear for "Last hour" or "All time"

### Netlify CDN Cache

Netlify automatically invalidates CDN cache on new deploys. However, if needed:

1. Go to: https://app.netlify.com/sites/vocal-kleicha-5b949e/settings
2. Navigate to: "Build & deploy" → "Post processing"
3. Look for: "Asset optimization"
4. Ensure "Bundle CSS" and "Bundle JS" are enabled

**Manual Cache Clear (if needed):**
```bash
netlify api clearCache --data '{"site_id":"[your-site-id]"}'
```

---

## Troubleshooting

### Issue: Still seeing "InstaChat AI"

**Solution 1: Hard refresh browser**
```
Ctrl + Shift + R (Windows/Linux)
Cmd + Shift + R (Mac)
```

**Solution 2: Clear all browser cache**
- Go to browser settings
- Clear all cached data
- Restart browser

**Solution 3: Try incognito/private mode**
- Open incognito window
- Visit site
- Should show new branding immediately

### Issue: Netlify deploy failed

**Check build logs:**
1. Go to Netlify dashboard
2. Click on failed deploy
3. View error logs
4. Common issues:
   - Build command failed: Check `netlify.toml`
   - Missing dependencies: Run `npm install`
   - Environment variables: Check Netlify env vars

### Issue: Deployment successful but old branding persists

**Possible causes:**
1. **Browser cache:** Clear cache or use incognito
2. **CDN propagation:** Wait 5-10 minutes for global CDN update
3. **Service Worker:** Clear service worker cache
4. **DNS issues:** Check if using custom domain

**Solution:**
```bash
# Re-deploy with cache bust
netlify deploy --prod --dir=dist --force
```

---

## Environment Variables Check

### Netlify Environment Variables

No branding-related environment variables are currently in use. The branding is all in the source code and build artifacts.

**To verify (optional):**
1. Go to: https://app.netlify.com/sites/vocal-kleicha-5b949e/settings
2. Navigate to: "Environment variables"
3. Check for any InstaChat references (there should be none)

---

## Build Configuration

### Current Build Settings

**File:** `netlify.toml`

```toml
[build]
  command   = "npm ci && npm run build"
  publish   = "dist"
  functions = "netlify/functions"

[functions]
  node_bundler = "esbuild"

[build.environment]
  NODE_VERSION = "18"
```

**These settings are correct and don't need changes.**

---

## Rollback Plan (If Needed)

If deployment causes issues:

### Via Netlify Dashboard

1. Go to: https://app.netlify.com/sites/vocal-kleicha-5b949e/deploys
2. Find previous deploy (before rebranding)
3. Click "..." menu → "Publish deploy"
4. Confirm rollback

### Via CLI

```bash
# List recent deploys
netlify deploys:list

# Restore specific deploy
netlify api restoreSiteDeploy --data '{"deploy_id":"[deploy-id]"}'
```

---

## DNS and Domain Configuration

### Current Domain

**Netlify URL:** https://vocal-kleicha-5b949e.netlify.app

### Custom Domain Setup (Future)

When ready to use `writingmate.co`:

1. **Purchase domain:** writingmate.co
2. **Add to Netlify:**
   - Dashboard → Domain settings
   - Add custom domain: writingmate.co
   - Add: www.writingmate.co

3. **Configure DNS:**
   ```
   A Record:    @ → 75.2.60.5
   CNAME:       www → vocal-kleicha-5b949e.netlify.app
   ```

4. **Enable HTTPS:**
   - Netlify auto-provisions SSL certificate
   - Usually takes 1-2 hours

5. **Verify:**
   - Visit: https://writingmate.co
   - Check certificate is valid

---

## Monitoring

### Check Deploy Status

**Via Dashboard:**
- https://app.netlify.com/sites/vocal-kleicha-5b949e/deploys

**Via CLI:**
```bash
netlify status
```

### Deploy Notifications

**Setup (optional):**
1. Dashboard → Settings → Deploy notifications
2. Add email notification for:
   - Deploy started
   - Deploy succeeded
   - Deploy failed

---

## Summary Checklist

Before marking deployment as complete:

- [ ] Clean build completed successfully
- [ ] All artifacts verified (HTML, JS, CSS)
- [ ] No "InstaChat AI" in build files
- [ ] "Writing Mate" appears correctly in build
- [ ] Deployed to Netlify (via CLI, dashboard, or Git)
- [ ] Verified live site shows "Writing Mate"
- [ ] Checked navigation bar logo (should be "WM")
- [ ] Checked footer copyright (should be "© 2025 Writing Mate")
- [ ] Verified FAQ page content
- [ ] Verified About page content
- [ ] Cleared browser cache and tested
- [ ] Tested in incognito mode
- [ ] Checked SEO meta tags in source
- [ ] Verified support email is support@writingmate.co

---

## Next Steps After Deployment

1. **Monitor for 24 hours:** Check for any user reports
2. **Update marketing materials:** Social media, ads, etc.
3. **Configure custom domain:** Set up writingmate.co
4. **Update email:** Configure support@writingmate.co
5. **Notify users:** Send announcement about rebrand
6. **Update search engines:** Submit new sitemap if domain changes

---

## Support

If you encounter issues during deployment:

- **Netlify Support:** https://www.netlify.com/support/
- **Build Logs:** Check in Netlify dashboard
- **Community:** Netlify Community Forums

---

*Last Updated: October 20, 2025*
*Build Hash: index-oChOUSyB.js*
*Deployment Status: Ready for Production*
