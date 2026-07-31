import mongoose, { Schema, Document } from "mongoose";

export interface IOrderPlan extends Document {
  orderId: mongoose.Types.ObjectId;
  planId: mongoose.Types.ObjectId;
  emailTypeId: mongoose.Types.ObjectId;

  registrationDate: Date | null;
  expiryDate: Date | null;

  noOfUsers: number;
 type:
  | "email"
  | "storage"
  | "msoffice"
  | "hosting"
  | "website"
  | "ssl";

  adminEmail: string;
  adminPassword: string;
  status: string;

  createdAt: Date;
  updatedAt: Date;
}

const OrderPlanSchema = new Schema(
  {
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true },
planId: { 
  type: Schema.Types.ObjectId, 
  ref: "PlanEmail", 
  required: false,
  default: null
},

emailTypeId: { 
  type: Schema.Types.ObjectId, 
  ref: "TypeEmail", 
  required: false,
  default: null
},

    registrationDate: {
  type: Date,
  required: false,
  default: null,
},
    expiryDate: {
    type: Date,
    required: false,
    default: null,
  },

    noOfUsers: { type: Number, default: 1 },

    type: {
      type: String,
      enum: [
  "email",
  "storage",
  "msoffice",
  "hosting",
  "website",
  "ssl"
],
      required: true,
    },

    // NEW FIELDS FROM CSV
    adminEmail: { type: String, default: "" },
    adminPassword: { type: String, default: "" },
    status: { type: String, default: "" },
  },
  { timestamps: true }
);

export const OrderPlan =
  mongoose.models.OrderPlan ||
  mongoose.model<IOrderPlan>("OrderPlan", OrderPlanSchema);
