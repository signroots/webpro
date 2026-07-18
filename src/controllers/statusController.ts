import { RequestHandler } from "express";
import Status from "../models/Status";

// Create
export const createStatus: RequestHandler = async (req, res) => {
  try {
    const status = new Status(req.body);
    await status.save();

    const populatedStatus = await Status.findById(status._id).populate(
      "typeEmail",
      "name"
    );

    res.status(201).json(populatedStatus);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

// Read all
export const getStatuses: RequestHandler = async (_req, res) => {
  try {
    const statuses = await Status.find()
      .populate("typeEmail", "name")
      .sort({ createdAt: -1 });

    res.json(statuses);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// Read one
export const getStatusById: RequestHandler = async (req, res) => {
  try {
    const status = await Status.findById(req.params.id).populate(
      "typeEmail",
      "name"
    );

    if (!status) {
      res.status(404).json({ error: "Status not found" });
      return;
    }

    res.json(status);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// Update
export const updateStatus: RequestHandler = async (req, res) => {
  try {
    const status = await Status.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("typeEmail", "name");

    if (!status) {
      res.status(404).json({ error: "Status not found" });
      return;
    }

    res.json(status);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

// Delete
export const deleteStatus: RequestHandler = async (req, res) => {
  try {
    const status = await Status.findByIdAndDelete(req.params.id);

    if (!status) {
      res.status(404).json({ error: "Status not found" });
      return;
    }

    res.json({ message: "Deleted successfully" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};