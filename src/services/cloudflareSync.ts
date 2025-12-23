import axios from "axios";
import Order from "../models/Order";
import Customer from "../models/Customer";

export async function syncCloudflareDomains() {
  const CLOUDFLARE_TOKEN = process.env.CLOUDFLARE_TOKEN!;
  const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID!;
  const CLOUDFLARE_GLOBAL_KEY = process.env.CLOUDFLARE_API_KEY!;
  const CLOUDFLARE_EMAIL_ID = process.env.CLOUDFLARE_EMAIL!;

  // Default customer
  const customer = await Customer.findOneAndUpdate(
    { email: "cloudflare@signroots.com" },
    { name: "Cloudflare Client", phone: "0000000000" },
    { upsert: true, new: true }
  );

  // Registrar domains
  const registrarMap: Record<string, any> = {};
  let page = 0;
  let fetched = 0;
  let total = 0;

  do {
    const r = await axios.get(
      `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/registrar/domains`,
      {
        headers: {
          "X-Auth-Email": CLOUDFLARE_EMAIL_ID,
          "X-Auth-Key": CLOUDFLARE_GLOBAL_KEY,
        },
        params: { page, per_page: 50 },
      }
    );

    total = r.data.result_info.total_count;
    fetched += r.data.result.length;

    r.data.result.forEach((d: any) => {
      registrarMap[d.name] = d;
    });

    page++;
  } while (fetched < total);

  // Zones
  let zonePage = 1;
  let totalPages = 1;

  do {
    const z = await axios.get("https://api.cloudflare.com/client/v4/zones", {
      headers: { Authorization: `Bearer ${CLOUDFLARE_TOKEN}` },
      params: { page: zonePage, per_page: 50 },
    });

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
              cloudflareRegistered: !!registrar,
              managedBy: "Signroots",
              customer: customer._id,
              domainSource: "Cloudflare",
            },
          },
          upsert: true,
        },
      };
    });

    if (ops.length) await Order.bulkWrite(ops);
    zonePage++;
  } while (zonePage <= totalPages);

  console.log("✅ Cloudflare sync completed");
}
