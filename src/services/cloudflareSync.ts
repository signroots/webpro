import axios from "axios";
import Order from "../models/Order";
import Customer from "../models/Customer";

/**
 * Sync all Cloudflare domains (registrar + zones) into MongoDB.
 */
export async function syncCloudflareDomains(): Promise<void> {
  const { CLOUDFLARE_TOKEN, CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_EMAIL, CLOUDFLARE_API_KEY } = process.env;

  if (!CLOUDFLARE_TOKEN || !CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_EMAIL || !CLOUDFLARE_API_KEY) {
    throw new Error("Cloudflare credentials missing in .env");
  }

  // -------------------- CREATE/UPDATE DEFAULT CUSTOMER --------------------
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
 let registrarPage = 0; // start from page 0
const apiDomainNames: string[] = []; // track domains from API

while (true) {
  const res = await axios.get(
    `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/registrar/domains`,
    {
      headers: {
        "X-Auth-Email": CLOUDFLARE_EMAIL,
        "X-Auth-Key": CLOUDFLARE_API_KEY,
        "Content-Type": "application/json",
      },
      params: { page: registrarPage, per_page: 50 },
    }
  );

  const domains = res.data.result || [];
  const totalPages = res.data.result_info?.total_pages || 1;

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
        domain_flag: true,
        dns_flag: true,
      },
      { upsert: true }
    );

    console.log(`✅ Synced registrar domain: ${domain.name}, expires at: ${expiryDate}`);
  }

  registrarPage++;

  if (registrarPage >= totalPages) break; // stop when all pages are fetched
}
  // -------------------- FETCH ALL CLOUD ZONES --------------------
  let zonePage = 1;
  const zoneDomainNames: string[] = [];

  while (true) {
    const res = await axios.get("https://api.cloudflare.com/client/v4/zones", {
      headers: { Authorization: `Bearer ${CLOUDFLARE_TOKEN}` },
      params: { page: zonePage, per_page: 50 },
    });

    const zones = res.data.result || [];
    if (!zones.length) break;

    for (const zone of zones) {
  zoneDomainNames.push(zone.name);

  // Fetch existing Order if exists
  const existingOrder = await Order.findOne({ domainName: zone.name });

  await Order.findOneAndUpdate(
    { domainName: zone.name },
    {
      domainName: zone.name,
      customer: customer._id,
      status: zone.status || "active",
      registrationDate: existingOrder?.registrationDate || new Date(zone.created_on),
      expiryDate: existingOrder?.expiryDate || null, // Keep existing expiry date
      cloudflareRegistered: existingOrder?.cloudflareRegistered || false,
      domainSource: "cloudflare",
      managedBy: "Signroots",
      nameServers: zone.name_servers || [],
      is_dns: zone.original_dnshost || false,
      lockStatus: zone.paused ? "Locked" : "Unlocked",
      isActive: true,
      lastSyncedAt: new Date(),
      domain_flag: true,
      dns_flag: true,
    },
    { upsert: true }
  );

  console.log(`🌐 Synced zone: ${zone.name}, status: ${zone.status}`);
}

    if (zones.length < 50) break;
    zonePage++;
  }

  // -------------------- MARK REMOVED DOMAINS --------------------
  const allCloudflareDomains = [...new Set([...apiDomainNames, ...zoneDomainNames])];

  const removed = await Order.updateMany(
    { domainSource: "cloudflare", domainName: { $nin: allCloudflareDomains } },
    {
      $set: {
        status: "Removed / Not in Cloudflare",
        isActive: false,
        lastSyncedAt: new Date(),
        // ======================== RESET FLAGS FOR REMOVED DOMAINS ========================
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
