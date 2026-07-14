import express from "express";
import cors from "cors";

import authRoutes from "./src/modules/auth/auth.routes.js";
import userRoutes from "./src/modules/users/user.routes.js";
import eventRoutes from "./src/modules/events/event.routes.js";
import registrationRoutes from "./src/modules/registrations/registration.routes.js";
import attendanceRoutes from "./src/modules/attendance/attendance.routes.js";
import certificateRoutes from "./src/modules/certificates/certificate.routes.js";
import feedbackRoutes from "./src/modules/feedback/feedback.routes.js";
import notificationRoutes from "./src/modules/notifications/notification.routes.js";
import analyticsRoutes from "./src/modules/analytics/analytics.routes.js";
import organizerRoutes from "./src/modules/organizer/organizer.routes.js";
import adminRoutes from "./src/modules/admin/admin.routes.js";
import paymentRoutes from "./src/modules/payments/payment.routes.js";
import loggingMiddleware from "./src/common/middleware/logging.middleware.js";
import errorMiddleware from "./src/common/middleware/error.middleware.js";
import type { Request, Response } from "express";

const app = express();

app.use(cors());
app.use(express.json());
app.use(loggingMiddleware);

app.get("/api/health", (req: Request, res: Response) =>
  res.json({ success: true, message: "OK" }),
);

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/registrations", registrationRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/certificates", certificateRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/organizer", organizerRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/payments", paymentRoutes);

app.use((req: Request, res: Response) =>
  res
    .status(404)
    .json({ success: false, message: "Route not found", errors: [] }),
);
app.use(errorMiddleware);

export default app;
