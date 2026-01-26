# API Reference

This document describes all HTTP endpoints provided by the CV As Code server.

## Base URL

```
http://localhost:3000
```

The port can be configured via the `CV_PORT` environment variable.

---

## Page Endpoints

### GET /

**Description:** Main preview page with toolbar and embedded resume iframe.

**Response:** HTML page containing:
- Floating toolbar with resume selector, PDF, ATS, and Stop buttons
- Iframe displaying the current resume
- Live reload connection

**Example:**
```bash
curl http://localhost:3000/
```

---

### GET /resume

**Description:** Raw resume HTML file (no wrapper).

**Response:** 
- `200 OK` - HTML content of the current resume
- `404 Not Found` - Resume file doesn't exist

**Headers:**
```
Content-Type: text/html
```

**Example:**
```bash
curl http://localhost:3000/resume
```

---

### GET /pdf

**Description:** Loading page that redirects to PDF generation.

**Response:** HTML page with loading spinner that automatically fetches `/api/pdf`.

**Example:**
```bash
# Opens loading page, then displays PDF
curl http://localhost:3000/pdf
```

---

### GET /ats-test

**Description:** Loading page that redirects to ATS testing.

**Response:** HTML page with loading spinner that automatically fetches `/api/ats-test`.

---

## API Endpoints

### GET /api/resumes

**Description:** Get list of all available resumes.

**Response:**
```json
{
  "resumes": ["MyResume", "templates/example1", "external:Other|/path/to/other"],
  "current": "MyResume"
}
```

**Fields:**
- `resumes` - Array of all resume names (including templates and externals)
- `current` - Currently selected resume name

---

### GET /api/config

**Description:** Get current configuration.

**Response:**
```json
{
  "visibleResumes": ["MyResume", "templates/example1"],
  "externalPaths": ["/path/to/external/resume"],
  "allResumes": ["MyResume", "templates/example1", "templates/example2"]
}
```

**Fields:**
- `visibleResumes` - Resumes shown in the dropdown (null = show all)
- `externalPaths` - Array of external directory paths
- `allResumes` - All discovered resumes

---

### POST /api/config

**Description:** Update configuration settings.

**Request Body:**
```json
{
  "visibleResumes": ["MyResume", "templates/example1"],
  "externalPaths": ["/path/to/resume"]
}
```

**Response (Success):**
```json
{
  "success": true,
  "visibleResumes": ["MyResume", "templates/example1"]
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "No valid resumes selected"
}
```

**Status Codes:**
- `200 OK` - Configuration saved
- `400 Bad Request` - Invalid data format
- `413 Payload Too Large` - Request body exceeds 64KB limit
- `500 Internal Server Error` - Failed to save

---

### GET|POST /api/switch/:name

**Description:** Switch to a different resume.

**Methods:** GET, POST (both accepted)

**Parameters:**
- `name` - Resume name (URL encoded)

**Response (Success):**
```json
{
  "success": true,
  "current": "MyResume"
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Resume not found"
}
```

**Side Effects:**
- Updates live reload watcher to new resume
- Notifies connected SSE clients of switch
- Saves as last resume for next session

**Example:**
```bash
curl http://localhost:3000/api/switch/templates%2Fexample1
```

---

### GET /api/pdf

**Description:** Generate and serve PDF for current resume. Uses caching - serves existing PDF if up-to-date, regenerates if HTML/CSS changed.

**Response:**
- `200 OK` - PDF binary data
- `500 Internal Server Error` - Generation failed

**Headers:**
```
Content-Type: application/pdf
Content-Disposition: inline; filename="MyResume-resume.pdf"
Cache-Control: no-cache
```

**Note:** This is a blocking operation that may take several seconds for high-quality generation.

---

### GET /api/ats-test

**Description:** Run ATS compatibility test on current resume.

**Response:** HTML page with test results including:
- Extracted text with preserved formatting
- Keyword analysis
- Issue detection

**Status Codes:**
- `200 OK` - Test completed
- `500 Internal Server Error` - Test failed

**Note:** Will regenerate PDF if stale or missing before testing.

---

### GET /api/update-status

**Description:** Check if updates are available from git remote.

**Response:**
```json
{
  "updateAvailable": true,
  "canSync": true,
  "warning": null,
  "branch": "main"
}
```

**Fields:**
- `updateAvailable` - Whether remote has new commits
- `canSync` - Whether it's safe to sync (on main, no local commits)
- `warning` - Warning message if sync is risky
- `branch` - Current git branch

---

### POST /api/sync

**Description:** Sync with git remote (git reset --hard origin/main).

**Response (Success):**
```json
{
  "success": true,
  "message": "Synced successfully. Please restart the server."
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "git error message"
}
```

**Side Effects:**
- Fetches from origin/main
- Resets local to match remote
- Exits server with code 3 (triggers restart)

**Warning:** This will discard any local changes in tools/ and templates/.

---

### GET /api/shutdown

**Description:** Shutdown server with cleanup.

**Response:**
```
Server shutting down...
```

**Side Effects:**
- Runs cleanup (removes PDFs, extracted text files)
- Exits with code 0

---

### GET /api/shutdown-fast

**Description:** Fast shutdown without cleanup.

**Response:**
```
Server shutting down...
```

**Side Effects:**
- Exits with code 2 (fast restart)
- No cleanup performed

---

### GET /api/live-reload

**Description:** Server-Sent Events endpoint for live reload.

**Response:** SSE stream with events:

**Connection Event:**
```
event: connected
data: {"message":"Live reload connected","resume":"MyResume","timestamp":1706500000000}
```

**Reload Event (file changed):**
```
event: reload
data: {"file":"resume.html","resume":"MyResume","timestamp":1706500001000}
```

**Switch Event (resume changed):**
```
event: switch
data: {"resume":"templates/example1","timestamp":1706500002000}
```

**Heartbeat (every 30s):**
```
: heartbeat
```

**Example:**
```javascript
const source = new EventSource('/api/live-reload');
source.addEventListener('reload', (e) => {
  console.log('File changed:', JSON.parse(e.data));
  document.getElementById('resumeFrame').src += '?t=' + Date.now();
});
```

---

## Static Files

### GET /css/*

**Description:** Serve CSS files from current resume's css/ directory.

**Example:**
```bash
curl http://localhost:3000/css/styles.css
```

---

### GET /fonts/*

**Description:** Serve font files from current resume's fonts/ directory.

---

### GET /images/*

**Description:** Serve image files from current resume's images/ directory.

---

## Error Responses

All endpoints may return error responses:

### 404 Not Found
```json
{
  "error": "Not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Description of error"
}
```

Or plain text:
```
Internal Server Error: Description
```

---

## CORS

The `/api/live-reload` endpoint includes CORS headers:
```
Access-Control-Allow-Origin: *
```

Other endpoints do not include CORS headers as they're intended for same-origin requests only.
