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
    type?: "user" | "client" | "customer";
  };
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // =====================================================
    // 1. AUTHORIZATION HEADER
    // =====================================================

    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        error: "No token provided",
      });
      return;
    }

    const token = authHeader.substring(7);

    if (!token) {
      res.status(401).json({
        success: false,
        error: "Invalid authorization header",
      });
      return;
    }

    // =====================================================
    // 2. JWT SECRET
    // =====================================================

    if (!process.env.JWT_SECRET) {
      res.status(500).json({
        success: false,
        error: "JWT secret is not configured",
      });
      return;
    }

    // =====================================================
    // 3. VERIFY TOKEN
    // =====================================================

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    ) as {
      _id: string;
      email: string;
      role?: string;
      type?: string;
      clientId?: string;
    };

    console.log("=================================");
    console.log("[AUTH] DECODED TOKEN");
    console.log(decoded);
    console.log("=================================");

    // =====================================================
    // 4. CLIENT / CUSTOMER
    // =====================================================

    const isClient =
      decoded.role?.toLowerCase() === "client" ||
      decoded.type?.toLowerCase() === "client" ||
      decoded.type?.toLowerCase() === "customer";

    if (isClient) {
      const clientId =
        decoded.clientId || decoded._id;

      console.log("[AUTH] Client/Customer token");
      console.log("[AUTH] Client ID:", clientId);

      // -----------------------------------------------------
      // FIND CLIENT
      // -----------------------------------------------------

      const client = await Client.findById(clientId)
        .populate("userType")
        .select(
          "_id c_email c_name userType is_active c_portalEnabled"
        );

      if (!client) {
        console.log(
          "[AUTH] Client not found:",
          clientId
        );

        res.status(401).json({
          success: false,
          error: "Client not found",
        });

        return;
      }

      console.log(
        "[AUTH] Client found:",
        client._id
      );

      // -----------------------------------------------------
      // ACTIVE CHECK
      // -----------------------------------------------------

      if (client.is_active === false) {
        res.status(403).json({
          success: false,
          error: "Client account is inactive",
        });

        return;
      }

      // -----------------------------------------------------
      // PORTAL CHECK
      // -----------------------------------------------------

      if (client.c_portalEnabled === false) {
        res.status(403).json({
          success: false,
          error: "Client portal access is disabled",
        });

        return;
      }

      // -----------------------------------------------------
      // USER TYPE
      // -----------------------------------------------------

      const userTypeName =
        (client.userType as any)?.name;

      console.log(
        "[AUTH] Client UserType:",
        userTypeName
      );

      // Database:
      // Customer
      //
      // Application:
      // Client

      let role = "Client";

      if (
        userTypeName &&
        userTypeName.toLowerCase() === "customer"
      ) {
        role = "Client";
      }

      // -----------------------------------------------------
      // EMAIL
      // -----------------------------------------------------

      let clientEmail = decoded.email;

      if (Array.isArray(client.c_email)) {
        clientEmail =
          client.c_email[0] || decoded.email;
      } else if (client.c_email) {
        clientEmail = client.c_email as any;
      }

      // -----------------------------------------------------
      // ATTACH CLIENT USER
      // -----------------------------------------------------

      req.user = {
        _id: client._id.toString(),
        email: clientEmail,
        role: "Client",
        clientId: client._id.toString(),
        type: "customer",
      };

      console.log(
        "[AUTH] FINAL CLIENT USER:",
        req.user
      );

      next();
      return;
    }

    // =====================================================
    // 5. NORMAL USER / ADMIN
    // =====================================================

    console.log(
      "[AUTH] Normal User/Admin token"
    );

    const user = await User.findById(
      decoded._id
    )
      .populate("userType")
      .select("_id email name userType");

    if (!user) {
      console.log(
        "[AUTH] User not found:",
        decoded._id
      );

      res.status(401).json({
        success: false,
        error: "User not found",
      });

      return;
    }

    // -----------------------------------------------------
    // USER ROLE
    // -----------------------------------------------------

    let role =
      decoded.role || "User";

    if (
      user.userType &&
      typeof user.userType === "object"
    ) {
      role =
        (user.userType as any).name ||
        role;
    }

    console.log(
      "[AUTH] User:",
      user.email
    );

    console.log(
      "[AUTH] User role:",
      role
    );

    // -----------------------------------------------------
    // ATTACH USER
    // -----------------------------------------------------

    req.user = {
      _id: user._id.toString(),
      email: user.email,
      role,
      clientId: null,
      type: "user",
    };

    console.log(
      "[AUTH] FINAL USER:",
      req.user
    );

    next();

  } catch (err: any) {

    console.error(
      "[AUTH ERROR]:",
      err
    );

    if (
      err.name === "TokenExpiredError"
    ) {
      res.status(401).json({
        success: false,
        error: "Token expired",
      });

      return;
    }

    if (
      err.name === "JsonWebTokenError"
    ) {
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