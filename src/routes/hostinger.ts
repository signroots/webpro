import express from "express";
import axios from "axios";
import Order from "../models/Order";
import Customer from "../models/Customer";
import DomainSource from "../models/DomainSource";
const router = express.Router();

router.get("/import-hostinger-domains", async (req, res) => {
  try {
    const hostingerSource = await DomainSource.findOne({
  code: "HOSTINGER"
});

if (!hostingerSource) {
  return res.status(400).json({
    error: "Hostinger domain source not configured"
  });
}
    const TOKEN = process.env.HOSTINGER_API_TOKEN;

    if (!TOKEN) {
      return res.status(400).json({
        error: "Hostinger API token missing",
      });
    }

    // ✅ Default customer for Hostinger-owned domains
    const hostingerCustomer = await Customer.findOneAndUpdate(
      { email: "hostinger@signroots.com" },
      { name: "Hostinger Domains", phone: "0000000000" },
      { upsert: true, new: true }
    );

    // 🔹 Fetch Hostinger portfolio
    const response = await axios.get(
      "https://developers.hostinger.com/api/domains/v1/portfolio",
      {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
        },
      }
    );

    const portfolio = response.data;

    if (!Array.isArray(portfolio) || !portfolio.length) {
      return res.json({
        message: "No Hostinger domains found in portfolio",
      });
    }

    // 🔹 Only PAID domains
    const paidDomains = portfolio.filter(
      (d: any) => d.type === "domain"
    );

    const bulkOps = paidDomains.map((d: any) => ({
      updateOne: {
        filter: { domainName: d.domain },
        update: {
          $set: {
            domainName: d.domain,
            status: d.status,
            registrationDate: d.created_at
              ? new Date(d.created_at)
              : null,
            expiryDate: d.expires_at
              ? new Date(d.expires_at)
              : null,
            managedBy: "Signroots",
            domainSource: hostingerSource._id,
            customer: hostingerCustomer._id,
            domain_flag: true,
          },
        },
        upsert: true,
      },
    }));

    if (bulkOps.length) {
      await Order.bulkWrite(bulkOps);
    }

    res.json({
      success: true,
      imported: bulkOps.length,
      ignoredFreeDomains: portfolio.length - paidDomains.length,
      totalPortfolio: portfolio.length,
    });
  } catch (error: any) {
    console.error("Hostinger Import Error:", error.response?.data || error.message);
    res.status(500).json({
      error: "Failed to import Hostinger domains",
    });
  }
});

export default router;
