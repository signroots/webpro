import cron from "node-cron";
import { importMainResellerClubDomains } from "../routes/mainreseller";

let isRunning = false;

cron.schedule("* * * * *", async () => {

  if (isRunning) {
    console.log("⚠️ Previous sync still running");
    return;
  }

  isRunning = true;

  console.log("⏰ Running ResellerClub 1 minute sync");

  try {
    await importMainResellerClubDomains();
    console.log("✅ Sync completed");
  } catch (err) {
    console.error("❌ Sync failed", err);
  } finally {
    isRunning = false;
  }
});