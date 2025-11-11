import mongoose from "mongoose";
import * as XLSX from "xlsx";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import Order, { IOrder } from "./models/Order"; // adjust path

dayjs.extend(customParseFormat);

// Connect to MongoDB
mongoose.connect("mongodb://root:StrongRootPassword123@127.0.0.1:27017/webpro_db?authSource=admin")

  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Helpers
function excelSerialToDate(serial: number): Date {
  return new Date(Math.round((serial - 25569) * 86400 * 1000));
}

function parseMaybeDate(v: any): Date | null {
  if (!v) return null;
  if (v instanceof Date) return v;
  if (typeof v === "number") return excelSerialToDate(v);
  const parsed = dayjs(
    v,
    ["DD-MMM-YYYY", "D-MMM-YYYY", "DD/MM/YYYY", "YYYY-MM-DD"],
    true
  );
  return parsed.isValid() ? parsed.toDate() : null;
}

// Read CSV
const workbook = XLSX.readFile("./data.csv");
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const rawData: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

// Map CSV → DB schema
const data = rawData.map((row) => ({
  domainName: (row["Domain"] ?? "").toString().trim(),
  subscription: (row["Subscription"] ?? "").toString().trim(),
  plan: (row["Plan"] ?? "").toString().trim(),
  email_status: (row["Status"] ?? "").toString().trim(),
  username: (row["Username"] ?? "").toString().trim(),
  password: (row["Password"] ?? "").toString().trim(),
  users: Number(row["Users"] ?? 0) || 0,
  creationDate: parseMaybeDate(row["Creation Date"]),
  email_expiryDate: parseMaybeDate(row["Expiry Date"]),
  email_customer: (row["Customer"] ?? "").toString().trim(),
  provider: (row["Provider"] ?? "").toString().trim(),
}));

// Import logic
(async () => {
  try {
    if (data.length === 0) {
      console.log("⚠️ No data found in CSV");
      process.exit(0);
    }

    for (const row of data) {
      if (!row.domainName) continue;

      const existing = await Order.findOne({ domainName: row.domainName });

      if (existing) {
        // Update all email fields
        await Order.updateOne(
          { domainName: row.domainName },
          {
            $set: {
              subscription: row.subscription,
              plan: row.plan,
              email_status: row.email_status,
              username: row.username,
              password: row.password,
              users: row.users,
              creationDate: row.creationDate,
              email_expiryDate: row.email_expiryDate,
              email_customer: row.email_customer,
              provider: row.provider,
              email_flag: true,
            },
          }
        );
        console.log(`🔄 Updated email details for: ${row.domainName}`);
      } else {
        // Insert new
        const newOrder: Partial<IOrder> = {
          ...row,
          managedBy: "Signroots", // default for required field
          registrationDate: row.creationDate || new Date(),
          email_flag: true,
        };
        await Order.create(newOrder);
        console.log(`✨ Inserted new domain with email_flag: ${row.domainName}`);
      }
    }

    console.log("🎉 Import/update completed!");
  } catch (err) {
    console.error("❌ Error importing data:", err);
  } finally {
    await mongoose.connection.close();
  }
})();
