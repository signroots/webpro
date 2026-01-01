import axios from "axios";
import Order from "../models/Order";
import Customer from "../models/Customer";

export async function syncCloudflareDomains() {
  console.log("🔄 Starting Cloudflare sync...");

  const CLOUDFLARE_TOKEN = process.env.CLOUDFLARE_TOKEN!;
  const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID!;

  if (!CLOUDFLARE_TOKEN || !CLOUDFLARE_ACCOUNT_ID) {
    throw new Error("❌ Cloudflare credentials missing in .env");
  }

  // Default customer
  const customer = await Customer.findOneAndUpdate(
    { email: "cloudflare@signroots.com" },
    { name: "Cloudflare Client", phone: "0000000000" },
    { upsert: true, new: true }
  );

  /* -------------------- REGISTRAR DOMAINS -------------------- */
  const registrarMap: Record<string, any> = {};
  let page = 1;                 // ✅ Cloudflare starts from 1
  let fetched = 0;
  let total = 0;

  do {
    const r = await axios.get(
      `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/registrar/domains`,
      {
        headers: {
          Authorization: `Bearer ${CLOUDFLARE_TOKEN}`, // ✅ correct auth
        },
        params: { page, per_page: 50 },
      }
    );

    const result = r.data.result || [];
    total = r.data.result_info?.total_count || 0;
    fetched += result.length;

    result.forEach((d: any) => {
      registrarMap[d.name] = d;
    });

    console.log(`📄 Registrar page ${page} fetched (${result.length})`);
    page++;
  } while (fetched < total);

  /* -------------------- ZONES -------------------- */
  let zonePage = 1;
  let totalPages = 1;

  do {
    const z = await axios.get(
      "https://api.cloudflare.com/client/v4/zones",
      {
        headers: {
          Authorization: `Bearer ${CLOUDFLARE_TOKEN}`,
        },
        params: { page: zonePage, per_page: 50 },
      }
    );

    const zones = z.data.result || [];
    totalPages = z.data.result_info?.total_pages || 1;

    const ops = zones.map((zone: any) => {
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
              cloudflareRegistered: !!registrar,
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

    if (ops.length) {
      await Order.bulkWrite(ops);
      console.log(`✅ Synced ${ops.length} Cloudflare domains`);
    }

    zonePage++;
  } while (zonePage <= totalPages);

  console.log("✅ Cloudflare sync completed successfully");
}
