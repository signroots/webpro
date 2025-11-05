import express from "express";
import axios from "axios";
import dotenv from "dotenv";
// import Domain from "../models/Domain";
import Order from "../models/Order";
import Customer from "../models/Customer";
// import Email from "../models/email";  

import { Request, Response } from "express";

dotenv.config();
const router = express.Router();

// Main route to import Cloudflare domains
router.get(
  "/import-from-cloudflare",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const CLOUDFLARE_TOKEN = process.env.CLOUDFLARE_TOKEN;
      const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
      const CLOUDFLARE_GLOBAL_KEY = process.env.CLOUDFLARE_API_KEY;
      const CLOUDFLARE_EMAIL_ID = process.env.CLOUDFLARE_EMAIL;

      if (!CLOUDFLARE_TOKEN || !CLOUDFLARE_ACCOUNT_ID) {
        res
          .status(400)
          .json({
            error: "Missing CLOUDFLARE_TOKEN or CLOUDFLARE_ACCOUNT_ID in env",
          });
        return;
      }

      // ✅ Step 1: Fetch Registrar Domains with full pagination
      let registrarPage = 0;
      const registrarPerPage = 50;
      const registrarDomainMap: Record<string, any> = {};
      let registrarFetched = 0;
      let registrarTotal = 0;

      do {
        const registrarResponse = await axios.get(
          `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/registrar/domains`,
          {
            headers: {
              "X-Auth-Email": CLOUDFLARE_EMAIL_ID,
              "X-Auth-Key": CLOUDFLARE_GLOBAL_KEY,
              "Content-Type": "application/json",
            },
            params: {
              page: registrarPage,
              per_page: registrarPerPage,
            },
          }
        );

        const { result, result_info } = registrarResponse.data;

        registrarTotal = result_info.total_count || registrarTotal;
        registrarFetched += result.length;

        console.log(
          `📄 Registrar Page ${registrarPage} → ${result.length} domains`
        );

        result.forEach((domain: any) => {
          registrarDomainMap[domain.name] = domain;
          console.log("📌 Registrar Domain:", domain.name);
        });

        registrarPage++;
      } while (registrarFetched < registrarTotal);

      console.log(
        `✅ Total Registrar Domains fetched: ${
          Object.keys(registrarDomainMap).length
        } / ${registrarTotal}`
      );

      // ✅ Step 2: Create/find default customer
      const defaultCustomer = await Customer.findOneAndUpdate(
        { email: "cloudflare@signroots.com" },
        { name: "Cloudflare Client", phone: "0000000000" },
        { upsert: true, new: true }
      );

      // ✅ Step 3: Fetch and store all Cloudflare zones with pagination
      let page = 1;
      let totalPages = 1;
      const allDomains: any[] = [];

      do {
        const response = await axios.get(
          "https://api.cloudflare.com/client/v4/zones",
          {
            headers: {
              Authorization: `Bearer ${CLOUDFLARE_TOKEN}`,
              "Content-Type": "application/json",
            },
            params: {
              page,
              per_page: 50,
            },
          }
        );

        const { result, result_info } = response.data;
        totalPages = result_info.total_pages || 1;

        console.log(
          `🌐 Zones Page ${page}/${totalPages} → ${result.length} zones`
        );

        // ✅ Use Promise.all to resolve async operations inside .map()
        const bulkOps = await Promise.all(
          result.map(async (zone: any) => {
            allDomains.push(zone);

            const registrarInfo = registrarDomainMap[zone.name];
            const expiryDate = registrarInfo?.expires_at
              ? new Date(registrarInfo.expires_at)
              : null;

            const cloudflareRegistered = !!registrarInfo;

           

            return {
              updateOne: {
                filter: { domainName: zone.name },
                update: {
                  $set: {
                    domainName: zone.name,
                    status: zone.status,
                    nameServers: zone.name_servers,
                    registrationDate: new Date(zone.created_on),
                    originalRegistrar: zone.original_registrar,
                    is_dns: zone.original_dnshost,
                    expiryDate,
                    managedBy: "Signroots",
                    lockStatus: zone.paused ? "Locked" : "Unlocked",
                    customer: defaultCustomer._id,
                    domainSource: "Cloudflare",
                    dnsDetails: [],
                    cloudflareRegistered,
                  },
                },
                upsert: true,
              },
            };
          })
        );

        const registeredCount = bulkOps.filter(
          (op: any) => op.updateOne.update.$set.cloudflareRegistered
        ).length;
        console.log(
          `✅ Total Cloudflare Registered Domains (Page ${page}):`,
          registeredCount
        );

        if (bulkOps.length > 0) {
          await Order.bulkWrite(bulkOps);
        }

        page++;
      } while (page <= totalPages);

      res.status(200).json({
        message: "✅ All Cloudflare domains imported successfully",
        totalZones: allDomains.length,
        totalRegistrarDomains: Object.keys(registrarDomainMap).length,
        domainNames: allDomains.map((zone: any) => zone.name),
      });
    } catch (error: any) {
      console.error("❌ Import Error:", error.response?.data || error.message);
      res
        .status(500)
        .json({ error: "Failed to import domains from Cloudflare" });
    }
  }
);

export default router;
