import express from "express";

import {
  createStatus,
  getStatuses,
  getStatusById,
  updateStatus,
  deleteStatus,
  updateOrderStatus,
  getOrderStatuses,
  getPrimaryPlanStatuses,
  getSecondaryPlanStatuses,
  updatePlanStatus,
  activatePlanStatus,
  getDomainStatuses,
} from "../controllers/statusController";

const router = express.Router();

router.post("/", createStatus);

router.get("/", getStatuses);

// =====================================================
// SPECIFIC STATUS ROUTES
// =====================================================

// ORDER STATUS
router.get(
  "/order/:orderId",
  getOrderStatuses
);

// DOMAIN STATUS
router.get(
  "/domain/:orderId",
  getDomainStatuses
);

// PLAN PRIMARY STATUS
router.get(
  "/plan/primary",
  getPrimaryPlanStatuses
);

// PLAN SECONDARY STATUS
router.get(
  "/plan/secondary",
  getSecondaryPlanStatuses
);

// =====================================================
// STATUS UPDATE ROUTES
// =====================================================

router.put(
  "/order/:id/status",
  updateOrderStatus
);

router.put(
  "/plan/:id/status",
  updatePlanStatus
);
router.put(
  "/plan/:id/activate",
  activatePlanStatus
);
// =====================================================
// GENERIC :id ROUTES - MUST BE LAST
// =====================================================

router.get(
  "/:id",
  getStatusById
);

router.put(
  "/:id",
  updateStatus
);

router.delete(
  "/:id",
  deleteStatus
);

export default router;