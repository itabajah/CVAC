# Development Guide

This document covers development setup, testing, and contributing to CV As Code.

## Prerequisites

- **Node.js 18.0.0+** - Required for native test runner and modern features
- **Git** - For version control and update features
- **VS Code** (recommended) - For best development experience

## Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/cv-as-code.git
cd cv-as-code
```

### 2. Install Dependencies

```bash
cd src
npm install
```

This installs:
- `puppeteer` - Headless Chrome for PDF generation
- `pdfjs-dist` - PDF text extraction
- `chokidar` - Cross-platform file watching

### 3. Create Your Resume

```bash
mkdir -p resumes/MyResume/css
```

Create `resumes/MyResume/resume.html` with your content.

### 4. Start the Server

```bash
# From project root
./RunLinux.sh    # or RunWindows.bat

# Or directly
cd src
npm start
```

Open http://localhost:3000 in your browser.

---

## Project Structure for Development

```
src/
├── cli/                 # Standalone command-line tools
│   ├── pdf.js           # PDF generator (Puppeteer)
│   └── ats.js           # ATS text extractor (pdf.js)
│
├── launcher/            # Application startup
│   ├── index.js         # Main entry, restart loop
│   ├── checks.js        # Environment checks
│   ├── cleanup.js       # File cleanup
│   └── utils.js         # Logging, browser opening
│
├── server/              # HTTP server
│   ├── index.js         # Server creation
│   ├── routes.js        # Request routing
│   ├── state.js         # Unified state management (config + runtime state)
│   ├── resumes.js       # Resume discovery and management
│   ├── live-reload.js   # File watching + SSE
│   │
│   ├── handlers/        # Request handlers
│   │   ├── api.js       # REST endpoints
│   │   ├── pdf.js       # PDF generation
│   │   ├── ats.js       # ATS testing
│   │   └── static.js    # Static files
│   │
│   └── templates/       # HTML generation
│       ├── loading.js
│       ├── ats-results.js
│       ├── shared.js
│       └── preview/     # Main page
│           ├── page.js
│           ├── toolbar.css
│           ├── modal.css
│           └── scripts/
│
├── shared/              # Shared utilities
│   ├── resume.js        # Resume discovery (pure functions)
│   └── errors.js        # Centralized error handling utilities
│
└── tests/               # Test suite
    ├── helpers/         # Test utilities
    ├── unit/            # Unit tests
    └── integration/     # Integration tests
```

---

## npm Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start the preview server |
| `npm test` | Run all tests |
| `npm run pdf` | Generate PDF for default resume |
| `npm run pdf -- --resume=NAME` | Generate PDF for specific resume |
| `npm run pdf -- --watch` | Watch mode (regenerate on changes) |
| `npm run ats` | Run ATS test for default resume |
| `npm run ats -- --resume=NAME` | Run ATS test for specific resume |
| `npm run serve` | Alias for `npm start` |

---

## Running Tests

### All Tests

```bash
cd src
npm test
```

### Specific Test File

```bash
node --test tests/unit/config.test.js
```

### Watch Mode (manual)

```bash
# Use nodemon or similar
npx nodemon --exec "npm test" --watch tests --watch server
```

### Test Coverage

Currently no built-in coverage. Use c8:

```bash
npx c8 npm test
```

---

## Testing Guide

### Unit Tests

Located in `tests/unit/`. Test individual functions in isolation.

**Example:**
```javascript
const { describe, it } = require('node:test');
const assert = require('node:assert');
const state = require('../../server/state');

describe('State', () => {
    it('should return default config', () => {
        const config = state.getConfig();
        assert.ok(config);
        assert.ok('lastResume' in config);
    });
});
```

### Integration Tests

Located in `tests/integration/`. Test full request/response cycles.

**Example:**
```javascript
const { describe, it, before, after } = require('node:test');
const http = require('http');
const { makeRequest } = require('../helpers/http');

describe('Routes', () => {
    let server;
    
    before(async () => {
        // Start test server
    });
    
    after(async () => {
        // Stop server
    });
    
    it('should return resumes list', async () => {
        const res = await makeRequest('/api/resumes');
        assert.strictEqual(res.statusCode, 200);
    });
});
```

### Test Helpers

```javascript
// assertions.js
assertFileExists(path)
assertFileNotExists(path)
assertContains(string, substring)
assertValidPdf(buffer)
assertValidHtml(string)

// http.js
makeRequest(path, options)
postJson(path, data)

// fixtures.js
createTestResume(name)
cleanupTestResume(name)
getTestResumeDir()
```

---

## Adding New Features

### 1. New API Endpoint

1. Add handler in `handlers/api.js`:
```javascript
function handleMyEndpoint(res) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ data: 'value' }));
}

module.exports = { ..., handleMyEndpoint };
```

2. Add route in `routes.js`:
```javascript
if (pathname === '/api/my-endpoint') {
    return handleMyEndpoint(res);
}
```

3. Add test in `tests/integration/routes.test.js`.

### 2. New Template

1. Create template in `templates/`:
```javascript
function getMyPage(data) {
    return `<!DOCTYPE html>
    <html>
        <head><title>${data.title}</title></head>
        <body>${data.content}</body>
    </html>`;
}

module.exports = { getMyPage };
```

2. Import and use in routes.

### 3. New Client Script

1. Create script in `templates/preview/scripts/`:
```javascript
// my-feature.js
function initMyFeature() {
    console.log('Feature initialized');
}

// Initialize when DOM ready
document.addEventListener('DOMContentLoaded', initMyFeature);
```

2. Add to `page.js` script loading:
```javascript
const scripts = [
    ...,
    readScript('my-feature.js')
];
```

### 4. New CLI Tool

1. Create in `cli/`:
```javascript
#!/usr/bin/env node
const { parseResumeArg, getResumeDir } = require('../shared/resume');

async function main() {
    const resumeName = parseResumeArg();
    const resumeDir = getResumeDir(resumeName);
    // Your logic here
}

main();
```

2. Add npm script in `package.json`:
```json
{
    "scripts": {
        "mytool": "node cli/mytool.js"
    }
}
```

---

## Code Style Guidelines

### JavaScript

- Use ES6+ features (const/let, arrow functions, async/await)
- Use JSDoc comments for functions
- Use descriptive variable names
- Handle errors appropriately

```javascript
/**
 * Generate a PDF for the specified resume
 * @param {string} resumeName - Name of the resume
 * @returns {Promise<boolean>} True if successful
 */
async function generatePdf(resumeName) {
    try {
        // Implementation
        return true;
    } catch (err) {
        console.error('[PDF] Error:', err.message);
        return false;
    }
}
```

### CSS

- Use BEM naming convention
- Organize by component
- Use CSS variables for theming

```css
.toolbar {
    /* Block */
}

.toolbar__btn {
    /* Element */
}

.toolbar__btn--primary {
    /* Modifier */
}
```

### File Naming

- Use kebab-case for files: `live-reload.js`
- Use PascalCase for classes: `ConfigManager.js`
- Use descriptive names that indicate purpose

---

## Debugging

### Server Logs

The server logs all requests:
```
[SERVER] GET /
[SERVER] GET /resume
[SERVER] GET /api/resumes
```

### Live Reload Logs

```
[LIVE-RELOAD] Watching: MyResume
[LIVE-RELOAD] File changed: resume.html
[LIVE-RELOAD] Notified 1 client(s): reload
```

### PDF Generation Logs

```
[PDF] Launching browser with high-quality settings...
[PDF] Loading resume.html...
[PDF] Waiting for fonts to load...
[PDF] Fonts loaded: Roboto, Open-Sans
[PDF] Generating high-quality PDF...
[SUCCESS] High-quality PDF generated successfully!
```

### Debug Mode

Add console.log statements or use Node.js inspector:

```bash
node --inspect src/server/index.js
```

Then open `chrome://inspect` in Chrome.

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `CV_PORT` | Server port | `3000` |
| `CV_UPDATE_AVAILABLE` | Set by launcher | `0` |

**Usage:**
```bash
CV_PORT=8080 npm start
```

---

## Common Development Tasks

### Rebuild After Changes

No build step needed - changes take effect on server restart.

For live reload during development, the server auto-reloads resume files but not server code.

### Update Dependencies

```bash
cd src
npm update
```

### Check for Security Issues

```bash
npm audit
npm audit fix
```

### Generate PDF Manually

```bash
npm run pdf -- --resume=MyResume
```

### Test ATS Extraction

```bash
npm run ats -- --resume=MyResume
```

---

## Contributing

### Pull Request Process

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Add/update tests
5. Run tests: `npm test`
6. Commit with descriptive message
7. Push and create PR

### Commit Message Format

```
type(scope): description

[optional body]

[optional footer]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Examples:
```
feat(live-reload): add SSE-based live reload
fix(pdf): increase quality settings
docs(readme): update installation instructions
```

### Code Review Checklist

- [ ] Code follows style guidelines
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No console.log left (use proper logging)
- [ ] Error handling in place
- [ ] Works on Windows/macOS/Linux
