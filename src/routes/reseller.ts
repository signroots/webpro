import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import Domain from "../models/Domain";    // ✅ correct
import Customer from "../models/Customer"; // ✅ correct
import { Email } from "../models/email";      // ✅ must match file name

dotenv.config();
const router = express.Router();

// ✅ Get all domains with customer + emails populated
router.get("/", async (_req, res) => {
  try {
    const domains = await Domain.find()
      .populate("customer")
      .populate("email_services")
      .sort({ expiryDate: 1 });

    res.status(200).json(domains);
  } catch (err) {
    console.error("❌ Error fetching domains:", err);
    res.status(500).json({ error: "Failed to fetch domains" });
  }
});

// ✅ Example import route (ResellerClub)
router.get("/import/resellerclub", async (_req, res) => {
  try {
    const { RESELLER_USER_ID, RESELLER_API_KEY, MAIN_RESELLER_USER_ID } = process.env;

    const response = await axios.get("https://httpapi.com/api/domains/search.json", {
      params: {
        "auth-userid": RESELLER_USER_ID,
        "api-key": RESELLER_API_KEY,
        "no-of-records": 100,
        "page-no": 1,
      },
    });

    const rawData = response.data;
    const savedDomains = [];

    for (const key of Object.keys(rawData)) {
      if (!/^\d+$/.test(key)) continue;

      const d = rawData[key];
      const domainName = d["entity.description"];
      const resellerCustomerId = d["entity.customerid"];

      // ✅ get customer details
      const customerRes = await axios.get("https://httpapi.com/api/customers/details-by-id.json", {
        params: {
          "auth-userid": RESELLER_USER_ID,
          "api-key": RESELLER_API_KEY,
          "customer-id": resellerCustomerId,
        },
      });

      const customerData = customerRes.data;

      // ✅ save/update customer
      const customer = await Customer.findOneAndUpdate(
        { resellerCustomerId: customerData.customerid },
        {
          name: customerData.name,
          email: customerData.useremail,
          company: customerData.company,
          address: customerData.address1,
          city: customerData.city,
          country: customerData.country,
          phone: customerData.mobileno,
          resellerCustomerId: customerData.customerid,
        },
        { new: true, upsert: true }
      );

      // ✅ build domain data
      const domainData = {
        domainName,
        customer: customer._id,
        status: d["entity.currentstatus"],
        managedBy: "Signroots",
        registrationDate: new Date(Number(d["orders.creationtime"]) * 1000),
        expiryDate: new Date(Number(d["orders.endtime"]) * 1000),
        originalRegistrar: "-",
        lockStatus: d["orders.transferlock"] === "true" ? "Locked" : "Unlocked",
        domainSource: ["resellerclub"],
        nameServers: [],
        dnsDetails: [],
        reseller_outside_inside: "SubReseller",
        reseller_id: customerData.resellerid,
        resellerCustomerId: customerData.customerid,
      };

      // ✅ save/update domain
      const saved = await Domain.findOneAndUpdate({ domainName }, domainData, { upsert: true, new: true });

      // ✅ link any existing email accounts
      const matchingEmails = await Email.find({ domain: domainName });
      if (matchingEmails.length > 0) {
        await Domain.findByIdAndUpdate(saved._id, {
          $addToSet: { email_services: { $each: matchingEmails.map((e) => e._id) } },
        });
      }

      savedDomains.push(saved);
    }

    res.status(200).json({
      message: "✅ Reseller domains imported successfully",
      count: savedDomains.length,
      data: savedDomains,
    });
  } catch (error: any) {
    console.error("❌ Import Error:", error.message);
    res.status(500).json({ error: "❌ Failed to import domains" });
  }
});

export default router;
