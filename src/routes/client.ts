import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import Customer, { IClient } from "../models/Client";
import Order from '../models/Order';
import Domain from '../models/Domain';
import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import mongoose from 'mongoose';
import Client from '../models/Client';
dotenv.config();
interface UpdateClientBody {
  c_name?: string;
  c_email?: string[];
  c_phone?: string;
  c_company?: string;
  c_address?: string;
  c_city?: string;
  c_state?: string;
  c_country?: string;
  c_zipCode?: string;
  password?:string;
  resellerCustomerId?: string;
}
const router = express.Router();
// router.get('/', async (_req, res) => {
//     try {
//       const customers = await Client.find().sort({ createdAt: -1 });
//       res.status(200).json(customers);
//     } catch (err: any) {
//       console.error(' Error fetching customers:', err.message);
//       res.status(500).json({ error: 'Failed to fetch customized customers' });
//     }
//   });

router.get('/', async (_req, res) => {
  try {
    const customers = await Client.find()
      .sort({ createdAt: -1 })
      .populate('c_country', 'name code')
      .populate('c_state', 'name code country')
      .lean();

    res.status(200).json(customers);
  } catch (err: any) {
    console.error('Error fetching customers:', err.message);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});



router.post("/", async (req: Request, res: Response): Promise<any> => {
  try {
    console.log("Incoming request body:", req.body);

    let c_email: string[] = [];

    // ✅ Normalize email
    if (typeof req.body.c_email === "string") {
      c_email = req.body.c_email.split(",").map((e: string) => e.trim());
    } else if (Array.isArray(req.body.c_email)) {
      c_email = req.body.c_email
        .flatMap((e: string) => e.split(","))
        .map((e: string) => e.trim());
    }

    if (!c_email.length || !c_email[0]) {
      return res.status(400).json({
        success: false,
        error: "Customer email is required.",
      });
    }

    // ✅ Duplicate email check
    const primaryEmail = c_email[0].toLowerCase();
    const existingCustomer = await Customer.findOne({
      c_email: { $elemMatch: { $regex: new RegExp(`^${primaryEmail}$`, "i") } },
    });

    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        error: "Primary email already exists.",
      });
    }

    // ✅ Password generation
    let plainPassword: string;
    if (req.body.password?.trim()) {
      plainPassword = req.body.password.trim();
    } else {
      plainPassword =
        Math.random().toString(36).slice(-8) +
        crypto.randomBytes(2).toString("hex");
    }

    // ✅ Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);

    // ✅ Encrypt password
    const key = crypto
      .createHash("sha256")
      .update(process.env.ENCRYPTION_SECRET || "default_secret")
      .digest();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
    let encrypted = cipher.update(plainPassword, "utf8", "hex");
    encrypted += cipher.final("hex");
    const encryptedPassword = iv.toString("hex") + ":" + encrypted;

    // ✅ STORE EVERYTHING (this is the FIX)
    const customerData: any = {
      ...req.body,              // 🔥 ALL frontend fields
      c_email,                  // normalized
      password: hashedPassword,
      encryptedPassword,
      is_customer: true,
      resellerCustomerId: req.body.resellerCustomerId || uuidv4(),
      userType: req.body.userType
        ? new mongoose.Types.ObjectId(req.body.userType)
        : new mongoose.Types.ObjectId("6900a4ef87b9fe9ff304e91e"),
    };

    // ❌ Never allow plain password to be saved
    delete customerData.password;
    delete customerData.c_password;

    const customer = await Customer.create(customerData);

    res.status(201).json({
      success: true,
      message: "Customer created successfully",
      data: {
        ...customer.toObject(),
        generatedPassword: req.body.password ? undefined : plainPassword,
      },
    });
  } catch (err: any) {
    console.error("Error creating customer:", err);
    res.status(500).json({
      success: false,
      error: "Failed to create customer",
      details: err.message,
    });
  }
});

router.put("/:id", async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    console.log(`[DEBUG] Updating customer with ID: ${id}`);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: "Invalid customer ID" });
    }

    const updateData: any = {};

    /* =======================
       EMAIL NORMALIZATION
    ======================= */
    if (req.body.c_email !== undefined) {
      let emails: string[] = [];

      if (typeof req.body.c_email === "string") {
        emails = req.body.c_email
          .split(",")
          .map((e: string) => e.trim())
          .filter(Boolean);
      } else if (Array.isArray(req.body.c_email)) {
        emails = req.body.c_email
          .flatMap((e: string) => e.split(","))
          .map((e: string) => e.trim())
          .filter(Boolean);
      }

      if (!emails.length) {
        return res.status(400).json({
          success: false,
          error: "Customer email is required.",
        });
      }

      const primaryEmail = emails[0].toLowerCase();
      const existingCustomer = await Customer.findOne({
        _id: { $ne: id },
        c_email: { $elemMatch: { $regex: new RegExp(`^${primaryEmail}$`, "i") } },
      });

      if (existingCustomer) {
        return res.status(400).json({
          success: false,
          error: "Primary email already exists for another customer.",
        });
      }

      updateData.c_email = emails;
    }

    /* =======================
       PASSWORD UPDATE
    ======================= */
    if (req.body.password && typeof req.body.password === "string") {
      const plainPassword = req.body.password.trim();

      if (plainPassword) {
        console.log("[DEBUG] Updating password...");

        const salt = await bcrypt.genSalt(10);
        updateData.password = await bcrypt.hash(plainPassword, salt);

        const key = crypto
          .createHash("sha256")
          .update(process.env.ENCRYPTION_SECRET || "default_secret")
          .digest();
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
        let encrypted = cipher.update(plainPassword, "utf8", "hex");
        encrypted += cipher.final("hex");

        updateData.encryptedPassword = iv.toString("hex") + ":" + encrypted;
      }
    }

    /* =======================
       ALL OTHER FIELDS
    ======================= */
    const ignoredFields = ["_id", "password", "encryptedPassword", "__v"];

    for (const [key, value] of Object.entries(req.body)) {
      if (
        value !== undefined &&
        !ignoredFields.includes(key) &&
        key !== "c_email"
      ) {
        updateData[key] = value;
      }
    }

    console.log("[DEBUG] Final update data:", updateData);

    const updatedCustomer = await Customer.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedCustomer) {
      return res.status(404).json({
        success: false,
        error: "Customer not found",
      });
    }

    return res.json({
      success: true,
      message: "Customer updated successfully",
      data: updatedCustomer,
    });
  } catch (err: any) {
    console.error("[ERROR] Customer update failed:", err);
    return res.status(500).json({
      success: false,
      error: "Server error",
      details: err.message,
    });
  }
});
router.get(
  "/:id/orders",
  async (req: Request, res: Response): Promise<any> => {
    try {
      const { id } = req.params;

      // ✅ Validate client id
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          error: "Invalid client ID",
        });
      }

      // ✅ Check client exists
      const client = await Client.findById(id);
      if (!client) {
        return res.status(404).json({
          success: false,
          error: "Client not found",
        });
      }

      // ✅ Fetch orders for this client
      const orders = await Order.find({ client: id })
        .populate("client", "c_name c_email c_phone c_company")
        .populate("registrarName", "name")
        .populate("emailtypeid planid hosttypeid subHostTypeId hoststorageId")
        .sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        client: {
          _id: client._id,
          c_name: client.c_name,
          c_email: client.c_email,
          c_phone: client.c_phone,
          c_company: client.c_company,
        },
        totalOrders: orders.length,
        orders,
      });
    } catch (err: any) {
      console.error("Error fetching client orders:", err.message);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch client orders",
        details: err.message,
      });
    }
  }
);
export default router;
