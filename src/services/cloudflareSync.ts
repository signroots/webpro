import axios from "axios";
import Order from "../models/Order";
import Customer from "../models/Customer";

export async function syncCloudflareDomains(): Promise<void> {
  const { CLOUDFLARE_TOKEN, CLOUDFLARE_ACCOUNT_ID } = process.env;

  if (!CLOUDFLARE_TOKEN || !CLOUDFLARE_ACCOUNT_ID) {
    throw new Error("Cloudflare credentials missing in .env");
  }

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
  let registrarPage = 1;
  const apiDomainNames: string[] = []; // keep track of domains from API

  while (true) {
    const res = await axios.get(
      `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/registrar/domains`,
      {
        headers: { Authorization: `Bearer ${CLOUDFLARE_TOKEN}` },
        params: { page: registrarPage, per_page: 30 },
      }
    );

    const domains = res.data.result || [];
    if (!domains.length) break;

    for (const domain of domains) {
      const expiryDate = domain.expires_at ? new Date(domain.expires_at) : null;
      const registrationDate = domain.registered_at ? new Date(domain.registered_at) : null;

      apiDomainNames.push(domain.name);

     await Order.findOneAndUpdate(
  { domainName: domain.name },
  {
    domainName: domain.name,
    customer: customer._id,
    status: domain.last_known_status || "active",
    registrationDate,
    expiryDate,
    cloudflareRegistered: true,
    domainSource: "cloudflare",
    managedBy: "Signroots",
    isActive: true,
    lastSyncedAt: new Date(),
    // ==================== SET FLAGS FOR ACTIVE DOMAINS ====================
    domain_flag: true,
    dns_flag: true,
  },
  { upsert: true }
);

      console.log(`✅ Synced domain: ${domain.name}, expires at: ${expiryDate}`);
    }

    if (domains.length < 30) break;
    registrarPage++;
  }

  // -------------------- MARK REMOVED DOMAINS --------------------
  const removed = await Order.updateMany(
    { domainSource: "cloudflare", domainName: { $nin: apiDomainNames } },
    {
      $set: {
        status: "Removed / Not in Cloudflare",
        isActive: false,
        lastSyncedAt: new Date(),
        // ======================== reset flags for removed domains ========================
        email_flag: false,
        website_flag: false,
        domain_flag: false,
        ssl_flag: false,
        host_flag: false,
        storage_services_flag: false,
        msoffice_services_flag: false,
        dns_flag: false,
      },
    }
  );

  console.log(`🧹 Marked ${removed.modifiedCount} domains as removed and reset flags`);
  console.log("✅ Cloudflare sync completed successfully");
}
