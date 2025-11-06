import { Router, Request, Response } from "express";
import { HostType, IHostType } from "../models/HostType";


const router = Router();

// GET all HostTypes
router.get("/", async (_req: Request, res: Response): Promise<void> => {
  try {
    const hosts = await HostType.find().sort({ createdAt: -1 });
    res.json({ success: true, data: hosts });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET single HostType
router.get("/:id", async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const host = await HostType.findById(req.params.id);
    if (!host) {
      res.status(404).json({ success: false, message: "HostType not found" });
      return;
    }
    res.json({ success: true, data: host });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// CREATE HostType
router.post("/", async (req: Request<{}, {}, Partial<IHostType>>, res: Response): Promise<void> => {
  try {
    const { type } = req.body;
    if (!type) {
      res.status(400).json({ success: false, message: "Type is required" });
      return;
    }

    const newHost = new HostType({ type });
    const saved = await newHost.save();
    res.status(201).json({ success: true, data: saved });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// UPDATE HostType
router.put(
  "/:id",
  async (req: Request<{ id: string }, {}, Partial<IHostType>>, res: Response): Promise<void> => {
    try {
      const updates = req.body;
      const updatedHost = await HostType.findByIdAndUpdate(req.params.id, updates, {
        new: true,
      });

      if (!updatedHost) {
        res.status(404).json({ success: false, message: "HostType not found" });
        return;
      }

      res.json({ success: true, data: updatedHost });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);
// DELETE HostType
router.delete("/:id", async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const deleted = await HostType.findByIdAndDelete(req.params.id);
    if (!deleted) {
      res.status(404).json({ success: false, message: "HostType not found" });
      return;
    }
    res.json({ success: true, message: "HostType deleted successfully" });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// TOGGLE isActive
router.patch("/:id/toggle", async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const host = await HostType.findById(req.params.id);
    if (!host) {
      res.status(404).json({ success: false, message: "HostType not found" });
      return;
    }

    host.isActive = !host.isActive;
    await host.save();

    res.json({ success: true, data: host });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});


export default router;
