import cron from "node-cron";
import { importMainResellerClubDomains } from "../routes/mainreseller";

let isRunning = false;

export const startDomainSyncCron = () => {

  // Every 1 minute
  cron.schedule("* * * * *", async () => {

    // Prevent overlapping jobs
    if (isRunning) {
      console.log("⚠️ Previous sync still running...");
      return;
    }

    isRunning = true;

    console.log("⏳ Running domain sync...");

    try {

      await importMainResellerClubDomains();

      console.log("✅ Domain sync finished");

    } catch (err) {

      console.error("❌ Domain sync failed", err);

    } finally {

      isRunning = false;

    }
  });

  console.log("🔄 Domain cron started (every 1 minute)");
};