import { Request, Response } from "express";
import mongoose from "mongoose";
import { OrderPlan } from "../models/OrderPlan";

export const addPlanLicenses = async (
  req: Request,
  res: Response
) => {
  try {
    const { planId } = req.params;
    const { additionalLicenses } = req.body;

    // Validate Plan ID
    if (!mongoose.Types.ObjectId.isValid(planId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid plan ID",
      });
    }

    // Allow positive and negative integers, but not zero
    if (
      !Number.isInteger(additionalLicenses) ||
      additionalLicenses === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Licence change must be a non-zero integer",
      });
    }

    const plan = await OrderPlan.findById(planId);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found",
      });
    }

    const currentUsers = plan.noOfUsers ?? 0;

    // Calculate new licence count
    const newTotal = currentUsers + additionalLicenses;

    // Minimum licence validation
    if (newTotal < 1) {
      return res.status(400).json({
        success: false,
        message: "Minimum 1 licence is required",
      });
    }

    // Maximum licence validation
    if (newTotal > 300) {
      return res.status(400).json({
        success: false,
        message: "Total licences cannot exceed 300",
      });
    }

    // Update licence count
    plan.noOfUsers = newTotal;

    await plan.save();

    return res.status(200).json({
      success: true,
      message:
        additionalLicenses > 0
          ? "Licences added successfully"
          : "Licences minimized successfully",
      plan: {
        _id: plan._id,
        noOfUsers: plan.noOfUsers,
      },
    });

  } catch (error) {
    console.error("Update licences error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update licences",
    });
  }
};
