
import mongoose, { Document, Schema } from "mongoose";

export interface ILabel extends Document {
  statusLabelName: string;
  code: string;
  type: string;
  service: string;
  status: boolean;
  displayArea: string;
  visibleTo: string[];
}

const LabelSchema = new Schema<ILabel>(
  {
    statusLabelName: {
      type: String,
      required: true,
      trim: true,
    },

    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },

    type: {
      type: String,
      required: true,
      trim: true,
    },

    service: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: Boolean,
      default: true,
    },

    displayArea: {
      type: String,
      required: true,
      trim: true,
    },

    // Admin / Customer visibility
    visibleTo: {
      type: [
        {
          type: String,
          enum: ["ADMIN", "CUSTOMER"],
        },
      ],
      default: ["ADMIN", "CUSTOMER"],
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<ILabel>("Label", LabelSchema);
