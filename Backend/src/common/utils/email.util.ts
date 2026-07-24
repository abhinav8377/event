import nodemailer from "nodemailer";
import { google } from "googleapis";

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

const OAUTH_PLAYGROUND = "https://developers.google.com/oauthplayground";

let transporter: nodemailer.Transporter | null = null;

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not configured.`);
  }
  return value;
}

async function getTransporter(): Promise<nodemailer.Transporter> {
  if (transporter) {
    return transporter;
  }

  const user = getRequiredEnv("EMAIL_USER");
  const clientId = getRequiredEnv("GMAIL_CLIENT_ID");
  const clientSecret = getRequiredEnv("GMAIL_CLIENT_SECRET");
  const refreshToken = getRequiredEnv("GMAIL_REFRESH_TOKEN");

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    OAUTH_PLAYGROUND,
  );

  oauth2Client.setCredentials({ refresh_token: refreshToken });

  const { token: accessToken } = await oauth2Client.getAccessToken();

  if (!accessToken) {
    throw new Error("Failed to retrieve Gmail OAuth2 access token.");
  }

  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user,
      clientId,
      clientSecret,
      refreshToken,
      accessToken,
    },
  });

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

      // Force re-authentication on the next attempt in case the access
      // token expired or the transporter is otherwise stale.
      transporter = null;

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
  if (!process.env.EMAIL_USER) {
    throw new Error("EMAIL_USER is not configured.");
  }

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

  const info = await attempt(3, async () => {
    const activeTransporter = await getTransporter();
    return activeTransporter.sendMail(mailOptions);
  });

  console.log("[MAIL] Email sent successfully.", {
    messageId: info.messageId,
    accepted: info.accepted,
    rejected: info.rejected,
    response: info.response,
  });

  return info;
};
