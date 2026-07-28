/**
 * Diagnoses SMTP reachability from wherever it is run.
 *   local:    npx tsx scripts/smtp-check.ts
 *   railway:  railway run npx tsx scripts/smtp-check.ts
 *
 * Distinguishes the three failure modes that all look identical from the browser:
 *   ENETUNREACH / ETIMEDOUT on every port -> host blocks outbound SMTP (switch to an HTTP API)
 *   connects but EAUTH                    -> credentials/app-password problem
 *   connects and authenticates            -> SMTP is fine, look at the calling code
 */
import 'dotenv/config';
import dns from 'dns';
import net from 'net';
import nodemailer from 'nodemailer';

dns.setDefaultResultOrder('ipv4first');

const HOST = process.env.EMAIL_HOST || 'smtp.gmail.com';
const USER = (process.env.EMAIL_USER || '').trim();
const PASS = (process.env.EMAIL_PASS || '').replace(/\s+/g, '');

const probe = (host: string, port: number) =>
  new Promise<string>((resolve) => {
    const socket = net.connect({ host, port, family: 4 });
    const done = (msg: string) => {
      socket.destroy();
      resolve(msg);
    };
    socket.setTimeout(10_000);
    socket.on('connect', () => done('OPEN'));
    socket.on('timeout', () => done('TIMEOUT (port filtered)'));
    socket.on('error', (e: NodeJS.ErrnoException) => done(`${e.code || 'ERROR'} – ${e.message}`));
  });

const main = async () => {
  console.log(`user: ${USER || '(unset)'}  pass: ${PASS ? `${PASS.length} chars` : '(unset)'}`);

  const a = await dns.promises.resolve4(HOST).catch((e) => `failed: ${e.code}`);
  const aaaa = await dns.promises.resolve6(HOST).catch((e) => `failed: ${e.code}`);
  console.log(`\nDNS ${HOST}\n  A    ${JSON.stringify(a)}\n  AAAA ${JSON.stringify(aaaa)}`);

  console.log('\nTCP reachability (IPv4)');
  for (const port of [587, 465, 25, 2525]) {
    console.log(`  ${HOST}:${port.toString().padEnd(5)} ${await probe(HOST, port)}`);
  }

  if (!USER || !PASS) return console.log('\nCredentials unset – skipping auth check.');

  for (const port of [587, 465]) {
    const transport = nodemailer.createTransport({
      host: HOST,
      port,
      secure: port === 465,
      auth: { user: USER, pass: PASS },
      connectionTimeout: 15_000,
      greetingTimeout: 15_000,
    });
    try {
      await transport.verify();
      console.log(`\nAUTH OK on ${port} – SMTP works from here.`);
      return;
    } catch (err) {
      const e = err as NodeJS.ErrnoException;
      console.log(`\nAUTH FAILED on ${port}: ${e.code || ''} ${e.message}`);
    }
  }
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
