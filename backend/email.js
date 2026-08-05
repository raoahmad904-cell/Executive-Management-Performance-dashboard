const nodemailer = require('nodemailer');

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || SMTP_USER;
const SUPPORT_NAME = process.env.SUPPORT_NAME || 'Support';

let transporter;
if (SMTP_HOST && SMTP_PORT && (SMTP_USER || SMTP_PASS)) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT, 10),
    secure: parseInt(SMTP_PORT, 10) === 465,
    auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  });
} else {
  console.warn('Email transporter not configured: missing SMTP environment variables');
}

async function sendMail({ to, subject, text, html }) {
  if (!transporter) {
    console.warn('Skipping sending mail because transporter is not configured');
    return;
  }
  const mailOptions = {
    from: `${SUPPORT_NAME} <${SUPPORT_EMAIL}>`,
    to,
    subject,
    text,
    html,
  };
  return transporter.sendMail(mailOptions);
}

module.exports = { sendMail };
