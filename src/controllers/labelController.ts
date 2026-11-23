
import { Request, Response, RequestHandler } from "express";
import mongoose from "mongoose";
import Label from "../models/Label";
import Order from "../models/Order";
import { OrderPlan } from "../models/OrderPlan";

const VALID_VISIBILITY = ["ADMIN", "CUSTOMER"];

// =====================================================
// VALIDATE visibleTo
// =====================================================

const validateVisibleTo = (visibleTo: unknown): string[] | null => {
  if (!Array.isArray(visibleTo) || visibleTo.length === 0) {
    return null;
  }

  const valid = visibleTo.every(
    (value) =>
      typeof value === "string" &&
      VALID_VISIBILITY.includes(value)
  );

  if (!valid) {
    return null;
  }

  return [...new Set(visibleTo as string[])];
};

// =====================================================
// CREATE LABEL
// POST /api/labels
// =====================================================

export const createLabel: RequestHandler = async (req, res) => {
  try {
    const {
      statusLabelName,
      code,
      type,
      service,
      status,
      displayArea,
      visibleTo,
    } = req.body;

    if (
      typeof statusLabelName !== "string" ||
      !statusLabelName.trim() ||
      !type ||
      !service ||
      typeof displayArea !== "string" ||
      !displayArea.trim()
    ) {
      res.status(400).json({
        success: false,
        message: "All required fields must be provided",
      });
      return;
    }

    const normalizedVisibility =
      visibleTo === undefined
        ? ["ADMIN", "CUSTOMER"]
        : validateVisibleTo(visibleTo);

    if (!normalizedVisibility) {
      res.status(400).json({
        success: false,
        message: "visibleTo must contain ADMIN and/or CUSTOMER",
      });
      return;
    }

    const normalizedCode = code?.trim()
      ? String(code).trim().toUpperCase()
      : statusLabelName.trim().replace(/\s+/g, "_").toUpperCase();

    const existingLabel = await Label.findOne({
      code: normalizedCode,
    });

    if (existingLabel) {
      res.status(409).json({
        success: false,
        message: "Label code already exists",
      });
      return;
    }

    const label = await Label.create({
      statusLabelName: statusLabelName.trim(),
      code: normalizedCode,
      type,
      service,
      status: status !== undefined ? status : true,
      displayArea: displayArea.trim(),
      visibleTo: normalizedVisibility,
    });

    res.status(201).json({
      success: true,
      message: "Label created successfully",
      data: label,
    });
  } catch (error: any) {
    console.error("Create Label Error:", error);

    res.status(error.code === 11000 ? 409 : 500).json({
      success: false,
      message:
        error.code === 11000
          ? "Label code already exists"
          : "Failed to create label",
      error: error.message,
    });
  }
};

// =====================================================
// GET ALL LABELS
// GET /api/labels
// =====================================================

export const getAllLabels: RequestHandler = async (req, res) => {
  try {
    const labels = await Label.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: labels.length,
      data: labels,
    });
  } catch (error: any) {
    console.error("Get Labels Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch labels",
      error: error.message,
    });
  }
};

// =====================================================
// GET ACTIVE LABELS
// GET /api/labels/active
// Optional query: ?role=CUSTOMER or ?role=ADMIN
// =====================================================

export const getActiveLabels: RequestHandler = async (req, res) => {
  try {
    const { type, service, role } = req.query;

    const filter: any = {
      status: true,
    };

    if (type) {
      filter.type = String(type).trim().toUpperCase();
    }

    if (service) {
      filter.service = String(service).trim().toUpperCase();
    }

    if (role !== undefined) {
      const normalizedRole = String(role).trim().toUpperCase();

      if (!VALID_VISIBILITY.includes(normalizedRole)) {
        res.status(400).json({
          success: false,
          message: "Invalid role. Use ADMIN or CUSTOMER",
        });
        return;
      }

      // Admin receives all active labels.
      // Customer receives only customer-visible labels.
      if (normalizedRole === "CUSTOMER") {
        filter.visibleTo = "CUSTOMER";
      }
    }

    const labels = await Label.find(filter).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: labels.length,
      data: labels,
    });
  } catch (error: any) {
    console.error("Get Active Labels Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch active labels",
      error: error.message,
    });
  }
};

// =====================================================
// GET SINGLE LABEL
// GET /api/labels/:id
// =====================================================

export const getLabelById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid label ID",
      });
      return;
    }

    const label = await Label.findById(id);

    if (!label) {
      res.status(404).json({
        success: false,
        message: "Label not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: label,
    });
  } catch (error: any) {
    console.error("Get Label Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch label",
      error: error.message,
    });
  }
};

// =====================================================
// UPDATE LABEL
// PUT /api/labels/:id
// =====================================================

export const updateLabel: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid label ID",
      });
      return;
    }

    const {
      statusLabelName,
      code,
      type,
      service,
      status,
      displayArea,
      visibleTo,
    } = req.body;

    const existingLabel = await Label.findById(id);

    if (!existingLabel) {
      res.status(404).json({
        success: false,
        message: "Label not found",
      });
      return;
    }

    let normalizedVisibility: string[] | undefined;

    if (visibleTo !== undefined) {
      normalizedVisibility = validateVisibleTo(visibleTo) ?? undefined;

      if (!normalizedVisibility) {
        res.status(400).json({
          success: false,
          message: "visibleTo must contain ADMIN and/or CUSTOMER",
        });
        return;
      }
    }

    if (code !== undefined) {
      const normalizedCode = String(code).trim().toUpperCase();

      const duplicateLabel = await Label.findOne({
        code: normalizedCode,
        _id: { $ne: id },
      });

      if (duplicateLabel) {
        res.status(409).json({
          success: false,
          message: "Label code already exists",
        });
        return;
      }
    }

    const updatedLabel = await Label.findByIdAndUpdate(
      id,
      {
        ...(statusLabelName !== undefined && {
          statusLabelName: String(statusLabelName).trim(),
        }),
        ...(code !== undefined && {
          code: String(code).trim().toUpperCase(),
        }),
        ...(type !== undefined && { type }),
        ...(service !== undefined && { service }),
        ...(status !== undefined && { status }),
        ...(displayArea !== undefined && { displayArea }),
        ...(normalizedVisibility !== undefined && {
          visibleTo: normalizedVisibility,
        }),
      },
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      success: true,
      message: "Label updated successfully",
      data: updatedLabel,
    });
  } catch (error: any) {
    console.error("Update Label Error:", error);

    res.status(error.code === 11000 ? 409 : 500).json({
      success: false,
      message:
        error.code === 11000
          ? "Label code already exists"
          : "Failed to update label",
      error: error.message,
    });
  }
};

// =====================================================
// DELETE LABEL
// DELETE /api/labels/:id
// =====================================================

export const deleteLabel: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid label ID",
      });
      return;
    }

    const deletedLabel = await Label.findByIdAndDelete(id);

    if (!deletedLabel) {
      res.status(404).json({
        success: false,
        message: "Label not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Label deleted successfully",
      data: deletedLabel,
    });
  } catch (error: any) {
    console.error("Delete Label Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete label",
      error: error.message,
    });
  }
};

// =====================================================
// COMMON FUNCTION: VALIDATE MULTIPLE LABEL IDS
// =====================================================

const validateLabelIds = async (
  labelIds: unknown
): Promise<string[] | null> => {
  if (!Array.isArray(labelIds)) {
    return null;
  }

  const validIds = labelIds.every(
    (id) =>
      typeof id === "string" &&
      mongoose.Types.ObjectId.isValid(id)
  );

  if (!validIds) {
    return null;
  }

  const uniqueLabelIds = [
    ...new Set(labelIds as string[]),
  ];

  if (uniqueLabelIds.length > 0) {
    const activeLabels = await Label.find({
      _id: { $in: uniqueLabelIds },
      status: true,
    }).select("_id");

    if (activeLabels.length !== uniqueLabelIds.length) {
      return null;
    }
  }

  return uniqueLabelIds;
};

// =====================================================
// UPDATE ORDER LABELS
// PATCH /api/labels/order/:orderId
// =====================================================

export const updateOrderLabel: RequestHandler = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { labelIds } = req.body;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
      return;
    }

    const validatedLabelIds = await validateLabelIds(labelIds);

    if (validatedLabelIds === null) {
      res.status(400).json({
        success: false,
        message: "Invalid label IDs or one or more labels are inactive",
      });
      return;
    }

    const order = await Order.findByIdAndUpdate(
      orderId,
      {
        $set: {
          labels: validatedLabelIds,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    ).populate("labels");

    if (!order) {
      res.status(404).json({
        success: false,
        message: "Order not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Order labels updated successfully",
      data: order,
    });
  } catch (error: any) {
    console.error("Update Order Labels Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update order labels",
      error: error.message,
    });
  }
};

// =====================================================
// UPDATE ORDER PLAN LABELS
// PATCH /api/labels/plan/:planId
// =====================================================

export const updateOrderPlanLabel: RequestHandler = async (req, res) => {
  try {
    const { planId } = req.params;
    const { labelIds } = req.body;

    if (!mongoose.Types.ObjectId.isValid(planId)) {
      res.status(400).json({
        success: false,
        message: "Invalid plan ID",
      });
      return;
    }

    const validatedLabelIds = await validateLabelIds(labelIds);

    if (validatedLabelIds === null) {
      res.status(400).json({
        success: false,
        message: "Invalid label IDs or one or more labels are inactive",
      });
      return;
    }

    const plan = await OrderPlan.findByIdAndUpdate(
      planId,
      {
        $set: {
          labels: validatedLabelIds,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    ).populate("labels");

    if (!plan) {
      res.status(404).json({
        success: false,
        message: "Order plan not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Order plan labels updated successfully",
      data: plan,
    });
  } catch (error: any) {
    console.error("Update Order Plan Labels Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update order plan labels",
      error: error.message,
    });
  }
};
