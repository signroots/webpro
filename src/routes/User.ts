import express, { Request, Response } from "express";
import User from "../models/User";
import UserType from "../models/UserType";
const router = express.Router();
import bcrypt from "bcryptjs";
import { IUserType } from "../models/UserType";
import jwt from "jsonwebtoken";
import Client, { IClient } from "../models/Client";
import crypto from "crypto";
import { login } from "../controllers/authController";
import { generateAccessToken, generateRefreshToken } from "../utils/token";
let refreshTokens: string[] = [];
import { encryptPassword } from "../utils/encryption";
// GET all user types
router.get("/types", async (_req, res) => {
  try {
    const userTypes = await UserType.find();
     res.status(200).json(userTypes);
  } catch (err) {
    console.error(err);
     res.status(500).json({ error: "Failed to fetch user types" });
  }
});

// GET user type by ID
router.get("/types/:id", async (req, res) => {
  try {
    const userType = await UserType.findById(req.params.id);
    if (!userType) res.status(404).json({ error: "User type not found" });
     res.json(userType);
  } catch (err) {
    console.error(err);
     res.status(500).json({ error: "Failed to fetch user type" });
  }
});

// CREATE user type
router.post("/types", async (req: Request, res: Response) => {
  try {
    const { name, is_active } = req.body;
    const newUserType = await UserType.create({ name, is_active });
    res.status(201).json(newUserType); // no return
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create user type" });
  }
});



// UPDATE user type
router.put("/types/:id", async (req: Request, res: Response) => {
  try {
    const updated = await UserType.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    if (!updated) res.status(404).json({ error: "User type not found" });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update user type" });
  }
});

// DELETE user type
router.delete("/types/:id", async (req: Request, res: Response) => {
  try {
    const deleted = await UserType.findByIdAndDelete(req.params.id);
    if (!deleted) res.status(404).json({ error: "User type not found" });
    res.json({ message: "User type deleted successfully" });
  } catch (err) {
    console.error(err);
     res.status(500).json({ error: "Failed to delete user type" });
  }
});


// Register - POST /api/users/register
import Customer from "../models/Customer"; // import your customer model

router.post("/register", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name, userType, customerDetails } = req.body;

    if (password.length < 6) {
      res.status(400).json({ error: "Password must be at least 6 characters long" });
      return;
    }

    if (!userType) {
      res.status(400).json({ error: "User type is required" });
      return;
    }

    // Check user type name
    const foundUserType = await UserType.findById(userType);
    if (!foundUserType) {
      res.status(400).json({ error: "Invalid user type" });
      return;
    }

    let customerId = null;

    // ✅ If user type is "Customer", create a Customer document
    if (foundUserType.name === "Customer" && customerDetails) {
      const createdCustomer = await Customer.create({
        ...customerDetails,
        name: name,         // Optional: sync with user name
        email: email,       // Optional: sync with user email
      });

      customerId = createdCustomer._id;
    }

    // ✅ Create the user and associate customer if applicable
    const user = await User.create({
      email,
      password,
      name,
      userType,
      ...(customerId ? { customer: customerId } : {}),
    });

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
    console.log("[DEBUG] Login attempt:", email);

    // ✅ Fetch user + populate userType
    const user = await User.findOne({ email }).populate<{ userType: IUserType }>("userType");

    if (!user) {
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(400).json({ success: false, error: "Invalid credentials" });
      return;
    }

    // ✅ Safely access userType name
    const role = user.userType?.name || "User";

    // ✅ Generate Access Token
    const accessToken = jwt.sign(
      { _id: user._id, email: user.email, role },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );

    // ✅ Generate Refresh Token
    const refreshToken = jwt.sign(
      { _id: user._id, email: user.email },
      process.env.JWT_REFRESH_SECRET as string,
      { expiresIn: "7d" }
    );

    // ✅ Store refresh token in memory
    refreshTokens.push(refreshToken);

    res.json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role,
      },
    });
  } catch (err: any) {
    console.error("[ERROR] Login failed:", err.message);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

router.post("/customer/login", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    console.log("[DEBUG] Login attempt:", email);

    if (!email || !password) {
      res.status(400).json({ success: false, error: "Email and password are required" });
      return;
    }

    // Include password explicitly
    const user = await Client.findOne({ c_email: { $in: [email] } })
      .select("+password")
      .populate("userType");

    if (!user) {
      console.log("[DEBUG] User not found with email:", email);
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }

    if (!user.password) {
      console.log("[DEBUG] User has no password set.");
      res.status(400).json({ success: false, error: "Account has no password set" });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    console.log("[DEBUG] Password match result:", isMatch);

    if (!isMatch) {
      res.status(400).json({ success: false, error: "Invalid credentials" });
      return;
    }

    const firstEmail = user.c_email[0];

    const token = jwt.sign(
      { _id: user._id, email: firstEmail },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );

    const name = user.c_name;
    const role = (user.userType as IUserType)?.name || "User";
console.log("Input password:", password);
console.log("Stored hash:", user.password);
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        email: firstEmail,
        name,
        role,
      },
    });
  } catch (err: any) {
    console.error("[ERROR] Login failed:", err.message);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

router.get("/customer/:id/decrypted", async (req: Request, res: Response): Promise<void> => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      res.status(404).json({ error: "Client not found" });
      return;
    }

    if (!client.encryptedPassword) {
      res.status(404).json({ error: "No encrypted password found" });
      return;
    }

    const [ivHex, encrypted] = client.encryptedPassword.split(":");
    if (!ivHex || !encrypted) {
      res.status(400).json({ error: "Invalid encrypted data format" });
      return;
    }

    const key = crypto
      .createHash("sha256")
      .update(process.env.ENCRYPTION_SECRET || "default_secret")
      .digest();

    const iv = Buffer.from(ivHex, "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    res.json({
      email: client.c_email?.[0] || null,
      password: decrypted,
    });
  } catch (err: any) {
    console.error("Decryption error:", err.message);
    res.status(500).json({ error: "Failed to decrypt password" });
  }
});

// ✅ Refresh token route
router.post("/refresh", async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    // 1️⃣ Validate presence
    if (!refreshToken) {
      res.status(401).json({ success: false, error: "Refresh token required" });
      return;
    }

    // 2️⃣ Validate token existence
    if (!refreshTokens.includes(refreshToken)) {
      res.status(403).json({ success: false, error: "Invalid refresh token" });
      return;
    }

    // 3️⃣ Verify refresh token validity
    jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET as string,
      (err: any, user: any) => {
        if (err) {
          res.status(403).json({ success: false, error: "Invalid refresh token" });
          return;
        }

        // 4️⃣ Create a new short-lived access token
        const newAccessToken = jwt.sign(
          { _id: user._id, email: user.email },
          process.env.JWT_SECRET as string,
          { expiresIn: "15m" } // ⏰ expires in 15 minutes
        );

        res.json({
          success: true,
          accessToken: newAccessToken,
        });
      }
    );
  } catch (error: any) {
    console.error("[ERROR] Refresh token error:", error.message);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});


export default router;
