# Template Guide

This guide explains how to create and customize resume templates for CV As Code.

## Template Structure

Each resume template is a folder containing:

```
MyResume/
├── resume.html          # Main HTML file (required)
└── css/                 # Stylesheets (optional but recommended)
    ├── styles.css       # Main stylesheet
    ├── variables.css    # CSS variables
    ├── base.css         # Reset and base styles
    ├── layout.css       # Layout and grid
    ├── main-content.css # Content styles
    └── print.css        # Print-specific styles
```

## Minimal Template

The simplest possible template:

```html
<!-- resume.html -->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Resume</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
    </style>
</head>
<body>
    <h1>John Doe</h1>
    <p>Software Engineer</p>
    
    <h2>Experience</h2>
    <h3>Company Name - Role</h3>
    <p>2020 - Present</p>
    <ul>
        <li>Achievement 1</li>
        <li>Achievement 2</li>
    </ul>
    
    <h2>Education</h2>
    <p>University Name - Degree</p>
    
    <h2>Skills</h2>
    <p>JavaScript, Python, React, Node.js</p>
</body>
</html>
```

## Recommended Template Structure

### resume.html

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Name - Resume</title>
    
    <!-- Google Fonts (optional) -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet">
    
    <!-- Font Awesome for icons (optional) -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <!-- Your stylesheets -->
    <link rel="stylesheet" href="css/variables.css">
    <link rel="stylesheet" href="css/base.css">
    <link rel="stylesheet" href="css/layout.css">
    <link rel="stylesheet" href="css/main-content.css">
    <link rel="stylesheet" href="css/print.css">
</head>
<body>
    <main class="resume">
        <header class="header">
            <h1 class="name">Your Name</h1>
            <p class="title">Your Title</p>
            <div class="contact">
                <span><i class="fas fa-envelope"></i> email@example.com</span>
                <span><i class="fas fa-phone"></i> (555) 123-4567</span>
                <span><i class="fab fa-linkedin"></i> linkedin.com/in/yourname</span>
            </div>
        </header>
        
        <section class="section">
            <h2 class="section-title">Summary</h2>
            <p class="summary">Brief professional summary...</p>
        </section>
        
        <section class="section">
            <h2 class="section-title">Experience</h2>
            
            <article class="job">
                <div class="job-header">
                    <h3 class="job-title">Senior Software Engineer</h3>
                    <span class="job-dates">2022 - Present</span>
                </div>
                <p class="job-company">Company Name, Location</p>
                <ul class="job-achievements">
                    <li>Key achievement with measurable impact</li>
                    <li>Another significant accomplishment</li>
                </ul>
            </article>
            
            <!-- More jobs... -->
        </section>
        
        <section class="section">
            <h2 class="section-title">Education</h2>
            <article class="education">
                <h3>University Name</h3>
                <p>Bachelor of Science in Computer Science, 2020</p>
            </article>
        </section>
        
        <section class="section">
            <h2 class="section-title">Skills</h2>
            <div class="skills">
                <span class="skill">JavaScript</span>
                <span class="skill">Python</span>
                <span class="skill">React</span>
                <!-- More skills... -->
            </div>
        </section>
    </main>
</body>
</html>
```

### css/variables.css

```css
:root {
    /* Colors */
    --color-primary: #1e3a5f;
    --color-secondary: #2c5282;
    --color-text: #333333;
    --color-text-light: #666666;
    --color-background: #ffffff;
    --color-border: #e2e8f0;
    --color-accent: #4299e1;
    
    /* Typography */
    --font-family: 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif;
    --font-size-base: 11pt;
    --font-size-small: 10pt;
    --font-size-large: 12pt;
    --font-size-h1: 24pt;
    --font-size-h2: 14pt;
    --font-size-h3: 12pt;
    
    /* Spacing */
    --spacing-xs: 4px;
    --spacing-sm: 8px;
    --spacing-md: 16px;
    --spacing-lg: 24px;
    --spacing-xl: 32px;
    
    /* Layout */
    --page-width: 210mm;  /* A4 width */
    --page-height: 297mm; /* A4 height */
    --page-margin: 15mm;
}
```

### css/base.css

```css
/* Reset */
*, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

/* Base styles */
html {
    font-size: var(--font-size-base);
}

body {
    font-family: var(--font-family);
    color: var(--color-text);
    background: var(--color-background);
    line-height: 1.5;
}

/* Typography */
h1, h2, h3, h4 {
    font-weight: 600;
    line-height: 1.2;
}

h1 { font-size: var(--font-size-h1); }
h2 { font-size: var(--font-size-h2); }
h3 { font-size: var(--font-size-h3); }

a {
    color: var(--color-accent);
    text-decoration: none;
}

ul, ol {
    padding-left: 1.5em;
}

li {
    margin-bottom: var(--spacing-xs);
}
```

### css/layout.css

```css
/* Page setup for A4 */
.resume {
    width: var(--page-width);
    min-height: var(--page-height);
    margin: 0 auto;
    padding: var(--page-margin);
    background: var(--color-background);
}

/* Sections */
.section {
    margin-bottom: var(--spacing-lg);
}

.section-title {
    color: var(--color-primary);
    border-bottom: 2px solid var(--color-primary);
    padding-bottom: var(--spacing-xs);
    margin-bottom: var(--spacing-md);
}

/* Header */
.header {
    text-align: center;
    margin-bottom: var(--spacing-xl);
}

.name {
    color: var(--color-primary);
    margin-bottom: var(--spacing-xs);
}

.contact {
    display: flex;
    justify-content: center;
    gap: var(--spacing-lg);
    flex-wrap: wrap;
    color: var(--color-text-light);
    font-size: var(--font-size-small);
}
```

### css/main-content.css

```css
/* Job entries */
.job {
    margin-bottom: var(--spacing-md);
}

.job-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
}

.job-title {
    color: var(--color-secondary);
}

.job-dates {
    color: var(--color-text-light);
    font-size: var(--font-size-small);
}

.job-company {
    color: var(--color-text-light);
    font-style: italic;
    margin: var(--spacing-xs) 0;
}

.job-achievements {
    margin-top: var(--spacing-sm);
}

/* Skills */
.skills {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-sm);
}

.skill {
    background: var(--color-border);
    padding: var(--spacing-xs) var(--spacing-sm);
    border-radius: 4px;
    font-size: var(--font-size-small);
}
```

### css/print.css

```css
/* Print-specific styles */
@page {
    size: A4;
    margin: 0;
}

@media print {
    body {
        background: white;
    }
    
    .resume {
        width: 100%;
        min-height: auto;
        padding: var(--page-margin);
    }
    
    /* Hide elements not needed in PDF */
    .no-print {
        display: none !important;
    }
    
    /* Ensure colors print */
    * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
    }
    
    /* Prevent page breaks inside elements */
    .job, .education, .section {
        break-inside: avoid;
    }
    
    /* Force page breaks where needed */
    .page-break {
        break-before: page;
    }
}
```

---

## ATS Optimization

For better Applicant Tracking System compatibility:

### Do's

1. **Use semantic HTML** - Proper heading hierarchy, lists, sections
2. **Include plain text contact info** - Not just icons
3. **Use standard section titles** - Experience, Education, Skills
4. **Include keywords** - Match job descriptions
5. **Keep layout simple** - Single column works best

### Don'ts

1. **Avoid complex layouts** - Multi-column can confuse ATS
2. **Avoid images for text** - ATS can't read images
3. **Avoid special characters** - Stick to standard characters
4. **Avoid excessive styling** - ATS strips styles anyway

### Example: ATS-Friendly Contact Section

```html
<!-- Good: Both visual and parseable -->
<div class="contact">
    <span class="contact-item">
        <i class="fas fa-envelope" aria-hidden="true"></i>
        <span>john.doe@email.com</span>
    </span>
    <span class="contact-item">
        <i class="fas fa-phone" aria-hidden="true"></i>
        <span>(555) 123-4567</span>
    </span>
</div>
```

---

## Two-Column Layouts

If you want a sidebar layout:

```html
<main class="resume resume--two-column">
    <aside class="sidebar">
        <section class="section">
            <h2>Contact</h2>
            <!-- Contact info -->
        </section>
        <section class="section">
            <h2>Skills</h2>
            <!-- Skills list -->
        </section>
    </aside>
    
    <div class="main-content">
        <section class="section">
            <h2>Experience</h2>
            <!-- Experience -->
        </section>
    </div>
</main>
```

```css
.resume--two-column {
    display: grid;
    grid-template-columns: 200px 1fr;
    gap: var(--spacing-lg);
}

.sidebar {
    background: var(--color-border);
    padding: var(--spacing-md);
}
```

---

## Multi-Page Resumes

For longer resumes:

```css
/* Force page breaks */
.resume {
    /* Remove min-height for multi-page */
    min-height: auto;
}

/* Start sections on new pages if needed */
.section--new-page {
    break-before: page;
    padding-top: var(--page-margin);
}

/* Prevent orphans/widows */
p {
    orphans: 3;
    widows: 3;
}
```

---

## Using Custom Fonts

### Google Fonts

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&display=swap" rel="stylesheet">
```

### Local Fonts

Put fonts in a `fonts/` folder:

```
MyResume/
├── resume.html
├── css/
└── fonts/
    ├── myfont.woff2
    └── myfont.woff
```

```css
@font-face {
    font-family: 'MyFont';
    src: url('../fonts/myfont.woff2') format('woff2'),
         url('../fonts/myfont.woff') format('woff');
    font-weight: 400;
    font-style: normal;
    font-display: swap;
}
```

---

## Testing Your Template

### 1. Preview in Browser

```bash
./RunLinux.sh
# Open http://localhost:3000
```

### 2. Generate PDF

Click "Preview PDF" in the toolbar or:

```bash
npm run pdf -- --resume=MyResume
```

### 3. Run ATS Test

Click "ATS Test" in the toolbar or:

```bash
npm run ats -- --resume=MyResume
```

Check the extracted text to ensure all content is parseable.

### 4. Watch Mode

For live PDF regeneration during development:

```bash
npm run pdf -- --resume=MyResume --watch
```

---

## Troubleshooting Templates

### Content Cut Off

- Check print margins in `@page` rule
- Ensure content fits within page width
- Add page breaks for long content

### Fonts Not Rendering in PDF

- Use web-safe fonts or properly loaded web fonts
- Ensure fonts are loaded before PDF generation (handled automatically)
- Check font file paths are correct

### Icons Showing as Boxes

- Use web fonts (Font Awesome) instead of emoji
- Add `aria-hidden="true"` to icons
- Ensure CDN link is correct

### Colors Not Printing

- Add `print-color-adjust: exact` to CSS
- Avoid very light colors that may not print

### Layout Breaks on Print

- Test with browser print preview
- Use `break-inside: avoid` on important elements
- Simplify complex grid layouts for print

---

## Example Templates

Check the `templates/` folder for working examples:

- **example1/** - Clean, single-column layout
- **example2/** - Modern with sidebar
