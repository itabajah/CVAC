# CV As Code Documentation

Welcome to the comprehensive documentation for CV As Code, a developer-focused resume management system that treats your CV as code.

## Table of Contents

1. [Architecture Overview](./architecture.md) - System design and module structure
2. [API Reference](./api.md) - HTTP endpoints and their usage
3. [Components Guide](./components.md) - Detailed file-by-file documentation
4. [Development Guide](./development.md) - Setup, testing, and contributing
5. [Template Guide](./templates.md) - Creating custom resume templates
6. [Troubleshooting](./troubleshooting.md) - Common issues and solutions

## Quick Start

### Prerequisites

- Node.js 18.0.0 or higher
- Git (optional, for version control features)

### Running the Server

**Windows:**
```batch
RunWindows.bat
```

**Linux/macOS:**
```bash
./RunLinux.sh
```

The server will start at `http://localhost:3000` with:
- **Live Reload** - Changes to your resume are reflected instantly
- **PDF Generation** - High-quality, ATS-friendly PDF output
- **ATS Testing** - See exactly what ATS systems will parse

## Project Structure

```
cv-as-code/
├── docs/                    # This documentation
├── resumes/                 # Your resumes (git-ignored)
│   ├── config.json          # User preferences
│   └── MyResume/            # Your resume folder
│       ├── resume.html      # Main resume content
│       └── css/             # Stylesheets
├── templates/               # Example templates (read-only)
├── src/                     # Application source code
│   ├── cli/                 # Command-line tools
│   ├── launcher/            # Startup and cleanup
│   ├── server/              # HTTP server
│   └── shared/              # Shared utilities
└── RunWindows.bat / RunLinux.sh
```

## Key Features

### 1. Live Reload
The server monitors your resume files for changes and automatically refreshes the preview. No need to manually refresh the browser.

### 2. High-Quality PDF Generation
PDFs are generated at 8x device scale factor for maximum quality, with proper font embedding and ATS-friendly tagging.

### 3. ATS Compatibility Testing
See exactly what text Applicant Tracking Systems will extract from your PDF, with keyword analysis and issue detection.

### 4. Multi-Resume Support
Manage multiple resumes with easy switching via the toolbar dropdown.

### 5. External Paths
Reference resume folders from anywhere on your system.

## Need Help?

- Check [Troubleshooting](./troubleshooting.md) for common issues
- Read the [Development Guide](./development.md) to understand the codebase
- Review [Components](./components.md) for detailed module documentation
