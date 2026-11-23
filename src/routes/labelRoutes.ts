
import express from "express";

import {
  createLabel,
  getAllLabels,
  getActiveLabels,
  getLabelById,
  updateLabel,
  deleteLabel,
  updateOrderLabel,
  updateOrderPlanLabel,
} from "../controllers/labelController";

import { authMiddleware } from "../middleware/auth";

const router = express.Router();

// =====================================================
// CREATE LABEL
// POST /api/labels
// =====================================================

router.post("/", authMiddleware, createLabel);

// =====================================================
// GET ALL LABELS
// GET /api/labels
// =====================================================

router.get("/", authMiddleware, getAllLabels);

// =====================================================
// GET ACTIVE LABELS
// GET /api/labels/active
// =====================================================

router.get("/active", authMiddleware, getActiveLabels);

// =====================================================
// UPDATE ORDER LABEL
// PATCH /api/labels/order/:orderId
// =====================================================

router.patch("/order/:orderId", authMiddleware, updateOrderLabel);

// =====================================================
// UPDATE ORDER PLAN LABEL
// PATCH /api/labels/plan/:planId
// =====================================================

router.patch("/plan/:planId", authMiddleware, updateOrderPlanLabel);

// =====================================================
// GET SINGLE LABEL
// GET /api/labels/:id
// =====================================================

router.get("/:id", authMiddleware, getLabelById);

// =====================================================
// UPDATE LABEL
// PUT /api/labels/:id
// =====================================================

router.put("/:id", authMiddleware, updateLabel);

// =====================================================
// DELETE LABEL
// DELETE /api/labels/:id
// =====================================================

router.delete("/:id", authMiddleware, deleteLabel);

export default router;
