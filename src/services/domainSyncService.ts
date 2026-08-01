import axios, { AxiosError } from "axios";
import dotenv from "dotenv";
import Domain from "../models/Domain";
import { CloudflareRegistrarDomain } from "../types/cloudflare";
import DomainSource from "../models/DomainSource";
dotenv.config();

/* ================= CLOUDflare CONFIG ================= */
const CF_ZONES_API = "https://api.cloudflare.com/client/v4/zones";
const CF_REGISTRAR_API = `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/registrar/domains`;

const cfHeaders = process.env.CLOUDFLARE_TOKEN
  ? { Authorization: `Bearer ${process.env.CLOUDFLARE_TOKEN}` }
  : {
      "X-Auth-Key": process.env.CLOUDFLARE_API_KEY!,
      "X-Auth-Email": process.env.CLOUDFLARE_EMAIL!,
    };

/* ================= RESELLER CONFIG ================= */
const RESELLER_SEARCH_API = "https://httpapi.com/api/domains/search.json";
const MAIN_USER = process.env.MAIN_RESELLER_USER_ID!;
const MAIN_KEY = process.env.MAIN_RESELLER_API_KEY!;

/* =================================================== */
export const syncDomains = async () => {
  const syncedDomains: any[] = [];

  try {
    /* ================= CLOUDflare ================= */
    const zonesRes = await axios.get(CF_ZONES_API, { headers: cfHeaders });
    const zones = zonesRes.data?.result || [];
const cloudflareSource =
  await DomainSource.findOne({
    name:{
      $regex:"Cloudflare",
      $options:"i"
    }
  });


if(!cloudflareSource){
  throw new Error("Cloudflare domain source not found");
}


const orderData = {

  domainSource: cloudflareSource._id

};
    let registrarDomains: CloudflareRegistrarDomain[] = [];
    try {
      const regRes = await axios.get(CF_REGISTRAR_API, { headers: cfHeaders });
      registrarDomains = regRes.data?.result || [];
    } catch (e) {
      console.warn("⚠️ Cloudflare Registrar API failed");
    }

    const registrarMap = new Map<string, CloudflareRegistrarDomain>();
    registrarDomains.forEach(r => {
      if (r.name) registrarMap.set(r.name.toLowerCase(), r);
    });

    for (const z of zones) {
      const reg = registrarMap.get(z.name.toLowerCase());

      const expiryDate = reg?.expires_at
        ? new Date(reg.expires_at)
        : null;

      const domain = await Domain.findOneAndUpdate(
        { domainName: z.name.toLowerCase() },
        {
          $set: {
            domainName: z.name.toLowerCase(),
            expiryDate,
            registrationDate: reg?.registered_at
              ? new Date(reg.registered_at)
              : null,
            status: expiryDate && expiryDate < new Date() ? "EXPIRED" : "ACTIVE",
            domainSource: cloudflareSource._id,
            lockStatus: reg?.locked ? "Locked" : "Unlocked",
            nameServers: reg?.name_servers || z.name_servers || [],
            cloudflareRegistered: true,
            updatedAt: new Date(),
          },
          $setOnInsert: { createdAt: new Date() },
        },
        { upsert: true, new: true }
      );

      syncedDomains.push(domain);
    }

    /* ================= RESELLER / SUB RESELLER ================= */
    let page = 1;
    while (true) {
      const res = await axios.get(RESELLER_SEARCH_API, {
        params: {
          "auth-userid": MAIN_USER,
          "api-key": MAIN_KEY,
          "no-of-records": 100,
          "page-no": page,
        },
      });

      const data = res.data;
      const keys = Object.keys(data).filter(k => /^\d+$/.test(k));
      if (!keys.length) break;

      for (const k of keys) {
        const d = data[k];
        const expiryDate = d["orders.endtime"]
          ? new Date(Number(d["orders.endtime"]) * 1000)
          : null;

        const domain = await Domain.findOneAndUpdate(
          { domainName: d["entity.description"].toLowerCase() },
          {
            $set: {
              domainName: d["entity.description"].toLowerCase(),
              expiryDate,
              status:
                expiryDate && expiryDate < new Date()
                  ? "EXPIRED"
                  : d["entity.currentstatus"]?.toUpperCase() || "ACTIVE",
              domainSource: "ResellerClub",
              lockStatus: d["orders.transferlock"] === "true" ? "Locked" : "Unlocked",
              resellerCustomerId: d["entity.customerid"],
              updatedAt: new Date(),
            },
            $setOnInsert: { createdAt: new Date() },
          },
          { upsert: true, new: true }
        );

        syncedDomains.push(domain);
      }

      page++;
    }

    console.log(`✅ Synced ${syncedDomains.length} domains`);
    return syncedDomains;

  } catch (err) {
    const e = err as AxiosError;
    console.error("❌ Domain sync error:", e.response?.data || e.message);
    throw err;
  }
};

/* ================= MANUAL RUN ================= */
if (require.main === module) {
  syncDomains()
    .then(() => console.log("✔ Sync completed"))
    .catch(console.error);
}
