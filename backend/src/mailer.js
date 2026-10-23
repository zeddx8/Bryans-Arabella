import nodemailer from 'nodemailer';

let transport;
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const toHtml = (text) =>
  `<div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;color:#1b1820;line-height:1.6">` +
  esc(text).replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" style="color:#6e1f3a">$1</a>').replace(/\n/g, '<br>') +
  `</div>`;

// Never throws: a failed email must not break signing up or placing an order.
export async function sendMail(to, subject, text) {
  if (!process.env.SMTP_HOST) {
    console.log(`\n[email not sent: SMTP is not set up in .env]\nTo: ${to}\nSubject: ${subject}\n\n${text}\n`);
    return false;
  }
  try {
    const port = Number(process.env.SMTP_PORT || 465);
    transport ??= nodemailer.createTransport({
      host: process.env.SMTP_HOST, port, secure: port === 465,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });
    await transport.sendMail({ from: process.env.MAIL_FROM || process.env.SMTP_USER, to, subject, text, html: toHtml(text) });
    return true;
  } catch (e) {
    console.error('Email failed:', e.message);
    return false;
  }
}
