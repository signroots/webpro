// src/services/domainSyncService.ts
import Domain from "../models/Domain";
import axios, { AxiosError } from "axios";
import dotenv from "dotenv";
dotenv.config();

// --- Cloudflare config ---
const CLOUDFLARE_ZONES_API = "https://api.cloudflare.com/client/v4/zones";
const CLOUDFLARE_REGISTRAR_API = `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/registrar/domains`;

// Cloudflare headers using API Token if available
const cfHeaders = process.env.CLOUDFLARE_TOKEN
  ? { Authorization: `Bearer ${process.env.CLOUDFLARE_TOKEN}` }
  : {
      "X-Auth-Key": process.env.CLOUDFLARE_API_KEY,
      "X-Auth-Email": process.env.CLOUDFLARE_EMAIL,
    };

// --- Reseller config (not used in this version) ---
const RESELLER_API = "https://httpapi.com/api/domains/details.json";
const SUB_RESELLER_KEY = process.env.RESELLER_API_KEY;
const SUB_RESELLER_USER_ID = process.env.RESELLER_USER_ID;
const MAIN_RESELLER_KEY = process.env.MAIN_RESELLER_API_KEY;
const MAIN_RESELLER_USER_ID = process.env.MAIN_RESELLER_USER_ID;

export const syncDomains = async () => {
  try {
    // 1️⃣ Fetch Cloudflare zones
    const cfZonesRes = await axios.get(CLOUDFLARE_ZONES_API, { headers: cfHeaders });
    const cfZones = cfZonesRes.data?.result || [];
    console.log(`📌 Cloudflare zones fetched: ${cfZones.length}`);

    // 2️⃣ Fetch Cloudflare registrar (for expiry dates)
    let registrarDomains: any[] = [];
    try {
      const registrarRes = await axios.get(CLOUDFLARE_REGISTRAR_API, { headers: cfHeaders });
      registrarDomains = registrarRes.data?.result || [];
      console.log(`📌 Registrar domains fetched: ${registrarDomains.length}`);
    } catch (err) {
      const error = err as AxiosError;
      console.warn("⚠️ Could not fetch registrar domains:", error.response?.data || error.message);
    }

    // Map registrar info by domain name
    const registrarMap = new Map<string, any>();
    for (const r of registrarDomains) {
      if (r.name) registrarMap.set(r.name.toLowerCase(), r);
    }

    // 3️⃣ Merge zones + registrar data
    const cfDomains = cfZones.map((z: any) => {
      const domainKey = z.name.toLowerCase();
      const reg = registrarMap.get(domainKey);

      const expiryDate = reg?.expires_at ? new Date(reg.expires_at) : null;
      if (!expiryDate) console.warn(`⚠️ Domain ${domainKey} has no expiry date in Registrar API`);

      return {
        domainName: domainKey,
        expiryDate,
        registrationDate: reg?.registered_at ? new Date(reg.registered_at) : null,
        status: z.status || reg?.last_known_status || "active",
        source: "Cloudflare",
        nameServers: reg?.name_servers || z.name_servers || [],
        originalRegistrar: reg?.current_registrar || null,
        lockStatus: reg?.locked ? "Locked" : "Unlocked",
        cloudflareRegistered: true,
      };
    });

    // 4️⃣ Upsert into MongoDB
    for (const domain of cfDomains) {
      await Domain.findOneAndUpdate(
        { domainName: domain.domainName },
        {
          $set: {
            expiryDate: domain.expiryDate,
            registrationDate: domain.registrationDate,
            status: domain.status,
            source: domain.source,
            nameServers: domain.nameServers,
            originalRegistrar: domain.originalRegistrar,
            lockStatus: domain.lockStatus,
            cloudflareRegistered: domain.cloudflareRegistered,
            updatedAt: new Date(),
          },
          $setOnInsert: { createdAt: new Date() },
        },
        { upsert: true, new: true }
      );
    }

    console.log(`✅ Synced ${cfDomains.length} Cloudflare domains with expiryDate`);
    return cfDomains;
  } catch (err) {
    const error = err as AxiosError;
    if (error.response) console.error("❌ API Error:", error.response.data);
    else if (error.request) console.error("❌ No response from API:", error.request);
    else console.error("❌ Unexpected error:", error.message);
    throw error;
  }
};

// --- Run manually if needed ---
if (require.main === module) {
  syncDomains()
    .then(() => console.log("📌 Domain sync finished"))
    .catch(err => console.error("❌ Domain sync failed:", err));
}
