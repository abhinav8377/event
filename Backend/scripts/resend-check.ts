/**
 * Verifies the Resend API key works and, if an address is passed, sends a test email.
 *   local:    npx tsx scripts/resend-check.ts you@example.com
 *   railway:  railway run npx tsx scripts/resend-check.ts you@example.com
 */
import 'dotenv/config';
import { sendEmail, verifyEmailTransport } from '../src/common/utils/email.util.js';

const main = async () => {
  const ok = await verifyEmailTransport();
  if (!ok) process.exit(1);

  const to = process.argv[2];
  if (!to) {
    console.log('\nPass an email address as an argument to send a test message.');
    return;
  }

  const sent = await sendEmail({
    to,
    subject: 'EventHub – Resend test',
    html: '<p>This confirms Resend is delivering from this environment.</p>',
  });

  console.log(sent ? `\nSent to ${to}.` : '\nSend failed – see [MAIL] logs above.');
  process.exit(sent ? 0 : 1);
};

main();
