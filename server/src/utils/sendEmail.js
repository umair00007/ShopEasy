import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

// If SMTP_* variables are set, send a real email. Otherwise (local dev) print it to the
// server console so you can click the link without setting up an email provider.
export async function sendEmail({ to, subject, text }) {
  if (!env.SMTP_HOST) {
    console.log(`\n📧 [DEV email, SMTP not configured]\nTo: ${to}\nSubject: ${subject}\n${text}\n`);
    return;
  }
  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });
  await transporter.sendMail({ from: env.EMAIL_FROM, to, subject, text });
}
