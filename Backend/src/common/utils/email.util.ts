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

export const sendEmail = async ({ to, subject, html, attachments }: EmailOptions) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("Email not configured – skipping sendEmail")
    return
  }

  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  })

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

  await transporter.sendMail(mailOptions)
}
