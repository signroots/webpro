import mongoose from "mongoose";
import ActivityLog from "../models/ActivityLog";

interface LogActivityParams {
  entityType: "ORDER" | "PLAN" | "CUSTOMER" | "CLIENT";

  entityId: mongoose.Types.ObjectId | string;

  orderId?: mongoose.Types.ObjectId | string;

  domainName?: string;

  action:
    | "CREATED"
    | "UPDATED"
    | "DELETED"
    | "STATUS_CHANGED"
    | "PLAN_CHANGED";

  performedBy?: mongoose.Types.ObjectId | string;

  performedByName?: string;

  changes?: {
    field: string;
    oldValue?: any;
    newValue?: any;
  }[];

  description?: string;
}

export const logActivity = async ({
  entityType,
  entityId,
  orderId,
  domainName,
  action,
  performedBy,
  performedByName,
  changes = [],
  description,
}: LogActivityParams) => {
  try {
    await ActivityLog.create({
      entityType,

      entityId,

      orderId,

      domainName,

      action,

      performedBy,

      performedByName,

      changes,

      description,
    });
  } catch (error) {
    console.error(
      "ACTIVITY LOG ERROR:",
      error
    );
  }
};