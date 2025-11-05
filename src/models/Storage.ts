// backend/models/Storage.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IStorage extends Document {
  storage: string;
  hostType: mongoose.Types.ObjectId;
  hostSubType: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
}

const StorageSchema: Schema = new Schema({
  storage: { type: String, required: true, trim: true },
  hostType: { type: Schema.Types.ObjectId, ref: "HostType", required: true },
  hostSubType: { type: Schema.Types.ObjectId, ref: "HostSubType", required: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

export const Storage = mongoose.model<IStorage>("Storage", StorageSchema);
