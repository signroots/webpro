import { RequestHandler } from "express";
import Status from "../models/Status";
import Order from "../models/Order";
import { OrderPlan } from "../models/OrderPlan";

// ===============================
// CREATE STATUS
// ===============================
export const createStatus: RequestHandler = async (req, res) => {
  try {
    const { name, type, is_active } = req.body;

    const status = new Status({
      name,
      type,
      is_active,
    });

    await status.save();

    res.status(201).json(status);
  } catch (err: any) {
    res.status(400).json({
      error: err.message,
    });
  }
};


// ===============================
// GET PLAN STATUSES
// ===============================
export const getPlanStatuses: RequestHandler = async (req, res) => {
  try {
    const statuses = await Status.find({
      type: "plan",
      is_active: true,
    }).sort({ createdAt: -1 });

    res.json(statuses);
  } catch (err: any) {
    res.status(500).json({
      error: err.message,
    });
  }
};


// ===============================
// GET ORDER STATUSES
// ===============================
export const getOrderStatuses: RequestHandler = async (req, res) => {
  try {
    const statuses = await Status.find({
      type: "order",
      is_active: true,
    }).sort({ createdAt: -1 });

    res.json(statuses);
  } catch (err: any) {
    res.status(500).json({
      error: err.message,
    });
  }
};


// ===============================
// UPDATE PLAN STATUS
// ===============================
export const updatePlanStatus: RequestHandler = async (req, res) => {
  try {
    const { status } = req.body;

    const plan = await OrderPlan.findByIdAndUpdate(
      req.params.id,
      { status },
      {
        new: true,
        runValidators: true,
      }
    ).populate("status", "name type");

    if (!plan) {
      res.status(404).json({
        message: "Plan not found",
      });
      return;
    }

    res.status(200).json(plan);
  } catch (error: any) {
    res.status(400).json({
      message: "Failed to update plan status",
      error: error.message,
    });
  }
};


// ===============================
// UPDATE ORDER STATUS
// ===============================
export const updateOrderStatus: RequestHandler = async (req, res) => {
  try {
    const { status } = req.body;

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      {
        new: true,
        runValidators: true,
      }
    ).populate("status", "name type");

    if (!order) {
      res.status(404).json({
        message: "Order not found",
      });
      return;
    }

    res.status(200).json(order);
  } catch (error: any) {
    res.status(400).json({
      message: "Failed to update order status",
      error: error.message,
    });
  }
};


// ===============================
// GET ALL STATUSES
// ===============================
export const getStatuses: RequestHandler = async (_req, res) => {
  try {
    const statuses = await Status.find()
      .sort({ createdAt: -1 });

    res.json(statuses);
  } catch (err: any) {
    res.status(500).json({
      error: err.message,
    });
  }
};


// ===============================
// GET STATUS BY ID
// ===============================
export const getStatusById: RequestHandler = async (req, res) => {
  try {
    const status = await Status.findById(req.params.id);

    if (!status) {
      res.status(404).json({
        error: "Status not found",
      });
      return;
    }

    res.json(status);
  } catch (err: any) {
    res.status(500).json({
      error: err.message,
    });
  }
};


// ===============================
// UPDATE STATUS
// ===============================
export const updateStatus: RequestHandler = async (req, res) => {
  try {
    const status = await Status.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!status) {
      res.status(404).json({
        error: "Status not found",
      });
      return;
    }

    res.json(status);
  } catch (err: any) {
    res.status(400).json({
      error: err.message,
    });
  }
};


// ===============================
// DELETE STATUS
// ===============================
export const deleteStatus: RequestHandler = async (req, res) => {
  try {
    const status = await Status.findByIdAndDelete(req.params.id);

    if (!status) {
      res.status(404).json({
        error: "Status not found",
      });
      return;
    }

    res.json({
      message: "Deleted successfully",
    });
  } catch (err: any) {
    res.status(500).json({
      error: err.message,
    });
  }
};