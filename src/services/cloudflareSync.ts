import axios from "axios";
import Order from "../models/Order";
import Customer from "../models/Customer";

export async function syncCloudflareDomains() {
  const { CLOUDFLARE_TOKEN, CLOUDFLARE_ACCOUNT_ID } = process.env;

  if (!CLOUDFLARE_TOKEN || !CLOUDFLARE_ACCOUNT_ID) {
    throw new Error("Cloudflare credentials missing in .env");
  }

  console.log("🔄 Starting Cloudflare sync...");

  /* -------------------- DEFAULT CUSTOMER -------------------- */
  const customer = await Customer.findOneAndUpdate(
    { email: "cloudflare@signroots.com" },
    {
      name: "Cloudflare Client",
      email: "cloudflare@signroots.com",
      phone: "0000000000",
      domainSource: "cloudflare",
      lastSyncedAt: new Date(),
    },
    { upsert: true, new: true }
  );

  /* -------------------- FETCH REGISTRAR DOMAINS -------------------- */
  const registrarMap: Record<string, any> = {};
  let page = 1;

  while (true) {
    const res = await axios.get(
      `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/registrar/domains`,
      {
        headers: {
          Authorization: `Bearer ${CLOUDFLARE_TOKEN}`,
        },
        params: { page, per_page: 30 },
      }
    );

    const domains = res.data.result || [];
    const count = res.data.result_info?.count || domains.length;

    if (!domains.length) break;

    domains.forEach((d: any) => {
      registrarMap[d.name] = d;
    });

    console.log(`📄 Registrar page ${page} fetched (${count})`);

    if (count < 30) break;
    page++;
  }

  console.log(`📦 Registrar domains: ${Object.keys(registrarMap).length}`);

  /* -------------------- FETCH ZONES -------------------- */
  let zonePage = 1;
  let totalPages = 1;
  const apiDomainNames: string[] = [];

  do {
    const res = await axios.get(
      "https://api.cloudflare.com/client/v4/zones",
      {
        headers: {
          Authorization: `Bearer ${CLOUDFLARE_TOKEN}`,
        },
        params: { page: zonePage, per_page: 50 },
      }
    );

    const zones = res.data.result || [];
    totalPages = res.data.result_info?.total_pages || 1;

    for (const z of zones) {
      try {
        const registrar = registrarMap[z.name];
        apiDomainNames.push(z.name);

        let expiryDate: Date | null = null;
        if (registrar?.expires_at) {
          expiryDate = new Date(registrar.expires_at);
        }

        await Order.findOneAndUpdate(
          { domainName: z.name },
          {
            domainName: z.name,
            customer: customer._id,
            status: z.status,
            registrationDate: new Date(z.created_on),
            expiryDate,
            cloudflareRegistered: !!registrar,
            domainSource: "cloudflare",
            managedBy: "Signroots",
            isActive: true,
            lastSyncedAt: new Date(),
          },
          { upsert: true }
        );

        console.log(`✅ Synced domain: ${z.name}`);
      } catch (err) {
        console.error(`❌ Failed to sync ${z.name}`, err);
      }
    }

    console.log(`🌐 Zone page ${zonePage} synced (${zones.length})`);
    zonePage++;
  } while (zonePage <= totalPages);

  /* -------------------- MARK REMOVED DOMAINS -------------------- */
  const removed = await Order.updateMany(
    {
      domainSource: "cloudflare",
      domainName: { $nin: apiDomainNames },
    },
    {
      $set: {
        status: "Removed / Not in Cloudflare",
        isActive: false,
        lastSyncedAt: new Date(),
      },
    }
  );

  console.log(`🧹 Marked ${removed.modifiedCount} domains as removed`);
  console.log("✅ Cloudflare sync completed successfully");
}
