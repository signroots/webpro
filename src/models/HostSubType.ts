// backend/models/HostSubType.ts
import mongoose, { Document, Schema } from "mongoose";

export interface IHostSubType extends Document {
  hostType: mongoose.Types.ObjectId; // Reference to HostType
  name: string;
  isActive: boolean;
  createdAt: Date;
}

const HostSubTypeSchema: Schema = new Schema<IHostSubType>({
  hostType: {
    type: Schema.Types.ObjectId,
    ref: "HostType",
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const HostSubType = mongoose.model<IHostSubType>("HostSubType", HostSubTypeSchema);
