import cron from "node-cron";
import { syncDomains } from "../services/domainSyncService";

export const startDomainSyncCron = () => {
  cron.schedule("*/5 * * * *", async () => {
    console.log("⏳ Running domain sync...");
    try {
      await syncDomains();
      console.log("✅ Domain sync finished");
    } catch (err) {
      console.error("❌ Domain sync failed", err);
    }
  });

  console.log("🔄 Domain cron started (every 5 minutes)");
};
