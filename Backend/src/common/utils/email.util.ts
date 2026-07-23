import nodemailer from "nodemailer"

interface Attachment {
  filename: string
  content: Buffer
  cid: string
}

interface EmailOptions {
  to: string
  subject: string
  html: string
  attachments?: Attachment[]
}

let transporter: nodemailer.Transporter | null = null

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    })
  }
  return transporter
}

async function attempt(attempts: number, fn: () => Promise<void>): Promise<void> {
  for (let i = 0; i < attempts; i++) {
    try {
      await fn()
      return
    } catch (err) {
      const isLast = i === attempts - 1
      console.error(`Email send attempt ${i + 1}/${attempts} failed${isLast ? " — giving up" : ", retrying..."}`, (err as Error).message)
      if (!isLast) await new Promise((r) => setTimeout(r, (i + 1) * 2000))
      else throw err
    }
  }
}

export const sendEmail = async ({ to, subject, html, attachments }: EmailOptions) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("Email not configured – skipping sendEmail")
    return
  }

  const mailOptions: nodemailer.SendMailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    html,
  }

  if (attachments && attachments.length > 0) {
    mailOptions.attachments = attachments.map((a) => ({
      filename: a.filename,
      content: a.content,
      cid: a.cid,
    }))
  }

  await attempt(3, () => getTransporter().sendMail(mailOptions))
}
