import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import customerRoutes from './routes/customer';
import cloudflareRoutes from './routes/cloudflare';
import MainResellerRoutes from './routes/mainreseller';
import emailRoutes from "./routes/email";
import domainRoutes from './routes/domain';
import userRoute from "./routes/User";
import statusRoutes from "./routes/statusRoutes"; 
import { startDomainSyncCron } from "./utils/cronjob";

dotenv.config();
const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI as string)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB error:', err));

// Root route
app.get('/', (_req: Request, res: Response) => {
  res.send('API is working 🚀');
});

// Routes
app.use('/api/cloudflare', cloudflareRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/mainreseller', MainResellerRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/status', statusRoutes);
app.use('/api/domains_list', domainRoutes);
app.use("/api/users", userRoute);

// Start domain sync cron
startDomainSyncCron();

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://192.168.220.44:${PORT}`);
});
