import express from "express";

import {
  createStatus,
  getStatuses,
  getStatusById,
  updateStatus,
  deleteStatus,
  updateOrderStatus,
  getOrderStatuses,
  getPlanStatuses,
  updatePlanStatus,
} from "../controllers/statusController";

const router = express.Router();

router.post("/", createStatus);

router.get("/", getStatuses);

// Specific routes FIRST
router.get("/order/:orderId", getOrderStatuses);
router.get("/plan/:planId", getPlanStatuses);

// Status update routes
router.put("/order/:id/status", updateOrderStatus);
router.put("/plan/:id/status", updatePlanStatus);

// Generic :id route LAST
router.get("/:id", getStatusById);
router.put("/:id", updateStatus);
router.delete("/:id", deleteStatus);

export default router;