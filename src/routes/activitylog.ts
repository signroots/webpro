import express, { Response } from "express";
import mongoose from "mongoose";

import ActivityLog from "../models/ActivityLog";
import User from "../models/User";
import { AuthRequest, authMiddleware } from "../middleware/auth";

const router = express.Router();

// =====================================================
// GET USER ACTIVITY
// =====================================================

router.get(
  "/",
  authMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      // =================================================
      // QUERY PARAMETERS
      // =================================================

      const {
        page = "1",
        limit = "25",

        domainName,
        performedBy,
        action,

        startDate,
        endDate,

        search,
      } = req.query;

      // =================================================
      // PAGINATION
      // =================================================

      const pageNumber = Math.max(Number(page) || 1, 1);

      const limitNumber = Math.min(
        Math.max(Number(limit) || 25, 1),
        100
      );

      const skip = (pageNumber - 1) * limitNumber;

      // =================================================
      // FILTER
      // =================================================

      const filter: any = {};

      // =================================================
      // DOMAIN NAME FILTER
      // =================================================

      if (
        domainName &&
        typeof domainName === "string" &&
        domainName.trim() !== ""
      ) {
        filter.domainName = {
          $regex: domainName.trim(),
          $options: "i",
        };
      }

      // =================================================
      // CREATED BY / PERFORMED BY FILTER
      // =================================================

      if (
        performedBy &&
        typeof performedBy === "string" &&
        performedBy.trim() !== ""
      ) {
        if (mongoose.Types.ObjectId.isValid(performedBy)) {
          filter.performedBy = new mongoose.Types.ObjectId(
            performedBy
          );
        }
      }

      // =================================================
      // ACTION FILTER
      // =================================================

      if (
        action &&
        typeof action === "string" &&
        action.trim() !== ""
      ) {
        filter.action = action.trim();
      }

      // =================================================
      // DATE FILTER
      // =================================================

      if (
        startDate &&
        typeof startDate === "string"
      ) {
        const start = new Date(startDate);

        if (!isNaN(start.getTime())) {
          start.setHours(0, 0, 0, 0);

          filter.createdAt = {
            ...filter.createdAt,
            $gte: start,
          };
        }
      }

      if (
        endDate &&
        typeof endDate === "string"
      ) {
        const end = new Date(endDate);

        if (!isNaN(end.getTime())) {
          end.setHours(23, 59, 59, 999);

          filter.createdAt = {
            ...filter.createdAt,
            $lte: end,
          };
        }
      }

      // =================================================
      // GENERAL SEARCH
      // =================================================

      if (
        search &&
        typeof search === "string" &&
        search.trim() !== ""
      ) {
        const searchRegex = {
          $regex: search.trim(),
          $options: "i",
        };

        filter.$or = [
          {
            domainName: searchRegex,
          },
          {
            description: searchRegex,
          },
          {
            performedByName: searchRegex,
          },
          {
            action: searchRegex,
          },
        ];
      }

      // =================================================
      // GET TOTAL
      // =================================================

      const total = await ActivityLog.countDocuments(filter);

      // =================================================
      // GET ACTIVITIES
      // =================================================

      const activities = await ActivityLog.find(filter)
        .populate(
          "performedBy",
          "name email role"
        )
        .populate(
          "orderId",
          "domainName"
        )
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limitNumber)
        .lean();

      // =================================================
      // RESPONSE
      // =================================================

      res.status(200).json({
        success: true,

        data: activities,

        pagination: {
          page: pageNumber,
          limit: limitNumber,
          total,
          totalPages: Math.ceil(
            total / limitNumber
          ),
        },
      });
    } catch (error: any) {
      console.error(
        "❌ Get user activity error:",
        error
      );

      res.status(500).json({
        success: false,

        error: {
          code: "INTERNAL_SERVER_ERROR",

          message:
            error?.message ||
            "Failed to fetch user activities",
        },
      });
    }
  }
);

// =====================================================
// GET ACTIVITY BY ID
// =====================================================

router.get(
  "/:id",
  authMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      // =================================================
      // VALIDATE ID
      // =================================================

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,

          error: {
            code: "INVALID_ACTIVITY_ID",
            message: "Invalid activity ID",
          },
        });

        return;
      }

      // =================================================
      // FIND ACTIVITY
      // =================================================

      const activity =
        await ActivityLog.findById(id)
          .populate(
            "performedBy",
            "name email role"
          )
          .populate(
            "orderId",
            "domainName"
          )
          .lean();

      if (!activity) {
        res.status(404).json({
          success: false,

          error: {
            code: "ACTIVITY_NOT_FOUND",

            message:
              "Activity log not found",
          },
        });

        return;
      }

      // =================================================
      // RESPONSE
      // =================================================

      res.status(200).json({
        success: true,
        data: activity,
      });
    } catch (error: any) {
      console.error(
        "❌ Get activity by ID error:",
        error
      );

      res.status(500).json({
        success: false,

        error: {
          code: "INTERNAL_SERVER_ERROR",

          message:
            error?.message ||
            "Failed to fetch activity",
        },
      });
    }
  }
);

// =====================================================
// GET ACTIVITY FILTER OPTIONS
// =====================================================

router.get(
  "/filters/options",
  authMiddleware,
  async (
    req: AuthRequest,
    res: Response
  ): Promise<void> => {
    try {
      // =================================================
      // USERS WHO PERFORMED ACTIVITIES
      // =================================================

      const users =
        await ActivityLog.aggregate([
          {
            $match: {
              performedBy: {
                $exists: true,
                $ne: null,
              },
            },
          },

          {
            $group: {
              _id: "$performedBy",
              name: {
                $first: "$performedByName",
              },
            },
          },

          {
            $sort: {
              name: 1,
            },
          },
        ]);

      // =================================================
      // ACTIONS
      // =================================================

      const actions =
        await ActivityLog.distinct(
          "action"
        );

      // =================================================
      // DOMAINS
      // =================================================

      const domains =
        await ActivityLog.distinct(
          "domainName"
        );

      // =================================================
      // RESPONSE
      // =================================================

      res.status(200).json({
        success: true,

        data: {
          users,
          actions,
          domains,
        },
      });
    } catch (error: any) {
      console.error(
        "❌ Activity filter options error:",
        error
      );

      res.status(500).json({
        success: false,

        error: {
          code: "INTERNAL_SERVER_ERROR",

          message:
            error?.message ||
            "Failed to fetch activity filter options",
        },
      });
    }
  }
);

export default router;