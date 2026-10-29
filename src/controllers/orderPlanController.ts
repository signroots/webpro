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

    if (!mongoose.Types.ObjectId.isValid(planId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid plan ID",
      });
    }

    if (
      !Number.isInteger(additionalLicenses) ||
      additionalLicenses < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "Additional licences must be a positive integer",
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

    if (currentUsers + additionalLicenses > 300) {
      return res.status(400).json({
        success: false,
        message: "Total licences cannot exceed 300",
      });
    }

    plan.noOfUsers = currentUsers + additionalLicenses;
    await plan.save();

    return res.status(200).json({
      success: true,
      message: "Licences updated successfully",
      plan: {
        _id: plan._id,
        noOfUsers: plan.noOfUsers,
      },
    });
  } catch (error) {
    console.error("Add licences error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update licences",
    });
  }
};