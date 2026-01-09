import express, { Request, Response } from "express";
import Order from "../models/Order";
import Customer from "../models/Customer";
import { authMiddleware, AuthRequest } from "../middleware/auth";

const router = express.Router();

// GET /api/dashboard/metrics
router.get(
  "/metrics",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      // -------------------- TOTAL ORDERS --------------------
      const totalOrders = await Order.countDocuments();

      // -------------------- REGISTRAR ORDERS --------------------
      const registrarOrder = await Order.countDocuments({
        domainSource: "Cloudflare",
        domain_flag: false,
      });

      // -------------------- RESELLER CLUB ORDERS --------------------
      const resellerOrder = await Order.countDocuments({
        domainSource: "resellerclub",
      });

      // -------------------- DNS ORDERS --------------------
      const dnsOrders = await Order.countDocuments({
        domainSource: "Cloudflare",
        domain_flag: true,
      });

      // -------------------- TOTAL CUSTOMERS --------------------
      const totalCustomers = await Customer.countDocuments();

      // -------------------- RENEWALS COUNT --------------------
      const now = new Date();

      // Previous Month
      const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const prevMonthEnd = new Date(
        now.getFullYear(),
        now.getMonth(),
        0,
        23,
        59,
        59,
        999
      );

      // Current Month
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const currentMonthEnd = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59,
        999
      );

      // Next Month
      const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const nextMonthEnd = new Date(
        now.getFullYear(),
        now.getMonth() + 2,
        0,
        23,
        59,
        59,
        999
      );

      // Count renewals
      const prevMonthRenewals = await Order.countDocuments({
        expiryDate: { $gte: prevMonthStart, $lte: prevMonthEnd },
      });

      const currentMonthRenewals = await Order.countDocuments({
        expiryDate: { $gte: currentMonthStart, $lte: currentMonthEnd },
      });

      const nextMonthRenewals = await Order.countDocuments({
        expiryDate: { $gte: nextMonthStart, $lte: nextMonthEnd },
      });

      res.json({
        success: true,
        data: {
          totalOrders,
          registrarOrder,
          resellerOrder,
          dnsOrders,
          totalCustomers,
          renewals: {
            previousMonth: prevMonthRenewals,
            currentMonth: currentMonthRenewals,
            nextMonth: nextMonthRenewals,
          },
        },
      });
    } catch (error) {
      console.error("Dashboard metrics error:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to fetch metrics" });
    }
  }
);


export default router;
