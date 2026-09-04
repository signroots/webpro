import { RequestHandler } from "express";
import Status from "../models/Status";
import Order from "../models/Order";
import { OrderPlan } from "../models/OrderPlan";

// ===============================
// CREATE STATUS
// ===============================
export const createStatus: RequestHandler = async (req, res) => {
  try {
    const {
      name,
      code,
      type,
      is_custom,
      is_active,
    } = req.body;

    const status = new Status({
      name,
      code,
      type,
      is_custom,
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
      is_custom: true,
      is_active: true,
    })
      .select("_id name code type is_custom is_active")
      .sort({ createdAt: -1 });

    res.json(statuses);
  } catch (err: any) {
    res.status(500).json({
      error: err.message,
    });
  }
};
export const getDomainStatuses: RequestHandler = async (req, res) => {
  try {
    const statuses = await Status.find({
      type: "domain",
      is_custom: true,
      is_active: true,
    })
      .select("_id name code type is_custom is_active")
      .sort({ createdAt: -1 });

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
    const {
      order_status,
      domain_status,
    } = req.body;

    // At least one status should be provided
    if (!order_status && !domain_status) {
      res.status(400).json({
        success: false,
        message: "order_status or domain_status is required",
      });
      return;
    }

    const updateData: any = {};

    // ============================
    // ORDER STATUS
    // ============================
    if (order_status) {
      updateData.order_status = order_status;
    }

    // ============================
    // DOMAIN STATUS
    // ============================
    if (domain_status) {
      updateData.domain_status = domain_status;

      // Check selected domain status
      const selectedDomainStatus = await Status.findById(domain_status);

      if (!selectedDomainStatus) {
        res.status(400).json({
          success: false,
          message: "Invalid domain status",
        });
        return;
      }

      // If domain status is TRANSFERRED
      if (
        selectedDomainStatus.code?.toUpperCase() === "TRANSFERRED" ||
        selectedDomainStatus.name?.toUpperCase() === "TRANSFERRED"
      ) {
        updateData.managedBy = "Customer";
        updateData.domainSource = null;
      }
    }

    // ============================
    // UPDATE ORDER
    // ============================
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        $set: updateData,
      },
      {
        new: true,
        runValidators: true,
      }
    )
      .populate(
        "order_status",
        "_id name code type is_custom is_active"
      )
      .populate(
        "domain_status",
        "_id name code type is_custom is_active"
      )
      .populate(
        "domainSource",
        "_id name code image"
      );

    if (!order) {
      res.status(404).json({
        success: false,
        message: "Order not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: order,
    });

  } catch (error: any) {
    console.error("Order status update error:", error);

    res.status(400).json({
      success: false,
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