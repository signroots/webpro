import cron from "node-cron";
import { syncSubResellerDomains } from "../services/SubresellerclubSync";

cron.schedule("*/5 * * * *", async () => {
  // console.log("⏱ ResellerClub auto sync running...");
  // await syncSubResellerDomains();
});
