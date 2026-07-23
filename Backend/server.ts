import 'dotenv/config';
import http from "http";
import mongoose from "mongoose";
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
    server.keepAliveTimeout = 65000;
    server.headersTimeout = 66000;
    initSocketIO(server);
    startLifecycleScheduler();
    server.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}/`));

    const shutdown = async (signal: string) => {
      console.log(`\n${signal} received — shutting down gracefully...`);
      server.close(() => {
        mongoose.connection.close(false).then(() => {
          console.log("MongoDB connection closed");
          process.exit(0);
        });
      });
      setTimeout(() => {
        console.error("Forced shutdown after timeout");
        process.exit(1);
      }, 10000).unref();
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  })
  .catch((err: Error) => {
    console.error('Failed to connect to database:', err.message);
    process.exit(1);
  });
