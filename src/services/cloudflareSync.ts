import axios from "axios";
import Order from "../models/Order";
import Customer from "../models/Customer";

export async function syncCloudflareDomains(): Promise<void> {
  const { CLOUDFLARE_TOKEN, CLOUDFLARE_ACCOUNT_ID } = process.env;

  if (!CLOUDFLARE_TOKEN || !CLOUDFLARE_ACCOUNT_ID) {
    throw new Error("Cloudflare credentials missing in .env");
  }

  console.log("🔄 Starting Cloudflare sync...");

  // -------------------- DEFAULT CUSTOMER --------------------
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

  // -------------------- FETCH REGISTRAR DOMAINS --------------------
  const registrarMap: Record<string, any> = {};
  let page = 1;

  while (true) {
    const res = await axios.get(
      `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/registrar/domains`,
      {
        headers: { Authorization: `Bearer ${CLOUDFLARE_TOKEN}` },
        params: { page, per_page: 30 },
      }
    );

    const domains = res.data.result || [];
    if (!domains.length) break;

    domains.forEach((d: any) => {
      registrarMap[d.name] = d; // store entire domain info for easy lookup
    });

    console.log(`📄 Registrar page ${page} fetched (${domains.length} domains)`);

    if (domains.length < 30) break;
    page++;
  }

  console.log(`📦 Total registrar domains fetched: ${Object.keys(registrarMap).length}`);

  // -------------------- FETCH ZONES --------------------
  let zonePage = 1;
  let totalPages = 1;
  const apiDomainNames: string[] = [];

  do {
    const res = await axios.get("https://api.cloudflare.com/client/v4/zones", {
      headers: { Authorization: `Bearer ${CLOUDFLARE_TOKEN}` },
      params: { page: zonePage, per_page: 50 },
    });

    const zones = res.data.result || [];
    totalPages = res.data.result_info?.total_pages || 1;

    for (const zone of zones) {
      try {
        apiDomainNames.push(zone.name);

        // Check if registrar info exists for this domain
        const registrar = registrarMap[zone.name];

        const expiryDate = registrar?.expires_at ? new Date(registrar.expires_at) : null;
        const registrationDate = registrar?.registered_at
          ? new Date(registrar.registered_at)
          : zone.created_on
          ? new Date(zone.created_on)
          : null;

        await Order.findOneAndUpdate(
          { domainName: zone.name },
          {
            domainName: zone.name,
            customer: customer._id,
            status: registrar?.last_known_status || zone.status || "active",
            registrationDate,
            expiryDate, // ✅ store expiry date from registrar
            cloudflareRegistered: !!registrar,
            domainSource: "cloudflare",
            managedBy: "Signroots",
            isActive: true,
            lastSyncedAt: new Date(),
          },
          { upsert: true }
        );

        console.log(`✅ Synced domain: ${zone.name}, expires at: ${expiryDate}`);
      } catch (err) {
        console.error(`❌ Failed to sync domain ${zone.name}`, err);
      }
    }

    console.log(`🌐 Zone page ${zonePage} synced (${zones.length} zones)`);
    zonePage++;
  } while (zonePage <= totalPages);

  // -------------------- MARK REMOVED DOMAINS --------------------
  const removed = await Order.updateMany(
    { domainSource: "cloudflare", domainName: { $nin: apiDomainNames } },
    { $set: { status: "Removed / Not in Cloudflare", isActive: false, lastSyncedAt: new Date() } }
  );

  console.log(`🧹 Marked ${removed.modifiedCount} domains as removed`);
  console.log("✅ Cloudflare sync completed successfully");
}
