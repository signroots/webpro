import mongoose, { Schema, Document } from "mongoose";

export interface IOrderPlan extends Document {
  orderId: mongoose.Types.ObjectId;

  type:
    | "email"
    | "storage"
    | "msoffice"
    | "hosting"
    | "website"
    | "ssl";

  // ===============================
  // EMAIL / STORAGE / MS OFFICE
  // ===============================

  emailTypeId?: mongoose.Types.ObjectId | null;

  planId?: mongoose.Types.ObjectId | null;

  noOfUsers?: number;

  registrationDate?: Date | null;

  expiryDate?: Date | null;

  // ===============================
  // HOSTING
  // ===============================

  hostTypeId?: mongoose.Types.ObjectId | null;

  hostSubTypeId?: mongoose.Types.ObjectId | null;

  storageId?: mongoose.Types.ObjectId | null;

  // ===============================
  // WEBSITE / SSL
  // ===============================

  websiteDetails?: any;

  sslDetails?: any;

  // ===============================
  // ADMIN LOGIN
  // ===============================

  adminEmail?: string;

  adminPassword?: string;

  // ===============================
  // STATUS
  // ===============================

  status?: mongoose.Types.ObjectId | null;

  // ===============================
  // TIMESTAMPS
  // ===============================

  createdAt: Date;

  updatedAt: Date;
}

const OrderPlanSchema = new Schema(
  {
    // ===============================
    // ORDER
    // ===============================

    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },

    // ===============================
    // SERVICE TYPE
    // ===============================

    type: {
      type: String,
      enum: [
        "email",
        "storage",
        "msoffice",
        "hosting",
        "website",
        "ssl",
      ],
      required: true,
    },

    // ===============================
    // STATUS
    // ===============================

    status: {
      type: Schema.Types.ObjectId,
      ref: "Status",
      default: null,
    },

    // ===============================
    // EMAIL / STORAGE / MS OFFICE
    // ===============================

    emailTypeId: {
      type: Schema.Types.ObjectId,
      ref: "TypeEmail",
      default: null,
    },

    planId: {
      type: Schema.Types.ObjectId,
      ref: "PlanEmail",
      default: null,
    },

    noOfUsers: {
      type: Number,
      default: 1,
    },

    registrationDate: {
      type: Date,
      default: null,
    },

    expiryDate: {
      type: Date,
      default: null,
    },

    // ===============================
    // HOSTING
    // ===============================

    hostTypeId: {
      type: Schema.Types.ObjectId,
      ref: "HostType",
      default: null,
    },

    hostSubTypeId: {
      type: Schema.Types.ObjectId,
      ref: "HostSubType",
      default: null,
    },

    storageId: {
      type: Schema.Types.ObjectId,
      ref: "Storage",
      default: null,
    },

    // ===============================
    // WEBSITE
    // ===============================

    websiteDetails: {
      type: Object,
      default: null,
    },

    // ===============================
    // SSL
    // ===============================

    sslDetails: {
      type: Object,
      default: null,
    },

    // ===============================
    // ADMIN LOGIN
    // ===============================

    adminEmail: {
      type: String,
      default: "",
    },

    adminPassword: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

export const OrderPlan =
  mongoose.models.OrderPlan ||
  mongoose.model<IOrderPlan>("OrderPlan", OrderPlanSchema);