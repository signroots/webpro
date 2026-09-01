import mongoose, { Schema, Document } from "mongoose";

export interface IStatus extends Document {
  name: string;
  type: "order" | "plan" ;
  is_active: boolean;
}

const StatusSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // Status belongs to Order / Plan / Service
    type: {
      type: String,
      enum: ["order", "plan"],
      required: true,
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

export default mongoose.model<IStatus>("Status", StatusSchema);