# Architecture Overview

This document describes the system architecture of CV As Code, a Node.js application for managing and previewing resumes.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Entry Points                              │
│  RunWindows.bat / RunLinux.sh → src/launcher/index.js           │
└─────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Launcher                                 │
│  • Environment checks (Node.js version, dependencies)           │
│  • Git update detection                                          │
│  • Cleanup management                                            │
│  • Process lifecycle (restart loop)                              │
└─────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                       HTTP Server                                │
│  src/server/index.js                                            │
│  • Native Node.js http module (no Express)                      │
│  • Single-threaded, event-driven                                │
│  • Port 3000 (configurable via CV_PORT env var)                │
└─────────────────────────────────────────────────────────────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    ▼              ▼              ▼
           ┌───────────┐   ┌───────────┐   ┌───────────┐
           │  Routes   │   │Live Reload│   │  Handlers │
           │routes.js  │   │live-reload│   │ handlers/ │
           └───────────┘   └───────────┘   └───────────┘
                    │              │              │
                    └──────────────┼──────────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    ▼              ▼              ▼
           ┌───────────┐   ┌───────────┐   ┌───────────┐
           │ Templates │   │   State   │   │  Resumes  │
           │templates/ │   │ state.js  │   │resumes.js │
           └───────────┘   └───────────┘   └───────────┘
```

## Module Structure

### 1. Launcher (`src/launcher/`)

The launcher handles application lifecycle:

| File | Purpose |
|------|---------|
| `index.js` | Main entry point, restart loop, process management |
| `checks.js` | Port availability, git update detection |
| `cleanup.js` | Removal of generated files (PDFs, node_modules) |
| `utils.js` | Logging, browser opening, silent execution |

**Restart Exit Codes:**
- `0` - Clean shutdown with cleanup
- `2` - Fast restart without cleanup
- `3` - Restart after git sync

### 2. Server (`src/server/`)

Native HTTP server without Express for minimal dependencies:

| File | Purpose |
|------|---------|
| `index.js` | HTTP server creation, signal handlers |
| `routes.js` | URL routing, handler delegation |
| `state.js` | Unified state management (config + runtime state) |
| `resumes.js` | Resume discovery and management |
| `live-reload.js` | File watching and SSE for live updates |

### 3. Handlers (`src/server/handlers/`)

Request handlers organized by functionality:

| File | Purpose |
|------|---------|
| `api.js` | REST API endpoints |
| `pdf.js` | PDF generation (async spawn) |
| `ats.js` | ATS testing (async spawn) |
| `static.js` | Static file serving |
| `index.js` | Handler exports |

### 4. Templates (`src/server/templates/`)

Server-side HTML generation:

| File | Purpose |
|------|---------|
| `loading.js` | Loading/spinner page |
| `ats-results.js` | ATS test results display |
| `shared.js` | Common HTML elements |
| `preview/` | Main preview page components |

### 5. CLI Tools (`src/cli/`)

Command-line tools that can run standalone:

| File | Purpose |
|------|---------|
| `pdf.js` | Puppeteer-based PDF generation |
| `ats.js` | PDF.js text extraction and analysis |

### 6. State Management (`src/server/state.js`)

Unified state module combining runtime and persisted configuration:

| Function | Purpose |
|----------|---------|
| `loadConfig()` | Load config from file |
| `saveConfig()` | Persist config changes |
| `getConfig()` | Get config copy |
| `getVisibleResumesFilter()` | Get visibility filter |
| `getExternalPaths()` | Get external resume paths |
| `getCurrentResume()` | Get current resume name |
| `setCurrentResume()` | Set current resume |

### 7. Shared Utilities (`src/shared/`)

| File | Purpose |
|------|---------|
| `resume.js` | Pure functions for resume discovery |
| `errors.js` | Centralized error handling utilities |

## Data Flow

### 1. Page Request Flow

```
Browser                    Server                      File System
   │                          │                              │
   │  GET /                   │                              │
   │─────────────────────────>│                              │
   │                          │  Read resume list            │
   │                          │─────────────────────────────>│
   │                          │<─────────────────────────────│
   │                          │  Generate page.js template   │
   │<─────────────────────────│                              │
   │                          │                              │
   │  GET /resume             │                              │
   │─────────────────────────>│                              │
   │                          │  Read resume.html            │
   │                          │─────────────────────────────>│
   │                          │<─────────────────────────────│
   │<─────────────────────────│                              │
```

### 2. Live Reload Flow

```
Browser                    Server                   File Watcher
   │                          │                          │
   │  SSE Connect             │                          │
   │  GET /api/live-reload    │                          │
   │─────────────────────────>│                          │
   │                          │                          │
   │<─────(connection open)───│                          │
   │                          │                          │
   │                          │   File Change Detected   │
   │                          │<─────────────────────────│
   │                          │                          │
   │<─────event: reload───────│                          │
   │                          │                          │
   │  Reload iframe           │                          │
   │                          │                          │
```

### 3. PDF Generation Flow

```
Browser              Server                PDF Handler            Puppeteer
   │                    │                       │                     │
   │  GET /pdf          │                       │                     │
   │───────────────────>│                       │                     │
   │<──loading page─────│                       │                     │
   │                    │                       │                     │
   │  GET /api/pdf      │                       │                     │
   │───────────────────>│                       │                     │
   │                    │  spawn(pdf.js)        │                     │
   │                    │──────────────────────>│                     │
   │                    │                       │  Launch browser     │
   │                    │                       │────────────────────>│
   │                    │                       │  Navigate to HTML   │
   │                    │                       │────────────────────>│
   │                    │                       │  Generate PDF       │
   │                    │                       │────────────────────>│
   │                    │                       │<────────────────────│
   │                    │<──────────────────────│                     │
   │<───PDF binary──────│                       │                     │
```

## Key Design Decisions

### 1. No Express.js

The server uses native Node.js `http` module to:
- Minimize dependencies
- Reduce security surface area
- Simplify deployment

### 2. Server-Sent Events (SSE) over WebSocket

Live reload uses SSE because:
- Simpler implementation (HTTP-based)
- One-way communication is sufficient
- No additional dependencies needed
- Auto-reconnection handled by browser

### 3. Async Process Spawning

PDF and ATS operations use async `spawn` instead of `execSync`:
- Non-blocking server operation
- Better error handling
- Graceful timeout support

### 4. Unified State Module

The `state.js` module provides centralized state management:
- Single source of truth for runtime state
- Persisted configuration to file
- Clear separation of concerns

### 5. Template-Based HTML

Server-side HTML generation using template literals:
- No client-side framework dependencies
- Fast initial page load
- Easy to understand and modify

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `CV_PORT` | Server port | `3000` |
| `CV_UPDATE_AVAILABLE` | Set by launcher when git updates exist | `0` |

### Config File (`resumes/config.json`)

```json
{
  "visibleResumes": ["MyResume", "templates/example1"],
  "lastResume": "MyResume",
  "externalPaths": ["/path/to/external/resume"]
}
```

## Security Considerations

1. **Local-only access**: Server binds to localhost by default
2. **Path validation**: External paths are validated before use
3. **No user input in shell commands**: Resume names are validated
4. **Static file serving**: Only serves from allowed directories
