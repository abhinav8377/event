import 'dotenv/config';
import http from "http";
import app from './app.js';
import connectDB from './src/common/config/db.js';
import { initSocketIO } from './src/socket.js';
import { startLifecycleScheduler } from './src/modules/events/event.lifecycle.js';
import dns from "dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);
const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    const server = http.createServer(app);
    initSocketIO(server);
    startLifecycleScheduler();
    server.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}/`));
  })
  .catch((err: Error) => {
    console.error('Failed to connect to database:', err.message);
    process.exit(1);
  });
