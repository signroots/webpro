import mongoose from "mongoose";
import * as XLSX from "xlsx";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

import Order from "./models/Order";
import { OrderPlan } from "./models/OrderPlan";
import { PlanEmail } from "./models/PlanEmail";
import { TypeEmail } from "./models/TypeEmail";

dayjs.extend(customParseFormat);

// ----------------------------------
// CONNECT TO MONGODB
// ----------------------------------
mongoose
  .connect("mongodb://127.0.0.1:27017/domain_management_system")
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

/* ----------------------------------
   HELPERS
---------------------------------- */

function excelSerialToDate(serial: number): Date {
  return new Date(Math.round((serial - 25569) * 86400 * 1000));
}

function parseMaybeDate(value: any): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "number") return excelSerialToDate(value);

  const parsed = dayjs(
    value,
    ["DD-MMM-YYYY", "D-MMM-YYYY", "DD/MM/YYYY", "YYYY-MM-DD"],
    true
  );

  return parsed.isValid() ? parsed.toDate() : null;
}

/* ----------------------------------
   LOOKUP HELPERS
---------------------------------- */

async function getEmailTypeId(typeName: string) {
  if (!typeName) return null;

  let type = await TypeEmail.findOne({ name: typeName });

  if (!type) {
    type = await TypeEmail.create({ name: typeName });
  }

  return type._id;
}

async function getPlanId(planName: string, typeName: string) {
  if (!planName || !typeName) return null;

  const emailType = await getEmailTypeId(typeName);

  let plan = await PlanEmail.findOne({ plan: planName, emailType });

  if (!plan) {
    plan = await PlanEmail.create({
      plan: planName,
      emailType,
    });
  }

  return plan._id;
}

/* ----------------------------------
   READ CSV FILE
---------------------------------- */

const workbook = XLSX.readFile("./M365 data for App - 4 WEBSITE.csv");
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rawRows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

const rows = rawRows.map((row) => ({
  domain: row["Domain"]?.trim(),

  adminEmail: row["Portal Admin Email"]?.trim(),
  adminPassword: row["PWD"]?.trim(),
  status: row["STATUS"]?.trim(),

  email_plan: row["Email Licence"]?.trim(),
  email_users: Number(row["Users1"] || 0),

  storage_plan: row["Storage"]?.trim(),
  storage_users: Number(row["Users2"] || 0),

  ms_plan: row["MS OFFICE"]?.trim(),
  ms_users: Number(row["Users3"] || 0),

  creationDate: parseMaybeDate(row["Creation Date"]),
  renewalDate: parseMaybeDate(row["Renewal Date"]),
}));

/* ----------------------------------
   MAIN IMPORT LOGIC
---------------------------------- */

(async () => {
  try {
    for (const row of rows) {
      if (!row.domain) continue;
const hasStorage = !!(row.storage_plan && row.storage_users > 0);
const hasMSOffice = !!(row.ms_plan && row.ms_users > 0);

      /* ---------------- ORDER TABLE ---------------- */
      let order = await Order.findOne({ domainName: row.domain });

      if (!order) {
        order = await Order.create({
          domainName: row.domain,

          username: row.adminEmail,
          password: row.adminPassword,

          email_status: row.status,
          email_flag: true,
          storage_services_flag:hasStorage,
          
          msoffice_services_flag:hasMSOffice,

          microsoft_email: true,

          registrationDate: row.creationDate || new Date(),
          email_expiryDate: row.renewalDate,

          provider: "Microsoft 365",
          managedBy: "Signroots",
        });

        console.log(`✨ Created Order: ${row.domain}`);
      } else {
        await order.updateOne({
  $set: {
    username: row.adminEmail,
    password: row.adminPassword,
    provider: "Microsoft 365",

    email_status: row.status,
    email_expiryDate: row.renewalDate,

    storage_services_flag: hasStorage,
    msoffice_services_flag: hasMSOffice,

    microsoft_email: true,
    email_flag: true,
  },
});

        console.log(`🔄 Updated Order: ${row.domain}`);
      }

      const orderId = order._id;

      /* ---------------- DATES ---------------- */
      const regDate = row.creationDate || order.registrationDate || new Date();
      const expDate = row.renewalDate || order.email_expiryDate || new Date();

      /* ---------------- ORDER PLAN TABLE ---------------- */

      // EMAIL PLAN
      if (row.email_plan && row.email_users > 0) {
        await OrderPlan.create({
          orderId,
          planId: await getPlanId(row.email_plan, "Email Licence"),
          // emailTypeId: await getEmailTypeId("Email Licence"),
          emailTypeId: "69294e938b1a73e433793f08",

          registrationDate: regDate,
          expiryDate: expDate,

          noOfUsers: row.email_users,
          type: "email",

          adminEmail: row.adminEmail,
          adminPassword: row.adminPassword,
          status: row.status,
        });

        console.log(`📨 Email Plan Added: ${row.domain}`);
      }

      // STORAGE PLAN
      if (row.storage_plan && row.storage_users > 0) {
        await OrderPlan.create({
          orderId,
          planId: await getPlanId(row.storage_plan, "Storage"),
          emailTypeId: "69294e938b1a73e433793f08",

          registrationDate: regDate,
          expiryDate: expDate,

          noOfUsers: row.storage_users,
          type: "storage",

          adminEmail: row.adminEmail,
          adminPassword: row.adminPassword,
          status: row.status,
        });

        console.log(`🗄️ Storage Plan Added: ${row.domain}`);
      }

      // MS OFFICE PLAN
      if (row.ms_plan && row.ms_users > 0) {
        await OrderPlan.create({
          orderId,
          planId: await getPlanId(row.ms_plan, "MS Office"),
          emailTypeId: "69294e938b1a73e433793f08",

          registrationDate: regDate,
          expiryDate: expDate,

          noOfUsers: row.ms_users,
          type: "msoffice",

          adminEmail: row.adminEmail,
          adminPassword: row.adminPassword,
          status: row.status,
        });

        console.log(`💻 MS Office Plan Added: ${row.domain}`);
      }
    }

    console.log("🎉 Import Completed Successfully");
  } catch (err) {
    console.error("❌ Import Error:", err);
  } finally {
    await mongoose.connection.close();
  }
})();
