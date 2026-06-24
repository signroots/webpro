import express, { Request, Response } from "express";
import axios from "axios";
import dotenv from "dotenv";

import Customer from "../models/Customer";
import Order from "../models/Order";
import { Email } from "../models/email";

dotenv.config();
const router = express.Router();

/* ======================================================
   GET ALL DOMAINS (with customer + email services)
====================================================== */
router.get("/", async (_req: Request, res: Response) => {
  try {
    const domains = await Order.find()
      .populate("customer")
      .populate("email_services")
      .sort({ expiryDate: 1 });

    res.status(200).json(domains);
  } catch (error) {
    console.error("❌ Error fetching domains:", error);
    res.status(500).json({ error: "Failed to fetch domains" });
  }
});

/* ======================================================
   IMPORT DOMAINS FROM RESELLERCLUB (INLINE)
====================================================== */
router.get("/import/resellerclub", async (_req: Request, res: Response) => {
  try {
    const {
      RESELLER_USER_ID,
      RESELLER_API_KEY
    } = process.env;

    if (!RESELLER_USER_ID || !RESELLER_API_KEY) {
      return res.status(400).json({
        error: "ResellerClub credentials missing in .env",
      });
    }

    console.log("🚀 ResellerClub import started");

    /* ---------- FETCH DOMAINS ---------- */
    const response = await axios.get(
      "https://httpapi.com/api/domains/search.json",
      {
        params: {
          "auth-userid": RESELLER_USER_ID,
          "api-key": RESELLER_API_KEY,
          "no-of-records": 100,
          "page-no": 1,
        },
      }
    );

    const rawData = response.data;
    const savedDomains: any[] = [];

    /* ---------- LOOP DOMAINS ---------- */
    for (const key of Object.keys(rawData)) {
      if (!/^\d+$/.test(key)) continue;

      const d = rawData[key];
      const domainName = d["entity.description"];
      const resellerCustomerId = d["entity.customerid"];

      console.log(`➕ Processing domain: ${domainName}`);

      /* ---------- CUSTOMER DETAILS ---------- */
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

      const customerData = customerRes.data;

      /* ---------- UPSERT CUSTOMER ---------- */
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

      /* ---------- DOMAIN DATA ---------- */
      const domainData = {
        domainName,
        customer: customer._id,
        status: d["entity.currentstatus"],
        managedBy: "Signroots",
        registrationDate: new Date(
          Number(d["orders.creationtime"]) * 1000
        ),
        expiryDate: new Date(Number(d["orders.endtime"]) * 1000),
        originalRegistrar: "-",
        lockStatus:
          d["orders.transferlock"] === "true" ? "Locked" : "Unlocked",
        domainSource: "resellerclub",
        nameServers: [],
        dnsDetails: [],
        reseller_outside_inside: "SubReseller",
        reseller_id: customerData.resellerid,
        resellerCustomerId: customerData.customerid,
      };

      /* ---------- UPSERT DOMAIN ---------- */
      const savedDomain = await Order.findOneAndUpdate(
        { domainName },
        domainData,
        { upsert: true, new: true }
      );

      /* ---------- LINK EMAIL SERVICES ---------- */
      const matchingEmails = await Email.find({ domain: domainName });
      if (matchingEmails.length > 0) {
        await Order.findByIdAndUpdate(savedDomain._id, {
          $addToSet: {
            email_services: {
              $each: matchingEmails.map((e) => e._id),
            },
          },
        });
      }

      savedDomains.push(savedDomain);
    }

    console.log("✅ ResellerClub import completed");

    res.status(200).json({
      success: true,
      message: "Reseller domains imported successfully",
      count: savedDomains.length,
      data: savedDomains,
    });
  } catch (error: any) {
    console.error("❌ Import Error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to import domains",
      message: error.response?.data || error.message,
    });
  }
});

export default router;
