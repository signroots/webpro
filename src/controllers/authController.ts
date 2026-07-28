// controllers/authController.ts
// Connect to Login  API
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";
import { IUser } from "../models/User";

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  try {
    // 1. Find the user and populate userType to get the role
    const user = await User.findOne({ email }).populate("userType");

    if (!user || !user.userType) {
      res.status(401).json({ success: false, error: "Invalid credentials or missing role" });
      return;
    }

    // 2. Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ success: false, error: "Invalid email or password" });
      return;
    }

    // 3. Get role from populated userType
    const role = typeof user.userType === "object" && "name" in user.userType
      ? user.userType.name
      : "Unknown";

    // 4. Create JWT with role
    const payload = {
      _id: user._id,
      email: user.email,
      role, // ✅ this will be available in req.user.role
    };
console.log("JWT Secret Loaded:", process.env.JWT_SECRET?.slice(0, 10)); // Should not be undefined
console.log("Token expiry set to 7d");
    const token = jwt.sign(payload, process.env.JWT_SECRET as string, {
  expiresIn: "7d", // valid for 7 days
});

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        role,
      },
    });
  } catch (err: any) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
};
