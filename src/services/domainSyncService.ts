// 
import axios, { AxiosError } from "axios";
import dotenv from "dotenv";

import Domain from "../models/Domain";
import Order from "../models/Order";
import Customer from "../models/Customer";
import DomainSource from "../models/DomainSource";

import { CloudflareRegistrarDomain } from "../types/cloudflare";

dotenv.config();

/* ================= CLOUDFLARE CONFIG ================= */

const CF_ZONES_API = "https://api.cloudflare.com/client/v4/zones";

const CF_REGISTRAR_API =
  `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/registrar/domains`;

const cfHeaders = process.env.CLOUDFLARE_TOKEN
  ? {
      Authorization: `Bearer ${process.env.CLOUDFLARE_TOKEN}`,
    }
  : {
      "X-Auth-Key": process.env.CLOUDFLARE_API_KEY!,
      "X-Auth-Email": process.env.CLOUDFLARE_EMAIL!,
    };

/* ================= RESELLER CONFIG ================= */

const RESELLER_SEARCH_API =
  "https://httpapi.com/api/domains/search.json";

const MAIN_USER = process.env.MAIN_RESELLER_USER_ID!;
const MAIN_KEY = process.env.MAIN_RESELLER_API_KEY!;

/* ================= HOSTINGER CONFIG ================= */

const HOSTINGER_PORTFOLIO_API =
  "https://developers.hostinger.com/api/domains/v1/portfolio";

/* ==================================================== */
/*                    MAIN DOMAIN SYNC                  */
/* ==================================================== */

export const syncDomains = async () => {
  const syncedDomains: any[] = [];

  let hostingerImported = 0;
  let hostingerIgnoredFreeDomains = 0;

  try {
    /* ================= CLOUDFLARE ZONES ================= */

    const zonesRes = await axios.get(CF_ZONES_API, {
      headers: cfHeaders,
    });

    const zones = zonesRes.data?.result || [];

    const cloudflareSource = await DomainSource.findOne({
      name: {
        $regex: "Cloudflare",
        $options: "i",
      },
    });

    if (!cloudflareSource) {
      throw new Error("Cloudflare domain source not found");
    }

    /* ================= CLOUDFLARE REGISTRAR ================= */

    let registrarDomains: CloudflareRegistrarDomain[] = [];

    try {
      const regRes = await axios.get(CF_REGISTRAR_API, {
        headers: cfHeaders,
      });

      registrarDomains = regRes.data?.result || [];
    } catch (e: any) {
      console.warn(
        "⚠️ Cloudflare Registrar API failed:",
        e.response?.data || e.message
      );
    }

    const registrarMap = new Map<
      string,
      CloudflareRegistrarDomain
    >();

    registrarDomains.forEach((r) => {
      if (r.name) {
        registrarMap.set(r.name.toLowerCase(), r);
      }
    });

    for (const z of zones) {
      const domainName = z.name.toLowerCase();
      const reg = registrarMap.get(domainName);

      const expiryDate = reg?.expires_at
        ? new Date(reg.expires_at)
        : null;

      const domain = await Domain.findOneAndUpdate(
        {
          domainName,
        },
        {
          $set: {
            domainName,
            expiryDate,

            registrationDate: reg?.registered_at
              ? new Date(reg.registered_at)
              : null,

            server_status:
              expiryDate && expiryDate < new Date()
                ? "EXPIRED"
                : "ACTIVE",

            domainSource: cloudflareSource._id,

            lockStatus: reg?.locked
              ? "Locked"
              : "Unlocked",

            nameServers:
              reg?.name_servers || z.name_servers || [],

            cloudflareRegistered: true,
            updatedAt: new Date(),
          },

          $setOnInsert: {
            createdAt: new Date(),
          },
        },
        {
          upsert: true,
          new: true,
        }
      );

      syncedDomains.push(domain);
    }

    console.log(
      `✅ Cloudflare sync completed: ${zones.length} zones`
    );

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

      const data = res.data || {};

      const keys = Object.keys(data).filter((k) =>
        /^\d+$/.test(k)
      );

      if (!keys.length) {
        break;
      }

      for (const k of keys) {
        const d = data[k];

        const rawDomainName = d["entity.description"];

        if (!rawDomainName) {
          continue;
        }

        const domainName = String(rawDomainName).toLowerCase();

        const expiryDate = d["orders.endtime"]
          ? new Date(Number(d["orders.endtime"]) * 1000)
          : null;

        const domain = await Domain.findOneAndUpdate(
          {
            domainName,
          },
          {
            $set: {
              domainName,
              expiryDate,

              status:
                expiryDate && expiryDate < new Date()
                  ? "EXPIRED"
                  : d["entity.currentstatus"]?.toUpperCase() ||
                    "ACTIVE",

              domainSource: "ResellerClub",

              lockStatus:
                d["orders.transferlock"] === "true"
                  ? "Locked"
                  : "Unlocked",

              resellerCustomerId: d["entity.customerid"],
              updatedAt: new Date(),
            },

            $setOnInsert: {
              createdAt: new Date(),
            },
          },
          {
            upsert: true,
            new: true,
          }
        );

        syncedDomains.push(domain);
      }

      page++;
    }

    console.log("✅ ResellerClub sync completed");

    /* ================= HOSTINGER DOMAINS ================= */

    try {
      const TOKEN = process.env.HOSTINGER_API_TOKEN;

      if (!TOKEN) {
        console.warn(
          "⚠️ HOSTINGER_API_TOKEN missing. Hostinger sync skipped."
        );
      } else {
        const hostingerSource = await DomainSource.findOne({
          code: "HOSTINGER",
        });

        if (!hostingerSource) {
          console.warn(
            "⚠️ Hostinger domain source not configured. Sync skipped."
          );
        } else {
          const hostingerCustomer =
            await Customer.findOneAndUpdate(
              {
                email: "hostinger@signroots.com",
              },
              {
                $set: {
                  name: "Hostinger Domains",
                  phone: "0000000000",
                },
              },
              {
                upsert: true,
                new: true,
              }
            );

          const response = await axios.get(
            HOSTINGER_PORTFOLIO_API,
            {
              headers: {
                Authorization: `Bearer ${TOKEN}`,
              },
              timeout: 30000,
            }
          );

          const portfolio = response.data;

          if (!Array.isArray(portfolio)) {
            throw new Error(
              "Invalid Hostinger portfolio response"
            );
          }

          const paidDomains = portfolio.filter(
            (d: any) =>
              d.type === "domain" &&
              typeof d.domain === "string" &&
              d.domain.length > 0
          );

          hostingerIgnoredFreeDomains =
            portfolio.length - paidDomains.length;

          const bulkOps = paidDomains.map((d: any) => ({
            updateOne: {
              filter: {
                domainName: d.domain.toLowerCase(),
              },

              update: {
                $set: {
                  domainName: d.domain.toLowerCase(),
                  status: d.status,

                  registrationDate: d.created_at
                    ? new Date(d.created_at)
                    : null,

                  expiryDate: d.expires_at
                    ? new Date(d.expires_at)
                    : null,

                  managedBy: "Signroots",
                  domainSource: hostingerSource._id,
                  customer: hostingerCustomer._id,
                  domain_flag: true,
                },
              },

              upsert: true,
            },
          }));

          if (bulkOps.length > 0) {
            const result = await Order.bulkWrite(bulkOps);

            hostingerImported = bulkOps.length;

            console.log("✅ Hostinger sync completed:", {
              processed: hostingerImported,
              inserted: result.upsertedCount,
              modified: result.modifiedCount,
              ignoredFreeDomains:
                hostingerIgnoredFreeDomains,
            });
          } else {
            console.log(
              "ℹ️ No paid Hostinger domains found."
            );
          }
        }
      }
    } catch (hostingerError: any) {
      // A Hostinger failure will not stop the other syncs.
      console.error(
        "❌ Hostinger sync failed:",
        hostingerError.response?.data ||
          hostingerError.message
      );
    }

    /* ================= SUMMARY ================= */

    console.log(
      `✅ Domain sync completed. Domain records processed: ${syncedDomains.length}; Hostinger records processed: ${hostingerImported}`
    );

    return syncedDomains;
  } catch (err) {
    const e = err as AxiosError;

    console.error(
      "❌ Domain sync error:",
      e.response?.data || e.message
    );

    throw err;
  }
};

/* ================= MANUAL RUN ================= */

if (require.main === module) {
  syncDomains()
    .then(() => {
      console.log("✔ Sync completed");
    })
    .catch((err) => {
      console.error("❌ Sync failed:", err);
      process.exitCode = 1;
    });
}
