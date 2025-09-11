import mongoose, { Document } from "mongoose";

export interface IDomain extends Document {
  domainName: string;
  status?: string;
  customer?: mongoose.Types.ObjectId;
  registrarName?: mongoose.Types.ObjectId;
  managedBy: "Signroots" | "Customer";
  registrationDate: Date;
  expiryDate: Date;
  originalRegistrar?: string;
  reseller_outside_inside?: string;
  reseller_id?: number;
  nameServers: string[];
  dnsDetails: string[];
  lockStatus?: string;
  domainSource?: string[];
  resellerCustomerId?: string;
  businessEmail?: boolean;
  hosting?: boolean;
  subResellerName?: string;
  subResellerEmail?: string;
  cloudflareRegistered?: boolean;
  google_email?: boolean;
  microsoft_email?: boolean;

  // 🔥 New field to store email services
  email_services?: mongoose.Types.ObjectId[];
}

const domainSchema = new mongoose.Schema<IDomain>(
  {
    domainName: { type: String, required: true, index: true, unique: true },
    status: { type: String },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
    registrarName: { type: mongoose.Schema.Types.ObjectId, ref: "Registrar" },
    managedBy: { type: String, enum: ["Signroots", "Customer"], required: true },
    registrationDate: { type: Date, required: true },
    expiryDate: { type: Date, required: true },
    originalRegistrar: { type: String },
    reseller_outside_inside: { type: String, enum: ["SubReseller", "MainReseller", "Unknown"] },
    reseller_id: { type: Number },
    nameServers: [{ type: String }],
    dnsDetails: [{ type: String }],
    lockStatus: { type: String },
    domainSource: [{ type: String }],
    resellerCustomerId: { type: String },
    businessEmail: { type: Boolean, default: false },
    hosting: { type: Boolean, default: false },
    google_email: { type: Boolean, default: false },
    microsoft_email:{ type: Boolean, default: false },
    subResellerName: { type: String },
    subResellerEmail: { type: String },
    cloudflareRegistered: { type: Boolean, default: false },

    // 🔥 Store related email accounts
   email_services: [
  { type: mongoose.Schema.Types.ObjectId, ref: "Email" }
],
  },
  { timestamps: true }
);

export default (mongoose.models.Domain as mongoose.Model<IDomain>) ||
  mongoose.model<IDomain>("Domain", domainSchema);
