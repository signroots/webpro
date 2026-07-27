import mongoose, { Document } from "mongoose";

export interface IOrder extends Document {
  domainName: string;
  status?: string;
  customer?: mongoose.Types.ObjectId;
  client?: mongoose.Types.ObjectId;
  emailtypeid?: mongoose.Types.ObjectId;
  planid?: mongoose.Types.ObjectId;
  hosttypeid?: mongoose.Types.ObjectId;
  subHostTypeId?: mongoose.Types.ObjectId;
  hoststorageId?: mongoose.Types.ObjectId;
  registrarName?: mongoose.Types.ObjectId;
  managedBy: "Signroots" | "Customer";
  is_active:{
  type:Boolean,
  default:true
},
  registrationDate?: Date;
  expiryDate?: Date;
  originalRegistrar?: string;
  reseller_outside_inside?: "SubReseller" | "MainReseller" | "Unknown";
  reseller_id?: number;
  nameServers: string[];
  dnsDetails: string[];
  lockStatus?: string;
  domainSource?: string;
  resellerCustomerId?: string;
  businessEmail?: boolean;
  hosting?: boolean;
  subResellerName?: string;
  subResellerEmail?: string;
  cloudflareRegistered?: boolean;
  modified_on?: string;
  created_on?: string;
  activated_on?: string;
  order_id?: string;
  google_email?: boolean;
  microsoft_email?: boolean;
  email_flag?: boolean;
  website_flag?: boolean;
  domain_flag?: boolean;
  ssl_flag?: boolean;
  host_flag?: boolean;
  storage_services_flag?:boolean;
  msoffice_services_flag?:boolean;
  dns_flag?:boolean;
  subscription?: string;
  email_status?: string;
  username?: string;
  password?: string;
  users?: number;
  creationDate?: Date | null;
  email_expiryDate?: Date | null;
  email_customer?: string;
  provider?: string;
  
}

const orderSchema = new mongoose.Schema<IOrder>(
  {
    // ========================
    // Basic Domain Information
    // ========================
    domainName: { type: String, required: true, index: true, unique: true },
    status: { type: String },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
    client: { type: mongoose.Schema.Types.ObjectId, ref: "Client" },
    registrarName: { type: mongoose.Schema.Types.ObjectId, ref: "Registrar" },
    managedBy: { type: String, enum: ["Signroots", "Customer"] },

  is_active:{
    type:Boolean,
    default:true
  },

    // ========================
    // Dates
    // ========================
    registrationDate: { type: Date },
    expiryDate: { type: Date },
    creationDate: { type: Date },
    email_expiryDate: { type: Date },

    // ========================
    // Reseller Info
    // ========================
    originalRegistrar: { type: String },
    reseller_outside_inside: {
      type: String,
      enum: ["SubReseller", "MainReseller", "Unknown"],
    },
    reseller_id: { type: Number },
    subResellerName: { type: String },
    subResellerEmail: { type: String },

    // ========================
    // Domain Config
    // ========================
    nameServers: [{ type: String }],
    dnsDetails: [{ type: String }],
    lockStatus: { type: String },
    domainSource: { type: String },
    resellerCustomerId: { type: String },
    cloudflareRegistered: { type: Boolean, default: false },

    // ========================
    // Flags
    // ========================
    businessEmail: { type: Boolean, default: false },
    hosting: { type: Boolean, default: false },
    google_email: { type: Boolean, default: false },
    microsoft_email: { type: Boolean, default: false },
    email_flag: { type: Boolean, default: false },
    website_flag: { type: Boolean, default: false },
    domain_flag: { type: Boolean, default: false },
    ssl_flag: { type: Boolean, default: false },
    host_flag: { type: Boolean, default: false },
    storage_services_flag:{type:Boolean,default:false},
    msoffice_services_flag:{type:Boolean,default:false},
    dns_flag:{type:Boolean,default:false},
    // ========================
    // References to Other Models
    // ========================
    emailtypeid: { type: mongoose.Schema.Types.ObjectId, ref: "TypeEmail" },
    planid: { type: mongoose.Schema.Types.ObjectId, ref: "EmailPlan" },
    hosttypeid: { type: mongoose.Schema.Types.ObjectId, ref: "HostType" },
    subHostTypeId: { type: mongoose.Schema.Types.ObjectId, ref: "HostSubType" },
hoststorageId: { type: mongoose.Schema.Types.ObjectId, ref: "Storage" },


    // ========================
    // Email Service Details
    // ========================
    subscription: { type: String },
    email_status: { type: String },
    username: { type: String },
    password: { type: String },
    users: { type: Number },
    email_customer: { type: String },
    provider: { type: String },

    // ========================
    // Metadata
    // ========================
    modified_on: { type: String },
    created_on: { type: String },
    activated_on: { type: String },
    order_id: { type: String },
  },
  { timestamps: true }
);

// ✅ Prevent model overwrite in hot-reload environments
export const Order =
  mongoose.models.Order || mongoose.model<IOrder>("Order", orderSchema);

export default Order;
