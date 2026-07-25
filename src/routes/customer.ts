import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import Customer, { ICustomer } from "../models/Customer";
import Domain from '../models/Domain';
import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import mongoose from 'mongoose';
dotenv.config();
interface UpdateCustomerBody {
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
router.get('/', async (_req, res) => {
    try {
      const customers = await Customer.find().sort({ createdAt: -1 });
      res.status(200).json(customers);
    } catch (err: any) {
      console.error(' Error fetching customers:', err.message);
      res.status(500).json({ error: 'Failed to fetch customers' });
    }
  });
//  Route to import customer details
router.get('/import/customers', async (_req, res) => {
  try {
    const { RESELLER_USER_ID, RESELLER_API_KEY } = process.env;

    //  Step 1: Get all unique customer IDs from domains
    const domains = await Domain.find({}, 'domainName customer resellerCustomerId');
    const customerIdSet = new Set<string>();

    for (const d of domains) {
      if (d?.resellerCustomerId) {
        customerIdSet.add(d.resellerCustomerId);
      }
    }

    const customerIds = Array.from(customerIdSet);
    const savedCustomers = [];

    //  Step 2: Fetch each customer from ResellerClub and save to DB
    for (const customerId of customerIds) {
      const response = await axios.get('https://httpapi.com/api/customers/details-by-id.json', {
        params: {
          'auth-userid': RESELLER_USER_ID,
          'api-key': RESELLER_API_KEY,
          'customer-id': customerId
        }
      });

      const c = response.data;

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
          resellerCustomerId: c.customerid
        },
        { upsert: true, new: true }
      );

      savedCustomers.push(customer);
    }

    res.status(200).json({
      message: 'Customers imported successfully',
      count: savedCustomers.length,
      data: savedCustomers
    });

  } catch (err: any) {
    console.error('Customer import failed:', err.message);
    res.status(500).json({ error: 'Customer import failed ' });
  }
});
// -------------------- Create New Customer (with c_* fields) --------------------
router.post("/", async (req, res) => {
  try {
    console.log("Incoming request body:", req.body);

    const customerData = {
      c_name: req.body.c_name,
      c_email: req.body.c_email,
      c_phone: req.body.c_phone,
      c_company: req.body.c_company,
      c_address: req.body.c_address,
      c_city: req.body.c_city,
      c_state: req.body.c_state,
      c_country: req.body.c_country,
      c_zipCode: req.body.c_zipCode,
      c_gst:req.body.c_gst,
      is_customer: true,
      resellerCustomerId: req.body.resellerCustomerId || uuidv4(),
      userType: req.body.userType
        ? new mongoose.Types.ObjectId(req.body.userType)
        : new mongoose.Types.ObjectId("68d51af328d7e1d888945ac8"), // default ObjectId
    };

    const customer = await Customer.create(customerData);
    res.status(201).json(customer);
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("Error creating customer:", err.message);
      res.status(500).json({ error: "Failed to create customer", details: err.message });
    } else {
      console.error("Unknown error creating customer:", err);
      res.status(500).json({ error: "Failed to create customer" });
    }
  }
});

// PUT /api/customers/:id
router.put("/:id", async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;

    const updateData: Partial<UpdateCustomerBody> = {};
    const allowedFields: (keyof UpdateCustomerBody)[] = [
      "c_name",
      "c_email",
      "c_phone",
      "c_company",
      "c_address",
      "c_city",
      "c_state",
      "c_country",
      "c_zipCode",
      "password",
      "resellerCustomerId",
    ];

    for (const field of allowedFields) {
      const value = req.body[field];

      if (value !== undefined) {
        if (field === "c_email" && typeof value === "string") {
          updateData[field] = [value];
        } else if (field === "password") {
          // Hash password using bcryptjs
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(value, salt);
          updateData[field] = hashedPassword;
        } else {
          updateData[field] = value;
        }
      }
    }

    const updatedCustomer = await Customer.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );

    if (!updatedCustomer) return res.status(404).json({ message: "Customer not found" });

    return res.json(updatedCustomer);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});
// -------------------- Update Customer (with c_* fields) --------------------

router.post(
  "/reseller_customer/:id",
  async (req: Request, res: Response): Promise<void> => {
    try {
      // 1️⃣ Fetch original customer (before update)
      const originalCustomer = await Customer.findById(req.params.id);
      if (!originalCustomer) {
        res.status(404).json({ error: "❌ Customer not found" });
        return;
      }

      // 2️⃣ Update Local DB
      const updatedCustomer = await Customer.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );

      if (!updatedCustomer) {
        res.status(404).json({ error: "❌ Customer not found after update" });
        return;
      }

      // 3️⃣ Normalize fields
      const phone = (updatedCustomer.phone || "").replace(/\D/g, "");
      const phoneCc = (updatedCustomer as any).phoneCc || "91";
      const zipCode = updatedCustomer.zipCode || "";

      // 4️⃣ Build ResellerClub payload
      const resellerPayload: any = {
        "auth-userid": process.env.MAIN_RESELLER_USER_ID || "169257",
        "api-key": process.env.MAIN_RESELLER_API_KEY || "",
        "customer-id": updatedCustomer.resellerCustomerId,
        username: updatedCustomer.email || "unknown@email.com",
        name: updatedCustomer.name || "Unknown",
        company: updatedCustomer.company || "",
        "address-line-1": updatedCustomer.address || "",
        country: updatedCustomer.country || "IN",
        zipCode,
        "phone-cc": phoneCc,
        phone: phone || "0000000000",
        "lang-pref": "en",
      };

      // Only include city/state if present
      if (updatedCustomer.city && updatedCustomer.city.trim() !== "") {
        resellerPayload.city = updatedCustomer.city;
      }
      if (updatedCustomer.state && updatedCustomer.state.trim() !== "") {
        resellerPayload.state = updatedCustomer.state;
      }

      // 5️⃣ Call ResellerClub Modify API
      const resellerRes = await axios.post(
        "https://test.httpapi.com/api/customers/modify.json",
        null,
        { params: resellerPayload }
      );

      // 6️⃣ Determine which fields were updated
      const updatedFields: string[] = [];
      const keysToCheck = [
        "name",
        "email",
        "phone",
        "company",
        "address",
        "city",
        "state",
        "country",
        "zipCode",
      ];

      keysToCheck.forEach((key) => {
        const oldVal = (originalCustomer as any)[key] || "";
        const newVal = (updatedCustomer as any)[key] || "";
        if (oldVal !== newVal) updatedFields.push(key);
      });

      // 7️⃣ Respond with notification info
      res.json({
        message: "✅ Customer updated successfully",
        local: updatedCustomer,
        reseller: resellerRes.data,
        updatedFields, // ✅ fields changed in this update
      });
    } catch (err: any) {
      console.error(
        "❌ Failed to update customer:",
        err.response?.data || err.message
      );
      res.status(400).json({
        error: "Failed to update customer",
        details: err.response?.data || err.message,
      });
    }
  }
);



export default router;