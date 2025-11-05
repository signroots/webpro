// backend/models/TypeEmail.ts
import mongoose, { Schema, Document } from "mongoose";

export interface ITypeEmail extends Document {
  name: string;
  isActive: boolean;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TypeEmailSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    image: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const TypeEmail = mongoose.model<ITypeEmail>("TypeEmail", TypeEmailSchema);
