# Source

Core application code for CV As Code. Handles PDF generation, ATS testing, and the preview server.

## Commands

```bash
npm run serve      # Start preview server
npm run pdf        # Generate PDF
npm run ats        # Run ATS compatibility test
npm test           # Run test suite
```

## Structure

```text
src/
├── cli/                  # Command-line tools
│   ├── pdf.js            # PDF generation with Puppeteer (8x quality)
│   └── ats.js            # ATS text extraction with line preservation
├── shared/               # Shared utilities
│   └── resume.js         # Resume discovery, external paths support
├── server/               # Preview server
│   ├── config.js         # Configuration management
│   ├── resumes.js        # Resume listing and categorization
│   ├── live-reload.js    # File watching and SSE for live updates
│   ├── handlers/         # HTTP request handlers (async)
│   ├── managers/         # Class-based state management
│   ├── templates/        # HTML templates
│   └── routes.js         # Main router
├── launcher/             # Cross-platform startup
└── tests/                # Test suite
```

## Notes

- Dependencies are installed automatically by the run scripts
- Do not modify these files - they're updated automatically via git pull
