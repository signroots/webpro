import { Router, Request, Response } from "express";
import { Email } from "../models/email";

const router = Router();

// ✅ GET all emails (with optional filtering by provider)
router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const { provider, search } = req.query;

    let filter: any = {};

    // Filter by provider if provided
    if (provider) {
      filter.provider = provider;
    }

    // Optional: add search filter (domain, username, customer)
    if (search) {
      filter.$or = [
        { domain: { $regex: search as string, $options: "i" } },
        { username: { $regex: search as string, $options: "i" } },
        { customer: { $regex: search as string, $options: "i" } },
      ];
    }

    const emails = await Email.find(filter).lean();
    res.json(emails);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch emails" });
  }
});

// ✅ GET all emails
router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const emails = await Email.find().lean();
    res.json(emails);   // 👈 no "return"
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch emails" });
  }
});

// ✅ GET single email by ID
router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const email = await Email.findById(req.params.id);
    if (!email) {
      res.status(404).json({ error: "Email not found" });
      return;
    }
    res.json(email);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch email" });
  }
});
// ✅ EDIT email (update by ID)
router.put("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const updateData: any = {};

    if (req.body.domain) updateData.domain = req.body.domain;
    if (req.body.subscription) updateData.subscription = req.body.subscription;
    if (req.body.username) updateData.username = req.body.username;
    if (req.body.customer) updateData.customer = req.body.customer; // only if non-empty
    if (req.body.users !== undefined) updateData.users = Number(req.body.users);
    if (req.body.password) updateData.password = req.body.password; // only if non-empty
    if (req.body.status) updateData.status = req.body.status;
    if (req.body.provider) updateData.provider = req.body.provider;
    if (req.body.creationDate) updateData.creationDate = new Date(req.body.creationDate);
    if (req.body.expiryDate) updateData.expiryDate = new Date(req.body.expiryDate);

    const updatedEmail = await Email.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).lean();

    if (!updatedEmail) {
      res.status(404).json({ error: "Email not found" });
      return;
    }

    res.json(updatedEmail);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update email" });
  }
});

export default router;
