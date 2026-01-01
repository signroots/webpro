import axios from "axios";
import Order from "../models/Order";
import Customer from "../models/Customer";

export async function syncCloudflareDomains() {
  console.log("🔄 Starting Cloudflare sync...");

  const TOKEN = process.env.CLOUDFLARE_TOKEN!;
  const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID!;

  if (!TOKEN || !ACCOUNT_ID) {
    console.log("❌ Cloudflare env missing");
    return;
  }

  // Default customer
  const customer = await Customer.findOneAndUpdate(
    { email: "cloudflare@signroots.com" },
    { name: "Cloudflare Client", phone: "0000000000" },
    { upsert: true, new: true }
  );

  /* -------------------- REGISTRAR DOMAINS -------------------- */
  const registrarMap: Record<string, any> = {};
  let page = 0;
  let fetched = 0;
  let total = 0;

  do {
    const r = await axios.get(
      `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/registrar/domains`,
      {
        headers: {
          Authorization: `Bearer ${TOKEN}`, // ✅ SAME AS POSTMAN
        },
        params: {
          page,
          per_page: 50,
        },
      }
    );

    const result = r.data.result || [];
    total = r.data.result_info.total_count;
    fetched += result.length;

    result.forEach((d: any) => {
      registrarMap[d.name] = d;
    });

    page++;
  } while (fetched < total);

  console.log(`📦 Registrar domains fetched: ${Object.keys(registrarMap).length}`);

  /* -------------------- ZONES -------------------- */
  let zonePage = 1;
  let totalPages = 1;

  do {
    const z = await axios.get(
      "https://api.cloudflare.com/client/v4/zones",
      {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
        },
        params: { page: zonePage, per_page: 50 },
      }
    );

    totalPages = z.data.result_info.total_pages;

    const ops = z.data.result.map((zone: any) => {
      const registrar = registrarMap[zone.name];

      return {
        updateOne: {
          filter: { domainName: zone.name },
          update: {
            $set: {
              domainName: zone.name,
              status: zone.status,
              registrationDate: new Date(zone.created_on),
              expiryDate: registrar?.expires_at
                ? new Date(registrar.expires_at)
                : null,
              cloudflareRegistered: true,
              managedBy: "Signroots",
              customer: customer._id,
              domainSource: "Cloudflare",
              isActive: true,
              lastSyncedAt: new Date(),
            },
          },
          upsert: true,
        },
      };
    });

    if (ops.length) await Order.bulkWrite(ops);
    zonePage++;
  } while (zonePage <= totalPages);

  console.log("✅ Cloudflare sync completed successfully");
}
