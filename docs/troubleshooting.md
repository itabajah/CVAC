# Troubleshooting Guide

This guide helps resolve common issues with CV As Code.

---

## Installation Issues

### Node.js Not Found

**Error:**
```
'node' is not recognized as an internal or external command
```

**Solution:**
1. Install Node.js from https://nodejs.org (v18+)
2. Restart your terminal/command prompt
3. Verify with `node --version`

---

### npm install Fails

**Error:**
```
npm ERR! code ENOENT
```

**Solution:**
1. Ensure you're in the `src/` directory
2. Run `npm install` again
3. If persists, delete `node_modules` and `package-lock.json`, then reinstall

**Error:**
```
npm ERR! code EACCES
```

**Solution (Linux/macOS):**
```bash
sudo chown -R $USER ~/.npm
npm install
```

---

### Puppeteer/Chromium Download Fails

**Error:**
```
ERROR: Failed to download Chromium
```

**Solution:**
1. Check internet connection
2. If behind proxy, set environment variables:
   ```bash
   export HTTP_PROXY=http://proxy:port
   export HTTPS_PROXY=http://proxy:port
   ```
3. Try manual install:
   ```bash
   npx puppeteer browsers install chrome
   ```

---

## Server Issues

### Port Already in Use

**Error:**
```
[ERROR] Port 3000 is already in use.
```

**Solution:**
1. Check if another instance is running
2. Find and kill the process:
   ```bash
   # Windows
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F
   
   # Linux/macOS
   lsof -i :3000
   kill -9 <PID>
   ```
3. Or use a different port:
   ```bash
   CV_PORT=8080 npm start
   ```

---

### Server Won't Start

**Error:**
```
[ERROR] No resumes found in resumes/ or templates/ folder
```

**Solution:**
1. Create a resume folder:
   ```bash
   mkdir -p resumes/MyResume
   ```
2. Add a `resume.html` file in that folder

---

### Can't Access http://localhost:3000

**Possible causes:**

1. **Server not running** - Check terminal for errors
2. **Firewall blocking** - Allow Node.js through firewall
3. **Wrong URL** - Ensure no typos
4. **Browser cache** - Try incognito mode or clear cache

---

## Live Reload Issues

### Changes Not Reflecting

**Symptoms:**
- Edit file, but browser doesn't update

**Solutions:**

1. **Check connection indicator** - Look for green "Live" badge in toolbar
2. **Reconnect manually** - Refresh the page
3. **Check file is watched** - Only `.html` and `.css` files are watched
4. **Check correct resume** - Ensure you're editing the active resume

---

### Live Reload Disconnected

**Symptoms:**
- Orange "Reconnecting..." indicator

**Solutions:**

1. **Server restarted?** - Refresh page after server restart
2. **Network issue** - Check internet connection
3. **Too many connections** - Close duplicate tabs

---

## PDF Generation Issues

### PDF Generation Fails

**Error:**
```
[ERROR] Error generating PDF: Protocol error
```

**Solution:**
1. Ensure Chromium is installed:
   ```bash
   npx puppeteer browsers install chrome
   ```
2. Check available memory (Puppeteer needs ~500MB)
3. On Linux, install required libraries:
   ```bash
   sudo apt-get install -y libx11-xcb1 libxcomposite1 libxdamage1 \
       libxi6 libxtst6 libnss3 libcups2 libxss1 libxrandr2 \
       libasound2 libpangocairo-1.0-0 libatk1.0-0 libatk-bridge2.0-0 \
       libgtk-3-0
   ```

---

### PDF is Blank

**Possible causes:**

1. **resume.html is empty** - Check file content
2. **CSS not loading** - Check for 404 errors in terminal
3. **Font loading timeout** - Increase RENDER_WAIT_MS in pdf.js

---

### PDF Quality is Poor

**Symptoms:**
- Text looks blurry
- Colors look washed out

**Solutions:**

1. **Use latest version** - PDF quality was improved (8x device scale)
2. **Check CSS** - Ensure `print-color-adjust: exact` is set
3. **Use vector icons** - Font Awesome instead of images

---

### PDF Takes Too Long

**Current settings optimize for quality over speed.**

If you need faster generation, edit `src/cli/pdf.js`:
```javascript
// Reduce for faster (lower quality) generation
viewport: {
    deviceScaleFactor: 4  // Changed from 8
}

// Reduce wait times
const RENDER_WAIT_MS = 1000;  // Changed from 3000
```

---

### Fonts Not Rendering in PDF

**Symptoms:**
- Some fonts appear as default system fonts

**Solutions:**

1. **Use web fonts** - Google Fonts work well
2. **Preconnect to font CDN**:
   ```html
   <link rel="preconnect" href="https://fonts.googleapis.com">
   <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
   ```
3. **Wait for font loading** - Already handled in latest version
4. **Use woff2 format** - Best browser support

---

## ATS Test Issues

### ATS Test Shows All Text in One Line

**This issue has been fixed.** If you're still seeing it:

1. Update to latest version
2. Regenerate PDF: `npm run pdf -- --resume=YourResume`
3. Run ATS test again

---

### ATS Test Fails

**Error:**
```
[ERROR] resume.pdf not found
```

**Solution:**
Generate PDF first:
```bash
npm run pdf -- --resume=YourResume
```

The web interface handles this automatically.

---

### ATS Shows Garbage Characters

**Symptoms:**
- Random Unicode characters in extracted text

**Cause:**
Icon fonts (Font Awesome) render in the text layer.

**Solution:**
Add `aria-hidden="true"` to icons:
```html
<i class="fas fa-envelope" aria-hidden="true"></i>
```

---

## External Paths Issues

### External Path Not Showing

**Possible causes:**

1. **Path doesn't exist** - Check the path is correct
2. **No resume.html** - External folder must contain resume.html
3. **Path not saved** - Click "Save" after adding path

---

### External Path Validation Failed

**Error in console:**
```
[CONFIG] Invalid external path: /path/to/folder
```

**Requirements for external paths:**
- Path must exist
- Must be a directory (not a file)
- Must contain `resume.html`

---

## Git/Update Issues

### Update Banner Won't Go Away

**Solution:**
1. Click "Sync" to update
2. Or dismiss manually
3. If can't sync, check git status:
   ```bash
   git status
   git log origin/main..HEAD
   ```

---

### Sync Fails

**Error:**
```
You have local commits. Push or reset them before syncing.
```

**Solution:**
```bash
# If you want to keep your changes
git push origin main

# If you want to discard your changes
git reset --hard origin/main
```

---

### Not on Main Branch

**Error:**
```
You are on branch "feature-x". Switch to main to sync updates.
```

**Solution:**
```bash
git checkout main
```

---

## Browser Issues

### Page Not Loading Correctly

**Solutions:**

1. **Clear cache**: Ctrl+Shift+R (hard refresh)
2. **Disable extensions**: Try incognito mode
3. **Check console**: F12 → Console tab for errors

---

### Toolbar Not Visible

**Solutions:**

1. **Click the gear icon** - Bottom-right corner when hidden
2. **Check zoom level** - Reset to 100%
3. **Refresh page** - F5

---

### Modal Won't Close

**Solutions:**

1. **Press Escape** - Should close modal
2. **Click outside modal** - On the dark overlay
3. **Refresh page** - If stuck

---

## Performance Issues

### Server Slow to Respond

**Possible causes:**

1. **PDF generating** - This is a blocking operation
2. **Large resume files** - Simplify complex layouts
3. **Many external paths** - Each is validated on load

---

### High CPU Usage

**Possible causes:**

1. **File watcher overhead** - Normal for chokidar
2. **Puppeteer running** - During PDF generation
3. **Too many watchers** - Reduce external paths

---

## Getting More Help

### Enable Debug Logging

Add to your command:
```bash
DEBUG=* npm start
```

### Check Node.js Version

```bash
node --version
# Should be v18.0.0 or higher
```

### Check Package Versions

```bash
cd src
npm list
```

### Report a Bug

Include:
1. Operating system
2. Node.js version
3. Error message (full)
4. Steps to reproduce
5. Contents of resume.html (if relevant)

---

## Known Limitations

1. **No HTTPS** - Server runs on HTTP only (local development)
2. **Single user** - Not designed for multi-user scenarios
3. **No database** - All data stored in files
4. **Browser required** - No headless preview mode
5. **Node.js only** - Requires Node.js runtime
