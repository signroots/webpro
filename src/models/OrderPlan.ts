import mongoose, { Schema, Document } from "mongoose";

// Interface for TypeScript
export interface IOrderPlan extends Document {
  orderId: mongoose.Types.ObjectId;     // Reference to Order
  planId: mongoose.Types.ObjectId;      // Reference to PlanEmail
  emailTypeId: mongoose.Types.ObjectId; // Reference to TypeEmail
  registrationDate: Date;               // Plan registration date
  expiryDate: Date;                     // Plan expiry date
  noOfUsers: number;                    // Number of users/seats
  createdAt: Date;
  updatedAt: Date;
}

// Mongoose Schema
const OrderPlanSchema: Schema = new Schema(
  {
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    planId: { type: Schema.Types.ObjectId, ref: "PlanEmail", required: true },
    emailTypeId: { type: Schema.Types.ObjectId, ref: "TypeEmail", required: true },
    registrationDate: { type: Date, required: true },
    expiryDate: { type: Date, required: true },
    noOfUsers: { type: Number, default: 1 },
  },
  { timestamps: true }
);

// Export the model
export const OrderPlan = mongoose.model<IOrderPlan>("OrderPlan", OrderPlanSchema);
