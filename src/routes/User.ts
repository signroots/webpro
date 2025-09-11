import express, { Request, Response } from "express";
import User from "../models/User";

const router = express.Router();

// Register - POST /api/users/register
router.post("/register", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name } = req.body;

    if (password.length < 6) {
      res.status(400).json({ error: "Password must be at least 6 characters long" });
      return;
    }

    // Don't hash manually - model pre-save will do it
    const user = await User.create({ email, password, name });

    res.status(201).json({ message: "User registered successfully", user });
  } catch (err: any) {
    if (err.name === "ValidationError") {
      res.status(400).json({ error: err.message });
    } else if (err.code === 11000) {
      res.status(400).json({ error: "Email already registered" });
    } else {
      res.status(500).json({ error: "Server error" });
    }
  }
});

// Login - POST /api/users/login
router.post("/login", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const isMatch = await user.comparePassword(password);

    console.log("Plain password:", password);
    console.log("Stored hash:", user.password);
    console.log("Compare result:", isMatch);

    if (!isMatch) {
      res.status(400).json({ error: "Invalid password" });
      return;
    }

    res.json({ message: "Login successful", user });
  } catch (err: any) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
