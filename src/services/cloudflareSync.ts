import axios from "axios";
import dotenv from "dotenv";

import Order from "../models/Order";
import Customer from "../models/Customer";

dotenv.config();

export async function syncCloudflareDomains() {
  

  const CLOUDFLARE_TOKEN =
    process.env.CLOUDFLARE_TOKEN?.trim();

  const CLOUDFLARE_ACCOUNT_ID =
    process.env.CLOUDFLARE_ACCOUNT_ID?.trim();

  const CLOUDFLARE_GLOBAL_KEY =
    process.env.CLOUDFLARE_API_KEY?.trim();

  const CLOUDFLARE_EMAIL_ID =
    process.env.CLOUDFLARE_EMAIL?.trim();

  if (!CLOUDFLARE_TOKEN || !CLOUDFLARE_ACCOUNT_ID) {
    throw new Error("Missing Cloudflare credentials");
  }

  console.log("☁️ Cloudflare Sync Started");

  // =====================================
  // FETCH REGISTRAR DOMAINS
  // =====================================

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

    const { result, result_info } =
      registrarResponse.data;

    registrarTotal =
      result_info.total_count || registrarTotal;

    registrarFetched += result.length;

    result.forEach((domain: any) => {
      registrarDomainMap[domain.name] = domain;
    });

    registrarPage++;

  } while (registrarFetched < registrarTotal);

  console.log(
    `✅ Registrar Domains: ${
      Object.keys(registrarDomainMap).length
    }`
  );

  // =====================================
  // DEFAULT CUSTOMER
  // =====================================

  const defaultCustomer =
    await Customer.findOneAndUpdate(
      {
        email: "cloudflare@signroots.com",
      },
      {
        name: "Cloudflare Client",
        phone: "0000000000",
      },
      {
        upsert: true,
        new: true,
      }
    );

  // =====================================
  // FETCH ZONES
  // =====================================

  let page = 1;

  let totalPages = 1;

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

    const { result, result_info } =
      response.data;

    totalPages =
      result_info.total_pages || 1;

    console.log(
      `🌐 Zones Page ${page}/${totalPages}`
    );

    // =====================================
    // BULK OPS
    // =====================================

    const bulkOps = await Promise.all(

      result.map(async (zone: any) => {

        const registrarInfo = registrarDomainMap[zone.name];

        // =====================================
        // DOMAIN NOT FOUND IN REGISTRAR
        // =====================================

        if (!registrarInfo) {

          console.log(
            `🗑 Removing ${zone.name} - Not found in registrar`
          );

          await Order.deleteOne({
            domainName: zone.name,
          });

          return null;
        }

        const expiryDate = new Date(registrarInfo.expires_at);

        // =====================================
        // REMOVE IF EXPIRED > 65 DAYS
        // =====================================

        const today = new Date();

        const diffDays =
          (today.getTime() - expiryDate.getTime()) /
          (1000 * 60 * 60 * 24);

        if (diffDays > 65) {

          console.log(
            `🗑 Removing ${zone.name} - Expired ${Math.floor(diffDays)} days ago`
          );

          await Order.deleteOne({
            domainName: zone.name,
          });

          return null;
        }
        // =====================================
        // FIND EXISTING DOMAIN
        // =====================================

        const existingOrder =
          await Order.findOne({
            domainName: zone.name,
          });

        // =====================================
        // PRESERVE EMAIL DATA
        // =====================================

        const provider =
          existingOrder?.provider || "";

        const providerLower =
          provider.toLowerCase();

        const hasGoogle =
          providerLower.includes(
            "google workspace"
          );

        const hasMicrosoft =
          providerLower.includes(
            "microsoft 365"
          );

        return {

          updateOne: {

            filter: {
              domainName: zone.name,
            },

            update: {

              $set: {

                // =====================================
                // DOMAIN DATA
                // =====================================

                domainName: zone.name,

                status: zone.status,

                nameServers:
                  zone.name_servers,

                registrationDate:
                  new Date(zone.created_on),

                originalRegistrar:
                  zone.original_registrar,

                is_dns:
                  zone.original_dnshost,

                expiryDate,

                managedBy: "Signroots",

                lockStatus:
                  zone.paused
                    ? "Locked"
                    : "Unlocked",

                customer:
                  defaultCustomer._id,

                domainSource:
                  "Cloudflare",

                dnsDetails: [],

                cloudflareRegistered:
                  !!registrarInfo,

                // =====================================
                // PRESERVE EMAIL DATA
                // =====================================

                provider,

                email_services:
                  existingOrder?.email_services || [],

                email_flag:
                  existingOrder?.email_flag || false,

                google_email:
                existingOrder?.google_email === true
                    ? true
                    : hasGoogle,

                microsoft_email:
                existingOrder?.microsoft_email === true
                    ? true
                    : hasMicrosoft,

                email_customer:
                  existingOrder?.email_customer || "",

                email_expiryDate:
                  existingOrder?.email_expiryDate || null,

                email_status:
                  existingOrder?.email_status || "",

                username:
                  existingOrder?.username || "",

                password:
                  existingOrder?.password || "",

                subscription:
                  existingOrder?.subscription || "",

                users:
                  existingOrder?.users || 0,

              },

            },

            upsert: true,

          },

        };

      })

    );

    // =====================================
    // SAVE
    // =====================================

    const validBulkOps = bulkOps.filter(
  (op): op is { updateOne: any } => op !== null
);

if (validBulkOps.length > 0) {

  await Order.bulkWrite(validBulkOps);

}

    page++;

  } while (page <= totalPages);
  const registrarDomains = Object.keys(registrarDomainMap);

const deleted = await Order.deleteMany({
  domainSource: "Cloudflare",
  domainName: {
    $nin: registrarDomains,
  },
});

console.log(
  `🗑 Cleanup completed. Removed ${deleted.deletedCount} orphan domains`
);
  console.log(
    "✅ Cloudflare Sync Completed"
  );
}