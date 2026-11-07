
import mongoose, { Schema, Document } from "mongoose";

export interface IOrderHistory extends Document {
  orderId: mongoose.Types.ObjectId;
  planId?: mongoose.Types.ObjectId | null;

  section: "ORDER" | "ORDER_PLAN";

  action:
    | "CREATE"
    | "UPDATE"
    | "STATUS_CHANGE"
    | "RENEW"
    | "DELETE";

  oldData?: Record<string, any> | null;
  newData?: Record<string, any> | null;

  changedFields?: string[];

  description?: string;

  updatedBy?: mongoose.Types.ObjectId | null;

  createdAt?: Date;
}

const OrderHistorySchema = new Schema<IOrderHistory>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },

    planId: {
      type: Schema.Types.ObjectId,
      ref: "OrderPlan",
      default: null,
      index: true,
    },

    section: {
      type: String,
      enum: ["ORDER", "ORDER_PLAN"],
      required: true,
    },

    action: {
      type: String,
      enum: [
        "CREATE",
        "UPDATE",
        "STATUS_CHANGE",
        "RENEW",
        "DELETE",
      ],
      required: true,
    },

    oldData: {
      type: Schema.Types.Mixed,
      default: null,
    },

    newData: {
      type: Schema.Types.Mixed,
      default: null,
    },

    changedFields: {
      type: [String],
      default: [],
    },

    description: {
      type: String,
      default: "",
    },

    updatedBy: {
      type: Schema.Types.ObjectId,
      default: null,
    },
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: false,
    },
  }
);

export const OrderHistory =
  mongoose.models.OrderHistory ||
  mongoose.model<IOrderHistory>(
    "OrderHistory",
    OrderHistorySchema
  );

export default OrderHistory;
