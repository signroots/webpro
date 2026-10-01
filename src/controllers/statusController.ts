import { RequestHandler } from "express";
import Status from "../models/Status";
import Order from "../models/Order";
import { OrderPlan } from "../models/OrderPlan";

// ===============================
// CREATE STATUS
// ===============================
export const createStatus: RequestHandler = async (req, res) => {
  try {
    const {
      name,
      code,
      type,
      category,
      is_custom,
      is_active,
    } = req.body;

    const status = new Status({
      name,
      code,
      type,
      category,
      is_custom,
      is_active,
    });

    await status.save();

    res.status(201).json(status);
  } catch (err: any) {
    res.status(400).json({
      error: err.message,
    });
  }
};


// ===============================
// GET PLAN STATUSES
// ===============================
export const getPrimaryPlanStatuses: RequestHandler = async (
  req,
  res
) => {
  try {
    const statuses = await Status.find({
      type: "plan",
      category: "primary",
      is_active: true,
      is_custom: true,
    })
      .select(
        "_id name code type category is_custom is_active"
      )
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: statuses,
    });
  } catch (err: any) {
    console.error(
      "GET PRIMARY PLAN STATUSES ERROR:",
      err
    );

    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};
export const getSecondaryPlanStatuses: RequestHandler = async (
  req,
  res
) => {
  try {
    const statuses = await Status.find({
      type: "plan",
      category: "secondary",
      is_active: true,
    })
      .select(
        "_id name code type category is_custom is_active"
      )
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: statuses,
    });
  } catch (err: any) {
    console.error(
      "GET SECONDARY PLAN STATUSES ERROR:",
      err
    );

    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};
// ===============================
// GET ORDER STATUSES
// ===============================
export const getOrderStatuses: RequestHandler = async (req, res) => {
  try {
    const statuses = await Status.find({
      type: "order",
      is_custom: true,
      is_active: true,
    })
      .select("_id name code type is_custom is_active")
      .sort({ createdAt: -1 });

    res.json(statuses);
  } catch (err: any) {
    res.status(500).json({
      error: err.message,
    });
  }
};
export const getDomainStatuses: RequestHandler = async (req, res) => {
  try {
    const statuses = await Status.find({
      type: "domain",
      is_custom: true,
      is_active: true,
    })
      .select("_id name code type is_custom is_active")
      .sort({ createdAt: -1 });

    res.json(statuses);
  } catch (err: any) {
    res.status(500).json({
      error: err.message,
    });
  }
};
// ===============================
// UPDATE PLAN STATUS
// ===============================
export const updatePlanStatus: RequestHandler = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const {
      primary_status,
      secondary_status,
    } = req.body;

    // =====================================================
    // VALIDATE PLAN ID
    // =====================================================

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid plan ID",
      });
    }

    // =====================================================
    // FIND PLAN
    // =====================================================

    const existingPlan =
      await OrderPlan.findById(id);

    if (!existingPlan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found",
      });
    }

    // =====================================================
    // UPDATE DATA
    // =====================================================

    const updateData: Record<string, any> = {};

    // =====================================================
    // PRIMARY STATUS
    // =====================================================

    if (
      primary_status !== undefined
    ) {
      if (
        !mongoose.Types.ObjectId.isValid(
          primary_status
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid primary status ID",
        });
      }

      const selectedPrimaryStatus =
        await Status.findOne({
          _id: primary_status,
          type: "plan",
          category: "primary",
          is_active: true,
        });

      if (!selectedPrimaryStatus) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid primary plan status",
        });
      }

      // ---------------------------------------------------
      // UPDATE PRIMARY STATUS
      // ---------------------------------------------------

      updateData.primary_status =
        selectedPrimaryStatus._id;

      // ---------------------------------------------------
      // GET STATUS CODE
      // ---------------------------------------------------

      const primaryStatusCode =
        String(
          selectedPrimaryStatus.code ||
            selectedPrimaryStatus.name ||
            ""
        )
          .trim()
          .toUpperCase();

      const now = new Date();

      // ---------------------------------------------------
      // CANCELLED
      // ---------------------------------------------------

      if (
        primaryStatusCode ===
        "CANCELLED"
      ) {
        updateData.plan_cancelled_on =
          now;
      }

      // ---------------------------------------------------
      // TRANSFERRED
      // ---------------------------------------------------

      if (
        primaryStatusCode ===
        "TRANSFERRED"
      ) {
        updateData.plan_transferred_on =
          now;
      }

      // ---------------------------------------------------
      // IMPORTANT
      //
      // secondary_status is NOT touched here.
      // ---------------------------------------------------
    }

    // =====================================================
    // SECONDARY STATUS
    // =====================================================

    if (
      secondary_status !== undefined
    ) {
      if (
        secondary_status === null ||
        secondary_status === ""
      ) {
        updateData.secondary_status =
          null;
      } else {

        if (
          !mongoose.Types.ObjectId.isValid(
            secondary_status
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid secondary status ID",
          });
        }

        const selectedSecondaryStatus =
          await Status.findOne({
            _id: secondary_status,
            type: "plan",
            category: "secondary",
            is_active: true,
          });

        if (!selectedSecondaryStatus) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid secondary plan status",
          });
        }

        updateData.secondary_status =
          selectedSecondaryStatus._id;
      }
    }

    // =====================================================
    // NOTHING TO UPDATE
    // =====================================================

    if (
      Object.keys(updateData).length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "No valid plan status update provided",
      });
    }

    // =====================================================
    // UPDATE PLAN
    // =====================================================

    const updatedPlan =
      await OrderPlan.findByIdAndUpdate(
        id,
        {
          $set: updateData,
        },
        {
          new: true,
          runValidators: true,
        }
      )
        .populate({
          path: "primary_status",
          select:
            "_id name code type category is_active is_custom",
        })
        .populate({
          path: "secondary_status",
          select:
            "_id name code type category is_active is_custom",
        })
        .populate({
          path: "planId",
          select:
            "_id planName image provider serviceType type",
        })
        .populate({
          path: "emailTypeId",
          select:
            "_id name image",
        });

    // =====================================================
    // CHECK UPDATED PLAN
    // =====================================================

    if (!updatedPlan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found",
      });
    }

    // =====================================================
    // SUCCESS
    // =====================================================

    return res.status(200).json({
      success: true,
      message:
        "Plan status updated successfully",
      data: updatedPlan,
    });

  } catch (error: any) {

    console.error(
      "UPDATE PLAN STATUS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update plan status",
      error:
        error?.message ||
        "Internal server error",
    });
  }
};
export const activatePlanStatus: RequestHandler = async (req, res) => {
  try {
    const { status, type } = req.body;

    if (status?.toUpperCase() !== "ACTIVE" || type !== "plan") {
      res.status(400).json({
        success: false,
        message: "Invalid activation request",
      });
      return;
    }

    // Find ACTIVE primary plan status
    const activeStatus = await Status.findOne({
      type: "plan",
      category: "primary",
      code: "ACTIVE",
      is_active: true,
    });

    if (!activeStatus) {
      res.status(404).json({
        success: false,
        message: "Active plan status not found",
      });
      return;
    }

    const plan = await OrderPlan.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          primary_status: activeStatus._id,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    )
      .populate(
        "primary_status",
        "_id name code type category is_custom is_active"
      )
      .populate(
        "secondary_status",
        "_id name code type category is_custom is_active"
      );

    if (!plan) {
      res.status(404).json({
        success: false,
        message: "Plan not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: plan,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: "Failed to activate plan",
      error: error.message,
    });
  }
};

// ===============================
// UPDATE ORDER STATUS


import mongoose from "mongoose";




// =========================================================
// UPDATE ORDER / DOMAIN STATUS
// =========================================================



/**
 * ============================================================
 * UPDATE ORDER STATUS
 * ============================================================
 *
 * Requirements:
 *
 * 1. Order Status update:
 *    - Only order_status is updated normally.
 *
 * 2. When Order Status = CANCELLED / TRANSFERRED:
 *    - Order status is updated.
 *    - Domain status is automatically updated to the
 *      corresponding domain status, if domain exists.
 *    - All email plans' PRIMARY status is updated.
 *    - Secondary plan status is NOT changed.
 *
 * 3. Domain Status update:
 *    - Only domain_status is updated.
 *    - Order status and plans are NOT changed.
 *
 * 4. Plan status update:
 *    - Handled separately by updatePlanStatus API.
 *
 * 5. No old CASE-based automatic synchronization.
 *
 * ============================================================
 */


// =========================================================
// UPDATE ORDER / DOMAIN STATUS
// =========================================================
export const updateOrderStatus: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      order_status,
      domain_status,
      status,
      type,

      // =====================================================
      // PLAN UPDATE
      // =====================================================
      plan_id,
      plan_primary_status,
    } = req.body;

    // =====================================================
    // VALIDATE ORDER ID
    // =====================================================

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    // =====================================================
    // FIND ORDER
    // =====================================================

    const existingOrder = await Order.findById(id);

    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // =====================================================
    // PLAN PRIMARY STATUS UPDATE
    //
    // Used when updating ONE PARTICULAR PLAN
    //
    // plan_id
    // plan_primary_status
    //
    // secondary_status will NEVER change.
    // =====================================================

    if (plan_id && plan_primary_status) {
      // -----------------------------------------------------
      // VALIDATE PLAN ID
      // -----------------------------------------------------

      if (!mongoose.Types.ObjectId.isValid(plan_id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid plan ID",
        });
      }

      // -----------------------------------------------------
      // FIND PLAN
      // -----------------------------------------------------

      const existingPlan = await OrderPlan.findOne({
        _id: plan_id,
        orderId: existingOrder._id,
      });

      if (!existingPlan) {
        return res.status(404).json({
          success: false,
          message: "Plan not found for this order",
        });
      }

      // -----------------------------------------------------
      // FIND PLAN PRIMARY STATUS
      // -----------------------------------------------------

      let selectedPlanStatus: any = null;

      // Try ObjectId
      if (
        mongoose.Types.ObjectId.isValid(
          plan_primary_status
        )
      ) {
        selectedPlanStatus = await Status.findOne({
          _id: plan_primary_status,
          type: "plan",
          category: "primary",
          is_active: true,
        });
      }

      // Try code / name
      if (!selectedPlanStatus) {
        selectedPlanStatus = await Status.findOne({
          type: "plan",
          category: "primary",
          is_active: true,
          $or: [
            {
              code: String(plan_primary_status)
                .trim()
                .toUpperCase(),
            },
            {
              name: plan_primary_status,
            },
          ],
        });
      }

      // -----------------------------------------------------
      // INVALID PLAN STATUS
      // -----------------------------------------------------

      if (!selectedPlanStatus) {
        return res.status(400).json({
          success: false,
          message: "Invalid primary plan status",
        });
      }

      // -----------------------------------------------------
      // GET STATUS CODE
      // -----------------------------------------------------

      const planStatusCode = String(
        selectedPlanStatus.code ||
          selectedPlanStatus.name ||
          ""
      )
        .trim()
        .toUpperCase();

      const now = new Date();

      // -----------------------------------------------------
      // PLAN UPDATE DATA
      //
      // IMPORTANT:
      // secondary_status is NOT included.
      // Therefore secondary_status remains unchanged.
      // -----------------------------------------------------

      const planUpdateData: Record<string, any> = {
        primary_status: selectedPlanStatus._id,
      };

      // -----------------------------------------------------
      // CANCELLED
      // -----------------------------------------------------

      if (planStatusCode === "CANCELLED") {
        planUpdateData.plan_cancelled_on = now;
      }

      // -----------------------------------------------------
      // TRANSFERRED
      // -----------------------------------------------------

      if (planStatusCode === "TRANSFERRED") {
        planUpdateData.plan_transferred_on = now;
      }

      // -----------------------------------------------------
      // ACTIVE
      //
      // Only primary_status changes.
      // Previous cancelled/transferred dates are not removed.
      // -----------------------------------------------------

      if (planStatusCode === "ACTIVE") {
        planUpdateData.plan_activated_on = now;
      }

      // -----------------------------------------------------
      // UPDATE ONLY THIS PLAN
      // -----------------------------------------------------

      const updatedPlan =
        await OrderPlan.findByIdAndUpdate(
          plan_id,
          {
            $set: planUpdateData,
          },
          {
            new: true,
            runValidators: true,
          }
        )
          .populate("primary_status")
          .populate("secondary_status");

      if (!updatedPlan) {
        return res.status(404).json({
          success: false,
          message: "Plan not found",
        });
      }

      // -----------------------------------------------------
      // RESPONSE
      // -----------------------------------------------------

      return res.status(200).json({
        success: true,
        message:
          planStatusCode === "CANCELLED"
            ? "Plan cancelled successfully"
            : planStatusCode === "TRANSFERRED"
            ? "Plan transferred successfully"
            : "Plan primary status updated successfully",
        data: updatedPlan,
      });
    }

    // =====================================================
    // ARCHIVED ORDER ACTIVATION
    // type = order
    //
    // ONLY ORDER STATUS SHOULD UPDATE
    // =====================================================

    if (status && type === "order") {
      let selectedStatus: any = null;

      // -----------------------------------------------------
      // TRY OBJECT ID
      // -----------------------------------------------------

      if (mongoose.Types.ObjectId.isValid(status)) {
        selectedStatus = await Status.findOne({
          _id: status,
          type: "order",
          is_active: true,
        });
      }

      // -----------------------------------------------------
      // TRY CODE / NAME
      // -----------------------------------------------------

      if (!selectedStatus) {
        selectedStatus = await Status.findOne({
          type: "order",
          is_active: true,
          $or: [
            {
              code: String(status)
                .trim()
                .toUpperCase(),
            },
            {
              name: status,
            },
          ],
        });
      }

      // -----------------------------------------------------
      // INVALID STATUS
      // -----------------------------------------------------

      if (!selectedStatus) {
        return res.status(400).json({
          success: false,
          message: "Invalid order status",
        });
      }

      const orderStatusCode = String(
        selectedStatus.code ||
          selectedStatus.name ||
          ""
      )
        .trim()
        .toUpperCase();

      const now = new Date();

      // -----------------------------------------------------
      // ORDER UPDATE DATA
      // -----------------------------------------------------

      const orderUpdateData: Record<string, any> = {
        order_status: selectedStatus._id,
        order_status_updated_on: now,
      };

      // -----------------------------------------------------
      // ACTIVE
      // -----------------------------------------------------

      if (orderStatusCode === "ACTIVE") {
        orderUpdateData.activated_on = now;
      }

      // -----------------------------------------------------
      // CANCELLED
      // -----------------------------------------------------

      if (orderStatusCode === "CANCELLED") {
        orderUpdateData.order_cancelled_on = now;
      }

      // -----------------------------------------------------
      // TRANSFERRED
      // -----------------------------------------------------

      if (orderStatusCode === "TRANSFERRED") {
        orderUpdateData.order_transferred_on = now;
      }

      // -----------------------------------------------------
      // ONLY ORDER STATUS
      //
      // Domain and plans remain unchanged.
      // -----------------------------------------------------

      const updatedOrder =
        await Order.findByIdAndUpdate(
          id,
          {
            $set: orderUpdateData,
          },
          {
            new: true,
            runValidators: true,
          }
        )
          .populate("order_status")
          .populate("domain_status")
          .populate("domainSource")
          .populate("customer")
          .populate("client")
          .populate("registrarName");

      if (!updatedOrder) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      return res.status(200).json({
        success: true,
        message:
          orderStatusCode === "ACTIVE"
            ? "Order activated successfully"
            : "Order status updated successfully",
        data: updatedOrder,
      });
    }

    // =====================================================
    // ARCHIVED DOMAIN ACTIVATION
    // type = domain
    //
    // ONLY DOMAIN STATUS SHOULD UPDATE
    // =====================================================

    if (status && type === "domain") {
      let selectedStatus: any = null;

      // -----------------------------------------------------
      // TRY OBJECT ID
      // -----------------------------------------------------

      if (mongoose.Types.ObjectId.isValid(status)) {
        selectedStatus = await Status.findOne({
          _id: status,
          type: "domain",
          is_active: true,
        });
      }

      // -----------------------------------------------------
      // TRY CODE / NAME
      // -----------------------------------------------------

      if (!selectedStatus) {
        selectedStatus = await Status.findOne({
          type: "domain",
          is_active: true,
          $or: [
            {
              code: String(status)
                .trim()
                .toUpperCase(),
            },
            {
              name: status,
            },
          ],
        });
      }

      // -----------------------------------------------------
      // INVALID STATUS
      // -----------------------------------------------------

      if (!selectedStatus) {
        return res.status(400).json({
          success: false,
          message: "Invalid domain status",
        });
      }

      const domainStatusCode = String(
        selectedStatus.code ||
          selectedStatus.name ||
          ""
      )
        .trim()
        .toUpperCase();

      const now = new Date();

      const domainUpdateData: Record<string, any> = {
        domain_status: selectedStatus._id,
        domain_status_updated_on: now,
      };

      // -----------------------------------------------------
      // ACTIVE
      // -----------------------------------------------------

      if (domainStatusCode === "ACTIVE") {
        domainUpdateData.activated_on = now;
      }

      // -----------------------------------------------------
      // CANCELLED
      // -----------------------------------------------------

      if (domainStatusCode === "CANCELLED") {
        domainUpdateData.domain_cancelled_on = now;
      }

      // -----------------------------------------------------
      // TRANSFERRED
      // -----------------------------------------------------

      if (domainStatusCode === "TRANSFERRED") {
        domainUpdateData.domain_transferred_on = now;
        domainUpdateData.managedBy = "Customer";
      }

      // -----------------------------------------------------
      // UPDATE ONLY DOMAIN
      // -----------------------------------------------------

      const updatedOrder =
        await Order.findByIdAndUpdate(
          id,
          {
            $set: domainUpdateData,
          },
          {
            new: true,
            runValidators: true,
          }
        )
          .populate("order_status")
          .populate("domain_status")
          .populate("domainSource")
          .populate("customer")
          .populate("client")
          .populate("registrarName");

      if (!updatedOrder) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      return res.status(200).json({
        success: true,
        message:
          domainStatusCode === "ACTIVE"
            ? "Domain activated successfully"
            : "Domain status updated successfully",
        data: updatedOrder,
      });
    }

    // =====================================================
    // NORMAL STATUS UPDATE VALIDATION
    // =====================================================

    if (!order_status && !domain_status) {
      return res.status(400).json({
        success: false,
        message:
          "Order status, domain status, or plan primary status is required",
      });
    }

    const updateData: Record<string, any> = {};

    // =====================================================
    // ORDER STATUS UPDATE
    // =====================================================

    if (order_status) {
      // -----------------------------------------------------
      // VALIDATE ORDER STATUS ID
      // -----------------------------------------------------

      if (
        !mongoose.Types.ObjectId.isValid(
          order_status
        )
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid order status ID",
        });
      }

      // -----------------------------------------------------
      // FIND ORDER STATUS
      // -----------------------------------------------------

      const selectedOrderStatus =
        await Status.findOne({
          _id: order_status,
          type: "order",
          is_active: true,
        });

      if (!selectedOrderStatus) {
        return res.status(400).json({
          success: false,
          message: "Invalid order status",
        });
      }

      // -----------------------------------------------------
      // GET ORDER STATUS CODE
      // -----------------------------------------------------

      const orderStatusCode = String(
        selectedOrderStatus.code ||
          selectedOrderStatus.name ||
          ""
      )
        .trim()
        .toUpperCase();

      const now = new Date();

      // -----------------------------------------------------
      // UPDATE ORDER STATUS
      // -----------------------------------------------------

      updateData.order_status =
        selectedOrderStatus._id;

      updateData.order_status_updated_on = now;

      // -----------------------------------------------------
      // ACTIVE
      // -----------------------------------------------------

      if (orderStatusCode === "ACTIVE") {
        updateData.activated_on = now;
      }

      // -----------------------------------------------------
      // CANCELLED
      // -----------------------------------------------------

      if (orderStatusCode === "CANCELLED") {
        updateData.order_cancelled_on = now;
      }

      // -----------------------------------------------------
      // TRANSFERRED
      // -----------------------------------------------------

      if (orderStatusCode === "TRANSFERRED") {
        updateData.order_transferred_on = now;
      }

      // =====================================================
      // ORDER CANCELLED / TRANSFERRED
      //
      // Automatically update:
      //
      // 1. Order
      // 2. Domain
      // 3. ALL PLANS PRIMARY STATUS
      //
      // Secondary status remains unchanged.
      // =====================================================

      if (
        orderStatusCode === "CANCELLED" ||
        orderStatusCode === "TRANSFERRED"
      ) {
        // ===================================================
        // FIND CORRESPONDING DOMAIN STATUS
        // ===================================================

        const selectedDomainStatus =
          await Status.findOne({
            type: "domain",
            code: orderStatusCode,
            is_active: true,
          });

        if (!selectedDomainStatus) {
          return res.status(400).json({
            success: false,
            message:
              `Corresponding domain status "${orderStatusCode}" not found`,
          });
        }

        // ===================================================
        // UPDATE DOMAIN STATUS
        // ===================================================

        updateData.domain_status =
          selectedDomainStatus._id;

        updateData.domain_status_updated_on =
          now;

        // ===================================================
        // DOMAIN DATE
        // ===================================================

        if (
          orderStatusCode === "CANCELLED"
        ) {
          updateData.domain_cancelled_on =
            now;
        }

        if (
          orderStatusCode === "TRANSFERRED"
        ) {
          updateData.domain_transferred_on =
            now;

          updateData.managedBy =
            "Customer";
        }

        // ===================================================
        // ORDER DATE
        // ===================================================

        if (
          orderStatusCode === "CANCELLED"
        ) {
          updateData.order_cancelled_on =
            now;
        }

        if (
          orderStatusCode === "TRANSFERRED"
        ) {
          updateData.order_transferred_on =
            now;
        }

        // ===================================================
        // FIND ALL PLANS
        // =====================================================

        const allPlans =
          await OrderPlan.find({
            orderId: existingOrder._id,
          });

        // ===================================================
        // UPDATE ALL PLAN PRIMARY STATUS
        // ===================================================

        if (allPlans.length > 0) {
          const selectedPrimaryPlanStatus =
            await Status.findOne({
              type: "plan",
              category: "primary",
              code: orderStatusCode,
              is_active: true,
            });

          if (!selectedPrimaryPlanStatus) {
            return res.status(400).json({
              success: false,
              message:
                `Corresponding primary plan status "${orderStatusCode}" not found`,
            });
          }

          // -------------------------------------------------
          // IMPORTANT
          //
          // secondary_status is NOT included.
          // -------------------------------------------------

          const planUpdateData: Record<
            string,
            any
          > = {
            primary_status:
              selectedPrimaryPlanStatus._id,
          };

          // -------------------------------------------------
          // CANCELLED DATE
          // -------------------------------------------------

          if (
            orderStatusCode ===
            "CANCELLED"
          ) {
            planUpdateData.plan_cancelled_on =
              now;
          }

          // -------------------------------------------------
          // TRANSFERRED DATE
          // -------------------------------------------------

          if (
            orderStatusCode ===
            "TRANSFERRED"
          ) {
            planUpdateData.plan_transferred_on =
              now;
          }

          // -------------------------------------------------
          // UPDATE ALL PLANS
          // -------------------------------------------------

          await OrderPlan.updateMany(
            {
              orderId:
                existingOrder._id,
            },
            {
              $set:
                planUpdateData,
            }
          );
        }
      }
    }

    // =====================================================
    // DOMAIN ONLY UPDATE
    //
    // Executes only when order_status is NOT present.
    //
    // Does NOT update order status.
    // Does NOT update plan status.
    // =====================================================

    if (
      domain_status &&
      !order_status
    ) {
      // -----------------------------------------------------
      // VALIDATE DOMAIN STATUS ID
      // -----------------------------------------------------

      if (
        !mongoose.Types.ObjectId.isValid(
          domain_status
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid domain status ID",
        });
      }

      // -----------------------------------------------------
      // FIND DOMAIN STATUS
      // -----------------------------------------------------

      const selectedDomainStatus =
        await Status.findOne({
          _id: domain_status,
          type: "domain",
          is_active: true,
        });

      if (!selectedDomainStatus) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid domain status. The selected status is not a valid active domain status.",
        });
      }

      // -----------------------------------------------------
      // GET DOMAIN STATUS CODE
      // -----------------------------------------------------

      const domainStatusCode =
        String(
          selectedDomainStatus.code ||
            selectedDomainStatus.name ||
            ""
        )
          .trim()
          .toUpperCase();

      const now = new Date();

      // =====================================================
      // UPDATE DOMAIN ONLY
      // =====================================================

      updateData.domain_status =
        selectedDomainStatus._id;

      updateData.domain_status_updated_on =
        now;

      // -----------------------------------------------------
      // ACTIVE
      // -----------------------------------------------------

      if (
        domainStatusCode ===
        "ACTIVE"
      ) {
        updateData.activated_on =
          now;
      }

      // -----------------------------------------------------
      // CANCELLED
      // -----------------------------------------------------

      if (
        domainStatusCode ===
        "CANCELLED"
      ) {
        updateData.domain_cancelled_on =
          now;
      }

      // -----------------------------------------------------
      // TRANSFERRED
      // -----------------------------------------------------

      if (
        domainStatusCode ===
        "TRANSFERRED"
      ) {
        updateData.managedBy =
          "Customer";

        updateData.domain_transferred_on =
          now;
      }
    }

    // =====================================================
    // FINAL ORDER UPDATE
    // =====================================================

    const updatedOrder =
      await Order.findByIdAndUpdate(
        id,
        {
          $set: updateData,
        },
        {
          new: true,
          runValidators: true,
        }
      )
        .populate("order_status")
        .populate("domain_status")
        .populate("domainSource")
        .populate("customer")
        .populate("client")
        .populate("registrarName");

    // =====================================================
    // ORDER NOT FOUND
    // =====================================================

    if (!updatedOrder) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // =====================================================
    // SUCCESS
    // =====================================================

    return res.status(200).json({
      success: true,
      message: "Status updated successfully",
      data: updatedOrder,
    });

  } catch (error: any) {
    console.error(
      "\n=============================================="
    );

    console.error(
      "UPDATE ORDER STATUS ERROR"
    );

    console.error(
      "=============================================="
    );

    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to update status",
      error:
        error?.message ||
        "Internal server error",
    });
  }
};
//=========================
// GET ALL STATUSES
// ===============================
export const getStatuses: RequestHandler = async (_req, res) => {
  try {
    const statuses = await Status.find()
      .sort({ createdAt: -1 });

    res.json(statuses);
  } catch (err: any) {
    res.status(500).json({
      error: err.message,
    });
  }
};


// ===============================
// GET STATUS BY ID
// ===============================
export const getStatusById: RequestHandler = async (req, res) => {
  try {
    const status = await Status.findById(req.params.id);

    if (!status) {
      res.status(404).json({
        error: "Status not found",
      });
      return;
    }

    res.json(status);
  } catch (err: any) {
    res.status(500).json({
      error: err.message,
    });
  }
};


// ===============================
// UPDATE STATUS
// ===============================
export const updateStatus: RequestHandler = async (req, res) => {
  try {
    const status = await Status.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!status) {
      res.status(404).json({
        error: "Status not found",
      });
      return;
    }

    res.json(status);
  } catch (err: any) {
    res.status(400).json({
      error: err.message,
    });
  }
};


// ===============================
// DELETE STATUS
// ===============================
export const deleteStatus: RequestHandler = async (req, res) => {
  try {
    const status = await Status.findByIdAndDelete(req.params.id);

    if (!status) {
      res.status(404).json({
        error: "Status not found",
      });
      return;
    }

    res.json({
      message: "Deleted successfully",
    });
  } catch (err: any) {
    res.status(500).json({
      error: err.message,
    });
  }
};