import express from "express";
import {
  createStatus,
  getStatuses,
  getStatusById,
  updateStatus,
  deleteStatus,
} from "../controllers/statusController";

const router = express.Router();

router.post("/", createStatus);
router.get("/", getStatuses);
router.get("/:id", getStatusById);
router.put("/:id", updateStatus);
router.delete("/:id", deleteStatus);

export default router;