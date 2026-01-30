# CV As Code

Create and maintain your resume as HTML/CSS with automatic PDF generation and ATS testing.

## About

CV As Code treats your resume like software: version-controlled, modular, and infinitely customizable. Instead of wrestling with Word templates or design tools, you write your CV in clean HTML/CSS, giving you complete control over every pixel while maintaining ATS (Applicant Tracking System) compatibility.

### Why Code Your CV?

One of the core purposes of this project is to leverage **modern AI coding assistants** like **GitHub Copilot**, **Anthropic Claude**, **ChatGPT**, and others to write, refine, and tailor your resume. These tools excel at:

- **Generating professional content**: AI can help craft compelling job descriptions, achievements, and summaries
- **Tailoring for specific roles**: Quickly adapt your resume for different positions with AI suggestions
- **Improving wording**: Get help with action verbs, quantifying achievements, and professional phrasing
- **HTML/CSS styling**: AI assistants can generate and modify styles, layouts, and responsive designs
- **Maintaining multiple versions**: Easily create role-specific variants with AI-assisted content generation

Since your CV is just code, AI coding tools work seamlessly in your editor: autocompleting sections, suggesting improvements, and helping you iterate faster than ever before.

## Quick Start

1. Run `RunWindows.bat` (Windows) or `./RunLinux.sh` (Mac/Linux)
2. Copy a template to `resumes/` from the browser or manually
3. Edit your resume HTML - preview updates live at `localhost:3000`
4. Click "Preview PDF" to generate your resume

### Or Let AI Do It

Open your AI coding assistant (Copilot, Claude, etc.) and use this prompt:

> *"Look at the templates in `templates/` folder. Create a new resume for me in `resumes/my-resume/` based on [template name]. Here's my information: [paste your details]. Make it professional and ATS-friendly."*

The AI will generate your complete resume HTML/CSS. Then just run the server and preview your PDF!

## Features

- **Live Reload** - Changes to your resume are reflected instantly in the browser
- **Auto-shutdown** - Server closes automatically 5 seconds after you close the browser
- **Easy Setup** - Auto-installs Node.js if missing (Windows: winget, Mac/Linux: Homebrew/apt)
- Multiple resume versions for different jobs
- Full HTML/CSS design control
- ATS-optimized PDF generation (extreme quality, 1200 DPI)
- Auto-updating tools and templates

## Documentation

See the `docs/` folder for comprehensive documentation:
- [Architecture](docs/architecture.md) - System design overview
- [API Reference](docs/api.md) - HTTP endpoints
- [Development Guide](docs/development.md) - Setup and contributing
- [Template Guide](docs/templates.md) - Creating custom templates
- [Troubleshooting](docs/troubleshooting.md) - Common issues

## Project Structure

```
├── RunWindows.bat    # Start script (Windows)
├── RunLinux.sh       # Start script (Mac/Linux)
├── templates/        # Resume templates (read-only)
├── resumes/          # Your resumes (private, git-ignored)
└── src/              # Application code (auto-updated)
```

## Browser UI

- **Dropdown** - Switch between resumes
- **Preview PDF** - Generate PDF from your resume
- **ATS Test** - Verify text extraction for job applications
- **Settings** - Configure visible resumes and external paths

### External Paths

You can add resume folders from anywhere on your computer:

1. Click **Settings** (gear icon) in the browser
2. The modal shows three sections: **Templates**, **Resumes**, and **External Paths**
3. In the External Paths section, paste any folder path containing a `resume.html`
4. Click **Add** to include it
5. Check/uncheck external paths to control their visibility in the dropdown
6. Click **Save** to apply changes

External paths persist across sessions and appear in the resume dropdown alongside your regular resumes.

## Notes

- Clone this repo, then create your own private repo inside `resumes/` for your personal data
- Your `resumes/` folder is git-ignored - your data stays private
- Templates and tools update automatically on `git pull`
- Each resume folder needs a `resume.html` file
