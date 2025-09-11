import mongoose from "mongoose";
import * as XLSX from "xlsx";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
dayjs.extend(customParseFormat);

// 1) Connect to MongoDB
mongoose
  .connect("mongodb://127.0.0.1:27017/domain_management")
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// 2) Define schema & model
const EmailSchema = new mongoose.Schema(
  {
    domain: { type: String, required: true, trim: true },
    subscription: { type: String, default: "", trim: true },
    plan: { type: String, default: "", trim: true },
    status: { type: String, default: "", trim: true },
    username: { type: String, default: "", trim: true },
    password: { type: String, default: "", trim: true },
    users: { type: Number, default: 0 },
    creationDate: { type: Date, default: null },
    expiryDate: { type: Date, default: null },
    customer: { type: String, default: "", trim: true },
    provider: { type: String, default: "", trim: true },
  },
  { timestamps: false, collection: "emails" } // explicit collection name
);

const Email = mongoose.model("emails", EmailSchema);

// --- Helpers ---

/** Convert Excel serial date (days since 1899-12-30) to JS Date */
function excelSerialToDate(serial: number): Date {
  // round to avoid floating point issues; 86400*1000 = ms/day
  return new Date(Math.round((serial - 25569) * 86400 * 1000));
}

/** Parse value that may be an Excel serial, JS Date, or string */
function parseMaybeDate(v: any): Date | null {
  if (v == null || v === "") return null;

  // If already a JS Date
  if (v instanceof Date && !isNaN(v.getTime())) return v;

  // If numeric (Excel serial)
  if (typeof v === "number") return excelSerialToDate(v);

  // If string, try multiple formats (strict mode = true)
  const s = String(v).trim();
  const parsed = dayjs(s, [
    "DD-MMM-YYYY",
    "D-MMM-YYYY",
    "DD-MMMM-YYYY",
    "D-MMMM-YYYY",
    "DD/MM/YYYY",
    "D/M/YYYY",
    "YYYY-MM-DD",
  ], true);

  return parsed.isValid() ? parsed.toDate() : null;
}

// 3) Read file (TIP: if you use .xlsx, prefer: XLSX.readFile("data.xlsx", { cellDates: true }))
const workbook = XLSX.readFile("./data.csv"); // works for CSV or XLSX
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];

// defval: "" keeps empty cells as empty strings instead of undefined
const rawData: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

// 4) Map headers → schema fields, fix dates
const data = rawData.map((row) => ({
  domain: (row["Domain"] ?? "").toString().trim(),
  subscription: (row["Subscription"] ?? "").toString().trim(),
  plan: (row["Plan"] ?? "").toString().trim(),
  status: (row["Status"] ?? "").toString().trim(),
  username: (row["Username"] ?? "").toString().trim(),
  password: (row["Password"] ?? "").toString().trim(),
  users: Number(row["Users"] ?? 0) || 0,
  creationDate: parseMaybeDate(row["Creation Date"]),
  expiryDate: parseMaybeDate(row["Expiry Date"]),
  customer: (row["Customer"] ?? "").toString().trim(),
  provider: (row["Provider"] ?? "").toString().trim(),
}));

// Optional: quick sanity check for rows that still failed to parse dates
for (const r of data) {
  if (r.creationDate === null && (rawData as any[]).length) {
    // console.warn("⚠️ Could not parse Creation Date for domain:", r.domain);
  }
}

// 5) Insert into MongoDB
(async () => {
  try {
    if (data.length === 0) {
      console.log("⚠️ No data found in file");
      process.exit(0);
    }

    await Email.insertMany(data);
    console.log("🎉 Data imported successfully!");
  } catch (error) {
    console.error("❌ Error importing data:", error);
  } finally {
    await mongoose.connection.close();
  }
})();
