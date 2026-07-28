import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import User from "../models/User";

export interface AuthRequest extends Request {
  user?: {
    _id: string;
    email: string;
    role: string;
  };
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        error: "No token provided",
      });
      return;
    }

    // Extract token
    const token = authHeader.split(" ")[1];

    // Check JWT secret
    if (!process.env.JWT_SECRET) {
      res.status(500).json({
        success: false,
        error: "JWT secret is not configured",
      });
      return;
    }

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    ) as {
      _id: string;
      email: string;
      role: string;
    };

    // Check user exists in database
    const user = await User.findById(decoded._id)
      .populate("userType")
      .select("_id email userType");

    if (!user) {
      res.status(401).json({
        success: false,
        error: "User not found",
      });
      return;
    }

    // Get role from token / database
    let role = decoded.role;

    if (user.userType && typeof user.userType === "object") {
      role = (user.userType as any).name;
    }

    // Attach user details to request
    req.user = {
      _id: user._id.toString(),
      email: user.email,
      role,
    };

    next();

  } catch (err: any) {
    console.error("Authentication error:", err.message);

    if (err.name === "TokenExpiredError") {
      res.status(401).json({
        success: false,
        error: "Token expired",
      });
      return;
    }

    if (err.name === "JsonWebTokenError") {
      res.status(401).json({
        success: false,
        error: "Invalid token",
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: "Authentication failed",
    });
  }
};