// src/utils/cronjob.ts
import cron from "node-cron";
import { syncDomains } from "../services/domainSyncService";

export const startDomainSyncCron = () => {
  // Runs every 5 minutes
  cron.schedule("*/5 * * * *", async () => {
    console.log("⏳ Running domain sync job...");
    try {
      const synced = await syncDomains();
      console.log(`✅ Synced ${synced.length} domains`);
    } catch (err: any) {
      console.error("❌ Domain sync failed:", err.message || err);
    }
  });

  console.log("🔄 Domain sync cron started (runs every 5 minutes)");
};