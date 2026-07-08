import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

let transporter: Transporter | null = null;

const getTransporter = (): Transporter | null => {
  if (!process.env.SMTP_HOST) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });
  }
  return transporter;
};

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async ({ to, subject, html }: EmailOptions): Promise<void> => {
  const t = getTransporter();
  if (!t) return;
  try {
    await t.sendMail({
      from: process.env.SMTP_FROM || 'noreply@eventplatform.dev',
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error('Email delivery failed:', (err as Error).message);
  }
};
