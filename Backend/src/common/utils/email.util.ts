import nodemailer, { type Transporter } from "nodemailer"

interface EmailOptions {
  to: string
  subject: string
  html: string
}

const EMAIL_HOST = process.env.EMAIL_HOST || "smtp.gmail.com"
// 587 (STARTTLS) is far more likely to be reachable from a PaaS container than 465.
const EMAIL_PORT = Number(process.env.EMAIL_PORT) || 587
const EMAIL_DEBUG = process.env.EMAIL_DEBUG === "true"

// Gmail shows app passwords in four-character groups; those spaces are display-only
// and must be stripped before authenticating.
const getPass = () => (process.env.EMAIL_PASS || "").replace(/\s+/g, "")
const getUser = () => (process.env.EMAIL_USER || "").trim()

export const isEmailConfigured = () => Boolean(getUser() && getPass())

let transporter: Transporter | null = null

const getTransporter = () => {
  if (transporter) return transporter

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
  })

  return transporter
}

/**
 * Opens a connection and authenticates without sending anything. Call at boot to
 * surface SMTP misconfiguration in the deploy logs rather than mid-request.
 */
export const verifyEmailTransport = async () => {
  if (!isEmailConfigured()) {
    console.warn("[email] EMAIL_USER/EMAIL_PASS not set – emails are disabled")
    return false
  }

  try {
    await getTransporter().verify()
    console.log(`[email] SMTP ready via ${EMAIL_HOST}:${EMAIL_PORT}`)
    return true
  } catch (err) {
    const e = err as NodeJS.ErrnoException
    console.error(`[email] SMTP unreachable at ${EMAIL_HOST}:${EMAIL_PORT} – ${e.code || ""} ${e.message}`)
    return false
  }
}

/**
 * Never rejects. Email is a side effect – a dead SMTP host must not fail the
 * request that triggered it.
 */
export const sendEmail = async ({ to, subject, html }: EmailOptions) => {
  if (!isEmailConfigured()) {
    console.warn("Email not configured – skipping sendEmail")
    return false
  }

  try {
    await getTransporter().sendMail({
      from: `"EventHub" <${getUser()}>`,
      to,
      subject,
      html,
    })
    return true
  } catch (err) {
    const e = err as NodeJS.ErrnoException
    console.error(`[email] failed to send "${subject}" to ${to} – ${e.code || ""} ${e.message}`)
    return false
  }
}
