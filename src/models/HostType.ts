import mongoose, { Schema, Document } from "mongoose";

export interface IHostType extends Document {
  type: string;
  isActive: boolean;
  createdAt: Date;
}

const HostTypeSchema: Schema<IHostType> = new Schema({
  type: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

export const HostType = mongoose.model<IHostType>("HostType", HostTypeSchema);
