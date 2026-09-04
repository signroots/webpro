import mongoose, { Schema, Document } from "mongoose";

export interface IStatus extends Document {
  name: string;
  code: string;
  type: "order" | "plan" | "domain";
  is_custom: boolean;
  is_active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const StatusSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // Unique code for the status
    // Example: ACTIVE, EXPIRED, TRANSFERRED
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    // Status belongs to Order / Plan / Domain
    type: {
      type: String,
      enum: ["order", "plan", "domain"],
      required: true,
    },

    // false = default/master status
    // true = customized status
    is_custom: {
      type: Boolean,
      default: false,
    },

    is_active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Same code can be used for different types.
// Example:
// order + ACTIVE
// plan + ACTIVE
// domain + ACTIVE
StatusSchema.index(
  { type: 1, code: 1 },
  { unique: true }
);

export default mongoose.model<IStatus>("Status", StatusSchema);