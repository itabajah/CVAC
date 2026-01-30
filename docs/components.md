# Components Guide

This document provides detailed documentation for every file in the CV As Code project.

---

## Entry Points

### `RunWindows.bat`

Windows batch script entry point.

**Purpose:**
- Checks for Node.js installation
- Offers automatic Node.js installation via winget if missing
- Navigates to src/ directory
- Runs the launcher via npm

**Usage:**
```batch
RunWindows.bat
```

---

### `RunLinux.sh`

Unix shell script entry point.

**Purpose:**
- Checks for Node.js installation
- Offers automatic Node.js installation via Homebrew/apt/dnf/pacman if missing
- Sets execute permissions
- Runs the launcher via npm

**Usage:**
```bash
chmod +x RunLinux.sh
./RunLinux.sh
```

---

## Launcher (`src/launcher/`)

### `index.js`

Main launcher orchestrating startup and lifecycle.

**Key Functions:**

| Function | Description |
|----------|-------------|
| `main()` | Entry point - checks dependencies, starts server |
| `startServer()` | Spawns server process with restart loop |
| `handleExit(code)` | Processes exit codes for restart/cleanup decisions |

**Exit Code Handling:**
```javascript
// Exit codes and their meanings
0: Clean shutdown → Run cleanup
1: Error → Exit with error
2: Fast restart → Skip cleanup, restart immediately  
3: Git sync → Restart after sync
```

---

### `checks.js`

Environment and git status checks.

**Key Functions:**

| Function | Description |
|----------|-------------|
| `checkNodeVersion()` | Ensures Node.js >= 18.0.0 |
| `checkPortAvailable(port)` | Tests if port is free |
| `checkForUpdates()` | Fetches git remote and compares commits |
| `getUpdateStatus()` | Returns detailed update information |

---

### `cleanup.js`

File cleanup utilities.

**Key Functions:**

| Function | Description |
|----------|-------------|
| `cleanupGeneratedFiles()` | Removes PDFs and extracted text |
| `cleanupNodeModules()` | Removes node_modules (for deep clean) |
| `getFilesToClean()` | Lists files that would be cleaned |

**Cleaned Files:**
- `resumes/*/resume.pdf`
- `resumes/*/ats-extracted-text.txt`
- `templates/*/resume.pdf`
- `templates/*/ats-extracted-text.txt`

---

### `utils.js`

Shared utilities.

**Key Functions:**

| Function | Description |
|----------|-------------|
| `log(message, type)` | Colored console logging |
| `openBrowser(url)` | Opens URL in default browser |
| `execSilent(command)` | Executes command, captures output silently |
| `printBanner()` | Displays startup banner |

---

## Server Core (`src/server/`)

### `index.js`

HTTP server setup and lifecycle.

**Key Responsibilities:**
- Creates HTTP server on configurable port
- Registers signal handlers (SIGINT, SIGTERM)
- Initializes live reload watcher
- Handles uncaught exceptions

**Configuration:**
```javascript
const PORT = process.env.CV_PORT || 3000;
```

---

### `routes.js`

Main request router.

**Route Matching:**
```javascript
/                    → Preview page
/resume              → Raw resume HTML
/pdf                 → PDF loading page
/ats-test            → ATS test loading page
/api/resumes         → List resumes
/api/config          → Get/set configuration
/api/switch/:name    → Switch resume
/api/pdf             → Generate PDF
/api/ats-test        → Run ATS test
/api/live-reload     → SSE endpoint
/api/update-status   → Git status
/api/sync            → Git sync
/api/shutdown        → Shutdown with cleanup
/api/shutdown-fast   → Fast shutdown
```

---

### `state.js`

Unified state management combining configuration and runtime state.

**State:**
```javascript
const state = {
  currentResume: null,      // Runtime: currently active resume
  config: {
    visibleResumes: null,   // Persisted: array of visible resume names
    lastResume: null,       // Persisted: last selected resume
    externalPaths: []       // Persisted: external directory paths
  }
};
```

**Key Functions:**

| Function | Description |
|----------|-------------|
| `loadConfig()` | Reads config.json from disk |
| `saveConfig(updates)` | Writes config.json to disk |
| `getConfig()` | Returns current config (immutable copy) |
| `updateConfig(updates)` | Merges updates into config |
| `getVisibleResumesFilter()` | Returns visible resumes filter |
| `getExternalPaths()` | Returns external paths array |
| `setExternalPaths(paths)` | Sets external paths |
| `getCurrentResume()` | Returns current resume name |
| `setCurrentResume(name)` | Sets current resume |
| `parseResumeArg()` | Parse --resume= from CLI |

---

### `resumes.js`

Resume discovery and management (high-level operations).

**Key Functions:**

| Function | Description |
|----------|-------------|
| `getAvailableResumes()` | Standard resumes only |
| `getAllResumesWithExternals()` | Includes external paths |
| `getCategorizedResumes()` | Split by type (templates, resumes, externals) |
| `getVisibleResumes()` | Filtered by visibility config |
| `getCurrentResumeDir()` | Path to current resume |
| `getCurrentResume()` | Current resume name |
| `setCurrentResume(name)` | Change current resume |
| `parseResumeArg()` | Parse --resume= from CLI |

---

### `live-reload.js`

File watching and Server-Sent Events with auto-shutdown.

**Key Functions:**

| Function | Description |
|----------|-------------|
| `initWatcher()` | Start chokidar file watcher |
| `switchWatcher()` | Reinitialize for new resume |
| `handleSSEConnection(res)` | Handle SSE client connection |
| `notifyClients(event, data)` | Broadcast to all SSE clients |
| `cleanup()` | Close watcher and connections |
| `getClientCount()` | Number of connected clients |
| `setAutoShutdownCallback(fn)` | Set callback for auto-shutdown |
| `cancelAutoShutdownTimer()` | Cancel pending auto-shutdown |

**Auto-Shutdown:**
- Server automatically shuts down 5 seconds after the last client disconnects
- Timer is cancelled if a new client connects within the grace period

**Watched Files:**
- `resume.html`
- `css/*.css`
- `**/*.html` (any HTML in subdirectories)

**Debouncing:**
- 100ms debounce to handle rapid saves

---

## Handlers (`src/server/handlers/`)

### `api.js`

REST API endpoint handlers.

**Key Functions:**

| Function | Endpoint | Method |
|----------|----------|--------|
| `handleGetResumes()` | /api/resumes | GET |
| `handleGetConfig()` | /api/config | GET |
| `handlePostConfig()` | /api/config | POST |
| `handleSwitchResume()` | /api/switch/:name | GET, POST |
| `handleShutdown()` | /api/shutdown | GET |
| `handleShutdownFast()` | /api/shutdown-fast | GET |
| `handleGetUpdateStatus()` | /api/update-status | GET |
| `handleSync()` | /api/sync | POST |

**Security Features:**
- Request body size limit (64KB) to prevent DoS attacks
- Input validation and sanitization
- Safe shell command execution with error handling

---

### `pdf.js`

PDF generation handler with caching.

**Key Functions:**

| Function | Description |
|----------|-------------|
| `needsPdfRegeneration(dir)` | Check if PDF is stale |
| `generatePdfAsync(resume)` | Async PDF generation via spawn |
| `handlePdfGeneration(res, dir, resume)` | Full PDF request handler with caching |

**Caching Behavior:**
- Serves existing PDF if HTML and CSS haven't changed
- Regenerates automatically when source files are modified
- Compares modification times of resume.html, CSS files vs resume.pdf

---

### `ats.js`

ATS testing handler.

**Key Functions:**

| Function | Description |
|----------|-------------|
| `runAtsTestAsync(resume)` | Async ATS test via spawn |
| `handleAtsTest(res, dir, resume)` | Full ATS test request handler |

**Flow:**
1. Check if PDF needs regeneration
2. Generate PDF if needed
3. Run ATS text extraction
4. Return formatted results

---

### `static.js`

Static file serving with security protections.

**Key Functions:**

| Function | Description |
|----------|-------------|
| `isPathSafe(fullPath, baseDir)` | Validate path against traversal attacks |
| `serveStaticFile(res, path, dir)` | Serve CSS, fonts, images safely |
| `serveResumeHtml(res, dir)` | Serve resume.html |
| `getMimeType(ext)` | Get MIME type for extension |

**Security Features:**
- Path traversal protection (validates resolved paths stay within base directory)
- Blocks attempts to access files outside the resume directory

**Supported MIME Types:**
```javascript
{
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain',
  '.ico': 'image/x-icon'
}
```

---

## Shared Utilities (`src/shared/`)

### `resume.js`

Pure functions for resume discovery (no state).

**Key Functions:**

| Function | Description |
|----------|-------------|
| `getResumesFromDir(dir)` | Scan directory for resumes |
| `getAvailableResumes()` | Get all standard resumes |
| `getAllResumesWithExternals(paths)` | Include external paths |
| `getResumeDirByName(name)` | Get directory for resume name |
| `getResumeDirByNameExtended(name)` | Handle external paths |
| `parseResumeArg()` | Parse --resume= CLI argument |
| `parseWatchArg()` | Parse --watch CLI argument |

### `errors.js`

Centralized error handling utilities.

**Key Functions:**

| Function | Description |
|----------|-------------|
| `exitWithError(msg, code)` | Log and exit (CLI) |
| `sendJsonError(res, status, msg)` | Send JSON error response |
| `sendJsonSuccess(res, data)` | Send JSON success response |
| `safeExecSync(cmd, opts, ctx)` | Safe shell execution |
| `safeExecute(fn, ctx, fallback)` | Error boundary wrapper |

---

## Templates (`src/server/templates/`)

### `loading.js`

Loading page generator.

**Function:**
```javascript
getLoadingPage(title, message, redirectUrl)
```

**Features:**
- Spinning animation
- Auto-redirect to API endpoint
- Error display on failure

---

### `ats-results.js`

ATS test results page.

**Function:**
```javascript
getAtsResultsPage(resumeName, output)
```

**Features:**
- Light theme matching the preview page design
- Status highlighting with subtle colored backgrounds
- Line break preservation
- Page break indicators
- Header with back button

---

### `shared.js`

Shared HTML elements.

**Exports:**
```javascript
FAVICON_LINK      // <link rel="icon" ...>
getPageTitle(sub) // "CV Preview - subtitle" or "CV Preview"
```

---

## Preview (`src/server/templates/preview/`)

### `page.js`

Main preview page generator.

**Function:**
```javascript
getPreviewPage()
```

**Components:**
- Toolbar with resume selector
- Config button
- PDF/ATS/Stop buttons
- Resume iframe
- All client scripts embedded

---

### `toolbar.css`

Toolbar styling.

**Classes:**
- `.toolbar` - Main container
- `.toolbar__btn` - Action buttons
- `.toolbar__select` - Resume dropdown
- `.toolbar__toggle` - Show/hide button

---

### `modal.css`

Modal dialog styling.

**Classes:**
- `.modal-overlay` - Backdrop
- `.modal` - Dialog container
- `.modal--config` - Config modal variant
- `.modal--stop` - Stop modal variant
- `.config-section` - Section containers
- `.config-section--externals` - Externals (collapsed/muted)

---

## Client Scripts (`src/server/templates/preview/scripts/`)

### `modal.js`

Modal dialog management.

**API:**
```javascript
Modal.open(html)           // Show modal with content
Modal.close()              // Close current modal
Modal.alert(title, msg, type, callback)  // Alert dialog
```

---

### `toolbar.js`

Toolbar interactions.

**Functions:**
```javascript
toggleToolbar()           // Show/hide toolbar
switchResume(name)        // Change resume via API
openPDF()                 // Navigate to /pdf
openATS()                 // Navigate to /ats-test
```

---

### `stop-modal.js`

Server stop dialog.

**Functions:**
```javascript
openStopModal()           // Show stop options
stopServer()              // /api/shutdown
stopServerFast()          // /api/shutdown-fast
```

---

### `config-modal.js`

Visible resumes configuration.

**Functions:**
```javascript
openConfigModal()         // Show config dialog
toggleExternalsSection()  // Expand/collapse externals
selectAllResumes(bool)    // Check/uncheck all
addExternalPath()         // Add new external path
removeExternalPath(i)     // Remove external path
saveConfig()              // POST to /api/config
renderExternalPathsList() // Update external paths UI
```

---

### `banner.js`

Shared banner notification system.

**Functions:**
```javascript
showBanner(id, options)   // Show a banner notification
hideBanner(id)            // Hide/remove a banner
updateBanner(id, options) // Update existing banner
```

**Banner Types:** `info`, `success`, `warning`, `error`

**Options:**
- `type` - Banner variant
- `message` - Main message text
- `icon` - FontAwesome icon class
- `autoDismiss` - Auto-hide after timeout
- `actionText/onAction` - Action button

---

### `update-banner.js`

Git update notification (uses shared banner system).

**Functions:**
```javascript
checkForUpdates()         // Fetch /api/update-status
showUpdateBanner()        // Display update via showBanner()
syncNow()                 // Initiate sync with confirmation
```

---

### `live-reload.js`

Live reload client (uses shared banner system).

**Functions:**
```javascript
initLiveReload()          // Connect to SSE endpoint
reloadResumeFrame()       // Refresh iframe with cache bust
showReloadNotification()  // "Reloaded" banner notification
```

**Banner Notifications:**
- Connected: Brief info banner on connection
- Disconnected: Warning banner while reconnecting
- Reloaded: Success banner on file change

**Auto-reconnection:**
- Max 10 attempts
- 2 second delay between attempts

---

## CLI Tools (`src/cli/`)

### `pdf.js`

High-quality PDF generator.

**Usage:**
```bash
node cli/pdf.js --resume=MyResume
node cli/pdf.js --watch
```

**Quality Settings:**
```javascript
{
  // Viewport at 300 DPI (A4 = 2480x3508)
  // deviceScaleFactor: 4 on top = 1200 DPI effective
  printBackground: true,   // Preserve colors
  tagged: true,            // ATS accessibility
  scale: 1                 // No scaling artifacts
}
```

**Browser Args:**
- `--font-render-hinting=none`
- `--enable-font-antialiasing`
- `--force-color-profile=srgb`

---

### `ats.js`

ATS text extraction.

**Usage:**
```bash
node cli/ats.js --resume=MyResume
```

**Text Extraction:**
- Y-coordinate detection for line breaks
- Paragraph detection (>15px gap)
- Line detection (>5px gap)
- Sorted by position for reading order

**Analysis:**
- Contact info keywords
- Education keywords
- Experience keywords
- Skills keywords
- Garbage character detection

---

## Shared (`src/shared/`)

### `resume.js`

Resume discovery utilities.

**Constants:**
```javascript
SRC_DIR       // src/ directory path
RESUMES_DIR   // resumes/ directory path  
TEMPLATES_DIR // templates/ directory path
```

**Functions:**
```javascript
getAvailableResumes()              // All standard resumes
getResumeDir(name)                 // Path for resume name
getResumeDirByName(name)           // Resolve from name
getResumeDirByNameExtended(name)   // Including externals
getAllResumesWithExternals(paths)  // All with external paths
parseResumeArg()                   // Parse --resume= CLI arg
parseWatchArg()                    // Parse --watch CLI arg
```

---

## Tests (`src/tests/`)

### Test Structure

```
tests/
├── fixtures/           # Test data
│   └── config-test/    # Test config files
├── helpers/            # Test utilities
│   ├── assertions.js   # Custom assertions
│   ├── fixtures.js     # Directory helpers
│   ├── http.js         # HTTP test helpers
│   └── test-utils.js   # Combined exports
├── integration/        # End-to-end tests
│   ├── ats.test.js
│   ├── pdf-generation.test.js
│   └── routes.test.js
└── unit/               # Unit tests
    ├── config.test.js
    ├── external-paths.test.js
    ├── resume.test.js
    └── resumes.test.js
```

### Running Tests

```bash
cd src
npm test
```

### Key Assertions

```javascript
assertFileExists(path)
assertFileNotExists(path)
assertContains(str, substr)
assertStartsWith(str, prefix)
assertValidPdf(buffer)
assertValidHtml(str)
```
