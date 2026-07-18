import express from "express";
import { exportOrders } from "../controllers/export.controller";

const router = express.Router();

router.get("/export", exportOrders);

export default router;