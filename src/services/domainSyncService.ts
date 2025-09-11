// src/services/domainSyncService.ts
import Domain from "../models/Domain";
import axios from "axios";

// --- Cloudflare config ---
const CLOUDFLARE_API = "https://api.cloudflare.com/client/v4/zones";
const CLOUDFLARE_KEY = process.env.CLOUDFLARE_API_KEY;
const CLOUDFLARE_EMAIL = process.env.CLOUDFLARE_EMAIL;

// --- ResellerClub config ---
const RESELLER_API = "https://httpapi.com/api/domains/details.json";

// Sub-reseller
const SUB_RESELLER_KEY = process.env.RESELLER_API_KEY;
const SUB_RESELLER_USER_ID = process.env.RESELLER_USER_ID;

// Main reseller
const MAIN_RESELLER_KEY = process.env.MAIN_RESELLER_API_KEY;
const MAIN_RESELLER_USER_ID = process.env.MAIN_RESELLER_USER_ID;

export const syncDomains = async () => {
  try {
    // --- 1. Fetch from Cloudflare ---
    const cfRes = await axios.get(CLOUDFLARE_API, {
      headers: {
        "X-Auth-Key": CLOUDFLARE_KEY,
        "X-Auth-Email": CLOUDFLARE_EMAIL,
      },
    });

    const cfDomains =
      cfRes.data?.result?.map((d: any) => ({
        domainName: d.name,
        expiryDate: null, // Cloudflare doesn't return expiry
        status: d.status,
        source: "Cloudflare",
      })) || [];

    // --- 2. Fetch from Sub-Reseller ---
    const subRcRes = await axios.get(RESELLER_API, {
      params: {
        "auth-userid": SUB_RESELLER_USER_ID,
        "api-key": SUB_RESELLER_KEY,
        "domain-name": "example.com", // TODO: loop through domain list
        "options": "All",
      },
    });

    const subRcDomains = subRcRes.data
      ? Object.values(subRcRes.data).map((d: any) => ({
          domainName: d.domainname,
          expiryDate: d.endtime ? new Date(Number(d.endtime) * 1000) : null,
          status: d.currentstatus,
          source: "SubReseller",
        }))
      : [];

    // --- 3. Fetch from Main Reseller ---
    const mainRcRes = await axios.get(RESELLER_API, {
      params: {
        "auth-userid": MAIN_RESELLER_USER_ID,
        "api-key": MAIN_RESELLER_KEY,
        "domain-name": "example.com", // TODO: loop through domain list
        "options": "All",
      },
    });

    const mainRcDomains = mainRcRes.data
      ? Object.values(mainRcRes.data).map((d: any) => ({
          domainName: d.domainname,
          expiryDate: d.endtime ? new Date(Number(d.endtime) * 1000) : null,
          status: d.currentstatus,
          source: "MainReseller",
        }))
      : [];

    // --- 4. Merge & upsert in DB ---
    const allDomains = [...cfDomains, ...subRcDomains, ...mainRcDomains];

    for (const domain of allDomains) {
      await Domain.findOneAndUpdate({ domainName: domain.domainName }, domain, {
        upsert: true,
        new: true,
      });
    }

    console.log("✅ Domains synced successfully:", allDomains.length);
    return allDomains;
  } catch (error) {
    console.error("❌ Error syncing domains:", error);
    throw error;
  }
};
