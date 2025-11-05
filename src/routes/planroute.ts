// routes/planEmail.ts
import { Router, Request, Response } from "express";
import { PlanEmail, IPlanEmail } from "../models/PlanEmail";

const router = Router();

// GET all PlanEmails
router.get("/", async (_req: Request, res: Response): Promise<void> => {
  try {
    const plans = await PlanEmail.find().populate("emailType").sort({ createdAt: -1 });
    res.json({ success: true, data: plans });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET a single PlanEmail
router.get("/:id", async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const plan = await PlanEmail.findById(req.params.id).populate("emailType");
    if (!plan) {
      res.status(404).json({ success: false, message: "PlanEmail not found" });
      return;
    }
    res.json({ success: true, data: plan });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// CREATE a PlanEmail
router.post("/", async (req: Request<{}, {}, Partial<IPlanEmail>>, res: Response): Promise<void> => {
  try {
    const { plan, emailType } = req.body;
    if (!plan || !emailType) {
      res.status(400).json({ success: false, message: "Plan and EmailType are required" });
      return;
    }
    const newPlan = new PlanEmail({ plan, emailType });
    const saved = await newPlan.save();
    res.status(201).json({ success: true, data: saved });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// UPDATE a PlanEmail
router.put("/:id", async (req: Request<{ id: string }, {}, Partial<IPlanEmail>>, res: Response): Promise<void> => {
  try {
    const updates = req.body;
    const updatedPlan = await PlanEmail.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!updatedPlan) {
      res.status(404).json({ success: false, message: "PlanEmail not found" });
      return;
    }
    res.json({ success: true, data: updatedPlan });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE a PlanEmail
router.delete("/:id", async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const deleted = await PlanEmail.findByIdAndDelete(req.params.id);
    if (!deleted) {
      res.status(404).json({ success: false, message: "PlanEmail not found" });
      return;
    }
    res.json({ success: true, message: "PlanEmail deleted successfully" });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// TOGGLE isActive
router.patch("/:id/toggle", async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const plan = await PlanEmail.findById(req.params.id);
    if (!plan) {
      res.status(404).json({ success: false, message: "PlanEmail not found" });
      return;
    }
    plan.isActive = !plan.isActive;
    await plan.save();
    res.json({ success: true, data: plan });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router.get("/planlist/:emailTypeId", async (req: Request, res: Response) => {
  try {
    const { emailTypeId } = req.params;

    const plans = await PlanEmail.find({ emailType: emailTypeId, isActive: true }).sort({ createdAt: 1 });

    res.json({
      success: true,
      data: plans,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Failed to fetch plans" });
  }
});

export default router;
