import express from "express";
import {
  createStatus,
  getStatuses,
  getStatusById,
  updateStatus,
  deleteStatus,
} from "../controllers/statusController";

const router = express.Router();

router.post("/", createStatus);       // Create
router.get("/", getStatuses);         // Read all
router.get("/:id", getStatusById);    // Read one
router.put("/:id", updateStatus);     // Update
router.delete("/:id", deleteStatus);  // Delete

export default router;
