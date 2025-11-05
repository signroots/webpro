import { Router, Request, Response } from "express";
import { HostSubType, IHostSubType } from "../models/HostSubType";

const router = Router();

/**
 * =====================
 * Create a new HostSubType
 * POST /api/hostsubtype
 * =====================
 */
router.post("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const { hostType, name } = req.body;

    if (!hostType || !name) {
      res.status(400).json({ success: false, message: "HostType and Name are required" });
      return;
    }

    const newSubType: IHostSubType = new HostSubType({
      hostType,
      name,
    });

    const savedSubType = await newSubType.save();
    res.status(201).json({ success: true, data: savedSubType });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * =====================
 * Get all HostSubTypes
 * GET /api/hostsubtype
 * =====================
 */
router.get("/", async (_req: Request, res: Response): Promise<void> => {
  try {
    const subTypes = await HostSubType.find().populate("hostType", "type");
    res.status(200).json({ success: true, data: subTypes });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * =====================
 * Get HostSubType by ID
 * GET /api/hostsubtype/:id
 * =====================
 */
router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const subType = await HostSubType.findById(req.params.id).populate("hostType", "type");
    if (!subType) {
      res.status(404).json({ success: false, message: "HostSubType not found" });
      return;
    }
    res.status(200).json({ success: true, data: subType });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * =====================
 * Update HostSubType by ID
 * PUT /api/hostsubtype/:id
 * =====================
 */
router.put("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { hostType, name, isActive } = req.body;

    const updatedSubType = await HostSubType.findByIdAndUpdate(
      req.params.id,
      { hostType, name, isActive },
      { new: true }
    );

    if (!updatedSubType) {
      res.status(404).json({ success: false, message: "HostSubType not found" });
      return;
    }

    res.status(200).json({ success: true, data: updatedSubType });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * =====================
 * Delete HostSubType by ID
 * DELETE /api/hostsubtype/:id
 * =====================
 */
router.delete("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const deleted = await HostSubType.findByIdAndDelete(req.params.id);
    if (!deleted) {
      res.status(404).json({ success: false, message: "HostSubType not found" });
      return;
    }
    res.status(200).json({ success: true, message: "HostSubType deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * =====================
 * Toggle isActive status
 * PATCH /api/hostsubtype/:id/toggle
 * =====================
 */
router.patch("/:id/toggle", async (req: Request, res: Response): Promise<void> => {
  try {
    const subType = await HostSubType.findById(req.params.id);
    if (!subType) {
      res.status(404).json({ success: false, message: "HostSubType not found" });
      return;
    }

    subType.isActive = !subType.isActive;
    await subType.save();

    res.status(200).json({ success: true, data: subType });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/subhosttypelist/:hostTypeId", async (req: Request, res: Response) => {
  const { hostTypeId } = req.params;

  try {
    const subTypes = await HostSubType.find({ hostType: hostTypeId });
    res.json({ success: true, data: subTypes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to fetch Host Sub Types" });
  }
});
export default router;
