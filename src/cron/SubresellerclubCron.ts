import cron from "node-cron";
import { syncSubResellerDomains } from "../services/SubresellerclubSync";

let isRunning = false;

cron.schedule("* * * * *", async () => {

  if (isRunning) {
    console.log("⚠️ Previous sub-reseller sync still running");
    return;
  }

  isRunning = true;

  console.log("⏰ Running sub-reseller sync");

  try {
    await syncSubResellerDomains();

    console.log("✅ Sub-reseller sync completed");
  } catch (err) {
    console.error("❌ Sub-reseller sync failed", err);
  } finally {
    isRunning = false;
  }
});