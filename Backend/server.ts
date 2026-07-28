import 'dotenv/config';
import http from "http";
import app from './app.js';
import connectDB from './src/common/config/db.js';
import { initSocketIO } from './src/socket.js';
import { verifyEmailTransport } from './src/common/utils/email.util.js';
import dns from "dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);
// Container hosts (Railway/Render/Fly) usually have no IPv6 route, so an AAAA
// record that is tried first fails with ENETUNREACH. Prefer A records everywhere.
dns.setDefaultResultOrder("ipv4first");
const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    const server = http.createServer(app);
    initSocketIO(server);
    server.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}/`));
    // Non-blocking: reports SMTP reachability in the deploy logs at startup.
    void verifyEmailTransport();
  })
  .catch((err: Error) => {
    console.error('Failed to connect to database:', err.message);
    process.exit(1);
  });
