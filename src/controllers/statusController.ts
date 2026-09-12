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
      category,
      is_custom,
      is_active,
    } = req.body;

    const status = new Status({
      name,
      code,
      type,
      category,
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
export const getPrimaryPlanStatuses: RequestHandler = async (
  req,
  res
) => {
  try {
    const statuses = await Status.find({
      type: "plan",
      category: "primary",
      is_active: true,
      is_custom: true,
    })
      .select(
        "_id name code type category is_custom is_active"
      )
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: statuses,
    });
  } catch (err: any) {
    console.error(
      "GET PRIMARY PLAN STATUSES ERROR:",
      err
    );

    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};
export const getSecondaryPlanStatuses: RequestHandler = async (
  req,
  res
) => {
  try {
    const statuses = await Status.find({
      type: "plan",
      category: "secondary",
      is_active: true,
    })
      .select(
        "_id name code type category is_custom is_active"
      )
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: statuses,
    });
  } catch (err: any) {
    console.error(
      "GET SECONDARY PLAN STATUSES ERROR:",
      err
    );

    res.status(500).json({
      success: false,
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
    const {
      primary_status,
      secondary_status,
    } = req.body;

    if (!primary_status && secondary_status === undefined) {
      res.status(400).json({
        success: false,
        message: "primary_status or secondary_status is required",
      });
      return;
    }

    const updateData: any = {};

    // ============================
    // PRIMARY STATUS
    // ============================
    if (primary_status) {
      const primaryStatus = await Status.findOne({
        _id: primary_status,
        type: "plan",
        category: "primary",
        is_active: true,
      });

      if (!primaryStatus) {
        res.status(400).json({
          success: false,
          message: "Invalid primary plan status",
        });
        return;
      }

      updateData.primary_status = primary_status;
    }

    // ============================
    // SECONDARY STATUS
    // ============================
    if (secondary_status !== undefined) {
      if (secondary_status === null || secondary_status === "") {
        updateData.secondary_status = null;
      } else {
        const secondaryStatus = await Status.findOne({
          _id: secondary_status,
          type: "plan",
          category: "secondary",
          is_active: true,
        });

        if (!secondaryStatus) {
          res.status(400).json({
            success: false,
            message: "Invalid secondary plan status",
          });
          return;
        }

        updateData.secondary_status = secondary_status;
      }
    }

    const plan = await OrderPlan.findByIdAndUpdate(
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
        "primary_status",
        "_id name code type category is_custom is_active"
      )
      .populate(
        "secondary_status",
        "_id name code type category is_custom is_active"
      );

    if (!plan) {
      res.status(404).json({
        success: false,
        message: "Plan not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: plan,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: "Failed to update plan status",
      error: error.message,
    });
  }
};

export const activatePlanStatus: RequestHandler = async (req, res) => {
  try {
    const { status, type } = req.body;

    if (status?.toUpperCase() !== "ACTIVE" || type !== "plan") {
      res.status(400).json({
        success: false,
        message: "Invalid activation request",
      });
      return;
    }

    // Find ACTIVE primary plan status
    const activeStatus = await Status.findOne({
      type: "plan",
      category: "primary",
      code: "ACTIVE",
      is_active: true,
    });

    if (!activeStatus) {
      res.status(404).json({
        success: false,
        message: "Active plan status not found",
      });
      return;
    }

    const plan = await OrderPlan.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          primary_status: activeStatus._id,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    )
      .populate(
        "primary_status",
        "_id name code type category is_custom is_active"
      )
      .populate(
        "secondary_status",
        "_id name code type category is_custom is_active"
      );

    if (!plan) {
      res.status(404).json({
        success: false,
        message: "Plan not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: plan,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: "Failed to activate plan",
      error: error.message,
    });
  }
};

// ===============================
// UPDATE ORDER STATUS
// ===============================
// ===============================
// UPDATE ORDER STATUS
// ===============================
export const updateOrderStatus: RequestHandler = async (req, res) => {
  try {
    const {
      order_status,
      domain_status,

      // Archived page → Active button
      status,
      type,
    } = req.body;

    const now = new Date();

    // ==========================================
    // ARCHIVED PAGE → ACTIVE DOMAIN
    // ==========================================
    if (status && type === "domain") {
      console.log("ARCHIVED ACTIVE REQUEST:", {
        status,
        type,
        orderId: req.params.id,
      });

      const selectedDomainStatus = await Status.findOne({
        type: "domain",
        $or: [
          { code: status.toUpperCase() },
          { name: status.toUpperCase() },
        ],
        is_active: true,
      });

      console.log(
        "FOUND DOMAIN STATUS:",
        selectedDomainStatus
      );

      if (!selectedDomainStatus) {
        res.status(400).json({
          success: false,
          message: `${status} domain status not found`,
        });
        return;
      }

      console.log(
        "STATUS ID TO UPDATE:",
        selectedDomainStatus._id
      );

      // ==========================================
      // ACTIVE DOMAIN → STORE ACTIVE DATE & TIME
      // ==========================================
      const order = await Order.findByIdAndUpdate(
        req.params.id,
        {
          $set: {
            domain_status: selectedDomainStatus._id,

            // Active date & time
            activated_on: now,
          },
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

      console.log("UPDATED ORDER:", order);

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

      return;
    }

    // ==========================================
    // EXISTING LOGIC
    // ==========================================

    if (!order_status && !domain_status) {
      res.status(400).json({
        success: false,
        message:
          "order_status or domain_status is required",
      });
      return;
    }

    const updateData: any = {};

    // ==========================================
    // ORDER STATUS
    // ==========================================
    if (order_status) {
      updateData.order_status = order_status;

      // Find selected order status
      const selectedOrderStatus =
        await Status.findById(order_status);

      if (!selectedOrderStatus) {
        res.status(400).json({
          success: false,
          message: "Invalid order status",
        });
        return;
      }

      const orderStatusCode =
        selectedOrderStatus.code?.toUpperCase() ||
        selectedOrderStatus.name?.toUpperCase();

      // ==========================================
      // ORDER → ACTIVE
      // ==========================================
      if (orderStatusCode === "ACTIVE") {
        updateData.activated_on = now;
      }

      // ==========================================
      // ORDER → TRANSFERRED
      // ==========================================
      if (orderStatusCode === "TRANSFERRED") {
        updateData.order_transferred_on = now;
      }
    }

    // ==========================================
    // DOMAIN STATUS
    // ==========================================
    if (domain_status) {
      updateData.domain_status = domain_status;

      const selectedDomainStatus =
        await Status.findById(domain_status);

      if (!selectedDomainStatus) {
        res.status(400).json({
          success: false,
          message: "Invalid domain status",
        });
        return;
      }

      const domainStatusCode =
        selectedDomainStatus.code?.toUpperCase() ||
        selectedDomainStatus.name?.toUpperCase();

      // ==========================================
      // DOMAIN → ACTIVE
      // ==========================================
      if (domainStatusCode === "ACTIVE") {
        updateData.activated_on = now;
      }

      // ==========================================
      // DOMAIN → TRANSFERRED
      // ==========================================
      if (domainStatusCode === "TRANSFERRED") {
        updateData.domain_transferred_on = now;

        // Existing logic
        updateData.managedBy = "Customer";

        // Keep your existing decision here
        // updateData.domainSource = null;
      }
    }

    // ==========================================
    // UPDATE ORDER
    // ==========================================
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
    console.error(
      "Order status update error:",
      error
    );

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