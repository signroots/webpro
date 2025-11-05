import crypto from "crypto";

export function encryptPassword(password: string): string {
  const iv = crypto.randomBytes(16);
  const key = crypto
    .createHash("sha256")
    .update(process.env.ENCRYPTION_SECRET || "default_secret")
    .digest();

  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(password, "utf8", "hex");
  encrypted += cipher.final("hex");

  return `${iv.toString("hex")}:${encrypted}`;
}
