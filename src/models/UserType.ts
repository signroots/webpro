// models/UserType.ts
import mongoose, { Schema, Document } from "mongoose";

// Interface for TypeScript typing
export interface IUserType extends Document {
  name: string;
  is_active: boolean;
}

const UserTypeSchema: Schema<IUserType> = new Schema(
  {
    name: { type: String, required: true, trim: true },
    is_active: { type: Boolean, default: true },
  },
  {
    timestamps: true, // optional, adds createdAt and updatedAt
  }
);

const UserType = mongoose.model<IUserType>("UserType", UserTypeSchema);
export default UserType;
