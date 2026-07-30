"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Order = void 0;
var mongoose_1 = require("mongoose");
var orderSchema = new mongoose_1.default.Schema({
    // ========================
    // Basic Domain Information
    // ========================
    domainName: { type: String, required: true, index: true, unique: true },
    status: { type: String },
    customer: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "Customer" },
    client: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "Client" },
    registrarName: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "Registrar" },
    managedBy: { type: String, enum: ["Signroots", "Customer"] },
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
    domainSource: {
  type: mongoose_1.default.Schema.Types.ObjectId,
  ref: "DomainSource"
},

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
    dns_flag: { type: Boolean, default: false },
    ssl_flag: { type: Boolean, default: false },
    host_flag: { type: Boolean, default: false },
    storage_services_flag: { type: Boolean, default: false },
    msoffice_services_flag: { type: Boolean, default: false },
    // ========================
    // References to Other Models
    // ========================
    emailtypeid: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "TypeEmail" },
    planid: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "EmailPlan" },
    hosttypeid: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "HostType" },
    subHostTypeId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "HostSubType" },
    hoststorageId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "Storage" },
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
}, { timestamps: true });
// ✅ Prevent model overwrite in hot-reload environments
exports.Order = mongoose_1.default.models.Order || mongoose_1.default.model("Order", orderSchema);
exports.default = exports.Order;
