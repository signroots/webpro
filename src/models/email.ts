import mongoose, { Schema, Document } from "mongoose";

export interface IEmail extends Document {
  _id: mongoose.Types.ObjectId;
  domain: string;
  subscription: string;
  plan: string;
  status: string;
  username: string;
  password: string;
  users: number;
  creationDate: Date | null;
  expiryDate: Date | null;
  customer: string;
  provider: string;
}

const EmailSchema: Schema = new Schema({
  domain: { type: String, required: true },
  subscription: { type: String, required: true },
  plan: { type: String, required: true },
  status: { type: String, required: true },
  username: { type: String, required: true },
  password: { type: String, required: true },
  users: { type: Number, required: true },
  creationDate: { type: Date },
  expiryDate: { type: Date },
  customer: { type: String, required: true },
  provider: { type: String, required: true },
});

// ✅ Fix OverwriteModelError by checking if model already exists
export const Email =
  mongoose.models.Email || mongoose.model<IEmail>("Email", EmailSchema);
