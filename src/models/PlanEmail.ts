// models/PlanEmail.ts
import mongoose, { Document, Schema, model } from "mongoose";
import { ITypeEmail } from "./TypeEmail"; // import your TypeEmail interface/model

export interface IPlanEmail extends Document {
  plan: string;            // Plan name or type
  emailType: ITypeEmail["_id"]; // Reference to TypeEmail
  isActive: boolean;
  createdAt: Date;
}

const planEmailSchema = new Schema<IPlanEmail>(
  {
    plan: { type: String, required: true, trim: true },
    emailType: { type: Schema.Types.ObjectId, ref: "TypeEmail", required: true },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true, // automatically creates createdAt and updatedAt
  }
);

export const PlanEmail = model<IPlanEmail>("PlanEmail", planEmailSchema);
