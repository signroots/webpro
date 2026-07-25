// src/server.ts

import express, { Request, Response } from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";

import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";

// Routes
import categoryRoutes from "./routes/category";
import customerRoutes from "./routes/customer";
import cloudflareRoutes from "./routes/cloudflare";
import MainResellerRoutes from "./routes/mainreseller";
import emailRoutes from "./routes/email";
import domainRoutes from "./routes/domain";
import userRoute from "./routes/User";
import statusRoutes from "./routes/statusRoutes";
import ResellerRoute from "./routes/reseller";
import ordersRouter from "./routes/orders";
import settingsRouter from "./routes/settings";
import clientRoutes from "./routes/client";
import typeEmail from "./routes/typeEmail";
import planRoutes from "./routes/planroute";
import hostTypeRoutes from "./routes/hostroute";
import hostSubTypeRoutes from "./routes/hostSubTyperoute";
import dashboard from "./routes/dashboard";
import storageRoutes from "./routes/storageroute";
import hostinger from "./routes/hostinger";

import { exportOrders } from "./controllers/export.controller";

// Cron
import { startDomainSyncCron } from "./utils/cronjob";
import "./cron/cloudflareCron";
import "./cron/SubresellerclubCron";


dotenv.config();

const app = express();

const PORT = process.env.PORT ? Number(process.env.PORT) : 5000;


// Swagger YAML Load
const swaggerDocument = YAML.load(
  path.join(__dirname, "./openapi.yaml")
);

// Middleware
const allowedOrigins = [
  "http://localhost:5174",
  "http://localhost:5173",
  "https://signroots.app",
  "http://192.168.220.39:5173",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
app.use(express.json());


// Swagger Documentation
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument)
);


// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI as string)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err));


// Root route
app.get("/", (_req: Request, res: Response) => {
  res.send("API is working 🚀");
});


// API Routes

app.use("/api/cloudflare", cloudflareRoutes);

app.use("/api/hostinger", hostinger);

app.use("/api/customers", customerRoutes);

app.use("/api/mainreseller", MainResellerRoutes);

app.use("/api/reseller", ResellerRoute);

app.use("/api/emails", emailRoutes);

app.use("/api/status", statusRoutes);

app.use("/api/domains_list", domainRoutes);

app.use("/api/users", userRoute);

app.use("/api/orders", ordersRouter);

app.use("/api/settings", settingsRouter);

app.use("/api/categories", categoryRoutes);

app.use("/api/client", clientRoutes);

app.use("/api/typeemail", typeEmail);

app.use("/api/plans", planRoutes);

app.use("/api/hosttypes", hostTypeRoutes);

app.use("/api/hostsubtype", hostSubTypeRoutes);

app.use("/api/storage", storageRoutes);

app.use("/api/dashboard", dashboard);

app.use("/api/export", exportOrders);


// Static uploads
app.use(
  "/uploads",
  express.static(path.join(__dirname, "../uploads"))
);


// Start cron
startDomainSyncCron();


// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `🚀 Server running on http://192.168.220.35:${PORT}`
  );

  console.log(
    `📚 Swagger Docs: http://localhost:${PORT}/api-docs`
  );
});