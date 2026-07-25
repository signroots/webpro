// backend/routes/typeEmail.ts
import { Router, Request, Response } from "express";
import { TypeEmail, ITypeEmail } from "../models/TypeEmail";
import multer from "multer";
import path from "path";
import fs from "fs";
const router = Router();
// Create upload directory if not exists
// === Ensure upload folder exists ===
const uploadDir = path.join(__dirname, "../../uploads/typeemails");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// === Multer storage configuration ===
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// =====================
// Create a new TypeEmail
// POST /api/typeemail
// =====================
router.post("/", upload.single("image"), async (req: Request, res: Response): Promise<void> => {
  try {
    // ✅ Access data safely
    const name = req.body?.name;
    const imageFile = req.file;

    if (!name || name.trim() === "") {
      res.status(400).json({ success: false, message: "Name is required" });
      return;
    }

    if (!imageFile) {
      res.status(400).json({ success: false, message: "Image is required" });
      return;
    }

    // ✅ Build image path
    const imagePath = `/uploads/typeemails/${imageFile.filename}`;

    // ✅ Save to DB
    const newTypeEmail = new TypeEmail({
      name: name.trim(),
      image: imagePath,
    });

    const saved = await newTypeEmail.save();

    res.status(201).json({
      success: true,
      message: "Type Email created successfully",
      data: saved,
    });
  } catch (err: any) {
    console.error("Error creating TypeEmail:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});


// =====================
// Get all TypeEmails
// GET /api/typeemail
// =====================
router.get("/", async (_req: Request, res: Response): Promise<void> => {
  try {
    const typeEmails = await TypeEmail.find().sort({ createdAt: -1 });
    res.json({ success: true, data: typeEmails });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});


// =====================
// Get a TypeEmail by ID
// GET /api/typeemail/:id
// =====================
router.get("/:id", async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const typeEmail = await TypeEmail.findById(id);

    if (!typeEmail) {
      res.status(404).json({ success: false, message: "TypeEmail not found" });
      return;
    }

    res.json({ success: true, data: typeEmail });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
// =====================
// Update a TypeEmail
// PUT /api/typeemail/:id
// =====================
router.put("/:id/toggle", upload.single("image"), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const typeEmail = await TypeEmail.findById(id);
    if (!typeEmail) {
      res.status(404).json({ success: false, message: "TypeEmail not found" });
      return;
    }

    // ✅ Toggle isActive
    typeEmail.isActive = !typeEmail.isActive;

    // ✅ Update name if provided
    if (name && name.trim() !== "") {
      typeEmail.name = name.trim();
    }

    // ✅ Update image if new one is uploaded
    if (req.file) {
      const newImagePath = `/uploads/typeemails/${req.file.filename}`;
      typeEmail.image = newImagePath;
    }

    const updated = await typeEmail.save();
    res.status(200).json({ success: true, data: updated });
  } catch (err: any) {
    console.error("Error in toggle route:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});
// =====================
// Delete a TypeEmail
// DELETE /api/typeemail/:id
// =====================
router.delete(
  "/:id",
  async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const deleted = await TypeEmail.findByIdAndDelete(id);

      if (!deleted) {
        res
          .status(404)
          .json({ success: false, message: "TypeEmail not found" });
        return;
      }

      res.json({
        success: true,
        message: "TypeEmail deleted successfully",
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// =====================
// Toggle isActive
// PATCH /api/typeemail/:id/toggle
// =====================
// router.patch(
//   "/:id/toggle",
//   async (req: Request<{ id: string }>, res: Response): Promise<void> => {
//     try {
//       const { id } = req.params;
//       const typeEmail = await TypeEmail.findById(id);

//       if (!typeEmail) {
//         res
//           .status(404)
//           .json({ success: false, message: "TypeEmail not found" });
//         return;
//       }

//       // Toggle the isActive field
//       typeEmail.isActive = !typeEmail.isActive;
//       await typeEmail.save();

//       res.json({ success: true, data: typeEmail });
//     } catch (err: any) {
//       res.status(500).json({ success: false, error: err.message });
//     }
//   }
// );

export default router;
