import { Resend } from "resend";

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

// Sends over HTTPS (port 443) instead of raw SMTP, so it isn't affected by hosts
// (Railway, Render, etc.) that block outbound SMTP ports 25/465/587 by default.
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
// Must be on a domain verified in the Resend dashboard, or Resend rejects the send.
const EMAIL_FROM = process.env.EMAIL_FROM || "EventHub <onboarding@resend.dev>";

export const isEmailConfigured = () => Boolean(RESEND_API_KEY);

let client: Resend | null = null;

function getClient(): Resend {
  if (!client) client = new Resend(RESEND_API_KEY);
  return client;
}

/**
 * Logs whether RESEND_API_KEY is present, at boot, so a missing key shows up in the
 * deploy logs rather than mid-request. Deliberately does not call the Resend API:
 * a key scoped to "Sending access only" (recommended) can't call GET /domains, so
 * that check would misreport a correctly-scoped key as invalid. The only true test
 * of the key is an actual send.
 */
export const verifyEmailTransport = async () => {
  if (!isEmailConfigured()) {
    console.warn("[MAIL] RESEND_API_KEY not set – emails are disabled");
    return false;
  }

  console.log("[MAIL] RESEND_API_KEY is set.");
  return true;
};

// Rate limiting and transient server errors are worth a retry; a bad key, a bad
// request, or a bounced address will fail identically every time.
const RETRYABLE_ERROR_NAMES = new Set(["rate_limit_exceeded", "internal_server_error"]);

/**
 * Never throws. Email is a side effect – a Resend outage must not fail the
 * request that triggered it. Returns whether the message was accepted for delivery.
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

  const payload = {
    from: EMAIL_FROM,
    to,
    subject,
    html,
    attachments: attachments?.map((a) => ({
      filename: a.filename,
      content: a.content,
      contentId: a.cid,
    })),
  };

  const maxAttempts = 3;
  for (let i = 1; i <= maxAttempts; i++) {
    const { data, error } = await getClient().emails.send(payload);

    if (!error) {
      console.log("[MAIL] Email sent successfully.", { id: data?.id, to, subject });
      return true;
    }

    console.error(`[MAIL] Attempt ${i}/${maxAttempts} failed`, {
      name: error.name,
      message: error.message,
    });

    if (!RETRYABLE_ERROR_NAMES.has(error.name) || i === maxAttempts) {
      console.error(`[MAIL] Failed to send "${subject}" to ${to} – ${error.name}: ${error.message}`);
      return false;
    }

    const delay = i * 2000; // 2s, 4s
    console.log(`[MAIL] Retrying in ${delay} ms...`);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  return false;
};
