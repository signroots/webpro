// backend/routes/storage.ts
import { Router, Request, Response } from "express";
import { Storage } from "../models/Storage";

const router = Router();

// =====================
// Create Storage
// POST /api/storage
// =====================
router.post("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const { storage, hostType, hostSubType } = req.body;
    if (!storage || !hostType || !hostSubType) {
      res.status(400).json({ success: false, error: "All fields are required" });
      return;
    }

    const newStorage = new Storage({ storage, hostType, hostSubType });
    await newStorage.save();
    res.json({ success: true, data: newStorage });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// =====================
// Get all Storage
// GET /api/storage
// =====================
router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const storages = await Storage.find()
      .populate("hostType", "type")
      .populate("hostSubType", "name");
    res.json({ success: true, data: storages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// =====================
// Get Storage by ID
// GET /api/storage/:id
// =====================
router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const storage = await Storage.findById(req.params.id)
      .populate("hostType", "type")
      .populate("hostSubType", "name");
    if (!storage) {
      res.status(404).json({ success: false, error: "Storage not found" });
      return;
    }
    res.json({ success: true, data: storage });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// =====================
// Update Storage by ID
// PUT /api/storage/:id
// =====================
router.put("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { storage, hostType, hostSubType } = req.body;
    const updated = await Storage.findByIdAndUpdate(
      req.params.id,
      { storage, hostType, hostSubType },
      { new: true }
    );
    if (!updated) {
      res.status(404).json({ success: false, error: "Storage not found" });
      return;
    }
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// =====================
// Delete Storage by ID
// DELETE /api/storage/:id
// =====================
router.delete("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const deleted = await Storage.findByIdAndDelete(req.params.id);
    if (!deleted) {
      res.status(404).json({ success: false, error: "Storage not found" });
      return;
    }
    res.json({ success: true, data: deleted });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// =====================
// Toggle isActive
// PATCH /api/storage/:id/toggle
// =====================
router.patch("/:id/toggle", async (req: Request, res: Response): Promise<void> => {
  try {
    const storage = await Storage.findById(req.params.id);
    if (!storage) {
      res.status(404).json({ success: false, error: "Storage not found" });
      return;
    }
    storage.isActive = !storage.isActive;
    await storage.save();
    res.json({ success: true, data: storage });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// Get storages by hostTypeId
router.get("/storagelist/:hostTypeId", async (req: Request, res: Response) => {
  try {
    const { hostTypeId } = req.params;
    if (!hostTypeId) {
      res.status(400).json({ success: false, message: "hostTypeId required" });
      return;
    }

    const storages = await Storage.find({ hostType: hostTypeId, isActive: true });
    res.json({ success: true, data: storages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
export default router;
