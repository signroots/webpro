// import cron from 'node-cron';
// import axios from 'axios';

// const endpoints = [
//   { name: 'Cloudflare', url: 'http://localhost:5000/api/cloudflare/import-from-cloudflare' },
//   { name: 'Reseller', url: 'http://localhost:5000/api/reseller/import-from-reseller' },
//   { name: 'Main Reseller', url: 'http://localhost:5000/api/mainreseller/import-from-mainreseller' },
// ];

// export function startDomainSyncJob() {
//   cron.schedule('*/10 * * * *', async () => {
//     console.log('⏱️ Running scheduled domain syncs...');

//     for (const { name, url } of endpoints) {
//       try {
//         const res = await axios.get(url);
//         console.log(`✅ Synced with ${name}:`, res.data.message || 'Success');
//       } catch (err: any) {
//         console.error(`❌ ${name} import failed:`, err.message);
//       }
//     }
//   });

//   console.log('🚀 Domain sync cron job started (every 10 min)');
// }

// src/cronJobs.ts
import cron from "node-cron";
import { syncDomains } from "../services/domainSyncService";

// Run sync every 10 minutes
export const startDomainSyncCron = () => {
  cron.schedule("*/10 * * * *", async () => {
    console.log("⏳ Running scheduled domain sync...");
    try {
      const synced = await syncDomains();
      console.log(`✅ Synced ${synced.length} domains at ${new Date().toLocaleString()}`);
    } catch (err) {
      console.error("❌ Error during scheduled domain sync:", err);
    }
  });

  console.log("🚀 Domain sync cron job started (every 10 min)");
};
