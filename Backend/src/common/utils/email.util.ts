import nodemailer from "nodemailer";

interface Attachment {
  filename: string;
  content: Buffer;
  cid: string;
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: Attachment[];
}

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
  return transporter;
}

async function attempt<T>(attempts: number, fn: () => Promise<T>): Promise<T> {
  let lastError: unknown;

  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;

      console.error(`[MAIL] Attempt ${i}/${attempts} failed`, {
        message: err.message,
        code: err.code,
        response: err.response,
        responseCode: err.responseCode,
        command: err.command,
      });

      if (i < attempts) {
        const delay = i * 2000; // 2s, 4s, 6s...
        console.log(`[MAIL] Retrying in ${delay} ms...`);

        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

export const sendEmail = async ({
  to,
  subject,
  html,
  attachments,
}: EmailOptions) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error("EMAIL_USER or EMAIL_PASS is not configured.");
  }

  const transporter = getTransporter();

  // Verify SMTP connection before sending
  await transporter.verify();
  console.log("[MAIL] SMTP connection verified.");

  const mailOptions: nodemailer.SendMailOptions = {
    from: `"Event Management" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
    attachments:
      attachments?.map((a) => ({
        filename: a.filename,
        content: a.content,
        cid: a.cid,
      })) ?? [],
  };

  const info = await attempt(3, () => transporter.sendMail(mailOptions));

  console.log("[MAIL] Email sent successfully.", {
    messageId: info.messageId,
    accepted: info.accepted,
    rejected: info.rejected,
    response: info.response,
  });

  return info;
};
