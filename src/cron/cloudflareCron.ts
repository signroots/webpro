import cron from "node-cron";
import { syncCloudflareDomains }
  from "../services/cloudflareSync";

let isRunning = false;

cron.schedule("* * * * *", async () => {

  if (isRunning) {
    console.log(
      "⚠️ Previous Cloudflare sync still running"
    );
    return;
  }

  isRunning = true;

  console.log("⏰ Running Cloudflare auto sync");

  try {

    await syncCloudflareDomains();

    console.log(
      "✅ Cloudflare auto sync completed"
    );

  } catch (err) {

    console.error(
      "❌ Cloudflare sync failed",
      err
    );

  } finally {

    isRunning = false;

  }
});