import nodemailer, { type Transporter } from "nodemailer";

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

const EMAIL_HOST = process.env.EMAIL_HOST || "smtp.gmail.com";
// 587 (STARTTLS) is far more likely to be reachable from a PaaS container than 465.
const EMAIL_PORT = Number(process.env.EMAIL_PORT) || 587;
const EMAIL_DEBUG = process.env.EMAIL_DEBUG === "true";

// Gmail shows app passwords in four-character groups; those spaces are display-only
// and must be stripped before authenticating.
const getPass = () => (process.env.EMAIL_PASS || "").replace(/\s+/g, "");
const getUser = () => (process.env.EMAIL_USER || "").trim();

export const isEmailConfigured = () => Boolean(getUser() && getPass());

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: EMAIL_HOST,
      port: EMAIL_PORT,
      secure: EMAIL_PORT === 465,
      auth: { user: getUser(), pass: getPass() },
      pool: true,
      maxConnections: 2,
      // Fail fast instead of hanging an HTTP request for the full OS TCP timeout.
      connectionTimeout: 15_000,
      greetingTimeout: 15_000,
      socketTimeout: 30_000,
      logger: EMAIL_DEBUG,
      debug: EMAIL_DEBUG,
    });
  }
  return transporter;
}

/**
 * Opens a connection and authenticates without sending anything. Call at boot to
 * surface SMTP misconfiguration in the deploy logs rather than mid-request.
 */
export const verifyEmailTransport = async () => {
  if (!isEmailConfigured()) {
    console.warn("[MAIL] EMAIL_USER/EMAIL_PASS not set – emails are disabled");
    return false;
  }

  try {
    await getTransporter().verify();
    console.log(`[MAIL] SMTP ready via ${EMAIL_HOST}:${EMAIL_PORT}`);
    return true;
  } catch (err: any) {
    console.error(
      `[MAIL] SMTP unreachable at ${EMAIL_HOST}:${EMAIL_PORT} – ${err.code || ""} ${err.message}`,
    );
    return false;
  }
};

// Retrying these only burns wall-clock time: the network has no route, the port is
// closed, the host does not resolve, or the credentials are wrong. A blocked egress
// would otherwise stall a request for the full timeout on every attempt.
const PERMANENT_CODES = new Set([
  "ENETUNREACH",
  "EHOSTUNREACH",
  "ECONNREFUSED",
  "ENOTFOUND",
  "EDNS",
  "EAUTH",
]);

const isPermanent = (err: any) =>
  PERMANENT_CODES.has(err?.code) || (err?.responseCode >= 500 && err?.responseCode < 600);

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

      if (isPermanent(err)) {
        console.error("[MAIL] Error is not retryable – giving up.");
        break;
      }

      if (i < attempts) {
        const delay = i * 2000; // 2s, 4s, 6s...
        console.log(`[MAIL] Retrying in ${delay} ms...`);

        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Never rejects. Email is a side effect – a dead SMTP host must not fail the
 * request that triggered it. Returns whether the message was handed to the server.
 */
export const sendEmail = async ({
  to,
  subject,
  html,
  attachments,
}: EmailOptions): Promise<boolean> => {
  if (!isEmailConfigured()) {
    console.warn("[MAIL] Email not configured – skipping sendEmail");
    return false;
  }

  const mailOptions: nodemailer.SendMailOptions = {
    from: `"EventHub" <${getUser()}>`,
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

  try {
    const info = await attempt(3, () => getTransporter().sendMail(mailOptions));

    console.log("[MAIL] Email sent successfully.", {
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
      response: info.response,
    });

    return true;
  } catch (err: any) {
    console.error(
      `[MAIL] Failed to send "${subject}" to ${to} – ${err.code || ""} ${err.message}`,
    );
    return false;
  }
};
