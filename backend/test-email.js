const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });
const emailer = require('./email');

(async () => {
  try {
    const to = process.env.SMTP_USER || process.env.SUPPORT_EMAIL;
    if (!to) throw new Error('No recipient configured (SMTP_USER or SUPPORT_EMAIL)');
    await emailer.sendMail({
      to,
      subject: 'Test: Performance Dashboard email setup',
      text: 'This is a test email sent from Performance Dashboard to verify SMTP configuration.',
      html: '<p>This is a test email sent from Performance Dashboard to verify SMTP configuration.</p>',
    });
    console.log('Test email sent to', to);
    process.exit(0);
  } catch (err) {
    console.error('Failed to send test email:', err);
    process.exit(1);
  }
})();
