import cron from "node-cron";
import { syncCloudflareDomains } from "../services/cloudflareSync";

cron.schedule("*/5 * * * *", async () => {
  console.log("⏱ Clouflare auto sync running...");
  await syncCloudflareDomains();
});
