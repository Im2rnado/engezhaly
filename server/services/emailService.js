/**
 * @deprecated Use mailgunService and emailTemplates directly.
 * Kept for backward compatibility - re-exports from mailgunService.
 */
const { sendEmail, sendAndLog } = require('./mailgunService');
module.exports = { sendEmail, sendAndLog };
