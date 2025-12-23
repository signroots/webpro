import axios from "axios";
import Customer from "../models/Customer";
import Order from "../models/Order";
import { Email } from "../models/email";

export async function syncSubResellerDomains() {
  const {
    RESELLER_USER_ID,
    RESELLER_API_KEY,
  } = process.env;

  const perPage = 100;
  let page = 1;
  let totalFetched = 0;

  console.log("🔄 ResellerClub Sync Started");

  while (true) {
    const response = await axios.get(
      "https://httpapi.com/api/domains/search.json",
      {
        params: {
          "auth-userid": RESELLER_USER_ID,
          "api-key": RESELLER_API_KEY,
          "no-of-records": perPage,
          "page-no": page,
        },
      }
    );

    const rawData = response.data;
    const domainKeys = Object.keys(rawData).filter(k => /^\d+$/.test(k));

    if (domainKeys.length === 0) break;

    for (const key of domainKeys) {
      const d = rawData[key];

      const domainName = d["entity.description"];
      const resellerCustomerId = d["entity.customerid"];

      // 🔹 Fetch customer
      const customerRes = await axios.get(
        "https://httpapi.com/api/customers/details-by-id.json",
        {
          params: {
            "auth-userid": RESELLER_USER_ID,
            "api-key": RESELLER_API_KEY,
            "customer-id": resellerCustomerId,
          },
        }
      );

      const c = customerRes.data;

      // 🔹 Upsert customer
      const customer = await Customer.findOneAndUpdate(
        { resellerCustomerId: c.customerid },
        {
          name: c.name,
          email: c.useremail,
          company: c.company,
          address: c.address1,
          city: c.city,
          country: c.country,
          phone: c.mobileno,
          resellerCustomerId: c.customerid,
        },
        { upsert: true, new: true }
      );

      const expiryDate = d["orders.endtime"]
        ? new Date(Number(d["orders.endtime"]) * 1000)
        : null;

      const registrationDate = d["orders.creationtime"]
        ? new Date(Number(d["orders.creationtime"]) * 1000)
        : null;

      // 🔹 Upsert domain
      const order = await Order.findOneAndUpdate(
        { domainName },
        {
          domainName,
          customer: customer._id,
          status: d["entity.currentstatus"],
          managedBy: "Signroots",
          registrationDate,
          expiryDate,
          lockStatus: d["orders.transferlock"] === "true" ? "Locked" : "Unlocked",
          domainSource: "resellerclub",
          reseller_outside_inside: "SubReseller",
          reseller_id: c.resellerid,
          resellerCustomerId: c.customerid,
        },
        { upsert: true, new: true }
      );

      // 🔹 Link emails if exist
      const emails = await Email.find({ domain: domainName });
      if (emails.length > 0) {
        await Order.findByIdAndUpdate(order._id, {
          $addToSet: {
            email_services: { $each: emails.map(e => e._id) },
          },
        });
      }

      totalFetched++;
    }

    page++;
  }

  console.log(`✅ ResellerClub Sync Completed → ${totalFetched} domains`);
}
