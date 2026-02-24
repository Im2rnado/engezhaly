const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const LOGO_URL = `${FRONTEND_URL}/logos/logo-green.png`;

/**
 * Wraps email content in a responsive HTML template with Engezhaly branding
 */
function wrapEmail(content, options = {}) {
    const { preheader } = options;
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Engezhaly</title>
    ${preheader ? `<style type="text/css">.preheader { display: none !important; }</style>` : ''}
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5; -webkit-font-smoothing: antialiased;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f4f4f5;">
        <tr>
            <td style="padding: 24px 16px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
                    <tr>
                        <td style="padding: 32px 32px 24px; text-align: center; border-bottom: 1px solid #e5e7eb;">
                            <a href="${FRONTEND_URL}" style="display: inline-block;">
                                <img src="${LOGO_URL}" alt="Engezhaly" width="140" height="32" style="height: 32px; width: auto; display: block;" />
                            </a>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 32px;">
                            ${content}
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 24px 32px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
                            &copy; ${new Date().getFullYear()} Engezhaly. All rights reserved.
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
}

/**
 * Renders a CTA button
 */
function ctaButton(text, url) {
    return `
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 24px;">
    <tr>
        <td align="center">
            <a href="${url}" style="display: inline-block; background-color: #09BF44; color: #ffffff !important; font-weight: 700; font-size: 16px; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">${text}</a>
        </td>
    </tr>
</table>`;
}

module.exports = { wrapEmail, ctaButton, FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000' };
