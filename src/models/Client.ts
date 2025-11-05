// src/models/Client.ts
import mongoose, { Schema, Document } from "mongoose";
import { IUserType } from "./UserType";

export interface IClient extends Document
{
    _id: mongoose.Types.ObjectId;
  c_name: string;
  c_email: string[];          // array of emails
  c_phone: string;
  c_company: string;
  c_address: string;
  c_city: string;
  c_state: string;
  c_country: string;
  c_zipCode: string;
  c_gst?: string;
  encryptedPassword?: string;
  password?: string;
  is_active?: boolean;
  addedBy?: mongoose.Types.ObjectId | IUserType;
  userType?: mongoose.Types.ObjectId | IUserType;
  createdAt?: Date;
  updatedAt?: Date;
}

const ClientSchema: Schema<IClient> = new Schema(
  {
    c_name: { type: String, required: true, trim: true },
    c_email: { type: [String], required: true, lowercase: true, trim: true },
    c_phone: { type: String, required: true, trim: true },
    c_company: { type: String, required: true, trim: true },
    c_address: { type: String, required: true, trim: true },
    c_city: { type: String, required: true, trim: true },
    c_state: { type: String, required: true, trim: true },
    c_country: { type: String, required: true, trim: true },
    c_zipCode: { type: String, trim: true },
    c_gst: { type: String, trim: true },
    encryptedPassword: { type: String },
    password: { type: String, select: false }, // hidden by default
    is_active: { type: Boolean, default: true },
    addedBy: { type: Schema.Types.ObjectId, ref: "UserType" },
    userType: { type: Schema.Types.ObjectId, ref: "UserType" },
  },
  { timestamps: true }
);

// Optional index for faster lookup
ClientSchema.index({ c_email: 1, c_phone: 1 });

export default mongoose.model<IClient>("Client", ClientSchema);
