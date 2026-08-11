import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import User from "../models/User";
import Client from "../models/Client";

export interface AuthRequest extends Request {
  user?: {
    _id: string;
    email: string;
    role: string;
    clientId?: string | null;
    type?: "user" | "client";
  };
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // =====================================================
    // 1. CHECK AUTHORIZATION HEADER
    // =====================================================

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        error: "No token provided",
      });
      return;
    }

    // =====================================================
    // 2. EXTRACT TOKEN
    // =====================================================

    const token = authHeader.split(" ")[1];

    if (!token) {
      res.status(401).json({
        success: false,
        error: "Invalid authorization header",
      });
      return;
    }

    // =====================================================
    // 3. CHECK JWT SECRET
    // =====================================================

    if (!process.env.JWT_SECRET) {
      res.status(500).json({
        success: false,
        error: "JWT secret is not configured",
      });
      return;
    }

    // =====================================================
    // 4. VERIFY TOKEN
    // =====================================================

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    ) as {
      _id: string;
      email: string;
      role: string;
      clientId?: string;
    };

    console.log("[AUTH] Decoded token:", decoded);

    // =====================================================
    // 5. FIRST CHECK USERS COLLECTION
    // =====================================================

    const user = await User.findById(decoded._id)
      .populate("userType")
      .select("_id email name userType");

    // =====================================================
    // 6. NORMAL USER / ADMIN
    // =====================================================

    if (user) {
      let role = decoded.role;

      if (
        user.userType &&
        typeof user.userType === "object"
      ) {
        role = (user.userType as any).name || role;
      }

      console.log("[AUTH] User found:", user.email);
      console.log("[AUTH] User role:", role);

      req.user = {
        _id: user._id.toString(),
        email: user.email,
        role,
        clientId: null,
        type: "user",
      };

      next();
      return;
    }

    // =====================================================
    // 7. USER NOT FOUND
    //    CHECK CLIENT COLLECTION
    // =====================================================

    console.log(
      "[AUTH] User not found. Checking client..."
    );

    const client = await Client.findById(decoded._id)
      .populate("userType")
      .select("_id c_email c_name userType is_active c_portalEnabled");

    // =====================================================
    // 8. CLIENT NOT FOUND
    // =====================================================

    if (!client) {
      console.log(
        "[AUTH] Client not found:",
        decoded._id
      );

      res.status(401).json({
        success: false,
        error: "User or client not found",
      });

      return;
    }

    console.log(
      "[AUTH] Client found:",
      client._id
    );

    // =====================================================
    // 9. CLIENT STATUS
    // =====================================================

    if (client.is_active === false) {
      res.status(403).json({
        success: false,
        error: "Client account is inactive",
      });

      return;
    }

    // =====================================================
    // 10. CLIENT PORTAL ACCESS
    // =====================================================

    if (client.c_portalEnabled === false) {
      res.status(403).json({
        success: false,
        error: "Client portal access is disabled",
      });

      return;
    }

    // =====================================================
    // 11. GET CLIENT ROLE
    // =====================================================

    let role = decoded.role || "Client";

    if (
      client.userType &&
      typeof client.userType === "object"
    ) {
      const userTypeName =
        (client.userType as any).name;

      console.log(
        "[AUTH] Client UserType:",
        userTypeName
      );

      // Database = Customer
      // Application = Client

      if (userTypeName === "Customer") {
        role = "Client";
      } else if (userTypeName) {
        role = userTypeName;
      }
    }

    console.log("[AUTH] Final client role:", role);

    // =====================================================
    // 12. GET CLIENT EMAIL
    // =====================================================

    let clientEmail = decoded.email;

    if (
      Array.isArray(client.c_email) &&
      client.c_email.length > 0
    ) {
      clientEmail = client.c_email[0];
    }

    // =====================================================
    // 13. ATTACH CLIENT TO REQUEST
    // =====================================================

    req.user = {
      _id: client._id.toString(),
      email: clientEmail,
      role,
      clientId: client._id.toString(),
      type: "client",
    };

    console.log("[AUTH] req.user:", req.user);

    // =====================================================
    // 14. NEXT
    // =====================================================

    next();

  } catch (err: any) {
    console.error(
      "[AUTH ERROR]:",
      err.message
    );

    // =====================================================
    // TOKEN EXPIRED
    // =====================================================

    if (err.name === "TokenExpiredError") {
      res.status(401).json({
        success: false,
        error: "Token expired",
      });

      return;
    }

    // =====================================================
    // INVALID TOKEN
    // =====================================================

    if (err.name === "JsonWebTokenError") {
      res.status(401).json({
        success: false,
        error: "Invalid token",
      });

      return;
    }

    // =====================================================
    // OTHER ERROR
    // =====================================================

    res.status(500).json({
      success: false,
      error: "Authentication failed",
    });

    return;
  }
};