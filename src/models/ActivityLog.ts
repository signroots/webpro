import mongoose, { Document } from "mongoose";

export interface IActivityChange {
  field: string;
  oldValue?: any;
  newValue?: any;
}

export interface IActivityLog extends Document {
  entityType: "ORDER" | "PLAN" | "CUSTOMER" | "CLIENT";
  entityId: mongoose.Types.ObjectId;

  orderId?: mongoose.Types.ObjectId;

  domainName?: string;

  action:
    | "CREATED"
    | "UPDATED"
    | "DELETED"
    | "STATUS_CHANGED"
    | "PLAN_CHANGED";

  performedBy?: mongoose.Types.ObjectId;
  performedByName?: string;

  changes?: IActivityChange[];

  description?: string;

  reason?: string;

  source?: "ADMIN" | "CUSTOMER" | "SYSTEM";

  ipAddress?: string;

  userAgent?: string;

  requestId?: string;

  isSystemAction?: boolean;

  metadata?: Record<string, any>;

  createdAt: Date;
  updatedAt: Date;
}

const activityLogSchema = new mongoose.Schema<IActivityLog>(
  {
    entityType: {
      type: String,
      enum: [
        "ORDER",
        "PLAN",
        "CUSTOMER",
        "CLIENT",
      ],
      required: true,
      index: true,
    },

    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      index: true,
    },

    domainName: {
      type: String,
      index: true,
    },

    action: {
      type: String,
      enum: [
        "CREATED",
        "UPDATED",
        "DELETED",
        "STATUS_CHANGED",
        "PLAN_CHANGED",
      ],
      required: true,
      index: true,
    },

    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    performedByName: {
      type: String,
    },

    changes: [
      {
        field: {
          type: String,
          required: true,
        },

        oldValue: {
          type: mongoose.Schema.Types.Mixed,
        },

        newValue: {
          type: mongoose.Schema.Types.Mixed,
        },
      },
    ],

    description: {
      type: String,
    },

    reason: {
      type: String,
    },

    source: {
      type: String,
      enum: [
        "ADMIN",
        "CUSTOMER",
        "SYSTEM",
      ],
      default: "ADMIN",
    },

    ipAddress: {
      type: String,
    },

    userAgent: {
      type: String,
    },

    requestId: {
      type: String,
      index: true,
    },

    isSystemAction: {
      type: Boolean,
      default: false,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

export const ActivityLog =
  mongoose.models.ActivityLog ||
  mongoose.model<IActivityLog>(
    "ActivityLog",
    activityLogSchema
  );

export default ActivityLog;
