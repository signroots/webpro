import mongoose, { Schema, Document, Types } from "mongoose";

export interface IStatus extends Document {
  name: string;
  is_active: boolean;
  typeEmail: Types.ObjectId;
}

const StatusSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    typeEmail: {
      type: Schema.Types.ObjectId,
      ref: "TypeEmail",
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IStatus>("Status", StatusSchema);