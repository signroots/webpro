import axios from "axios";
import Order from "../models/Order";
import Customer from "../models/Customer";

export async function syncResellerClubDomains() {
  const { MAIN_RESELLER_USER_ID, MAIN_RESELLER_API_KEY } = process.env;

  if (!MAIN_RESELLER_USER_ID || !MAIN_RESELLER_API_KEY) {
    throw new Error("ResellerClub credentials missing in .env");
  }

  const perPage = 100;
  let page = 1;
  let allDomains: any[] = [];

  console.log("🔄 Starting ResellerClub sync...");

  /* -------------------- FETCH ALL DOMAINS (PAGINATED) -------------------- */
  while (true) {
    const response = await axios.get(
      "https://httpapi.com/api/domains/search.json",
      {
        params: {
          "auth-userid": MAIN_RESELLER_USER_ID,
          "api-key": MAIN_RESELLER_API_KEY,
          "no-of-records": perPage,
          "page-no": page,
        },
      }
    );

    const rawData = response.data;
    const keys = Object.keys(rawData).filter(k => /^\d+$/.test(k));

    if (!keys.length) break;

    keys.forEach(k => allDomains.push(rawData[k]));
    console.log(`📄 Page ${page} fetched (${keys.length} domains)`);

    page++;
  }

  console.log(`📦 Total domains fetched: ${allDomains.length}`);

  /* -------------------- UPSERT DOMAINS & CUSTOMERS -------------------- */
  for (const d of allDomains) {
    try {
      const domainName = d["entity.description"];
      const resellerCustomerId = d["entity.customerid"];

      /* -------- FETCH CUSTOMER DETAILS -------- */
      let customerData;
      try {
        const customerRes = await axios.get(
          "https://httpapi.com/api/customers/details-by-id.json",
          {
            params: {
              "auth-userid": MAIN_RESELLER_USER_ID,
              "api-key": MAIN_RESELLER_API_KEY,
              "customer-id": resellerCustomerId,
            },
          }
        );
        customerData = customerRes.data;
      } catch (err) {
        console.error(`❌ Failed to fetch customer ${resellerCustomerId}`);
        continue;
      }

      /* -------- UPSERT CUSTOMER -------- */
      const customer = await Customer.findOneAndUpdate(
        { resellerCustomerId: customerData.customerid },
        {
          name: customerData.name,
          email: customerData.useremail,
          company: customerData.company,
          phone: customerData.mobileno,
          country: customerData.country,
          state: customerData.state,
          resellerCustomerId: customerData.customerid,
          lastSyncedAt: new Date(),
        },
        { upsert: true, new: true }
      );

      /* -------- EXPIRY DATE -------- */
      let expiryDate: Date | null = null;
      if (d["orders.endtime"]) {
        expiryDate = new Date(Number(d["orders.endtime"]) * 1000);
      }

      /* -------- UPSERT DOMAIN -------- */
      await Order.findOneAndUpdate(
        { domainName },
        {
          domainName,
          customer: customer._id,
          status: d["entity.currentstatus"],
          expiryDate,
          registrationDate: new Date(
            Number(d["orders.creationtime"]) * 1000
          ),
          resellerCustomerId,
          reseller_id: customerData.resellerid,
          domainSource: "resellerclub",
          isActive: true,
          lastSyncedAt: new Date(),
        },
        { upsert: true }
      );

      console.log(`✅ Synced domain: ${domainName}`);
    } catch (err) {
      console.error("❌ Domain sync error:", err);
    }
  }

  /* -------------------- HANDLE REMOVED / TRANSFERRED DOMAINS -------------------- */
  const apiDomainNames = allDomains.map(
    d => d["entity.description"]
  );

  const removed = await Order.updateMany(
    {
      domainSource: "resellerclub",
      domainName: { $nin: apiDomainNames },
    },
    {
      $set: {
        status: "Transferred / Removed",
        isActive: false,
        lastSyncedAt: new Date(),
      },
    }
  );

  console.log(`🧹 Marked ${removed.modifiedCount} domains as removed`);
  console.log("✅ ResellerClub sync completed successfully");
}
