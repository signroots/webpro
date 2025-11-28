import mongoose, { Schema, Document } from "mongoose";

export interface IOrderPlan extends Document {
  orderId: mongoose.Types.ObjectId;
  planId: mongoose.Types.ObjectId;
  emailTypeId: mongoose.Types.ObjectId;

  registrationDate: Date;
  expiryDate: Date;

  noOfUsers: number;
  type: "email" | "storage" | "msoffice";

  adminEmail: string;
  adminPassword: string;
  status: string;

  createdAt: Date;
  updatedAt: Date;
}

const OrderPlanSchema = new Schema(
  {
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    planId: { type: Schema.Types.ObjectId, ref: "PlanEmail", required: true },
    emailTypeId: { type: Schema.Types.ObjectId, ref: "TypeEmail", required: true },

    registrationDate: { type: Date, required: true },
    expiryDate: { type: Date, required: true },

    noOfUsers: { type: Number, default: 1 },

    type: {
      type: String,
      enum: ["email", "storage", "msoffice"],
      required: true,
    },

    // NEW FIELDS FROM CSV
    adminEmail: { type: String, default: "" },
    adminPassword: { type: String, default: "" },
    status: { type: String, default: "" },
  },
  { timestamps: true }
);

export const OrderPlan = mongoose.model<IOrderPlan>("OrderPlan", OrderPlanSchema);
