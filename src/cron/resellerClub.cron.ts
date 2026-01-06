import cron from "node-cron";
import { syncResellerClubDomains } from "../services/resellerClubSync.service";

cron.schedule("*/5 * * * *", async () => {
  // console.log("⏱ Running ResellerClub auto-sync...");
  // await syncResellerClubDomains();
});
