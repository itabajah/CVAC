/**
 * Loading page HTML template
 * Shown while PDF is generating or ATS test is running
 */

const { FAVICON_LINK, getPageTitle, escapeHtml } = require('./shared');

/**
 * Generate loading page HTML
 * @param {string} title - Page title
 * @param {string} message - Loading message
 * @param {string} redirectUrl - URL to redirect to (must be a safe relative path)
 */
function getLoadingPage(title, message, redirectUrl) {
    // Security: Escape HTML to prevent XSS
    const safeTitle = escapeHtml(title);
    const safeMessage = escapeHtml(message);
    
    // Security: Validate redirect URL is a safe relative path
    if (!redirectUrl.startsWith('/') || redirectUrl.includes("'") || redirectUrl.includes('"')) {
        throw new Error('Invalid redirect URL');
    }
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>${getPageTitle(safeTitle)}</title>
    ${FAVICON_LINK}
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #f5f5f5;
            color: #1e3a5f;
            margin: 0;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container { text-align: center; }
        .spinner {
            width: 60px;
            height: 60px;
            border: 5px solid rgba(30,58,95,0.2);
            border-top-color: #1e3a5f;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 25px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        h1 { font-weight: 400; font-size: 24px; margin: 0 0 10px; }
        p { opacity: 0.7; margin: 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="spinner"></div>
        <h1>${safeTitle}</h1>
        <p>${safeMessage}</p>
    </div>
    <script>
        setTimeout(() => { window.location.href = '${redirectUrl}'; }, 100);
    </script>
</body>
</html>`;
}

module.exports = { getLoadingPage };
