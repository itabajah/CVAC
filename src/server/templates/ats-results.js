/**
 * ATS Results page HTML template
 * Displays formatted output from the ATS compatibility test
 */

const { FAVICON_LINK, getPageTitle, escapeHtml } = require('./shared');

/**
 * Generate ATS results page HTML
 */
function getAtsResultsPage(resumeName, output) {
    // Security: Escape resume name to prevent XSS
    const safeResumeName = escapeHtml(resumeName);
    
    // Format output with color highlighting and preserve structure
    const formattedOutput = output
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\[OK\]/g, '<span class="status status--ok">[OK]</span>')
        .replace(/\[WARN\]/g, '<span class="status status--warn">[WARN]</span>')
        .replace(/\[INFO\]/g, '<span class="status status--info">[INFO]</span>')
        .replace(/\[ERROR\]/g, '<span class="status status--error">[ERROR]</span>')
        .replace(/\[SUCCESS\]/g, '<span class="status status--ok">[SUCCESS]</span>')
        .replace(/={60}/g, '<span class="separator">────────────────────────────────────────────────────────────</span>')
        .replace(/--- Page (\d+) ---/g, '<span class="page-break">── Page $1 ──</span>');
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${getPageTitle(`ATS Results - ${safeResumeName}`)}</title>
    ${FAVICON_LINK}
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        * {
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f5f5f5;
            color: #374151;
            padding: 0;
            margin: 0;
            min-height: 100vh;
        }
        .container {
            max-width: 900px;
            margin: 0 auto;
            padding: 32px 24px;
        }
        .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 24px;
            padding-bottom: 16px;
            border-bottom: 1px solid #e5e7eb;
        }
        h1 {
            color: #1e3a5f;
            font-size: 20px;
            font-weight: 600;
            margin: 0;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        h1 i {
            color: #6b7280;
            font-size: 18px;
        }
        .results-box {
            background: #fff;
            padding: 24px;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }
        pre {
            margin: 0;
            line-height: 1.7;
            font-size: 13px;
            font-family: 'SF Mono', 'Consolas', 'Monaco', monospace;
            white-space: pre-wrap;
            word-wrap: break-word;
            color: #4b5563;
        }
        .status {
            font-weight: 600;
            padding: 1px 6px;
            border-radius: 3px;
            font-size: 12px;
        }
        .status--ok { 
            color: #166534; 
            background: #f0fdf4;
        }
        .status--warn { 
            color: #92400e; 
            background: #fffbeb;
        }
        .status--info { 
            color: #0369a1; 
            background: #f0f9ff;
        }
        .status--error { 
            color: #991b1b; 
            background: #fef2f2;
        }
        .separator { 
            color: #9ca3af; 
            display: block;
            margin: 12px 0;
        }
        .page-break {
            display: block;
            text-align: center;
            color: #6b7280;
            background: #f9fafb;
            padding: 8px;
            margin: 16px 0;
            border-radius: 4px;
            font-weight: 500;
            font-size: 12px;
            border: 1px solid #e5e7eb;
        }
        .back-btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 10px 16px;
            background: #fff;
            color: #374151;
            text-decoration: none;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 500;
            border: 1px solid #d1d5db;
            transition: background 0.15s ease, border-color 0.15s ease;
        }
        .back-btn:hover {
            background: #f9fafb;
            border-color: #9ca3af;
        }
        .back-btn i {
            font-size: 12px;
            color: #6b7280;
        }
        .extracted-text {
            background: #f9fafb;
            border-left: 3px solid #1e3a5f;
            padding: 16px 20px;
            margin: 16px 0;
            border-radius: 0 6px 6px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1><i class="fas fa-microscope"></i> ATS Test: ${safeResumeName}</h1>
            <button onclick="window.close()" class="back-btn"><i class="fas fa-times"></i> Close</button>
        </div>
        <div class="results-box">
            <pre>${formattedOutput}</pre>
        </div>
    </div>
</body>
</html>`;
}

module.exports = { getAtsResultsPage };
