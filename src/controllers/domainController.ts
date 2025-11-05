// // src/controllers/domainController.ts
// import { Request, Response } from "express";
// import Domain from "../models/Domain";
// import { syncDomains } from "../services/domainSyncService";

// // ✅ GET /api/domains - Fetch all domains
// export const getDomains = async (req: Request, res: Response) => {
//   try {
//     // console.log("🔍 Fetching all domains...");

//     const domains = await Domain.find()
//       .populate("customer", "name email")   // only return customer name & email
//       .populate("registrarName", "name")    // only return registrar name
//       .populate("email_services");          // populate linked emails

//     console.log("✅ Domains fetched:", domains.length);

//     res.status(200).json({
//       success: true,
//       count: domains.length,
//       data: domains,
//     });
//   } catch (error) {
//     console.error("❌ Error fetching domains:", error);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// };

// // ✅ POST /api/domains/sync - Trigger domain sync manually
// export const syncNow = async (req: Request, res: Response) => {
//   try {
//     console.log("🔄 Starting domain sync...");
//     const synced = await syncDomains();
//     console.log("✅ Domain sync finished:", synced.length);

//     res.status(200).json({
//       success: true,
//       message: "Domains synced successfully",
//       count: synced.length,
//     });
//   } catch (error) {
//     console.error("❌ Error syncing domains:", error);
//     res.status(500).json({ success: false, message: "Sync failed" });
//   }
// };
// src/controllers/domainController.ts
import { Request, Response } from "express";
import Domain from "../models/Domain";
import { Email } from "../models/email";
import { syncDomains } from "../services/domainSyncService";

// GET /api/domains
export const getDomains = async (_req: Request, res: Response) => {
  try {
    const domains = await Domain.find()
      .populate("customer", "name email")
      .populate("registrarName", "name")
      .populate("email_services")
      .sort({ expiryDate: 1 });

    res.status(200).json({
      success: true,
      count: domains.length,
      data: domains,
    });
  } catch (error) {
    console.error("❌ Error fetching domains:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// POST /api/domains/sync
export const syncNow = async (req: Request, res: Response) => {
  try {
    const synced = await syncDomains();

    res.status(200).json({
      success: true,
      message: "Domains synced successfully",
      count: synced.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Sync failed" });
  }
};
export const getDistinctDomains = async (req: Request, res: Response) => {
  try {
    // get distinct domain names from both collections
    const domainTableNames = await Domain.distinct("domainName");
    const emailTableNames = await Email.distinct("domain");

    // merge and remove duplicates
    const allDomainNames = Array.from(
      new Set([...domainTableNames, ...emailTableNames])
    );

    // fetch domains with customer populated
    const domains = await Domain.find({
      domainName: { $in: allDomainNames },
    })
      .populate("customer", "name email")
      .populate("registrarName", "name")
      .populate("email_services") // Populate linked emails // populate customer
      .lean();

    // fetch emails with customer populated
    const emails = await Email.find({
      domain: { $in: allDomainNames },
    })
      .populate("customer") // populate customer
      .lean();

    // build result
    const result = allDomainNames.map((name) => ({
      domainName: name,
      domainInfo: domains.find((d) => d.domainName === name) || null,
      emails: emails.filter((e) => e.domain === name),
    }));

    res.json({
      success: true,
      count: result.length,
      data: result,
    });
  } catch (error) {
    console.error("❌ Error fetching distinct domains:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
export const updateDomainWithEmails = async (req: Request, res: Response) => {
  try {
    const { domainName } = req.params;
    const { domainInfo, emails } = req.body;

    // ✅ Update domain info if provided
    let updatedDomain = null;
    if (domainInfo) {
      updatedDomain = await Domain.findOneAndUpdate(
        { domainName },
        { $set: domainInfo },
        { new: true, upsert: true } // upsert: create if not exists
      );
    }

    // ✅ Update or insert emails if provided
    let updatedEmails: any[] = [];
    if (emails && Array.isArray(emails)) {
      updatedEmails = await Promise.all(
        emails.map(async (email: any) => {
          if (email._id) {
            // update existing
            return await Email.findByIdAndUpdate(
              email._id,
              { $set: email },
              { new: true }
            );
          } else {
            // create new
            return await Email.create({ ...email, domain: domainName });
          }
        })
      );
    }

    res.json({
      success: true,
      message: "Domain and emails updated successfully",
      data: {
        domain: updatedDomain,
        emails: updatedEmails,
      },
    });
  } catch (error) {
    console.error("Error updating domain and emails:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};