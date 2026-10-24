// import axios from "axios";
// import dotenv from "dotenv";

// import Order from "../models/Order";
// import Customer from "../models/Customer";
// import mongoose from "mongoose";
// import DomainSource from "../models/DomainSource";
// import { fetchResellerClubDomainMap } from "../routes/mainreseller";
// dotenv.config();

// let cloudflareSyncRunning = false;
// async function fetchHostingerDomainMap(): Promise<Record<string, any>> {
//   const TOKEN = process.env.HOSTINGER_API_TOKEN?.trim();

//   if (!TOKEN) {
//     throw new Error("Hostinger API token missing");
//   }

//   const response = await axios.get(
//     "https://developers.hostinger.com/api/domains/v1/portfolio",
//     {
//       headers: {
//         Authorization: `Bearer ${TOKEN}`,
//         Accept: "application/json",
//       },
//       timeout: 30000,
//     }
//   );

//   const portfolio = response.data;

//   if (!Array.isArray(portfolio)) {
//     throw new Error("Invalid Hostinger portfolio response");
//   }

//   const domainMap: Record<string, any> = {};

//   for (const domain of portfolio) {
//     if (
//       domain.type !== "domain" ||
//       !domain.domain
//     ) {
//       continue;
//     }

//     domainMap[
//       domain.domain.toLowerCase().trim()
//     ] = domain;
//   }

//   console.log(
//     "HOSTINGER PAID DOMAINS:",
//     Object.keys(domainMap).length
//   );

//   return domainMap;
// }
// export async function syncCloudflareDomains() {

//   if (cloudflareSyncRunning) {
//     console.log("⚠️ Previous sync still running...");
//     return;
//   }

//   cloudflareSyncRunning = true;

//   try {

//     const CLOUDFLARE_TOKEN =
//       process.env.CLOUDFLARE_TOKEN?.trim();

//     const CLOUDFLARE_ACCOUNT_ID =
//       process.env.CLOUDFLARE_ACCOUNT_ID?.trim();

//     const CLOUDFLARE_GLOBAL_KEY =
//       process.env.CLOUDFLARE_API_KEY?.trim();

//     const CLOUDFLARE_EMAIL_ID =
//       process.env.CLOUDFLARE_EMAIL?.trim();

//     if (
//       !CLOUDFLARE_TOKEN ||
//       !CLOUDFLARE_ACCOUNT_ID
//     ) {
//       throw new Error("Missing Cloudflare credentials");
//     }

//     console.log("☁️ Cloudflare Sync Started");

//     // =====================================
//     // FETCH ALL REGISTRAR DOMAINS
//     // =====================================
// const resellerDomainMap =
//   await fetchResellerClubDomainMap();
//     const registrarDomainMap: Record<string, any> = {};

//   let registrarPage = 0;
// let registrarTotalPages = 1;
// const dnsCloudflareSource =
//   await DomainSource.findOne({
//     code: "DNS-CLOUDFLARE"
//   });

// const cloudflareSource =
//   await DomainSource.findOne({
//     code: "CLOUDFLARE"
//   });

// const resellerClubSource =
//   await DomainSource.findOne({
//     code: "RESELLERCLUB"
//   });

// if (
//   !dnsCloudflareSource ||
//   !cloudflareSource ||
//   !resellerClubSource
// ) {
//   throw new Error("Cloudflare/ResellerClub domain sources missing");
// }

// do {

// const registrarResponse = await axios.get(
//   `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/registrar/domains`,
//  {

  
//       headers: {
//       Authorization: `Bearer ${CLOUDFLARE_TOKEN}`,
//       "Content-Type": "application/json"
//     },
    
// //    headers:{
// //   "X-Auth-Email": CLOUDFLARE_EMAIL_ID,
// //   "X-Auth-Key": CLOUDFLARE_GLOBAL_KEY,
// //   "Content-Type":"application/json"
// // },
//  params: {
//             page: registrarPage,
//             per_page: 30
//          }
//   }
// );

// console.log(
//   "REGISTRAR API SUCCESS:",
//   registrarResponse.data.success
// );

// console.log(
//   "REGISTRAR RESULT COUNT:",
//   registrarResponse.data.result?.length
// );
//  console.log(
//    "Registrar page",
//    registrarPage,
//    registrarResponse.data.result.length
//  );


//  registrarResponse.data.result.forEach((domain:any)=>{

//    console.log(
//     "Registrar domain:",
//     domain.name,
//     domain.expires_at
//    );

//    registrarDomainMap[
//      domain.name.toLowerCase().trim()
//    ] = domain;

//  });


// registrarTotalPages =
//  registrarResponse.data.result_info?.total_pages;


//  registrarPage++;


// } while(
//  registrarPage <= registrarTotalPages
// );
// console.log(
//  "TOTAL REGISTRAR DOMAINS:",
//  Object.keys(registrarDomainMap).length
// );

// console.log(
//  "VOLTOPAINTS:",
//  registrarDomainMap["voltopaints.com"]
// );
// // =====================================
// // MOVE OLD NON-REGISTRAR CLOUDFLARE DOMAINS
// // TO DNS-CLOUDFLARE
// // =====================================


//     // =====================================
//     // FETCH DEFAULT CUSTOMER
//     // =====================================

//     const defaultCustomer =
//       await Customer.findOneAndUpdate(
//         {
//           email: "cloudflare@signroots.com",
//         },
//         {
//           name: "Cloudflare Client",
//           phone: "0000000000",
//         },
//         {
//           upsert: true,
//           new: true,
//         }
//       );
//     // =====================================
//     // FETCH & SYNC CLOUDFLARE ZONES
//     // =====================================

//     let zonePage = 1;
//     let zoneTotalPages = 1;

//     do {

//       const zoneResponse = await axios.get(
//         "https://api.cloudflare.com/client/v4/zones",
//         {
//           headers: {
//             Authorization: `Bearer ${CLOUDFLARE_TOKEN}`,
//             "Content-Type": "application/json",
//           },
//           params: {
//             page: zonePage,
//             per_page: 100,
//           },
//         }
//       );

//       const zones = zoneResponse.data.result;

//       zoneTotalPages =
//         zoneResponse.data.result_info.total_pages || 1;

//       console.log(
//         `🌐 Processing Zones Page ${zonePage}/${zoneTotalPages}`
//       );

//       const bulkOps: any[] = [];

//       for (const zone of zones) {

//        const domainKey =
//   zone.name.toLowerCase().trim();

// const resellerInfo =
//   resellerDomainMap[domainKey];

// const registrarInfo =
//   registrarDomainMap[domainKey];

// let selectedDomainSource;

// if (resellerInfo) {

//   selectedDomainSource =
//     resellerClubSource._id;

//   console.log(
//     `🔴 ${zone.name} → RESELLERCLUB`
//   );

// } else if (registrarInfo) {

//   selectedDomainSource =
//     cloudflareSource._id;

//   console.log(
//     `☁️ ${zone.name} → CLOUDFLARE`
//   );

// } else {

//   selectedDomainSource =
//     dnsCloudflareSource._id;

//   console.log(
//     `🌐 ${zone.name} → DNS-CLOUDFLARE`
//   );
// }
//         const existingOrder =
//           await Order.findOne({
//             domainName: zone.name,
//           });

//         const expiryDate =
//           registrarInfo?.expires_at
//             ? new Date(registrarInfo.expires_at)
//             : existingOrder?.expiryDate
//               ? new Date(existingOrder.expiryDate)
//               : null;
//         const provider =
//           existingOrder?.provider || "";

//         const providerLower =
//           provider.toLowerCase();
//         // =====================================
//         // CHECK EXPIRY MORE THAN 65 DAYS
//         // =====================================

//         let isActive = true;
//         let domainStatus = zone.status;


//         if (expiryDate) {

//           const diffDays =
//             (
//               Date.now() -
//               expiryDate.getTime()
//             )
//             /
//             (
//               1000 *
//               60 *
//               60 *
//               24
//             );


//           if (diffDays > 65) {

//             console.log(
//               `⚠️ Expired more than 65 days: ${zone.name}`
//             );


//             isActive = false;

//             domainStatus = "EXPIRED";

//           }

//         }



//         // =====================================
//         // ADD / UPDATE ORDER
//         // =====================================


//         bulkOps.push({

//           updateOne: {

//             filter: {

//               domainName:
//                 zone.name

//             },


//          update: {
//   $set: {
//     domainName: zone.name,
//     server_status: domainStatus,
//     is_active: isActive,
//     nameServers: zone.name_servers,
//     registrationDate: zone.created_on
//       ? new Date(zone.created_on)
//       : existingOrder?.registrationDate || null,
//     originalRegistrar: zone.original_registrar,
//     expiryDate,
//     managedBy: "Signroots",
//     customer: defaultCustomer._id,
//     cloudflareRegistered: true,
//     provider,
//     google_email:
//       existingOrder?.google_email ||
//       providerLower.includes("google workspace"),
//     microsoft_email:
//       existingOrder?.microsoft_email ||
//       providerLower.includes("microsoft 365"),
//     email_flag:
//       existingOrder?.email_flag || false,
//     email_customer:
//       existingOrder?.email_customer || "",
//     users:
//       existingOrder?.users || 0,
//   },

//   $setOnInsert: {
//     domainSource: selectedDomainSource,
//   }
// },
// upsert: true

//           }


//         });
//       } // close for (const zone of zones)


//       // =====================================
//       // BULK UPDATE DATABASE
//       // =====================================

//       if (bulkOps.length) {

//         await Order.bulkWrite(
//           bulkOps
//         );

//         console.log(
//           `✅ Updated ${bulkOps.length} domains`
//         );

//       }


//       zonePage++;


//     } while (
//       zonePage <= zoneTotalPages
//     );


//     console.log(
//       "✅ Cloudflare Sync Completed"
//     );


//   }
//   catch (error: any) {

//     console.error(
//       "❌ Cloudflare Sync Failed:",
//       error.message || error
//     );

//   }
//   finally {

//     cloudflareSyncRunning = false;

//   }


// }
import axios from "axios";
import dotenv from "dotenv";

import Order from "../models/Order";
import Customer from "../models/Customer";
import DomainSource from "../models/DomainSource";
import { fetchResellerClubDomainMap } from "../routes/mainreseller";

dotenv.config();

let cloudflareSyncRunning = false;

interface HostingerDomain {
  id?: number;
  domain?: string | null;
  type?: string;
  status?: string;
  created_at?: string | null;
  expires_at?: string | null;
}

interface DomainMap {
  [domain: string]: any;
}

/* =========================================
   COMMON HELPERS
========================================= */

function normalizeDomain(value: unknown): string {
  return typeof value === "string"
    ? value.toLowerCase().trim().replace(/\.$/, "")
    : "";
}

function toValidDate(value: unknown): Date | null {
  if (!value) return null;

  const date = new Date(value as string | number);

  return Number.isNaN(date.getTime()) ? null : date;
}

function calculateActiveStatus(
  expiryDate: Date | null,
  defaultStatus: string
): { isActive: boolean; status: string } {
  if (!expiryDate) {
    return {
      isActive: true,
      status: defaultStatus,
    };
  }

  const diffDays =
    (Date.now() - expiryDate.getTime()) / (1000 * 60 * 60 * 24);

  if (diffDays > 65) {
    return {
      isActive: false,
      status: "EXPIRED",
    };
  }

  return {
    isActive: true,
    status: defaultStatus,
  };
}

/* =========================================
   FETCH HOSTINGER PORTFOLIO
========================================= */

async function fetchHostingerDomainMap(): Promise<DomainMap> {
  const token = process.env.HOSTINGER_API_TOKEN?.trim();

  if (!token) {
    throw new Error("HOSTINGER_API_TOKEN is missing");
  }

  const response = await axios.get<HostingerDomain[]>(
    "https://developers.hostinger.com/api/domains/v1/portfolio",
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      timeout: 30000,
    }
  );

  const portfolio = response.data;

  if (!Array.isArray(portfolio)) {
    throw new Error("Invalid Hostinger portfolio response");
  }

  const domainMap: DomainMap = {};

  for (const item of portfolio) {
    // Only registered/purchased domain portfolio items.
    // Free-domain items without a domain name are ignored.
    if (item.type !== "domain") continue;

    const domainName = normalizeDomain(item.domain);

    if (!domainName) continue;

    domainMap[domainName] = item;
  }

  console.log(
    `HOSTINGER DOMAIN COUNT: ${Object.keys(domainMap).length}`
  );

  return domainMap;
}

/* =========================================
   FETCH CLOUDFLARE REGISTRAR DOMAINS
========================================= */

async function fetchCloudflareRegistrarDomainMap(
  token: string,
  accountId: string
): Promise<DomainMap> {
  const domainMap: DomainMap = {};

  let page = 1;
  let totalPages = 1;

  do {
    const response = await axios.get(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/registrar/domains`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        params: {
          page,
          per_page: 30,
        },
        timeout: 30000,
      }
    );

    if (!response.data?.success) {
      throw new Error(
        `Cloudflare registrar API failed on page ${page}`
      );
    }

    const domains = response.data.result || [];

    for (const domain of domains) {
      const key = normalizeDomain(domain.name);

      if (key) {
        domainMap[key] = domain;
      }
    }

    totalPages = Math.max(
      1,
      Number(response.data.result_info?.total_pages) || 1
    );

    console.log(
      `Registrar page ${page}/${totalPages}: ${domains.length} domains`
    );

    page++;
  } while (page <= totalPages);

  console.log(
    `TOTAL CLOUDFLARE REGISTRAR DOMAINS: ${Object.keys(domainMap).length}`
  );

  return domainMap;
}

/* =========================================
   SYNC CLOUDFLARE + HOSTINGER
========================================= */

export async function syncCloudflareDomains(): Promise<void> {
  if (cloudflareSyncRunning) {
    console.log("Previous domain sync is still running");
    return;
  }

  cloudflareSyncRunning = true;

  try {
    const cloudflareToken =
      process.env.CLOUDFLARE_TOKEN?.trim();

    const cloudflareAccountId =
      process.env.CLOUDFLARE_ACCOUNT_ID?.trim();

    if (!cloudflareToken || !cloudflareAccountId) {
      throw new Error("Missing Cloudflare credentials");
    }

    console.log("Domain sync started");

    /* =====================================
       LOAD SOURCES
    ===================================== */

    const [
      dnsCloudflareSource,
      cloudflareSource,
      resellerClubSource,
      hostingerSource,
    ] = await Promise.all([
      DomainSource.findOne({ code: "DNS-CLOUDFLARE" }),
      DomainSource.findOne({ code: "CLOUDFLARE" }),
      DomainSource.findOne({ code: "RESELLERCLUB" }),
      DomainSource.findOne({ code: "HOSTINGER" }),
    ]);

    if (
      !dnsCloudflareSource ||
      !cloudflareSource ||
      !resellerClubSource ||
      !hostingerSource
    ) {
      throw new Error(
        "Missing DNS-CLOUDFLARE, CLOUDFLARE, RESELLERCLUB or HOSTINGER domain source"
      );
    }

    /* =====================================
       FETCH ALL PROVIDER DOMAINS
    ===================================== */

    const [
      resellerDomainMap,
      registrarDomainMap,
      hostingerDomainMap,
    ] = await Promise.all([
      fetchResellerClubDomainMap(),
      fetchCloudflareRegistrarDomainMap(
        cloudflareToken,
        cloudflareAccountId
      ),
      fetchHostingerDomainMap(),
    ]);

    /* =====================================
       DEFAULT CUSTOMERS
    ===================================== */

    const [cloudflareCustomer, hostingerCustomer] =
      await Promise.all([
        Customer.findOneAndUpdate(
          { email: "cloudflare@signroots.com" },
          {
            $set: {
              name: "Cloudflare Client",
              phone: "0000000000",
            },
          },
          { upsert: true, new: true }
        ),

        Customer.findOneAndUpdate(
          { email: "hostinger@signroots.com" },
          {
            $set: {
              name: "Hostinger Domains",
              phone: "0000000000",
            },
          },
          { upsert: true, new: true }
        ),
      ]);

    /* =====================================
       FETCH CLOUDFLARE ZONES
    ===================================== */

    const cloudflareZoneMap: DomainMap = {};

    let zonePage = 1;
    let zoneTotalPages = 1;

    do {
      const response = await axios.get(
        "https://api.cloudflare.com/client/v4/zones",
        {
          headers: {
            Authorization: `Bearer ${cloudflareToken}`,
            "Content-Type": "application/json",
          },
          params: {
            page: zonePage,
            per_page: 100,
          },
          timeout: 30000,
        }
      );

      if (!response.data?.success) {
        throw new Error(
          `Cloudflare zones API failed on page ${zonePage}`
        );
      }

      const zones = response.data.result || [];

      zoneTotalPages = Math.max(
        1,
        Number(response.data.result_info?.total_pages) || 1
      );

      console.log(
        `Cloudflare zones page ${zonePage}/${zoneTotalPages}`
      );

      for (const zone of zones) {
        const key = normalizeDomain(zone.name);

        if (key) {
          cloudflareZoneMap[key] = zone;
        }
      }

      zonePage++;
    } while (zonePage <= zoneTotalPages);

    /* =====================================
       MERGE ALL DOMAIN NAMES

       Includes Hostinger domains that do not
       exist in Cloudflare zones.
    ===================================== */

    const allDomainNames = new Set<string>([
      ...Object.keys(cloudflareZoneMap),
      ...Object.keys(hostingerDomainMap),
      ...Object.keys(registrarDomainMap),
      ...Object.keys(resellerDomainMap),
    ]);

    console.log(
      `TOTAL UNIQUE DOMAINS TO PROCESS: ${allDomainNames.size}`
    );

    /* =====================================
       BUILD DOMAIN OPERATIONS
    ===================================== */

    const bulkOps: any[] = [];

    let hostingerCount = 0;
    let resellerClubCount = 0;
    let cloudflareRegistrarCount = 0;
    let dnsCloudflareCount = 0;

    for (const domainKey of allDomainNames) {
      const zone = cloudflareZoneMap[domainKey];
      const hostingerInfo = hostingerDomainMap[domainKey];
      const resellerInfo = resellerDomainMap[domainKey];
      const registrarInfo = registrarDomainMap[domainKey];

      /*
       * Source priority:
       * ResellerClub > Hostinger > Cloudflare Registrar
       * > DNS-CLOUDFLARE
       */
      let selectedDomainSource: any;
      let sourceName: string;

      if (resellerInfo) {
        selectedDomainSource = resellerClubSource._id;
        sourceName = "RESELLERCLUB";
        resellerClubCount++;
      } else if (hostingerInfo) {
        selectedDomainSource = hostingerSource._id;
        sourceName = "HOSTINGER";
        hostingerCount++;
      } else if (registrarInfo) {
        selectedDomainSource = cloudflareSource._id;
        sourceName = "CLOUDFLARE";
        cloudflareRegistrarCount++;
      } else {
        selectedDomainSource = dnsCloudflareSource._id;
        sourceName = "DNS-CLOUDFLARE";
        dnsCloudflareCount++;
      }

      const existingOrder = await Order.findOne({
        domainName: {
          $regex: `^${domainKey.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
          $options: "i",
        },
      });

      /*
       * Prefer expiry from the matching registrar.
       * Otherwise use Hostinger expiry, then existing
       * order expiry, then null.
       */
      const providerExpiry =
        toValidDate(resellerInfo?.expires_at) ||
        toValidDate(registrarInfo?.expires_at) ||
        toValidDate(hostingerInfo?.expires_at);

      const expiryDate =
        providerExpiry ||
        toValidDate(existingOrder?.expiryDate);

      const registrationDate =
        toValidDate(
          resellerInfo?.created_at ||
          registrarInfo?.created_at ||
          hostingerInfo?.created_at ||
          zone?.created_on
        ) ||
        toValidDate(existingOrder?.registrationDate);

      const provider = existingOrder?.provider || "";

      const providerLower = provider.toLowerCase();

      const currentProviderStatus =
        hostingerInfo?.status ||
        registrarInfo?.status ||
        resellerInfo?.status ||
        zone?.status ||
        existingOrder?.server_status ||
        "UNKNOWN";

      const { isActive, status } = calculateActiveStatus(
        expiryDate,
        String(currentProviderStatus).toUpperCase()
      );

      /*
       * Do not overwrite unrelated existing customer
       * assignments for domains that already exist.
       */
      const assignedCustomer = existingOrder?.customer
        ? existingOrder.customer
        : hostingerInfo
          ? hostingerCustomer._id
          : cloudflareCustomer._id;

      const setFields: Record<string, any> = {
        domainName: domainKey,
        domainSource: selectedDomainSource,
        expiryDate,
        registrationDate,
        managedBy: existingOrder?.managedBy || "Signroots",
        customer: assignedCustomer,
      };

      /*
       * Hostinger-specific fields:
       * Use the Hostinger API values without requiring
       * a matching Cloudflare zone.
       */
      if (hostingerInfo) {
        setFields.server_status = status;
        setFields.is_active = isActive;
        setFields.domain_flag =
          existingOrder?.domain_flag ?? true;
      }

      /*
       * Cloudflare zone information is only updated
       * when the zone actually exists.
       */
      if (zone) {
        setFields.server_status = status;
        setFields.is_active = isActive;
        setFields.nameServers = zone.name_servers || [];
        setFields.originalRegistrar = zone.original_registrar || "";

        setFields.cloudflareRegistered = true;

        setFields.google_email =
          existingOrder?.google_email ??
          providerLower.includes("google workspace");

        setFields.microsoft_email =
          existingOrder?.microsoft_email ??
          providerLower.includes("microsoft 365");

        setFields.email_flag =
          existingOrder?.email_flag ?? false;

        setFields.email_customer =
          existingOrder?.email_customer ?? "";

        setFields.users = existingOrder?.users ?? 0;
      }

      /*
       * Do not set cloudflareRegistered=true for a
       * Hostinger domain without a Cloudflare zone.
       */
      bulkOps.push({
        updateOne: {
          filter: {
            domainName: domainKey,
          },
          update: {
            $set: setFields,
          },
          upsert: true,
        },
      });

      console.log(`${domainKey} → ${sourceName}`);
    }

    /* =====================================
       WRITE TO DATABASE IN BATCHES
    ===================================== */

    const batchSize = 500;
    let totalProcessed = 0;

    for (let i = 0; i < bulkOps.length; i += batchSize) {
      const batch = bulkOps.slice(i, i + batchSize);

      const result = await Order.bulkWrite(batch, {
        ordered: false,
      });

      totalProcessed +=
        result.upsertedCount + result.modifiedCount;

      console.log(
        `Database batch ${Math.floor(i / batchSize) + 1}: ` +
        `${batch.length} operations`
      );
    }

    console.log("========== DOMAIN SYNC SUMMARY ==========");
    console.log(`Total unique domains: ${allDomainNames.size}`);
    console.log(`Hostinger: ${hostingerCount}`);
    console.log(`ResellerClub: ${resellerClubCount}`);
    console.log(`Cloudflare Registrar: ${cloudflareRegistrarCount}`);
    console.log(`DNS-CLOUDFLARE: ${dnsCloudflareCount}`);
    console.log(`Inserted/modified: ${totalProcessed}`);
    console.log("Domain sync completed successfully");
  } catch (error: any) {
    console.error(
      "Domain sync failed:",
      error.response?.data || error.message || error
    );
  } finally {
    cloudflareSyncRunning = false;
  }
}