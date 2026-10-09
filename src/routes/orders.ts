import express, { Request, Response } from "express";
import { IOrder, Order } from "../models/Order";
import mongoose from "mongoose";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import User from "../models/User";
import { IUserType } from "../models/UserType"
import DomainSource from "../models/DomainSource";
import Client from "../models/Client";
import { OrderPlan } from "../models/OrderPlan";
import { PlanEmail } from "../models/PlanEmail";
import { TypeEmail } from "../models/TypeEmail";
import Status from "../models/Status";
import State from "../models/State";
import Country from "../models/Country";
import ActivityLog from "../models/ActivityLog";
const router = express.Router();
interface IOrderPlanResponse {
  _id: string;
  orderId: string;
  planName: string;
  emailType: string;
  serviceType: "email" | "hosting" | "forwarding";
  registrationDate: Date;
  expiryDate: Date;
  noOfUsers: number;
}
router.get(
  "/orders-by-month",
  authMiddleware,
  async (_req: AuthRequest, res: Response) => {

    try {

      if (_req.user?.role?.toLowerCase() !== "admin") {

        return res.status(403).json({
          success: false,
          error: "Admin access required",
        });

      }


      const now = new Date();



      // ================= MONTH RANGE =================


      const startOfCurrentMonth = new Date(
        now.getFullYear(),
        now.getMonth(),
        1,
        0, 0, 0
      );


      const endOfCurrentMonth = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23, 59, 59
      );



      const startOfPrevMonth = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        1,
        0, 0, 0
      );


      const endOfPrevMonth = new Date(
        now.getFullYear(),
        now.getMonth(),
        0,
        23, 59, 59
      );



      const startOfNextMonth = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        1,
        0, 0, 0
      );


      const endOfNextMonth = new Date(
        now.getFullYear(),
        now.getMonth() + 2,
        0,
        23, 59, 59
      );





      // ================= MONTH PARAM =================


      const month =
        (_req.query.month as string) || "current";



      let startDate: Date;
      let endDate: Date;



      switch (month) {


        case "previous":

          startDate = startOfPrevMonth;
          endDate = endOfPrevMonth;

          break;



        case "next":

          startDate = startOfNextMonth;
          endDate = endOfNextMonth;

          break;



        default:

          startDate = startOfCurrentMonth;
          endDate = endOfCurrentMonth;

      }





      // =================================================
      // GET PLANS WHICH EXPIRE IN SELECTED MONTH
      // =================================================


      const plans: any[] = await OrderPlan.find({

        expiryDate: {
          $gte: startDate,
          $lte: endDate
        }

      })
        .select(
          "orderId type expiryDate emailTypeId planId noOfUsers"
        )
        .populate({

          path: "emailTypeId",

          select: "name image"

        })
        .lean();







      // =================================================
      // PLAN ORDER IDS
      // =================================================


      const planOrderIds = [

        ...new Set(

          plans.map(
            plan => String(plan.orderId)
          )

        )

      ];







      // =================================================
      // GET ORDERS
      // Domain expiry OR Plan expiry
      // =================================================


      const orders: any[] = await Order.find({
        $or: [
          {
            expiryDate: {
              $gte: startDate,
              $lte: endDate
            }
          },
          {
            _id: {
              $in: planOrderIds
            }
          }
        ]
      })
        .populate({
          path: "customer",
          select: "name email mobile"
        })
        .populate({
          path: "client",
          select: "_id c_name c_company c_email c_phone"
        })
        .populate({
          path: "domainSource",
          select: "name code image"
        })
        .populate({
          path: "order_status",
          select: "_id name code type is_custom is_active"
        })
        .lean();
      // =================================================
      // MAP PLANS WITH ORDER
      // =================================================


      const planMap = new Map();



      plans.forEach(plan => {


        const key =
          String(plan.orderId);



        if (!planMap.has(key)) {


          planMap.set(
            key,
            []
          );


        }



        planMap.get(key).push({


          type: plan.type,


          expiryDate: plan.expiryDate,
          noOfUsers: plan.noOfUsers || 0,


          emailType:
            plan.emailTypeId?.name || null,


          emailTypeImage:
            plan.emailTypeId?.image || null,


          planId: plan.planId


        });



      });








      // =================================================
      // FINAL RESPONSE DATA
      // =================================================


      const finalOrders = orders.map(order => {


        const orderPlans =
          planMap.get(
            String(order._id)
          ) || [];




        const expiryDates: any[] = [];



        // Domain expiry

        if (order.expiryDate) {

          expiryDates.push(
            new Date(order.expiryDate)
          );

        }




        // Plan expiry

        orderPlans.forEach((plan: any) => {


          if (plan.expiryDate) {


            expiryDates.push(
              new Date(plan.expiryDate)
            );


          }


        });





        const nearestExpiryDate =

          expiryDates.length

            ?

            new Date(

              Math.min(

                ...expiryDates.map(
                  d => d.getTime()
                )

              )

            )

            :

            null;





        return {

          ...order,

          nearestExpiryDate,

          Plans: orderPlans

        };


      });





      // =================================================
      // UPDATE ORDER STATUS
      // Same logic as Orders API
      // Domain expiry OR Plan expiry
      // Skip TRANSFERRED / CANCELLED
      // =================================================

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const bulkOps: any[] = [];

      // ================= GET STATUS IDS =================

      const activeStatus = await Status.findOne({
        type: "order",
        code: "ACTIVE",
        is_active: true,
      }).select("_id name code");

      const expiredStatus = await Status.findOne({
        type: "order",
        code: "EXPIRED",
        is_active: true,
      }).select("_id name code");

      if (!activeStatus || !expiredStatus) {
        throw new Error(
          "ACTIVE or EXPIRED status not found in Status collection"
        );
      }

      // ================= CHECK EACH ORDER =================

      finalOrders.forEach((order: any) => {

        // ==========================================
        // SKIP MANUAL STATUSES
        // ==========================================

        const currentStatusCode =
          order.order_status?.code?.toUpperCase();

        const currentStatusName =
          order.order_status?.name?.toUpperCase();

        if (
          currentStatusCode === "TRANSFERRED" ||
          currentStatusName === "TRANSFERRED" ||
          currentStatusCode === "CANCELLED" ||
          currentStatusName === "CANCELLED"
        ) {
          return;
        }

        // ==========================================
        // EXPIRY CHECK
        // ==========================================

        let isExpired = false;

        // ================= DOMAIN EXPIRY =================

        if (order.expiryDate) {

          const expiry = new Date(order.expiryDate);
          expiry.setHours(0, 0, 0, 0);

          if (expiry < today) {
            isExpired = true;
          }
        }

        // ================= PLAN EXPIRY =================

        if (
          order.Plans &&
          order.Plans.length > 0
        ) {

          const planExpired = order.Plans.some(
            (plan: any) => {

              if (!plan.expiryDate) {
                return false;
              }

              const expiry = new Date(plan.expiryDate);
              expiry.setHours(0, 0, 0, 0);

              return expiry < today;
            }
          );

          if (planExpired) {
            isExpired = true;
          }
        }

        // ==========================================
        // NEW STATUS OBJECT
        // ==========================================

        const newStatus = isExpired
          ? expiredStatus
          : activeStatus;

        const currentStatusId =
          order.order_status?._id?.toString() ||
          order.order_status?.toString();

        const newStatusId =
          newStatus._id.toString();

        // ==========================================
        // UPDATE ONLY IF STATUS CHANGED
        // ==========================================

        if (currentStatusId !== newStatusId) {

          bulkOps.push({
            updateOne: {
              filter: {
                _id: order._id,
              },
              update: {
                $set: {
                  order_status: newStatus._id,
                },
              },
            },
          });

          // Response-il updated status kaanikkum
          order.order_status = {
            _id: newStatus._id,
            name: newStatus.name,
            code: newStatus.code,
          };
        }
      });

      // ================= DB UPDATE =================

      if (bulkOps.length > 0) {
        await Order.bulkWrite(bulkOps);
      }



      // =================================================
      // SORT BY NEAREST EXPIRY
      // =================================================


      finalOrders.sort((a, b) => {


        if (!a.nearestExpiryDate)
          return 1;


        if (!b.nearestExpiryDate)
          return -1;



        return (

          new Date(a.nearestExpiryDate).getTime()

          -

          new Date(b.nearestExpiryDate).getTime()

        );


      });







      return res.status(200).json({

        success: true,


        counts: {


          total: finalOrders.length,


          month,


          startDate,


          endDate


        },


        data: finalOrders


      });



    }


    catch (error) {


      console.error(
        "Error fetching orders by month:",
        error
      );



      return res.status(500).json({

        success: false,

        message: "Server Error"

      });


    }


  }
);
router.get(
  "/existing_customers",
  authMiddleware,
  async (_req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (_req.user?.role?.toLowerCase() !== "admin") {
        res.status(403).json({
          success: false,
          error: "Admin access required"
        });
        return;
      }
      // Only select email, phone, and name
      const clients = await Client.find({}, 'c_name c_email c_phone c_company').sort({ createdAt: -1 });
      res.status(200).json({ success: true, data: clients });
    } catch (err: any) {
      console.error('Error fetching customers:', err.message);
      res.status(500).json({ success: false, error: 'Failed to fetch customized customer' });
    }
  });


router.get(
  "/dnsorders",
  authMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {

    try {

      const loggedInUser = req.user;


      if (!loggedInUser?._id) {

        res.status(401).json({
          success: false,
          message: "Unauthorized"
        });

        return;
      }



      // ================= PAGINATION =================


      const page =
        Math.max(
          Number(req.query.page) || 1,
          1
        );


      const limit =
        Math.min(
          Number(req.query.limit) || 50,
          100
        );


      const skip =
        (page - 1) * limit;



      // ================= SEARCH =================


      const search =
        typeof req.query.search === "string"
          ?
          req.query.search.trim()
          :
          "";



      // ================= USER =================


      const user =
        await User.findById(
          loggedInUser._id
        )
          .populate("userType");



      if (
        !user ||
        typeof user.userType !== "object"
      ) {

        res.status(403).json({
          success: false,
          message: "Invalid user"
        });

        return;
      }



      const role =
        (user.userType as IUserType)
          .name
          .toLowerCase();




      // ================= PLAN MAPPING =================


      const attachPlans = async (
        orders: any[]
      ) => {


        if (!orders.length)
          return orders;



        const orderIds =
          orders.map(
            order => order._id
          );



        const plans =
          await OrderPlan.find({

            orderId: {
              $in: orderIds
            }

          })
            .populate({

              path: "emailTypeId",
              select: "name image"

            })
            .populate({

              path: "hostTypeId",
              select: "type"

            })
            .populate({

              path: "hostSubTypeId",
              select: "name"

            })
            .populate({

              path: "storageId",
              select: "name storage"

            })
            .select(
              `
orderId
type
expiryDate
emailTypeId
planId
hostTypeId
hostSubTypeId
storageId
`
            )
            .lean();




        const planMap = new Map();



        plans.forEach((plan: any) => {


          const key =
            plan.orderId.toString();



          if (!planMap.has(key)) {

            planMap.set(
              key,
              []
            );

          }




          planMap.get(key)
            .push({

              type: plan.type,


              expiryDate:
                plan.expiryDate || null,


              emailType:
                plan.emailTypeId?.name || null,


              emailTypeImage:
                plan.emailTypeId?.image || null,


              planId:
                plan.planId || null,



              hostType:
                plan.hostTypeId
                  ?
                  {
                    _id:
                      plan.hostTypeId._id,

                    type:
                      plan.hostTypeId.type
                  }
                  :
                  null,



              hostSubType:
                plan.hostSubTypeId
                  ?
                  {
                    _id:
                      plan.hostSubTypeId._id,

                    name:
                      plan.hostSubTypeId.name
                  }
                  :
                  null,



              storage:
                plan.storageId
                  ?
                  {
                    _id:
                      plan.storageId._id,

                    name:
                      plan.storageId.name
                  }
                  :
                  null


            });


        });



        return orders.map(order => ({

          ...order,

          Plans:
            planMap.get(
              order._id.toString()
            ) || []

        }));


      };


      // ================= CLOUDFLARE =================

      const dnscloudflareSource =
        await DomainSource.findOne({
          code: "DNS-CLOUDFLARE"
        });


      console.log(
        "cloudflareSource",
        dnscloudflareSource
      );
      const filters: any[] = [

        {
          dns_flag: true
        },

        {
          domainSource: dnscloudflareSource?._id
        }

      ];


      // ================= ONLY DNS ORDERS WITHOUT PLANS =================

      const planOrderIds =
        await OrderPlan.distinct("orderId");


      filters.push({

        _id: {
          $nin: planOrderIds
        }

      });



      if (search) {

        filters.push({

          $or: [

            {
              domainName: {
                $regex: search,
                $options: "i"
              }
            },

            {
              managedBy: {
                $regex: search,
                $options: "i"
              }
            }

          ]

        });

      }

      // ================= ADMIN =================



      if (role === "admin") {



        const finalFilter = {

          $and: filters

        };




        const total =
          await Order.countDocuments(
            finalFilter
          );




        let orders =
          await Order.find(
            finalFilter
          )
            .select({
              _id: 1,
              domainName: 1,
              dns_flag: 1,
              order_status: 1,
              client: 1,
              managedBy: 1,
              registrationDate: 1,
              expiryDate: 1,
              domainSource: 1,
              lockStatus: 1

            })
            .populate(
              "client",
              "_id c_name c_company"
            )
            .populate(
              "domainSource",
              "name image code"
            )
            .skip(skip)
            .limit(limit)
            .lean();




        orders =
          await attachPlans(
            orders
          );




        res.status(200).json({

          success: true,

          data: orders,


          pagination: {

            page,

            limit,

            total,

            totalPages:
              Math.ceil(
                total / limit
              )

          }

        });


        return;

      }





      // ================= CUSTOMER =================



      if (role === "customer") {



        const client =
          await Client.findOne({

            userType: user._id

          });



        if (!client) {

          res.status(404).json({

            success: false,

            message: "Client not found"

          });

          return;

        }





        filters.push({

          client: client._id

        });





        const finalFilter = {

          $and: filters

        };





        const total =
          await Order.countDocuments(
            finalFilter
          );





        let orders =
          await Order.find(
            finalFilter
          )
            .select({
              _id: 1,
              domainName: 1,
              dns_flag: 1,
              order_status: 1,
              client: 1,
              managedBy: 1,
              registrationDate: 1,
              expiryDate: 1,
              domainSource: 1,
              lockStatus: 1

            })
            .populate(
              "client",
              "_id c_name c_company"
            )
            .populate(
              "domainSource",
              "name image code"
            )
            .skip(skip)
            .limit(limit)
            .lean();





        orders =
          await attachPlans(
            orders
          );




        res.status(200).json({

          success: true,


          // client:{

          //   _id:client._id,

          //   c_name:client.c_name,

          //   c_email:client.c_email,

          //   c_company:client.c_company

          // },



          data: orders,



          pagination: {

            page,

            limit,

            total,

            totalPages:
              Math.ceil(
                total / limit
              )

          }

        });



        return;


      }





      res.status(403).json({

        success: false,

        message: "Access denied"

      });



    }
    catch (error) {


      console.error(
        "DNS ORDER ERROR:",
        error
      );



      res.status(500).json({

        success: false,

        message: "Internal server error"

      });


    }


  }
);




// ============================================================
// COMMON HELPERS
// ============================================================

const getStatusCode = (status: any): string => {
  if (!status) {
    return "";
  }

  return (
    status.code ||
    status.name ||
    ""
  )
    .toString()
    .trim()
    .toUpperCase();
};


const isTransferredOrCancelled = (
  status: any
): boolean => {
  const code = getStatusCode(status);

  return (
    code === "TRANSFERRED" ||
    code === "CANCELLED"
  );
};


// ============================================================
// ARCHIVED ORDERS
// ============================================================

router.get(
  "/archived",
  authMiddleware,
  async (
    req: AuthRequest,
    res: Response
  ) => {
    try {
      // ========================================================
      // 1. AUTH USER
      // ========================================================

      const userId = req.user?._id;
      const role = req.user?.role;
      const clientId = req.user?.clientId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized",
        });
      }

      // ========================================================
      // 2. QUERY PARAMS
      // ========================================================

      const search =
        typeof req.query.search === "string"
          ? req.query.search.trim()
          : "";

      const page = Math.max(
        parseInt(req.query.page as string) || 1,
        1
      );

      const limit = Math.min(
        Math.max(
          parseInt(req.query.limit as string) || 25,
          1
        ),
        100
      );

      const skip = (page - 1) * limit;

      // ========================================================
      // 3. TODAY
      // ========================================================

      const today = new Date();

      today.setHours(
        0,
        0,
        0,
        0
      );

      // ========================================================
      // 4. 35 DAYS BEFORE TODAY
      // ========================================================

      const thirtyFiveDaysAgo =
        new Date(today);

      thirtyFiveDaysAgo.setDate(
        thirtyFiveDaysAgo.getDate() - 35
      );

      // ========================================================
      // 5. STATUS LOOKUPS
      // ========================================================

      // --------------------------------------------------------
      // ORDER - TRANSFERRED
      // --------------------------------------------------------

      const orderTransferredStatus =
        await Status.findOne({
          type: "order",
          is_active: true,
          $or: [
            {
              code: "TRANSFERRED",
            },
            {
              name: "TRANSFERRED",
            },
          ],
        }).select(
          "_id name code type is_active"
        );

      // --------------------------------------------------------
      // ORDER - CANCELLED
      // --------------------------------------------------------

      const orderCancelledStatus =
        await Status.findOne({
          type: "order",
          is_active: true,
          $or: [
            {
              code: "CANCELLED",
            },
            {
              name: "CANCELLED",
            },
          ],
        }).select(
          "_id name code type is_active"
        );

      // --------------------------------------------------------
      // ARCHIVED - REDEMPTION PERIOD
      // --------------------------------------------------------

      const redemptionStatus =
        await Status.findOne({
          type: "domain",
          is_active: true,
          $or: [
            {
              code: "REDEMPTION_PERIOD",
            },
            {
              code: "REDEMPTION PERIOD",
            },
            {
              name: "REDEMPTION PERIOD",
            },
          ],
        }).select(
          "_id name code type is_active"
        );

      // --------------------------------------------------------
      // ARCHIVED - PENDING DELETE RESTORABLE
      // --------------------------------------------------------

      const pendingDeleteStatus =
        await Status.findOne({
          type: "domain",
          is_active: true,
          $or: [
            {
              code:
                "PENDING_DELETE_RESTORABLE",
            },
            {
              code:
                "PENDING DELETE RESTORABLE",
            },
            {
              name:
                "PENDING DELETE RESTORABLE",
            },
          ],
        }).select(
          "_id name code type is_active"
        );

      // --------------------------------------------------------
      // DOMAIN - ACTIVE
      // IMPORTANT:
      // ACTIVE domain should NOT appear in archived page
      // --------------------------------------------------------

      const domainActiveStatus =
        await Status.findOne({
          type: "domain",
          is_active: true,
          $or: [
            {
              code: "ACTIVE",
            },
            {
              name: "ACTIVE",
            },
          ],
        }).select(
          "_id name code type is_active"
        );

      // --------------------------------------------------------
      // DOMAIN - TRANSFERRED
      // --------------------------------------------------------

      const domainTransferredStatus =
        await Status.findOne({
          type: "domain",
          is_active: true,
          $or: [
            {
              code: "TRANSFERRED",
            },
            {
              name: "TRANSFERRED",
            },
          ],
        }).select(
          "_id name code type is_active"
        );

      // --------------------------------------------------------
      // DOMAIN - CANCELLED
      // --------------------------------------------------------

      const domainCancelledStatus =
        await Status.findOne({
          type: "domain",
          is_active: true,
          $or: [
            {
              code: "CANCELLED",
            },
            {
              name: "CANCELLED",
            },
          ],
        }).select(
          "_id name code type is_active"
        );

      // --------------------------------------------------------
      // PLAN - TRANSFERRED
      // --------------------------------------------------------

      const planTransferredStatus =
        await Status.findOne({
          type: "plan",
          is_active: true,
          $or: [
            {
              code: "TRANSFERRED",
            },
            {
              name: "TRANSFERRED",
            },
          ],
        }).select(
          "_id name code type is_active"
        );

      // --------------------------------------------------------
      // PLAN - CANCELLED
      // --------------------------------------------------------

      const planCancelledStatus =
        await Status.findOne({
          type: "plan",
          is_active: true,
          $or: [
            {
              code: "CANCELLED",
            },
            {
              name: "CANCELLED",
            },
          ],
        }).select(
          "_id name code type is_active"
        );

      // ========================================================
      // 6. LOG STATUS IDS
      // ========================================================

      console.log(
        "[ARCHIVED] STATUS IDS",
        {
          orderTransferred:
            orderTransferredStatus?._id,

          orderCancelled:
            orderCancelledStatus?._id,

          redemption:
            redemptionStatus?._id,

          pendingDelete:
            pendingDeleteStatus?._id,

          domainActive:
            domainActiveStatus?._id,

          domainTransferred:
            domainTransferredStatus?._id,

          domainCancelled:
            domainCancelledStatus?._id,

          planTransferred:
            planTransferredStatus?._id,

          planCancelled:
            planCancelledStatus?._id,
        }
      );

      // ========================================================
      // 7. CLIENT FILTER
      // ========================================================

      const baseConditions: any[] = [];

      if (
        role?.toLowerCase() === "client" ||
        req.user?.type === "customer"
      ) {
        if (!clientId) {
          return res.status(403).json({
            success: false,
            error: "Client ID not found",
          });
        }

        if (
          !mongoose.Types.ObjectId.isValid(
            clientId
          )
        ) {
          return res.status(400).json({
            success: false,
            error: "Invalid client ID",
          });
        }

        baseConditions.push({
          client:
            new mongoose.Types.ObjectId(
              clientId
            ),
        });
      }

      // ========================================================
      // 8. FIND PLAN ORDER IDS
      //
      // ANY ONE PLAN:
      //
      // primary_status = TRANSFERRED
      // OR
      // primary_status = CANCELLED
      // ========================================================

      const planStatusIds:
        mongoose.Types.ObjectId[] = [];

      if (
        planTransferredStatus?._id
      ) {
        planStatusIds.push(
          planTransferredStatus._id
        );
      }

      if (
        planCancelledStatus?._id
      ) {
        planStatusIds.push(
          planCancelledStatus._id
        );
      }

      let planOrderIds: any[] = [];

      if (
        planStatusIds.length > 0
      ) {
        const matchingPlans =
          await OrderPlan.find({
            primary_status: {
              $in: planStatusIds,
            },
          })
            .select("orderId")
            .lean();

        planOrderIds =
          matchingPlans
            .map(
              (plan: any) =>
                plan.orderId
            )
            .filter(Boolean);
      }

      console.log(
        "[ARCHIVED] PLAN MATCHING ORDER IDS:",
        planOrderIds.length
      );

      // ========================================================
      // 9. ARCHIVED ORDER CONDITIONS
      //
      // ANY ONE OF THESE CONDITIONS IS ENOUGH.
      // ========================================================

      const archiveConditions: any[] = [];

      // --------------------------------------------------------
      // ORDER STATUS = TRANSFERRED
      // --------------------------------------------------------

      if (
        orderTransferredStatus?._id
      ) {
        archiveConditions.push({
          order_status:
            orderTransferredStatus._id,
        });
      }

      // --------------------------------------------------------
      // ORDER STATUS = CANCELLED
      // --------------------------------------------------------

      if (
        orderCancelledStatus?._id
      ) {
        archiveConditions.push({
          order_status:
            orderCancelledStatus._id,
        });
      }

      // --------------------------------------------------------
      // EXPIRY DATE < 35 DAYS AGO
      // --------------------------------------------------------

      archiveConditions.push({
        expiryDate: {
          $lt:
            thirtyFiveDaysAgo,
        },
      });

      // --------------------------------------------------------
      // ARCHIVED STATUS = REDEMPTION PERIOD
      // --------------------------------------------------------

      if (
        redemptionStatus?._id
      ) {
        archiveConditions.push({
          archived_status:
            redemptionStatus._id,
        });
      }

      // --------------------------------------------------------
      // ARCHIVED STATUS =
      // PENDING DELETE RESTORABLE
      // --------------------------------------------------------

      if (
        pendingDeleteStatus?._id
      ) {
        archiveConditions.push({
          archived_status:
            pendingDeleteStatus._id,
        });
      }

      // --------------------------------------------------------
      // DOMAIN STATUS = TRANSFERRED
      // --------------------------------------------------------

      if (
        domainTransferredStatus?._id
      ) {
        archiveConditions.push({
          domain_status:
            domainTransferredStatus._id,
        });
      }

      // --------------------------------------------------------
      // DOMAIN STATUS = CANCELLED
      // --------------------------------------------------------

      if (
        domainCancelledStatus?._id
      ) {
        archiveConditions.push({
          domain_status:
            domainCancelledStatus._id,
        });
      }

      // --------------------------------------------------------
      // ANY PLAN = TRANSFERRED / CANCELLED
      // --------------------------------------------------------

      if (
        planOrderIds.length > 0
      ) {
        archiveConditions.push({
          _id: {
            $in:
              planOrderIds,
          },
        });
      }

      // ========================================================
      // 10. SEARCH CONDITION
      //
      // SEARCH AND ARCHIVE CONDITION
      // ========================================================

      if (
        archiveConditions.length === 0
      ) {
        return res.status(200).json({
          success: true,
          data: [],
          pagination: {
            total: 0,
            page,
            limit,
            totalPages: 0,
          },
        });
      }

      baseConditions.push({
        $or:
          archiveConditions,
      });

      // ========================================================
      // IMPORTANT
      // ========================================================
      // If domain status is ACTIVE,
      // the order MUST NOT appear in archived page.
      //
      // Current logic kept unchanged from your code.
      // ========================================================

      // if (
      //   domainActiveStatus?._id
      // ) {
      //   baseConditions.push({
      //     domain_status: {
      //       $ne:
      //         domainActiveStatus._id,
      //     },
      //   });
      // }

      // ========================================================
      // 11. SEARCH
      // ========================================================

      if (search) {
        baseConditions.push({
          $or: [
            {
              domainName: {
                $regex:
                  search,
                $options:
                  "i",
              },
            },
            {
              managedBy: {
                $regex:
                  search,
                $options:
                  "i",
              },
            },
            {
              "customer.email": {
                $regex:
                  search,
                $options:
                  "i",
              },
            },
            {
              "customer.name": {
                $regex:
                  search,
                $options:
                  "i",
              },
            },
            {
              "client.c_email": {
                $regex:
                  search,
                $options:
                  "i",
              },
            },
            {
              "client.c_name": {
                $regex:
                  search,
                $options:
                  "i",
              },
            },
          ],
        });
      }

      // ========================================================
      // 12. FINAL QUERY
      // ========================================================

      const query: any = {
        $and:
          baseConditions,
      };

      console.log(
        "[ARCHIVED] FINAL QUERY:",
        JSON.stringify(
          query,
          null,
          2
        )
      );

      // ========================================================
      // 13. FETCH ORDERS
      // ========================================================

      const orders: any[] =
        await Order.find(query)

          .populate({
            path: "order_status",
            select:
              "_id name code type is_active",
          })

          .populate({
            path: "domain_status",
            select:
              "_id name code type is_active",
          })

          .populate({
            path: "archived_status",
            select:
              "_id name code type is_active",
          })

          .populate({
            path: "domainSource",
            select:
              "_id name code image",
          })

          .populate({
            path: "customer",
            select:
              "_id name email",
          })

          .populate({
            path: "client",
            select:
              "_id c_company c_email",
          })

          .sort({
            expiryDate: -1,
            createdAt: -1,
          })

          .lean();

      console.log(
        "[ARCHIVED] ORDERS FOUND:",
        orders.length
      );

      // ========================================================
      // 14. FETCH PLANS FOR RETURN DATA
      //
      // Fetch ALL plans belonging to returned orders
      // ========================================================

      const orderIds =
        orders.map(
          (order: any) =>
            order._id
        );

      const orderPlans: any[] =
        orderIds.length > 0
          ? await OrderPlan.find({
            orderId: {
              $in:
                orderIds,
            },
          })

            .populate({
              path:
                "primary_status",
              select:
                "_id name code type category is_active is_custom",
            })

            .populate({
              path:
                "secondary_status",
              select:
                "_id name code type category is_active is_custom",
            })

            .populate({
              path:
                "planId",
              select:
                "_id planName image provider serviceType type",
            })

            .populate({
              path:
                "emailTypeId",
              select:
                "_id name image",
            })

            .lean()
          : [];

      // ========================================================
      // 15. FORMAT PLANS
      //
      // IMPORTANT:
      // Explicitly return transferred/cancelled dates
      // for every plan.
      // ========================================================

      const formattedOrderPlans =
        orderPlans.map(
          (plan: any) => {
            const emailType =
              plan.emailTypeId;

            return {
              ...plan,

              // ------------------------------------------------
              // PLAN TRANSFERRED DATE/TIME
              // ------------------------------------------------

              plan_transferred_on:
                plan.plan_transferred_on
                ?? null,

              // ------------------------------------------------
              // PLAN CANCELLED DATE/TIME
              // ------------------------------------------------

              plan_cancelled_on:
                plan.plan_cancelled_on
                ?? null,

              emailType:
                emailType?.name ||
                "",

              emailTypeImage:
                emailType?.image ||
                "",

              emailTypeId:
                emailType
                  ? {
                    _id:
                      emailType._id,

                    name:
                      emailType.name,

                    image:
                      emailType.image,
                  }
                  : null,
            };
          }
        );

      // ========================================================
      // 16. GROUP PLANS BY ORDER
      // ========================================================

      const planMap =
        new Map<
          string,
          any[]
        >();

      for (
        const plan of
        formattedOrderPlans
      ) {
        if (!plan.orderId) {
          continue;
        }

        const key =
          plan.orderId.toString();

        const existing =
          planMap.get(key) ||
          [];

        existing.push(
          plan
        );

        planMap.set(
          key,
          existing
        );
      }

      // ========================================================
      // 17. FINAL RESPONSE ORDERS
      //
      // IMPORTANT:
      // Explicitly return:
      //
      // ORDER:
      // - order_transferred_on
      // - order_cancelled_on
      //
      // DOMAIN:
      // - domain_transferred_on
      // - domain_cancelled_on
      //
      // PLANS:
      // - plan_transferred_on
      // - plan_cancelled_on
      // ========================================================

      const finalOrders =
        orders.map(
          (order: any) => ({
            ...order,

            // ------------------------------------------------
            // ORDER TRANSFERRED DATE/TIME
            // ------------------------------------------------

            order_transferred_on:
              order.order_transferred_on
              ?? null,

            // ------------------------------------------------
            // ORDER CANCELLED DATE/TIME
            // ------------------------------------------------

            order_cancelled_on:
              order.order_cancelled_on
              ?? null,

            // ------------------------------------------------
            // DOMAIN TRANSFERRED DATE/TIME
            // ------------------------------------------------

            domain_transferred_on:
              order.domain_transferred_on
              ?? null,

            // ------------------------------------------------
            // DOMAIN CANCELLED DATE/TIME
            // ------------------------------------------------

            domain_cancelled_on:
              order.domain_cancelled_on
              ?? null,

            // ------------------------------------------------
            // PLANS
            // ------------------------------------------------

            Plans:
              planMap.get(
                order._id.toString()
              ) || [],
          })
        );

      // ========================================================
      // 18. PAGINATION
      // ========================================================

      const total =
        finalOrders.length;

      const paginatedOrders =
        finalOrders.slice(
          skip,
          skip + limit
        );

      // ========================================================
      // 19. LOG
      // ========================================================

      console.log(
        "[ARCHIVED] TOTAL:",
        total
      );

      console.log(
        "[ARCHIVED] PAGE:",
        page
      );

      console.log(
        "[ARCHIVED] LIMIT:",
        limit
      );

      console.log(
        "[ARCHIVED] RETURNING:",
        paginatedOrders.length
      );

      // ========================================================
      // 20. RESPONSE
      // ========================================================

      return res.status(200).json({
        success: true,

        data:
          paginatedOrders,

        pagination: {
          total,

          page,

          limit,

          totalPages:
            Math.ceil(
              total /
              limit
            ),
        },
      });

    } catch (
    error: any
    ) {
      console.error(
        "================================="
      );

      console.error(
        "[ARCHIVED] ERROR:",
        error
      );

      console.error(
        "================================="
      );

      return res.status(500).json({
        success: false,

        error:
          error?.message ||
          "Failed to fetch archived orders",
      });
    }
  }
);
// ============================================================
// NORMAL ORDERS
// ============================================================

// ============================================================
// NORMAL ORDERS
// ============================================================

router.get(
  "/",
  authMiddleware,
  async (
    req: AuthRequest,
    res: Response
  ) => {
    try {
      // ========================================================
      // 1. AUTH
      // ========================================================

      const loggedInUser = req.user;

      if (!loggedInUser?._id) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      // ========================================================
      // 2. QUERY PARAMS
      // ========================================================

      const search =
        typeof req.query.search === "string"
          ? req.query.search.trim()
          : "";

      const emailType =
        typeof req.query.emailType === "string"
          ? req.query.emailType.trim()
          : "";

      const page = Math.max(
        Number(req.query.page) || 1,
        1
      );

      const limit = Math.min(
        Number(req.query.limit) || 50,
        100
      );

      // ========================================================
      // 3. TODAY
      // ========================================================

      const today = new Date();

      today.setHours(
        0,
        0,
        0,
        0
      );

      // ========================================================
      // 4. ORDER STATUSES
      // ========================================================

      const activeOrderStatus =
        await Status.findOne({
          type: "order",
          code: "ACTIVE",
          is_active: true,
        }).select(
          "_id name code type is_active"
        );

      const expiredOrderStatus =
        await Status.findOne({
          type: "order",
          code: "EXPIRED",
          is_active: true,
        }).select(
          "_id name code type is_active"
        );

      const transferredOrderStatus =
        await Status.findOne({
          type: "order",
          $or: [
            {
              code: "TRANSFERRED",
            },
            {
              name: "TRANSFERRED",
            },
          ],
          is_active: true,
        }).select(
          "_id name code type is_active"
        );

      const cancelledOrderStatus =
        await Status.findOne({
          type: "order",
          $or: [
            {
              code: "CANCELLED",
            },
            {
              name: "CANCELLED",
            },
          ],
          is_active: true,
        }).select(
          "_id name code type is_active"
        );

      if (
        !activeOrderStatus ||
        !expiredOrderStatus
      ) {
        throw new Error(
          "ACTIVE or EXPIRED order status not found"
        );
      }

      console.log(
        "[ORDERS] TRANSFERRED ORDER STATUS:",
        transferredOrderStatus?._id
      );

      console.log(
        "[ORDERS] CANCELLED ORDER STATUS:",
        cancelledOrderStatus?._id
      );

      // ========================================================
      // 5. PLAN STATUSES
      // ========================================================

      const activePlanStatus =
        await Status.findOne({
          type: "plan",
          code: "ACTIVE",
          is_active: true,
        }).select(
          "_id name code type is_active"
        );

      const expiredPlanStatus =
        await Status.findOne({
          type: "plan",
          code: "EXPIRED",
          is_active: true,
        }).select(
          "_id name code type is_active"
        );

      if (
        !activePlanStatus ||
        !expiredPlanStatus
      ) {
        throw new Error(
          "ACTIVE or EXPIRED plan status not found"
        );
      }

      // ========================================================
      // 6. BASE FILTERS
      // ========================================================

      const planOrderIds =
        await OrderPlan.distinct(
          "orderId"
        );

      const filters: any[] = [];

      // ========================================================
      // ORDER MUST HAVE DOMAIN OR PLAN
      // ========================================================

      filters.push({
        $or: [
          {
            _id: {
              $in: planOrderIds,
            },
          },
          {
            dns_flag: false,
          },
        ],
      });

      // ========================================================
      // EXCLUDE TRANSFERRED / CANCELLED ORDERS
      // FROM NORMAL ORDERS
      // ========================================================

      const excludedOrderStatusIds = [
        transferredOrderStatus?._id,
        cancelledOrderStatus?._id,
      ].filter(Boolean);

      if (
        excludedOrderStatusIds.length
      ) {
        filters.push({
          order_status: {
            $nin:
              excludedOrderStatusIds,
          },
        });
      }

      // ========================================================
      // 7. SEARCH
      // ========================================================

      if (search) {
        filters.push({
          $or: [
            {
              domainName: {
                $regex: search,
                $options: "i",
              },
            },
            {
              managedBy: {
                $regex: search,
                $options: "i",
              },
            },
          ],
        });
      }

      // ========================================================
      // 8. EMAIL TYPE
      // ========================================================

      if (emailType) {
        const emailPlans =
          await OrderPlan.find({
            type: "email",
          })
            .populate({
              path: "emailTypeId",
              select: "name",
            })
            .select(
              "orderId emailTypeId"
            )
            .lean();

        const emailOrderIds =
          emailPlans
            .filter(
              (plan: any) => {
                const name =
                  plan.emailTypeId?.name ||
                  "";

                return (
                  name
                    .trim()
                    .toLowerCase() ===
                  emailType
                    .trim()
                    .toLowerCase()
                );
              }
            )
            .map(
              (plan: any) =>
                plan.orderId
            )
            .filter(
              (id: any) =>
                mongoose.Types.ObjectId.isValid(
                  id
                )
            );

        filters.push({
          _id: {
            $in: emailOrderIds.length
              ? emailOrderIds
              : [],
          },
        });
      }

      // ========================================================
      // 9. USER
      // ========================================================

      const user =
        await User.findById(
          loggedInUser._id
        ).populate(
          "userType"
        );

      // ========================================================
      // 10. COMMON ORDER FIELDS
      // ========================================================

      const orderFields = {
        domainName: 1,
        order_status: 1,
        domain_status: 1,
        archived_status: 1,
        is_active: 1,
        dns_flag: 1,
        client: 1,
        managedBy: 1,
        registrationDate: 1,
        expiryDate: 1,
        lockStatus: 1,
        domainSource: 1,
      };

      // ========================================================
      // 11. ATTACH PLANS
      // ========================================================

      const attachPlans =
        async (
          orders: any[]
        ) => {
          if (!orders.length) {
            return orders;
          }

          const orderIds =
            orders.map(
              (order) => order._id
            );

          const plans =
            await OrderPlan.find({
              orderId: {
                $in: orderIds,
              },
            })
              .populate({
                path: "emailTypeId",
                select: "name image",
              })
              .populate({
                path: "hostTypeId",
                select: "type",
              })
              .populate({
                path: "hostSubTypeId",
                select: "name",
              })
              .populate({
                path: "storageId",
                select: "storage name",
              })
              .populate({
                path: "primary_status",
                select:
                  "_id name code type is_active",
              })
              .populate({
                path: "secondary_status",
                select:
                  "_id name code type is_active",
              })
              .select(`
                _id
                orderId
                type
                registrationDate
                expiryDate
                emailTypeId
                planId
                hostTypeId
                hostSubTypeId
                storageId
                noOfUsers
                primary_status
                secondary_status
              `)
              .lean();

          const planMap =
            new Map<
              string,
              any[]
            >();

          plans.forEach(
            (plan: any) => {
              const key =
                plan.orderId.toString();

              if (
                !planMap.has(key)
              ) {
                planMap.set(
                  key,
                  []
                );
              }

              planMap
                .get(key)!
                .push({
                  _id: plan._id,

                  type: plan.type,

                  registrationDate:
                    plan.registrationDate ||
                    null,

                  expiryDate:
                    plan.expiryDate ||
                    null,

                  noOfUsers:
                    plan.noOfUsers ||
                    0,

                  emailType:
                    plan.emailTypeId?.name ||
                    null,

                  emailTypeImage:
                    plan.emailTypeId?.image ||
                    null,

                  planId:
                    plan.planId ||
                    null,

                  hostType:
                    plan.hostTypeId
                      ? {
                        _id:
                          plan.hostTypeId._id,
                        type:
                          plan.hostTypeId.type,
                      }
                      : null,

                  hostSubType:
                    plan.hostSubTypeId
                      ? {
                        _id:
                          plan.hostSubTypeId._id,
                        name:
                          plan.hostSubTypeId.name,
                      }
                      : null,

                  storage:
                    plan.storageId
                      ? {
                        _id:
                          plan.storageId._id,
                        name:
                          plan.storageId.name ||
                          plan.storageId.storage ||
                          null,
                      }
                      : null,

                  primary_status:
                    plan.primary_status ||
                    null,

                  secondary_status:
                    plan.secondary_status ||
                    null,
                });
            }
          );

          return orders.map(
            (order) => ({
              ...order,

              Plans:
                planMap.get(
                  order._id.toString()
                ) || [],
            })
          );
        };

      // ========================================================
      // 12. UPDATE PLAN PRIMARY STATUS
      // ========================================================
      //
      // RULE:
      //
      // 1. TRANSFERRED / CANCELLED
      //    => NEVER CHANGE
      //
      // 2. Otherwise expiryDate is checked.
      //
      // 3. Expired
      //    => EXPIRED
      //
      // 4. Not expired
      //    => ACTIVE
      //
      // ========================================================

      const updatePlanStatuses =
        async (
          orders: any[]
        ) => {
          if (!orders.length) {
            return orders;
          }

          const bulkOps: any[] = [];

          for (
            const order of orders
          ) {
            const plans =
              Array.isArray(
                order.Plans
              )
                ? order.Plans
                : [];

            for (
              const plan of plans
            ) {

              // ==================================================
              // IMPORTANT:
              // TRANSFERRED / CANCELLED MUST NEVER BE OVERWRITTEN
              // ==================================================

              if (
                isTransferredOrCancelled(
                  plan.primary_status
                )
              ) {
                console.log(
                  `[ORDERS] PLAN STATUS PROTECTED: ${plan._id} => TRANSFERRED/CANCELLED`
                );

                continue;
              }

              // ==================================================
              // NO EXPIRY DATE
              // ==================================================

              if (!plan.expiryDate) {
                continue;
              }

              // ==================================================
              // EXPIRY DATE
              // ==================================================

              const expiry =
                new Date(
                  plan.expiryDate
                );

              expiry.setHours(
                0,
                0,
                0,
                0
              );

              // ==================================================
              // CHECK EXPIRY
              // ==================================================

              const isExpired =
                expiry < today;

              const newStatus =
                isExpired
                  ? expiredPlanStatus
                  : activePlanStatus;

              if (!newStatus?._id) {
                continue;
              }

              // ==================================================
              // CURRENT STATUS
              // ==================================================

              const currentStatusId =
                plan.primary_status?._id
                  ?.toString() ||
                plan.primary_status
                  ?.toString() ||
                "";

              const newStatusId =
                newStatus._id.toString();

              // ==================================================
              // UPDATE ONLY IF DIFFERENT
              // ==================================================

              if (
                currentStatusId !==
                newStatusId
              ) {
                bulkOps.push({
                  updateOne: {
                    filter: {
                      _id: plan._id,
                    },

                    update: {
                      $set: {
                        primary_status:
                          newStatus._id,
                      },
                    },
                  },
                });

                // ==================================================
                // UPDATE LOCAL RESPONSE
                // ==================================================

                plan.primary_status = {
                  _id:
                    newStatus._id,

                  name:
                    newStatus.name,

                  code:
                    newStatus.code,

                  type:
                    newStatus.type,

                  is_active:
                    newStatus.is_active,
                };
              }
            }
          }

          // ========================================================
          // BULK UPDATE
          // ========================================================

          if (
            bulkOps.length
          ) {
            await OrderPlan.bulkWrite(
              bulkOps
            );
          }

          return orders;
        };

      // ========================================================
      // 13. UPDATE ORDER STATUS
      // ========================================================
      //
      // RULE:
      //
      // TRANSFERRED / CANCELLED
      // => NEVER CHANGE
      //
      // Otherwise:
      // Order expiry OR plan expiry
      // => EXPIRED
      //
      // ========================================================

      const updateOrderStatuses =
        async (
          orders: any[]
        ) => {
          const bulkOps: any[] = [];

          orders.forEach(
            (order: any) => {

              // ==================================================
              // IMPORTANT:
              // TRANSFERRED / CANCELLED
              // MUST NEVER BECOME EXPIRED
              // ==================================================

              if (
                isTransferredOrCancelled(
                  order.order_status
                )
              ) {
                console.log(
                  `[ORDERS] ORDER STATUS PROTECTED: ${order.domainName} => TRANSFERRED/CANCELLED`
                );

                return;
              }

              let isExpired =
                false;

              // ==================================================
              // ORDER EXPIRY
              // ==================================================

              if (
                order.expiryDate
              ) {
                const expiry =
                  new Date(
                    order.expiryDate
                  );

                expiry.setHours(
                  0,
                  0,
                  0,
                  0
                );

                if (
                  expiry < today
                ) {
                  isExpired =
                    true;
                }
              }

              // ==================================================
              // PLAN EXPIRY
              // ==================================================

              const plans =
                Array.isArray(
                  order.Plans
                )
                  ? order.Plans
                  : [];

              const planExpired =
                plans.some(
                  (plan: any) => {

                    // ------------------------------------------
                    // TRANSFERRED / CANCELLED PLAN
                    // MUST NOT MAKE ORDER EXPIRED
                    // ------------------------------------------

                    if (
                      isTransferredOrCancelled(
                        plan.primary_status
                      )
                    ) {
                      return false;
                    }

                    if (
                      !plan.expiryDate
                    ) {
                      return false;
                    }

                    const expiry =
                      new Date(
                        plan.expiryDate
                      );

                    expiry.setHours(
                      0,
                      0,
                      0,
                      0
                    );

                    return (
                      expiry < today
                    );
                  }
                );

              if (
                planExpired
              ) {
                isExpired =
                  true;
              }

              // ==================================================
              // NEW STATUS
              // ==================================================

              const newStatus =
                isExpired
                  ? expiredOrderStatus
                  : activeOrderStatus;

              if (
                !newStatus?._id
              ) {
                return;
              }

              // ==================================================
              // CURRENT STATUS
              // ==================================================

              const currentStatusId =
                order.order_status?._id
                  ?.toString() ||
                order.order_status
                  ?.toString() ||
                "";

              const newStatusId =
                newStatus._id.toString();

              // ==================================================
              // UPDATE ONLY IF DIFFERENT
              // ==================================================

              if (
                currentStatusId !==
                newStatusId
              ) {
                bulkOps.push({
                  updateOne: {
                    filter: {
                      _id: order._id,
                    },

                    update: {
                      $set: {
                        order_status:
                          newStatus._id,
                      },
                    },
                  },
                });

                // ==================================================
                // LOCAL RESPONSE
                // ==================================================

                order.order_status = {
                  _id:
                    newStatus._id,

                  name:
                    newStatus.name,

                  code:
                    newStatus.code,

                  type:
                    newStatus.type,

                  is_active:
                    newStatus.is_active,
                };
              }
            }
          );

          // ========================================================
          // BULK UPDATE
          // ========================================================

          if (
            bulkOps.length
          ) {
            await Order.bulkWrite(
              bulkOps
            );
          }

          return orders;
        };

      // ========================================================
      // 14. UPDATE ARCHIVED STATUS
      // ========================================================

      const updateArchivedStatuses =
        async (
          orders: any[]
        ) => {
          const bulkOps: any[] = [];

          orders.forEach(
            (order: any) => {

              if (
                !order.expiryDate
              ) {
                return;
              }

              const expiry =
                new Date(
                  order.expiryDate
                );

              expiry.setHours(
                0,
                0,
                0,
                0
              );

              const diffMs =
                today.getTime() -
                expiry.getTime();

              const expiredDays =
                Math.floor(
                  diffMs /
                  (
                    1000 *
                    60 *
                    60 *
                    24
                  )
                );

              let newArchivedStatus:
                any = null;

              if (
                expiredDays <= 0
              ) {
                newArchivedStatus =
                  null;
              } else if (
                expiredDays <= 35
              ) {
                newArchivedStatus =
                  null;
              } else if (
                expiredDays <= 65
              ) {
                newArchivedStatus =
                  redemptionStatusSafe;
              } else {
                newArchivedStatus =
                  pendingDeleteStatusSafe;
              }

              const currentArchivedId =
                order.archived_status?._id
                  ?.toString() ||
                order.archived_status
                  ?.toString() ||
                null;

              const newArchivedId =
                newArchivedStatus?._id
                  ?.toString() ||
                null;

              if (
                currentArchivedId !==
                newArchivedId
              ) {
                bulkOps.push({
                  updateOne: {
                    filter: {
                      _id: order._id,
                    },

                    update: {
                      $set: {
                        archived_status:
                          newArchivedStatus
                            ? newArchivedStatus._id
                            : null,
                      },
                    },
                  },
                });

                order.archived_status =
                  newArchivedStatus;
              }
            }
          );

          if (
            bulkOps.length
          ) {
            await Order.bulkWrite(
              bulkOps
            );
          }

          return orders;
        };

      // ========================================================
      // 15. SAFE ARCHIVED STATUS VALUES
      // ========================================================

      const redemptionStatusSafe =
        await Status.findOne({
          type: "domain",
          $or: [
            {
              code:
                "REDEMPTION PERIOD",
            },
            {
              code:
                "REDEMPTION_PERIOD",
            },
            {
              name:
                "REDEMPTION PERIOD",
            },
          ],
          is_active: true,
        }).select(
          "_id name code type is_active"
        );

      const pendingDeleteStatusSafe =
        await Status.findOne({
          type: "domain",
          $or: [
            {
              code:
                "PENDING DELETE RESTORABLE",
            },
            {
              code:
                "PENDING_DELETE_RESTORABLE",
            },
            {
              name:
                "PENDING DELETE RESTORABLE",
            },
          ],
          is_active: true,
        }).select(
          "_id name code type is_active"
        );

      // ========================================================
      // 16. SERVICE AVAILABILITY
      // ========================================================

      const filterUnavailableOrders =
        (
          orders: any[]
        ) => {

          return orders.filter(
            (order: any) => {

              // ------------------------------------------------
              // TRANSFERRED / CANCELLED ORDER
              // ------------------------------------------------

              if (
                isTransferredOrCancelled(
                  order.order_status
                )
              ) {
                console.log(
                  `[ORDERS] EXCLUDED ORDER ${order.domainName} => TRANSFERRED/CANCELLED`
                );

                return false;
              }

              // ------------------------------------------------
              // DOMAIN SOURCE
              // ------------------------------------------------

              const hasDomainService =
                !!order.domainSource;

              // ------------------------------------------------
              // PLANS
              // ------------------------------------------------

              const plans =
                Array.isArray(
                  order.Plans
                )
                  ? order.Plans
                  : [];

              const hasPlans =
                plans.length > 0;

              // ------------------------------------------------
              // NO DOMAIN + NO PLAN
              // ------------------------------------------------

              if (
                !hasDomainService &&
                !hasPlans
              ) {
                return true;
              }

              // ------------------------------------------------
              // DOMAIN SOURCE EXISTS
              // ------------------------------------------------

              if (
                hasDomainService
              ) {

                const domainAvailable =
                  !isTransferredOrCancelled(
                    order.domain_status
                  );

                const planAvailable =
                  hasPlans &&
                  plans.some(
                    (plan: any) =>
                      !isTransferredOrCancelled(
                        plan.primary_status
                      )
                  );

                if (
                  domainAvailable ||
                  planAvailable
                ) {
                  return true;
                }

                return false;
              }

              // ------------------------------------------------
              // DOMAIN SOURCE NULL
              // ------------------------------------------------

              if (
                !hasDomainService
              ) {

                if (
                  hasPlans
                ) {

                  const planAvailable =
                    plans.some(
                      (plan: any) =>
                        !isTransferredOrCancelled(
                          plan.primary_status
                        )
                    );

                  if (
                    planAvailable
                  ) {
                    return true;
                  }

                  return false;
                }

                return true;
              }

              return false;
            }
          );
        };

      // ========================================================
      // 17. NORMAL ORDER EXPIRY FILTER
      // ========================================================

      const filterNormalOrderAge =
        (
          orders: any[]
        ) => {

          return orders.filter(
            (order: any) => {

              // ------------------------------------------------
              // TRANSFERRED / CANCELLED
              // ------------------------------------------------

              if (
                isTransferredOrCancelled(
                  order.order_status
                )
              ) {
                return false;
              }

              // ------------------------------------------------
              // NO EXPIRY
              // ------------------------------------------------

              if (
                !order.expiryDate
              ) {
                return true;
              }

              const expiry =
                new Date(
                  order.expiryDate
                );

              expiry.setHours(
                0,
                0,
                0,
                0
              );

              const diffMs =
                today.getTime() -
                expiry.getTime();

              const expiredDays =
                Math.floor(
                  diffMs /
                  (
                    1000 *
                    60 *
                    60 *
                    24
                  )
                );

              // TODAY / FUTURE

              if (
                expiredDays <= 0
              ) {
                return true;
              }

              // 1 - 35 DAYS

              if (
                expiredDays <= 35
              ) {
                return true;
              }

              // 36+ DAYS

              return false;
            }
          );
        };

      // ========================================================
      // 18. FINAL TRANSFERRED / CANCELLED SAFETY FILTER
      // ========================================================

      const filterTransferredCancelledOrders =
        (
          orders: any[]
        ) => {

          return orders.filter(
            (order: any) => {

              const status =
                order.order_status;

              const code =
                (
                  status?.code ||
                  status?.name ||
                  ""
                )
                  .toString()
                  .trim()
                  .toUpperCase()
                  .replace(
                    /[\s-]+/g,
                    "_"
                  );

              const isExcluded =
                code ===
                "TRANSFERRED" ||
                code ===
                "CANCELLED";

              if (
                isExcluded
              ) {
                console.log(
                  `[ORDERS] FINAL EXCLUDE: ${order.domainName} => ${code}`
                );

                return false;
              }

              return true;
            }
          );
        };

      // ========================================================
      // 19. LOAD ORDERS
      // ========================================================

      const loadOrders =
        async (
          finalFilter: any
        ) => {

          let orders: any[] =
            await Order.find(
              finalFilter
            )
              .select(
                orderFields
              )

              .populate({
                path: "client",
                select:
                  "_id c_name c_company",
              })

              .populate({
                path: "order_status",
                select:
                  "_id name code type is_active",
              })

              .populate({
                path: "domain_status",
                select:
                  "_id name code type is_active",
              })

              .populate({
                path: "archived_status",
                select:
                  "_id name code type is_active",
              })

              .populate({
                path: "domainSource",
                select:
                  "_id name code image",
              })

              .lean();

          // ====================================================
          // ATTACH PLANS
          // ====================================================

          orders =
            await attachPlans(
              orders
            );

          // ====================================================
          // UPDATE PLAN STATUS
          // ====================================================

          orders =
            await updatePlanStatuses(
              orders
            );

          // ====================================================
          // UPDATE ORDER STATUS
          // ====================================================

          orders =
            await updateOrderStatuses(
              orders
            );

          // ====================================================
          // UPDATE ARCHIVED STATUS
          // ====================================================

          orders =
            await updateArchivedStatuses(
              orders
            );

          // ====================================================
          // SERVICE AVAILABILITY
          // ====================================================

          orders =
            filterUnavailableOrders(
              orders
            );

          // ====================================================
          // NORMAL ORDER AGE
          // ====================================================

          orders =
            filterNormalOrderAge(
              orders
            );

          // ====================================================
          // FINAL TRANSFERRED / CANCELLED FILTER
          // ====================================================

          orders =
            filterTransferredCancelledOrders(
              orders
            );

          return orders;
        };

      // ========================================================
      // 20. ADMIN
      // ========================================================

      const userTypeName =
        (
          user?.userType as any
        )?.name
          ?.toString()
          .toLowerCase() ||
        "";

      if (
        userTypeName === "admin"
      ) {

        const finalFilter = {
          $and: filters,
        };

        let orders =
          await loadOrders(
            finalFilter
          );

        const total =
          orders.length;

        const skip =
          (page - 1) *
          limit;

        if (
          !emailType
        ) {
          orders =
            orders.slice(
              skip,
              skip + limit
            );
        }

        return res.status(
          200
        ).json({

          success: true,

          data: orders,

          ...(
            emailType
              ? {}
              : {
                pagination: {
                  page,
                  limit,
                  total,
                  totalPages:
                    Math.ceil(
                      total /
                      limit
                    ),
                },
              }
          ),

        });
      }

      // ========================================================
      // 21. CUSTOMER
      // ========================================================

      const client =
        await Client.findById(
          loggedInUser._id
        ).populate(
          "userType"
        );

      const clientUserType =
        (
          client?.userType as any
        )?.name
          ?.toString()
          .toLowerCase() ||
        "";

      if (
        clientUserType ===
        "customer"
      ) {

        if (!client) {
          return res.status(
            404
          ).json({
            success: false,
            error:
              "Client not found",
          });
        }

        filters.push({
          client:
            client._id,
        });

        const finalFilter = {
          $and: filters,
        };

        let orders =
          await loadOrders(
            finalFilter
          );

        const total =
          orders.length;

        const skip =
          (page - 1) *
          limit;

        if (
          !emailType
        ) {
          orders =
            orders.slice(
              skip,
              skip + limit
            );
        }

        return res.status(
          200
        ).json({

          success: true,

          data: orders,

          ...(
            emailType
              ? {}
              : {
                pagination: {
                  page,
                  limit,
                  total,
                  totalPages:
                    Math.ceil(
                      total /
                      limit
                    ),
                },
              }
          ),

        });
      }

      // ========================================================
      // 22. ACCESS DENIED
      // ========================================================

      return res.status(
        403
      ).json({
        success: false,
        message:
          "Access denied",
      });

    } catch (
    error: any
    ) {

      console.error(
        "================================="
      );

      console.error(
        "[ORDERS] ERROR:",
        error
      );

      console.error(
        "================================="
      );

      return res.status(
        500
      ).json({

        success: false,

        message:
          error?.message ||
          "Internal server error",

      });
    }
  }
);


// GET single order by ID
router.get(
  "/:id",
  authMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      // ============================================
      // Validate ObjectId
      // ============================================

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: "Invalid order ID",
        });
        return;
      }

      // ============================================
      // Fetch Order
      // ============================================

      const order = await Order.findById(id)
        .populate({
          path: "customer",
          select:
            "name email phone company address city state country zipCode",
        })
        .populate({
          path: "client",
          select:
            "c_name c_email c_phone c_company c_address c_city c_state c_country c_zipCode",
          populate: [
            {
              path: "c_country",
              model: "Country",
              select: "name code",
            },
            {
              path: "c_state",
              model: "State",
              select: "name stateCode",
            },
          ],
        })
        .populate({
          path: "order_status",
          model: "Status",
          select: "_id name code type is_active",
        })
        .populate({
          path: "domain_status",
          model: "Status",
          select: "_id name code type is_active",
        })
        .populate({
          path: "domainSource",
          model: "DomainSource",
          select: "name code image",
        })
        .populate("hosttypeid")
        .populate("subHostTypeId")
        .populate("hoststorageId")
        .exec();

      // ============================================
      // Order Not Found
      // ============================================

      if (!order) {
        res.status(404).json({
          success: false,
          message: "Order not found",
        });
        return;
      }

      // ============================================
      // Access Check
      // ============================================

      if (
        req.user?.role?.toLowerCase() !== "admin" &&
        order.client?._id?.toString() !== req.user?._id
      ) {
        res.status(403).json({
          success: false,
          error: "Access denied",
        });
        return;
      }

      // ============================================
      // Fetch Related Plans
      // ============================================

      const orderPlansRaw = await OrderPlan.find({
        orderId: order._id,
      })
        .populate({
          path: "planId",
          model: "PlanEmail",
        })
        .populate({
          path: "emailTypeId",
          model: "TypeEmail",
        })
        .populate({
          path: "hostTypeId",
          model: "HostType",
        })
        .populate({
          path: "hostSubTypeId",
          model: "HostSubType",
        })
        .populate({
          path: "storageId",
          model: "Storage",
        })
        .populate({
          path: "primary_status",
          model: "Status",
          select:
            "_id name code type category is_custom is_active",
        })
        .populate({
          path: "secondary_status",
          model: "Status",
          select:
            "_id name code type category is_custom is_active",
        })
        .lean();

      // ============================================
      // Format Plans
      // ============================================

      const orderPlans: IOrderPlanResponse[] =
        orderPlansRaw.map((p: any) => ({
          _id: p._id.toString(),

          orderId: p.orderId.toString(),

          serviceType: p.type,

          type: p.type,

          planName: p.planId?.plan || "",

          planId: p.planId?._id?.toString() || "",

          emailType: p.emailTypeId?.name || "",

          // ========================================
          // OLD PLAN STATUS
          // ========================================

          status: p.status
            ? {
              _id: p.status._id,
              name: p.status.name,
            }
            : null,

          // ========================================
          // PRIMARY STATUS
          // ========================================

          primary_status: p.primary_status
            ? {
              _id: p.primary_status._id,
              name: p.primary_status.name,
              code: p.primary_status.code,
              type: p.primary_status.type,
              category: p.primary_status.category,
              is_custom: p.primary_status.is_custom,
              is_active: p.primary_status.is_active,
            }
            : null,

          // ========================================
          // SECONDARY STATUS
          // ========================================

          secondary_status: p.secondary_status
            ? {
              _id: p.secondary_status._id,
              name: p.secondary_status.name,
              code: p.secondary_status.code,
              type: p.secondary_status.type,
              category: p.secondary_status.category,
              is_custom: p.secondary_status.is_custom,
              is_active: p.secondary_status.is_active,
            }
            : null,

          // ========================================
          // HOST TYPE
          // ========================================

          hostType: p.hostTypeId
            ? {
              _id: p.hostTypeId._id,
              name: p.hostTypeId.type,
            }
            : null,

          // ========================================
          // HOST SUB TYPE
          // ========================================

          hostSubType: p.hostSubTypeId
            ? {
              _id: p.hostSubTypeId._id,
              name: p.hostSubTypeId.name,
            }
            : null,

          // ========================================
          // STORAGE
          // ========================================

          storage: p.storageId
            ? {
              _id: p.storageId._id,
              name: p.storageId.storage,
            }
            : null,

          // ========================================
          // PLAN INFORMATION
          // ========================================

          registrationDate: p.registrationDate,

          expiryDate: p.expiryDate,

          noOfUsers: p.noOfUsers,
          // ========================================
          // ADMIN LOGIN INFORMATION
          // ========================================

          adminEmail: p.adminEmail || "",
          username: p.username || "",

          // ========================================
          // PLAN STATUS DATE TRACKING
          // ========================================

          // Plan cancelled date & time
          plan_cancelled_on: p.plan_cancelled_on || null,

          // Plan transferred date & time
          plan_transferred_on: p.plan_transferred_on || null,
        }));

      // ============================================
      // Convert Order to Plain Object
      // ============================================

      const orderObj = order.toObject();

      // ============================================
      // Clean Domain Source Image Path
      // ============================================

      let domainSourceImage: string | null = null;

      if (orderObj.domainSource?.image) {
        const image = String(orderObj.domainSource.image);

        if (image.startsWith("http")) {
          domainSourceImage = image;
        } else {
          // Remove existing upload path(s)
          const cleanImage = image
            .replace(/^\/+/, "")
            .replace(/^uploads\/domainsources\/+/, "");

          domainSourceImage = `/uploads/domainsources/${cleanImage}`;
        }
      }

      // ============================================
      // Final Response
      // ============================================

      res.status(200).json({
        success: true,

        data: {
          // ========================================
          // BASIC ORDER INFORMATION
          // ========================================

          _id: orderObj._id,

          domainName: orderObj.domainName,

          managedBy: orderObj.managedBy,

          registrationDate: orderObj.registrationDate,

          expiryDate: orderObj.expiryDate,

          // ========================================
          // STATUS
          // ========================================

          order_status: orderObj.order_status,

          domain_status: orderObj.domain_status,

          // ========================================
          // STATUS / DATE TRACKING
          // ========================================

          // General activation date
          activated_on: orderObj.activated_on,

          // ----------------------------------------
          // ORDER STATUS DATE TRACKING
          // ----------------------------------------

          order_cancelled_on:
            orderObj.order_cancelled_on || null,

          order_transferred_on:
            orderObj.order_transferred_on || null,

          order_status_updated_on:
            orderObj.order_status_updated_on || null,

          // ----------------------------------------
          // DOMAIN STATUS DATE TRACKING
          // ----------------------------------------

          domain_cancelled_on:
            orderObj.domain_cancelled_on || null,

          domain_transferred_on:
            orderObj.domain_transferred_on || null,

          domain_status_updated_on:
            orderObj.domain_status_updated_on || null,

          // ========================================
          // DOMAIN INFORMATION
          // ========================================

          lockStatus: orderObj.lockStatus,

          domain_flag: orderObj.domain_flag,

          nameServers: orderObj.nameServers,

          // ========================================
          // DOMAIN SOURCE / REGISTRAR
          // ========================================

          domainSource: orderObj.domainSource
            ? {
              ...orderObj.domainSource,
              image: domainSourceImage,
            }
            : null,

          // ========================================
          // CLIENT / CUSTOMER
          // ========================================

          client: orderObj.client,

          customer: orderObj.customer,

          // ========================================
          // PLANS
          // ========================================

          plans: orderPlans,

          // ========================================
          // VERSION
          // ========================================

          __v: orderObj.__v,
        },
      });
    } catch (err) {
      console.error("❌ Error fetching order:", err);

      res.status(500).json({
        success: false,
        error: (err as Error).message,
      });
    }
  }
);
// POST create order
// router.post(
//   "/",
//   async (
//     req: Request<{}, {}, Partial<IOrder> & { is_customer?: boolean; newCustomer?: Partial<ICustomer> }>,
//     res: Response
//   ): Promise<void> => {
//     try {
//       const data = req.body;

//       let customerId: string | undefined;

//       // Only handle customer logic if either is_customer is true or newCustomer provided
//       if (data.is_customer) {
//         // Existing customer flow
//         if (!data.customer || !(await Customer.findById(data.customer))) {
//           res.status(400).json({ success: false, message: "Invalid customer" });
//           return;
//         }
//         customerId = data.customer.toString();
//       } else if (data.newCustomer) {ed
//         // New customer flow
//         if (!data.newCustomer.name || data.newCustomer.name.trim() === "") {
//           res.status(400).json({ success: false, message: "New customer name is required" });
//           return;
//         }

//         // Check if resellerCustomerId already exists
//         const existingCustomer = await Customer.findOne<ICustomer>({
//           resellerCustomerId: data.newCustomer.resellerCustomerId,
//         });

//         if (existingCustomer) {
//           customerId = existingCustomer._id.toString();
//         } else {
//           const newCust = new Customer(data.newCustomer);
//           const savedCustomer = await newCust.save();
//           customerId = savedCustomer._id.toString();
//         }
//       }
//       // If neither is_customer nor newCustomer, customerId remains undefined (optional)

//       // Validate domain name presence
//       if (!data.domainName) {
//         res.status(400).json({ success: false, message: "Domain name is required" });
//         return;
//       }

//       // Check for existing domain
//       const existingOrder = await Order.findOne({ domainName: data.domainName });
//       if (existingOrder) {
//         res.status(400).json({ success: false, message: "Domain already exists" });
//         return;
//       }

//       // Validate provider value
//       const allowedProviders = ["Google Workspace", "Microsoft 365"];
//       if (data.provider && !allowedProviders.includes(data.provider)) {
//         res.status(400).json({ success: false, message: "Invalid provider" });
//         return;
//       }

//       // Create and save new order, customer is optional here
//       const newOrder = new Order({ ...data, customer: customerId });
//       const savedOrder = await newOrder.save();

//       res.status(201).json({ success: true, data: savedOrder });
//     } catch (err: any) {
//       if (err.name === "ValidationError") {
//         res.status(400).json({ success: false, error: err.message });
//       } else if (err.code === 11000) {
//         res.status(400).json({ success: false, error: "Domain already exists" });
//       } else {
//         res.status(500).json({ success: false, error: err.message });
//       }
//     }
//   }
// );
router.post(
  "/",
  authMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const data = req.body;

      let customerId: string | undefined;

      // =====================================================
      // CUSTOMER HANDLING
      // =====================================================

      if (data.is_customer) {
        if (
          !data.client ||
          !(await Client.findById(data.client))
        ) {
          res.status(400).json({
            success: false,
            error: {
              code: "INVALID_CLIENT",
              message: "Invalid client",
            },
          });

          return;
        }

        customerId = data.client.toString();
      } else if (data.newCustomer) {
        if (
          !data.newCustomer.c_name ||
          data.newCustomer.c_name.trim() === ""
        ) {
          res.status(400).json({
            success: false,
            message: "New customer name is required",
          });

          return;
        }

        const existingCustomer = await Client.findOne({
          c_email: data.newCustomer.c_email,
        });

        if (existingCustomer) {
          customerId = existingCustomer._id.toString();
        } else {
          const newCust = new Client(data.newCustomer);

          const savedCustomer = await newCust.save();

          customerId = savedCustomer._id.toString();
        }
      }

      // =====================================================
      // DOMAIN VALIDATION
      // =====================================================

      if (!data.domainName) {
        res.status(400).json({
          success: false,
          error: {
            code: "DOMAIN_REQUIRED",
            message: "Domain name is required",
          },
        });

        return;
      }

      // =====================================================
      // DUPLICATE DOMAIN
      // =====================================================

      const existingOrder = await Order.findOne({
        domainName: data.domainName,
      });

      if (existingOrder) {
        res.status(400).json({
          success: false,
          error: {
            code: "DOMAIN_EXISTS",
            message: "Domain already exists",
          },
        });

        return;
      }

      // =====================================================
      // PROVIDER VALIDATION
      // =====================================================

      const allowedProviders = [
        "Google Workspace",
        "Microsoft 365",
      ];

      if (
        data.provider &&
        !allowedProviders.includes(data.provider)
      ) {
        res.status(400).json({
          success: false,
          message: "Invalid provider",
        });

        return;
      }

      // =====================================================
      // MAP REFERENCES
      // =====================================================

      const mappedData: any = {
        ...data,

        client: customerId,

        hosttypeid:
          data.hosting_plan || undefined,

        subHostTypeId:
          data.hosting_subplan || undefined,

        hoststorageId:
          data.storage || undefined,
      };

      // =====================================================
      // DOMAIN SOURCE MAPPING
      // =====================================================

      if (data.domainSource) {
        if (
          mongoose.Types.ObjectId.isValid(
            data.domainSource
          )
        ) {
          mappedData.domainSource =
            data.domainSource;
        } else {
          const domainSourceDoc =
            await DomainSource.findOne({
              name: data.domainSource,
            });

          if (!domainSourceDoc) {
            res.status(400).json({
              success: false,
              error: {
                code: "INVALID_DOMAIN_SOURCE",
                message: "Domain source not found",
              },
            });

            return;
          }

          mappedData.domainSource =
            domainSourceDoc._id;
        }
      }

      // =====================================================
      // CREATE ORDER
      // =====================================================

      const newOrder = new Order(mappedData);

      const savedOrder = await newOrder.save();

      console.log(
        "✅ ORDER SAVED:",
        savedOrder._id.toString()
      );

      // =====================================================
      // CREATE ORDER ACTIVITY LOG
      // =====================================================

      try {
        const activityLog =
          await ActivityLog.create({
            entityType: "ORDER",

            entityId: savedOrder._id,

            orderId: savedOrder._id,

            domainName:
              savedOrder.domainName,

            action: "CREATED",

            performedBy:
              req.user?._id || null,

            performedByName:
              (req as any).user?.name ||
              "Unknown",

            changes: [],

            description:
              `Domain ${savedOrder.domainName} was created`,

            source:
              req.user?.type === "customer"
                ? "CUSTOMER"
                : "ADMIN",

            ipAddress:
              req.ip,

            userAgent:
              req.get("user-agent") || "",

            isSystemAction:
              false,

            metadata: {
              clientId:
                savedOrder.client || null,

              domainSource:
                savedOrder.domainSource || null,

              provider:
                savedOrder.provider || null,
            },
          });

        console.log(
          "✅ ACTIVITY LOG CREATED:",
          activityLog._id.toString()
        );

      } catch (activityError) {

        console.error(
          "❌ ACTIVITY LOG ERROR:",
          activityError
        );

        // Activity log failure should not hide
        // successful order creation

      }

      // =====================================================
      // SAVE ORDER PLANS
      // =====================================================

      if (
        data.plans &&
        Array.isArray(data.plans)
      ) {
        const plansToSave =
          await Promise.all(
            data.plans.map(
              async (p: any) => {

                // =================================================
                // SERVICE TYPE REQUIRED
                // =================================================

                if (!p.type) {
                  const error: any =
                    new Error(
                      "Service type required"
                    );

                  error.statusCode = 400;

                  throw error;
                }

                let planDoc = null;

                let emailTypeDoc = null;

                // =================================================
                // EMAIL / STORAGE / MS OFFICE
                // =================================================

                if (
                  p.type === "email" ||
                  p.type === "storage" ||
                  p.type === "msoffice"
                ) {
                  // ---------------------------------------------
                  // EMAIL TYPE REQUIRED
                  // ---------------------------------------------

                  if (!p.emailTypeId) {
                    const error: any =
                      new Error(
                        "EmailTypeId is required for email, storage and msoffice"
                      );

                    error.statusCode = 400;

                    throw error;
                  }

                  // ---------------------------------------------
                  // FIND EMAIL TYPE
                  // ---------------------------------------------

                  emailTypeDoc =
                    await TypeEmail.findById(
                      p.emailTypeId
                    );

                  if (!emailTypeDoc) {
                    const error: any =
                      new Error(
                        "Invalid emailTypeId"
                      );

                    error.statusCode = 400;

                    throw error;
                  }

                  // ---------------------------------------------
                  // PLAN OPTIONAL
                  // ---------------------------------------------

                  if (p.planId) {
                    planDoc =
                      await PlanEmail.findById(
                        p.planId
                      );

                    if (!planDoc) {
                      const error: any =
                        new Error(
                          "Invalid planId"
                        );

                      error.statusCode = 400;

                      throw error;
                    }
                  }
                }

                // =================================================
                // HOSTING
                // =================================================

                if (p.type === "hosting") {
                  if (
                    !p.hostingType ||
                    !p.hostingSubType ||
                    !p.storage
                  ) {
                    const error: any =
                      new Error(
                        "Hosting details required"
                      );

                    error.statusCode = 400;

                    throw error;
                  }
                }

                // =================================================
                // WEBSITE
                // =================================================

                if (p.type === "website") {
                  // No additional validation
                }

                // =================================================
                // SSL
                // =================================================

                if (p.type === "ssl") {
                  // No additional validation
                }

                // =================================================
                // RETURN ORDER PLAN
                // =================================================

                return {
                  orderId:
                    savedOrder._id,

                  planId:
                    planDoc?._id || null,

                  emailTypeId:
                    emailTypeDoc?._id || null,

                  hostTypeId:
                    p.hostingType || null,

                  hostSubTypeId:
                    p.hostingSubType || null,

                  storageId:
                    p.storage || null,

                  type:
                    p.type,

                  registrationDate:
                    p.registrationDate
                      ? new Date(
                        p.registrationDate
                      )
                      : new Date(),

                  expiryDate:
                    p.expiryDate
                      ? new Date(
                        p.expiryDate
                      )
                      : new Date(),

                  noOfUsers:
                    Number(
                      p.noOfUsers || 1
                    ),
                };
              }
            )
          );

        // =====================================================
        // INSERT ORDER PLANS
        // =====================================================

        if (plansToSave.length > 0) {
          const savedPlans =
            await OrderPlan.insertMany(
              plansToSave
            );

          console.log(
            "✅ ORDER PLANS SAVED:",
            savedPlans.length
          );

          // ===================================================
          // PLAN ACTIVITY LOG
          // ===================================================

          try {
            const planActivity =
              await ActivityLog.create({
                entityType: "ORDER",

                entityId:
                  savedOrder._id,

                orderId:
                  savedOrder._id,

                domainName:
                  savedOrder.domainName,

                action:
                  "PLAN_CHANGED",

                performedBy:
                  req.user?._id || null,

                performedByName:
                  (req as any).user?.name ||
                  "Unknown",

                changes: [],

                description:
                  `Plans added for order ${savedOrder.domainName}`,

                source:
                  req.user?.type === "customer"
                    ? "CUSTOMER"
                    : "ADMIN",

                ipAddress:
                  req.ip,

                userAgent:
                  req.get("user-agent") || "",

                isSystemAction:
                  false,

                metadata: {
                  plans:
                    savedPlans.map(
                      (plan) => ({
                        planId:
                          plan.planId,

                        emailTypeId:
                          plan.emailTypeId,

                        hostTypeId:
                          plan.hostTypeId,

                        hostSubTypeId:
                          plan.hostSubTypeId,

                        storageId:
                          plan.storageId,

                        type:
                          plan.type,

                        noOfUsers:
                          plan.noOfUsers,
                      })
                    ),
                },
              });

            console.log(
              "✅ PLAN ACTIVITY CREATED:",
              planActivity._id.toString()
            );

          } catch (activityError) {

            console.error(
              "❌ PLAN ACTIVITY ERROR:",
              activityError
            );

          }
        }
      }

      // =====================================================
      // SUCCESS RESPONSE
      // =====================================================

      res.status(201).json({
        success: true,
        data: savedOrder,
      });

    } catch (err: any) {

      console.error(
        "❌ Order creation error:",
        err
      );

      // =====================================================
      // CUSTOM VALIDATION ERROR
      // =====================================================

      if (err.statusCode) {
        res.status(
          err.statusCode
        ).json({
          success: false,
          error: {
            code:
              "VALIDATION_ERROR",
            message:
              err.message,
          },
        });

        return;
      }

      // =====================================================
      // MONGOOSE VALIDATION ERROR
      // =====================================================

      if (
        err.name ===
        "ValidationError"
      ) {
        res.status(400).json({
          success: false,
          error: {
            code:
              "VALIDATION_ERROR",
            message:
              err.message,
          },
        });

        return;
      }

      // =====================================================
      // DUPLICATE ENTRY
      // =====================================================

      if (
        err.code === 11000
      ) {
        res.status(400).json({
          success: false,
          error: {
            code:
              "DUPLICATE_ENTRY",
            message:
              "Domain already exists",
          },
        });

        return;
      }

      // =====================================================
      // INTERNAL SERVER ERROR
      // =====================================================

      res.status(500).json({
        success: false,
        error: {
          code:
            "INTERNAL_SERVER_ERROR",
          message:
            "Something went wrong",
        },
      });
    }
  }
);

// =====================================================
// PUT - UPDATE ORDER
// =====================================================

router.put("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      newCustomer,
      client: existingClient,
      is_customer,
      plans,
      ...rest
    }: any = req.body;

    // =====================================================
    // GET OLD ORDER
    // =====================================================

    const oldOrder = await Order.findById(req.params.id).lean();

    if (!oldOrder) {
      res.status(404).json({
        success: false,
        message: "Order not found",
      });
      return;
    }

    // =====================================================
    // DETERMINE CLIENT
    // =====================================================

    let clientId: mongoose.Types.ObjectId;

    if (is_customer) {
      if (existingClient) {
        const clientIdValue =
          typeof existingClient === "object" && existingClient._id
            ? existingClient._id
            : existingClient;

        if (!mongoose.Types.ObjectId.isValid(clientIdValue)) {
          res.status(400).json({
            success: false,
            message: "Invalid client ID",
          });
          return;
        }

        clientId = new mongoose.Types.ObjectId(clientIdValue);
      } else {
        res.status(400).json({
          success: false,
          message: "Existing client ID is required",
        });
        return;
      }
    } else if (newCustomer?.c_name && newCustomer?.c_email?.length) {
      const { _id, ...customerData } = newCustomer;
      const createdClient = await Client.create(customerData);
      clientId = createdClient._id;
    } else {
      res.status(400).json({
        success: false,
        message: "New customer data is required",
      });
      return;
    }

    // =====================================================
    // PREPARE UPDATE PAYLOAD
    // =====================================================

    const updatePayload: any = {
      ...rest,
      client: clientId,
      hoststorageId: rest.hoststorageId?._id || rest.hoststorageId,
    };

    // =====================================================
    // UPDATE ORDER
    // =====================================================

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      updatePayload,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedOrder) {
      res.status(404).json({
        success: false,
        message: "Order not found",
      });
      return;
    }

    // =====================================================
    // ORDER ACTIVITY LOG
    // =====================================================

    const orderChanges: {
      field: string;
      oldValue?: any;
      newValue?: any;
    }[] = [];

    Object.keys(updatePayload).forEach((field) => {
      const oldValue = (oldOrder as any)[field];
      const newValue = (updatedOrder as any)[field];

      const oldString = String(oldValue ?? "");
      const newString = String(newValue ?? "");

      if (oldString !== newString) {
        orderChanges.push({
          field,
          oldValue,
          newValue,
        });
      }
    });

    if (orderChanges.length > 0) {
      await ActivityLog.create({
        entityType: "ORDER",
        entityId: updatedOrder._id,
        orderId: updatedOrder._id,
        domainName: updatedOrder.domainName,
        action: "UPDATED",
        performedBy: (req as any).user?._id,
        performedByName: (req as any).user?.name,
        changes: orderChanges,
        description: `Order ${updatedOrder.domainName} was updated`,
        source: "ADMIN",
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
        isSystemAction: false,
      });
    }

    // =====================================================
    // HANDLE ORDER PLANS
    // =====================================================

    if (Array.isArray(plans)) {
      // -----------------------------------------------
      // GET EXISTING PLANS BEFORE DELETE
      // -----------------------------------------------

      const oldPlans = await OrderPlan.find({
        orderId: updatedOrder._id,
      })
        .populate("planId")
        .populate("emailTypeId")
        .populate("hostTypeId")
        .populate("hostSubTypeId")
        .populate("storageId")
        .lean();

      // -----------------------------------------------
      // PRESERVE EXISTING PLAN STATUS AND ADMIN LOGIN
      // Match by plan _id when frontend sends it.
      // -----------------------------------------------

      const oldPlanMap = new Map<string, any>();

      oldPlans.forEach((plan: any) => {
        oldPlanMap.set(plan._id.toString(), plan);
      });

      // -----------------------------------------------
      // PREPARE NEW PLANS
      // -----------------------------------------------

      const planDocs = await Promise.all(
        plans.map(async (p: any) => {
          let planId = p.planId?._id || p.planId || null;
          let emailTypeId = p.emailTypeId?._id || p.emailTypeId || null;

          // Find matching existing plan, if its _id was sent.
          const oldPlan = p._id
            ? oldPlanMap.get(String(p._id))
            : undefined;

          // -----------------------------------------------
          // EMAIL / STORAGE / MS OFFICE
          // -----------------------------------------------

          if (
            p.type === "email" ||
            p.type === "storage" ||
            p.type === "msoffice"
          ) {
            if (
              (!planId || !mongoose.Types.ObjectId.isValid(planId)) &&
              p.planName
            ) {
              const plan = await PlanEmail.findOne({
                plan: p.planName,
              });

              if (!plan) {
                throw new Error(`PlanEmail not found: ${p.planName}`);
              }

              planId = plan._id;
            }

            if (
              (!emailTypeId ||
                !mongoose.Types.ObjectId.isValid(emailTypeId)) &&
              p.emailType
            ) {
              const emailType = await TypeEmail.findOne({
                type: p.emailType,
              });

              if (!emailType) {
                throw new Error(`TypeEmail not found: ${p.emailType}`);
              }

              emailTypeId = emailType._id;
            }
          }

          // -----------------------------------------------
          // RESOLVE ID SAFELY
          // -----------------------------------------------

          const toObjectIdOrNull = (value: any) => {
            const id = value?._id || value;

            return id && mongoose.Types.ObjectId.isValid(id)
              ? new mongoose.Types.ObjectId(id)
              : null;
          };

          // -----------------------------------------------
          // PRESERVE EXISTING VALUES WHEN OMITTED
          // -----------------------------------------------

          const adminEmail =
            p.adminEmail !== undefined
              ? p.adminEmail
              : oldPlan?.adminEmail || "";

          const adminPassword =
            p.adminPassword !== undefined
              ? p.adminPassword
              : oldPlan?.adminPassword || "";

          const primaryStatus =
            p.primary_status !== undefined
              ? toObjectIdOrNull(p.primary_status)
              : oldPlan?.primary_status?._id ||
              oldPlan?.primary_status ||
              null;

          const secondaryStatus =
            p.secondary_status !== undefined
              ? toObjectIdOrNull(p.secondary_status)
              : oldPlan?.secondary_status?._id ||
              oldPlan?.secondary_status ||
              null;

          const status =
            p.status !== undefined
              ? toObjectIdOrNull(p.status)
              : oldPlan?.status?._id || oldPlan?.status || null;

          const planTransferredOn =
            p.plan_transferred_on !== undefined
              ? p.plan_transferred_on
                ? new Date(p.plan_transferred_on)
                : undefined
              : oldPlan?.plan_transferred_on;

          const planCancelledOn =
            p.plan_cancelled_on !== undefined
              ? p.plan_cancelled_on
                ? new Date(p.plan_cancelled_on)
                : undefined
              : oldPlan?.plan_cancelled_on;

          // -----------------------------------------------
          // RETURN PLAN DOCUMENT
          // -----------------------------------------------

          return {
            orderId: updatedOrder._id,

            // Preserve original plan document ID when possible.
            ...(oldPlan?._id ? { _id: oldPlan._id } : {}),

            type: p.type,

            planId: toObjectIdOrNull(planId),
            emailTypeId: toObjectIdOrNull(emailTypeId),

            hostTypeId: toObjectIdOrNull(
              p.hostingType !== undefined
                ? p.hostingType
                : oldPlan?.hostTypeId
            ),

            hostSubTypeId: toObjectIdOrNull(
              p.hostingSubType !== undefined
                ? p.hostingSubType
                : oldPlan?.hostSubTypeId
            ),

            storageId: toObjectIdOrNull(
              p.storage !== undefined
                ? p.storage
                : oldPlan?.storageId
            ),

            registrationDate:
              p.registrationDate !== undefined
                ? p.registrationDate
                  ? new Date(p.registrationDate)
                  : null
                : oldPlan?.registrationDate ?? null,

            expiryDate:
              p.expiryDate !== undefined
                ? p.expiryDate
                  ? new Date(p.expiryDate)
                  : null
                : oldPlan?.expiryDate ?? null,

            noOfUsers: Number(
              p.noOfUsers ?? oldPlan?.noOfUsers ?? 1
            ),

            // ADMIN LOGIN
            adminEmail,
            adminPassword,

            // STATUS
            status,
            primary_status: primaryStatus,
            secondary_status: secondaryStatus,

            // TRANSFER / CANCEL DATES
            ...(planTransferredOn
              ? { plan_transferred_on: planTransferredOn }
              : {}),
            ...(planCancelledOn
              ? { plan_cancelled_on: planCancelledOn }
              : {}),

            // WEBSITE / SSL DETAILS
            websiteDetails:
              p.websiteDetails !== undefined
                ? p.websiteDetails
                : oldPlan?.websiteDetails ?? null,

            sslDetails:
              p.sslDetails !== undefined
                ? p.sslDetails
                : oldPlan?.sslDetails ?? null,
          };
        })
      );

      // -----------------------------------------------
      // REPLACE PLANS
      // -----------------------------------------------

      await OrderPlan.deleteMany({
        orderId: updatedOrder._id,
      });

      if (planDocs.length > 0) {
        await OrderPlan.insertMany(planDocs);
      }

      // -----------------------------------------------
      // GET NEW PLANS
      // -----------------------------------------------

      const newPlans = await OrderPlan.find({
        orderId: updatedOrder._id,
      })
        .populate("planId")
        .populate("emailTypeId")
        .populate("hostTypeId")
        .populate("hostSubTypeId")
        .populate("storageId")
        .lean();

      // -----------------------------------------------
      // COMPARE PLAN CHANGES
      // -----------------------------------------------

      const planChanges: {
        field: string;
        oldValue?: any;
        newValue?: any;
      }[] = [];

      const maxPlans = Math.max(oldPlans.length, newPlans.length);

      const getId = (value: any) =>
        String(value?._id || value || "");

      for (let i = 0; i < maxPlans; i++) {
        const oldPlan: any = oldPlans[i];
        const newPlan: any = newPlans[i];

        const planSummary = (plan: any) =>
          plan
            ? {
              plan: plan.planId?.plan || null,
              emailType: plan.emailTypeId?.type || null,
              hostingType: plan.hostTypeId?.name || null,
              hostingSubType: plan.hostSubTypeId?.name || null,
              storage: plan.storageId?.name || null,
              registrationDate: plan.registrationDate || null,
              expiryDate: plan.expiryDate || null,
              noOfUsers: plan.noOfUsers || 0,
              type: plan.type || null,
              adminEmail: plan.adminEmail || "",
              // Do not put plaintext passwords in activity logs.
              adminPassword: undefined,
            }
            : null;

        if (!oldPlan && newPlan) {
          planChanges.push({
            field: `plans[${i}]`,
            oldValue: null,
            newValue: planSummary(newPlan),
          });
          continue;
        }

        if (oldPlan && !newPlan) {
          planChanges.push({
            field: `plans[${i}]`,
            oldValue: planSummary(oldPlan),
            newValue: null,
          });
          continue;
        }

        if (!oldPlan || !newPlan) continue;

        const comparisons: {
          field: string;
          oldValue: any;
          newValue: any;
        }[] = [
            {
              field: "plan",
              oldValue: oldPlan.planId?.plan || null,
              newValue: newPlan.planId?.plan || null,
            },
            {
              field: "emailType",
              oldValue: oldPlan.emailTypeId?.type || null,
              newValue: newPlan.emailTypeId?.type || null,
            },
            {
              field: "hostingType",
              oldValue: oldPlan.hostTypeId?.name || null,
              newValue: newPlan.hostTypeId?.name || null,
            },
            {
              field: "hostingSubType",
              oldValue: oldPlan.hostSubTypeId?.name || null,
              newValue: newPlan.hostSubTypeId?.name || null,
            },
            {
              field: "storage",
              oldValue: oldPlan.storageId?.name || null,
              newValue: newPlan.storageId?.name || null,
            },
            {
              field: "registrationDate",
              oldValue: oldPlan.registrationDate
                ? new Date(oldPlan.registrationDate).getTime()
                : null,
              newValue: newPlan.registrationDate
                ? new Date(newPlan.registrationDate).getTime()
                : null,
            },
            {
              field: "expiryDate",
              oldValue: oldPlan.expiryDate
                ? new Date(oldPlan.expiryDate).getTime()
                : null,
              newValue: newPlan.expiryDate
                ? new Date(newPlan.expiryDate).getTime()
                : null,
            },
            {
              field: "noOfUsers",
              oldValue: Number(oldPlan.noOfUsers || 0),
              newValue: Number(newPlan.noOfUsers || 0),
            },
            {
              field: "type",
              oldValue: oldPlan.type || null,
              newValue: newPlan.type || null,
            },
            {
              field: "adminEmail",
              oldValue: oldPlan.adminEmail || "",
              newValue: newPlan.adminEmail || "",
            },
            {
              field: "status",
              oldValue: getId(oldPlan.status),
              newValue: getId(newPlan.status),
            },
            {
              field: "primary_status",
              oldValue: getId(oldPlan.primary_status),
              newValue: getId(newPlan.primary_status),
            },
            {
              field: "secondary_status",
              oldValue: getId(oldPlan.secondary_status),
              newValue: getId(newPlan.secondary_status),
            },
          ];

        comparisons.forEach((change) => {
          if (String(change.oldValue ?? "") !== String(change.newValue ?? "")) {
            planChanges.push({
              field: `plans[${i}].${change.field}`,
              oldValue: change.oldValue,
              newValue: change.newValue,
            });
          }
        });
      }

      // -----------------------------------------------
      // CREATE PLAN ACTIVITY LOG
      // -----------------------------------------------

      if (planChanges.length > 0) {
        await ActivityLog.create({
          entityType: "ORDER",
          entityId: updatedOrder._id,
          orderId: updatedOrder._id,
          domainName: updatedOrder.domainName,
          action: "PLAN_CHANGED",
          performedBy: (req as any).user?._id,
          performedByName: (req as any).user?.name,
          changes: planChanges,
          description: `Plans updated for order ${updatedOrder.domainName}`,
          source: "ADMIN",
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
          isSystemAction: false,
        });
      }
    }

    // =====================================================
    // POPULATE FOR RESPONSE
    // =====================================================

    const populatedOrder = await Order.findById(updatedOrder._id)
      .populate("client")
      .populate({
        path: "hoststorageId",
        populate: [
          { path: "hostType" },
          { path: "hostSubType" },
        ],
      });

    // =====================================================
    // SUCCESS RESPONSE
    // =====================================================

    res.status(200).json({
      success: true,
      data: populatedOrder,
    });
  } catch (err: any) {
    console.error("Error updating order:", err);

    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});
// router.put("/:id", async (req: Request<{ id: string }, {}, Partial<IOrder>>, res: Response): Promise<void> => {
//   try {
//     const updatedOrder = await mongoose.model<IOrder>("Order").findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
//     if (!updatedOrder) {
//       res.status(404).json({ success: false, message: "Order not found" });
//       return;
//     }
//     res.status(200).json({ success: true, data: updatedOrder });
//   } catch (err) {
//     res.status(500).json({ success: false, error: (err as Error).message });
//   }
// });

// DELETE order
router.delete("/:id", async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const deletedOrder = await mongoose.model<IOrder>("Order").findByIdAndDelete(req.params.id);
    if (!deletedOrder) {
      res.status(404).json({ success: false, message: "Order not found" });
      return;
    }
    res.status(200).json({ success: true, message: "Order deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});


// ✅ GET orders by provider
// ✅ GET orders by provider
router.get("/provider/:name", async (req, res) => {
  try {
    const provider = req.params.name;

    // 1️⃣ Fetch orders by provider
    let orders = await mongoose
      .model("Order")
      .find({ provider })
      .populate({
        path: "client",
        select:
          "c_name c_email c_phone c_company c_address c_city c_state c_country c_zipCode",
        populate: [
          {
            path: "c_country",
            model: "Country",
            select: "name code"
          },
          {
            path: "c_state",
            model: "State",
            select: "name stateCode"
          }
        ]
      })
      .populate("customer")
      .lean();

    // 2️⃣ Attach email plans
    const attachEmailPlans = async (orders: any[]) => {
      return Promise.all(
        orders.map(async (order) => {
          const emailPlans = await mongoose
            .model("OrderPlan")
            .find({ orderId: order._id, type: "email" })
            .populate("planId")
            .populate("emailTypeId")
            .lean();

          return {
            ...order,
            emailPlans,
          };
        })
      );
    };

    // orders = await attachEmailPlans(orders);

    // 3️⃣ Optional: Update domain statuses like in / route
    const today = new Date();
    orders = await Promise.all(
      orders.map(async (order) => {
        let newStatus = "";
        if (order.expiryDate) {
          newStatus =
            new Date(order.expiryDate) < today ? "EXPIRED" : "ACTIVE";
        }
        if (order.status !== newStatus) {
          await mongoose.model("Order").updateOne(
            { _id: order._id },
            { status: newStatus }
          );
          order.status = newStatus;
        }
        return order;
      })
    );

    // 4️⃣ Return response
    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ success: false, error: message });
  }
});


router.get(
  "/customer_order_details/:customerId",
  async (req: Request, res: Response) => {
    try {
      // ========================================================
      // 1. CUSTOMER ID
      // ========================================================

      const { customerId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(customerId)) {
        return res.status(400).json({
          status: "ERROR",
          message: "Invalid customer ID",
        });
      }

      // ========================================================
      // 2. CLIENT
      // ========================================================

      const client = await Client.findById(customerId)
        .select(`
          c_name
          c_email
          c_mobilePhone
          c_countryCode
          c_company
          c_address
          c_city
          c_zipCode
          c_state
          c_country
        `)
        .lean();

      if (!client) {
        return res.status(404).json({
          status: "ERROR",
          message: "Customer not found",
        });
      }

      // ========================================================
      // 3. HELPERS
      // ========================================================

      const getName = async (
        value: any,
        model: any
      ) => {
        if (!value) return undefined;

        // Already populated
        if (
          typeof value === "object" &&
          value.name
        ) {
          return value.name;
        }

        const doc = await model
          .findById(value)
          .lean();

        return doc?.name;
      };

      // ========================================================
      // STATE / COUNTRY
      // ========================================================

      const stateName = await getName(
        client.c_state,
        State
      );

      const countryName = await getName(
        client.c_country,
        Country
      );

      const clientData = {
        ...client,

        c_state_name:
          stateName,

        c_country_name:
          countryName,
      };

      // ========================================================
      // 4. TODAY
      // ========================================================

      const today = new Date();

      today.setHours(
        0,
        0,
        0,
        0
      );

      // ========================================================
      // 5. ORDER STATUSES
      // ========================================================

      const activeOrderStatus =
        await Status.findOne({
          type: "order",
          code: "ACTIVE",
          is_active: true,
        }).select(
          "_id name code type is_active"
        );

      const expiredOrderStatus =
        await Status.findOne({
          type: "order",
          code: "EXPIRED",
          is_active: true,
        }).select(
          "_id name code type is_active"
        );

      if (
        !activeOrderStatus ||
        !expiredOrderStatus
      ) {
        throw new Error(
          "ACTIVE or EXPIRED order status not found"
        );
      }

      // ========================================================
      // 6. PLAN STATUSES
      // ========================================================

      const activePlanStatus =
        await Status.findOne({
          type: "plan",
          code: "ACTIVE",
          is_active: true,
        }).select(
          "_id name code type is_active"
        );

      const expiredPlanStatus =
        await Status.findOne({
          type: "plan",
          code: "EXPIRED",
          is_active: true,
        }).select(
          "_id name code type is_active"
        );

      if (
        !activePlanStatus ||
        !expiredPlanStatus
      ) {
        throw new Error(
          "ACTIVE or EXPIRED plan status not found"
        );
      }

      // ========================================================
      // 7. ARCHIVED STATUSES
      // ========================================================

      const redemptionStatusSafe =
        await Status.findOne({
          type: "domain",

          $or: [
            {
              code:
                "REDEMPTION PERIOD",
            },
            {
              code:
                "REDEMPTION_PERIOD",
            },
            {
              name:
                "REDEMPTION PERIOD",
            },
          ],

          is_active: true,
        }).select(
          "_id name code type is_active"
        );

      const pendingDeleteStatusSafe =
        await Status.findOne({
          type: "domain",

          $or: [
            {
              code:
                "PENDING DELETE RESTORABLE",
            },
            {
              code:
                "PENDING_DELETE_RESTORABLE",
            },
            {
              name:
                "PENDING DELETE RESTORABLE",
            },
          ],

          is_active: true,
        }).select(
          "_id name code type is_active"
        );

      // ========================================================
      // 8. LOAD CUSTOMER ORDERS
      // ========================================================

      let orders: any[] =
        await Order.find({
          client: customerId,
        })
          .select({
            domainName: 1,
            order_status: 1,
            domain_status: 1,
            archived_status: 1,
            is_active: 1,
            dns_flag: 1,
            client: 1,
            managedBy: 1,
            registrationDate: 1,
            expiryDate: 1,
            lockStatus: 1,
            domainSource: 1,

            status: 1,
            email_expiryDate: 1,
            createdAt: 1,
          })

          // ====================================================
          // DOMAIN SOURCE
          // ====================================================

          .populate({
            path: "domainSource",
            select:
              "_id name code image",
          })

          // ====================================================
          // ORDER STATUS
          // ====================================================

          .populate({
            path: "order_status",
            select:
              "_id name code type is_active",
          })

          // ====================================================
          // DOMAIN STATUS
          // ====================================================

          .populate({
            path: "domain_status",
            select:
              "_id name code type is_active",
          })

          // ====================================================
          // ARCHIVED STATUS
          // ====================================================

          .populate({
            path: "archived_status",
            select:
              "_id name code type is_active",
          })

          .sort({
            createdAt: -1,
          })

          .lean();

      // ========================================================
      // 9. GET PLANS
      // ========================================================

      const orderIds = orders.map(
        (order: any) =>
          order._id
      );

      const plans =
        orderIds.length
          ? await OrderPlan.find({
            orderId: {
              $in: orderIds,
            },
          })

            // ------------------------------------------------
            // EMAIL TYPE
            // ------------------------------------------------

            .populate({
              path:
                "emailTypeId",
              select:
                "name image",
            })

            // ------------------------------------------------
            // HOST TYPE
            // ------------------------------------------------

            .populate({
              path:
                "hostTypeId",
              select:
                "type",
            })

            // ------------------------------------------------
            // HOST SUB TYPE
            // ------------------------------------------------

            .populate({
              path:
                "hostSubTypeId",
              select:
                "name",
            })

            // ------------------------------------------------
            // STORAGE
            // ------------------------------------------------

            .populate({
              path:
                "storageId",
              select:
                "name storage",
            })

            // ------------------------------------------------
            // PRIMARY STATUS
            // ------------------------------------------------

            .populate({
              path:
                "primary_status",
              select:
                "_id name code type is_active",
            })

            // ------------------------------------------------
            // SECONDARY STATUS
            // ------------------------------------------------

            .populate({
              path:
                "secondary_status",
              select:
                "_id name code type is_active",
            })

            .select(`
                _id
                orderId
                type
                registrationDate
                expiryDate
                emailTypeId
                planId
                hostTypeId
                hostSubTypeId
                storageId
                noOfUsers
                primary_status
                secondary_status
              `)

            .lean()
          : [];

      // ========================================================
      // 10. PLAN MAP
      // ========================================================

      const planMap =
        new Map<
          string,
          any[]
        >();

      plans.forEach(
        (plan: any) => {
          const key =
            plan.orderId.toString();

          if (
            !planMap.has(key)
          ) {
            planMap.set(
              key,
              []
            );
          }

          planMap
            .get(key)!
            .push({
              _id:
                plan._id,

              type:
                plan.type,

              registrationDate:
                plan.registrationDate ||
                null,

              expiryDate:
                plan.expiryDate ||
                null,

              noOfUsers:
                plan.noOfUsers ||
                0,

              emailType:
                plan.emailTypeId?.name ||
                null,

              emailTypeImage:
                plan.emailTypeId?.image ||
                null,

              planId:
                plan.planId ||
                null,

              hostType:
                plan.hostTypeId
                  ? {
                    _id:
                      plan.hostTypeId._id,

                    type:
                      plan.hostTypeId.type,
                  }
                  : null,

              hostSubType:
                plan.hostSubTypeId
                  ? {
                    _id:
                      plan.hostSubTypeId._id,

                    name:
                      plan.hostSubTypeId.name,
                  }
                  : null,

              storage:
                plan.storageId
                  ? {
                    _id:
                      plan.storageId._id,

                    name:
                      plan.storageId.name ||
                      plan.storageId.storage ||
                      null,
                  }
                  : null,

              primary_status:
                plan.primary_status ||
                null,

              secondary_status:
                plan.secondary_status ||
                null,
            });
        }
      );

      // ========================================================
      // 11. ATTACH PLANS TO ORDERS
      // ========================================================

      orders = orders.map(
        (order: any) => ({
          ...order,

          // ----------------------------------------------------
          // DOMAIN SOURCE IMAGE
          // ----------------------------------------------------

          domainSource:
            order.domainSource
              ? {
                ...order.domainSource,

                image:
                  order.domainSource
                    .image
                    ? order.domainSource.image.startsWith(
                      "/uploads"
                    )
                      ? order.domainSource.image
                      : `/uploads/domainsources/${order.domainSource.image}`
                    : null,
              }
              : null,

          // ----------------------------------------------------
          // PLANS
          // ----------------------------------------------------

          Plans:
            planMap.get(
              order._id.toString()
            ) || [],
        })
      );

      // ========================================================
      // 12. SERVICE AVAILABILITY
      // ========================================================

      orders =
        orders.filter(
          (order: any) => {

            // --------------------------------------------------
            // DOMAIN SERVICE
            // --------------------------------------------------

            const hasDomainService =
              !!order.domainSource;

            // --------------------------------------------------
            // PLANS
            // --------------------------------------------------

            const plans =
              Array.isArray(
                order.Plans
              )
                ? order.Plans
                : [];

            const hasPlans =
              plans.length > 0;

            // --------------------------------------------------
            // NO SERVICE
            // --------------------------------------------------

            if (
              !hasDomainService &&
              !hasPlans
            ) {
              return false;
            }

            // ==================================================
            // DOMAIN AVAILABLE
            // ==================================================

            let domainAvailable =
              false;

            if (
              hasDomainService
            ) {
              domainAvailable =
                !isTransferredOrCancelled(
                  order.domain_status
                );
            }

            // ==================================================
            // ANY PLAN AVAILABLE
            // ==================================================

            let planAvailable =
              false;

            if (
              hasPlans
            ) {
              planAvailable =
                plans.some(
                  (plan: any) => {

                    return (
                      !isTransferredOrCancelled(
                        plan.primary_status
                      )
                    );
                  }
                );
            }

            // ==================================================
            // AT LEAST ONE SERVICE AVAILABLE
            // ==================================================

            if (
              domainAvailable ||
              planAvailable
            ) {
              return true;
            }

            // ==================================================
            // ALL SERVICES TRANSFERRED/CANCELLED
            // ==================================================

            return false;
          }
        );

      // ========================================================
      // 13. UPDATE PLAN PRIMARY STATUS
      // BASED ON PLAN expiryDate
      // ========================================================

      const updatePlanStatuses =
        async (
          orderList: any[]
        ) => {

          if (
            !orderList.length
          ) {
            return orderList;
          }

          const bulkOps: any[] =
            [];

          for (
            const order of orderList
          ) {

            const orderPlans =
              Array.isArray(
                order.Plans
              )
                ? order.Plans
                : [];

            for (
              const plan of orderPlans
            ) {

              // ------------------------------------------------
              // TRANSFERRED / CANCELLED
              // DO NOT OVERWRITE
              // ------------------------------------------------

              if (
                isTransferredOrCancelled(
                  plan.primary_status
                )
              ) {
                continue;
              }

              // ------------------------------------------------
              // NO EXPIRY
              // ------------------------------------------------

              if (
                !plan.expiryDate
              ) {
                continue;
              }

              const expiry =
                new Date(
                  plan.expiryDate
                );

              expiry.setHours(
                0,
                0,
                0,
                0
              );

              // ------------------------------------------------
              // ACTIVE / EXPIRED
              // ------------------------------------------------

              const isExpired =
                expiry < today;

              const newStatus =
                isExpired
                  ? expiredPlanStatus
                  : activePlanStatus;

              if (
                !newStatus?._id
              ) {
                continue;
              }

              const currentStatusId =
                plan.primary_status?._id
                  ?.toString() ||
                plan.primary_status
                  ?.toString() ||
                "";

              const newStatusId =
                newStatus._id.toString();

              // ------------------------------------------------
              // UPDATE DATABASE
              // ------------------------------------------------

              if (
                currentStatusId !==
                newStatusId
              ) {

                bulkOps.push({
                  updateOne: {
                    filter: {
                      _id:
                        plan._id,
                    },

                    update: {
                      $set: {
                        primary_status:
                          newStatus._id,
                      },
                    },
                  },
                });

                // ------------------------------------------------
                // LOCAL RESPONSE
                // ------------------------------------------------

                plan.primary_status = {
                  _id:
                    newStatus._id,

                  name:
                    newStatus.name,

                  code:
                    newStatus.code,

                  type:
                    newStatus.type,

                  is_active:
                    newStatus.is_active,
                };
              }
            }
          }

          // ====================================================
          // BULK UPDATE
          // ====================================================

          if (
            bulkOps.length
          ) {
            await OrderPlan.bulkWrite(
              bulkOps
            );
          }

          return orderList;
        };

      // ========================================================
      // 14. UPDATE ORDER STATUS
      // ORDER EXPIRY OR PLAN EXPIRY
      // ========================================================

      const updateOrderStatuses =
        async (
          orderList: any[]
        ) => {

          const bulkOps: any[] =
            [];

          orderList.forEach(
            (order: any) => {

              // ------------------------------------------------
              // TRANSFERRED / CANCELLED ORDER
              // DO NOT OVERWRITE
              // ------------------------------------------------

              if (
                isTransferredOrCancelled(
                  order.order_status
                )
              ) {
                return;
              }

              let isExpired =
                false;

              // ------------------------------------------------
              // ORDER EXPIRY
              // ------------------------------------------------

              if (
                order.expiryDate
              ) {

                const expiry =
                  new Date(
                    order.expiryDate
                  );

                expiry.setHours(
                  0,
                  0,
                  0,
                  0
                );

                if (
                  expiry < today
                ) {
                  isExpired = true;
                }
              }

              // ------------------------------------------------
              // PLAN EXPIRY
              // ------------------------------------------------

              const orderPlans =
                Array.isArray(
                  order.Plans
                )
                  ? order.Plans
                  : [];

              const planExpired =
                orderPlans.some(
                  (plan: any) => {

                    // ------------------------------------------
                    // IMPORTANT:
                    // CANCELLED / TRANSFERRED PLAN
                    // MUST NOT MAKE ORDER EXPIRED
                    // ------------------------------------------

                    if (
                      isTransferredOrCancelled(
                        plan.primary_status
                      )
                    ) {
                      return false;
                    }

                    // ------------------------------------------
                    // NO EXPIRY
                    // ------------------------------------------

                    if (
                      !plan.expiryDate
                    ) {
                      return false;
                    }

                    const expiry =
                      new Date(
                        plan.expiryDate
                      );

                    expiry.setHours(
                      0,
                      0,
                      0,
                      0
                    );

                    return (
                      expiry < today
                    );
                  }
                );

              if (
                planExpired
              ) {
                isExpired = true;
              }

              // ------------------------------------------------
              // NEW STATUS
              // ------------------------------------------------

              const newStatus =
                isExpired
                  ? expiredOrderStatus
                  : activeOrderStatus;

              if (
                !newStatus?._id
              ) {
                return;
              }

              const currentStatusId =
                order.order_status?._id
                  ?.toString() ||
                order.order_status
                  ?.toString() ||
                "";

              const newStatusId =
                newStatus._id.toString();

              // ------------------------------------------------
              // UPDATE DATABASE
              // ------------------------------------------------

              if (
                currentStatusId !==
                newStatusId
              ) {

                bulkOps.push({
                  updateOne: {
                    filter: {
                      _id:
                        order._id,
                    },

                    update: {
                      $set: {
                        order_status:
                          newStatus._id,
                      },
                    },
                  },
                });

                // ------------------------------------------------
                // LOCAL RESPONSE
                // ------------------------------------------------

                order.order_status = {
                  _id:
                    newStatus._id,

                  name:
                    newStatus.name,

                  code:
                    newStatus.code,

                  type:
                    newStatus.type,

                  is_active:
                    newStatus.is_active,
                };
              }
            }
          );

          // ====================================================
          // BULK UPDATE
          // ====================================================

          if (
            bulkOps.length
          ) {
            await Order.bulkWrite(
              bulkOps
            );
          }

          return orderList;
        };

      // ========================================================
      // 15. UPDATE ARCHIVED STATUS
      // 36-65 / 66+
      // ========================================================

      const updateArchivedStatuses =
        async (
          orderList: any[]
        ) => {

          const bulkOps: any[] =
            [];

          orderList.forEach(
            (order: any) => {

              // ------------------------------------------------
              // NO EXPIRY
              // ------------------------------------------------

              if (
                !order.expiryDate
              ) {
                return;
              }

              const expiry =
                new Date(
                  order.expiryDate
                );

              expiry.setHours(
                0,
                0,
                0,
                0
              );

              const diffMs =
                today.getTime() -
                expiry.getTime();

              const expiredDays =
                Math.floor(
                  diffMs /
                  (
                    1000 *
                    60 *
                    60 *
                    24
                  )
                );

              let newArchivedStatus:
                any = null;

              // ------------------------------------------------
              // TODAY / FUTURE
              // ------------------------------------------------

              if (
                expiredDays <= 0
              ) {

                newArchivedStatus =
                  null;
              }

              // ------------------------------------------------
              // 1-35 DAYS
              // ------------------------------------------------

              else if (
                expiredDays <= 35
              ) {

                newArchivedStatus =
                  null;
              }

              // ------------------------------------------------
              // 36-65 DAYS
              // ------------------------------------------------

              else if (
                expiredDays <= 65
              ) {

                newArchivedStatus =
                  redemptionStatusSafe;
              }

              // ------------------------------------------------
              // 66+ DAYS
              // ------------------------------------------------

              else {

                newArchivedStatus =
                  pendingDeleteStatusSafe;
              }

              const currentArchivedId =
                order.archived_status?._id
                  ?.toString() ||
                order.archived_status
                  ?.toString() ||
                null;

              const newArchivedId =
                newArchivedStatus?._id
                  ?.toString() ||
                null;

              // ------------------------------------------------
              // UPDATE ONLY IF DIFFERENT
              // ------------------------------------------------

              if (
                currentArchivedId !==
                newArchivedId
              ) {

                bulkOps.push({
                  updateOne: {
                    filter: {
                      _id:
                        order._id,
                    },

                    update: {
                      $set: {
                        archived_status:
                          newArchivedStatus
                            ? newArchivedStatus._id
                            : null,
                      },
                    },
                  },
                });

                // ------------------------------------------------
                // LOCAL RESPONSE
                // ------------------------------------------------

                order.archived_status =
                  newArchivedStatus;
              }
            }
          );

          // ====================================================
          // BULK UPDATE
          // ====================================================

          if (
            bulkOps.length
          ) {
            await Order.bulkWrite(
              bulkOps
            );
          }

          return orderList;
        };

      // ========================================================
      // 16. PLAN STATUS UPDATE
      // ========================================================

      orders =
        await updatePlanStatuses(
          orders
        );

      // ========================================================
      // 17. ORDER STATUS UPDATE
      // ========================================================

      orders =
        await updateOrderStatuses(
          orders
        );

      // ========================================================
      // 18. ARCHIVED STATUS UPDATE
      // ========================================================

      orders =
        await updateArchivedStatuses(
          orders
        );

      // ========================================================
      // 19. NORMAL ORDER AGE FILTER
      //
      // TODAY/FUTURE  -> SHOW
      // 1-35 DAYS     -> SHOW
      // 36+ DAYS      -> HIDE
      // ========================================================

      orders =
        orders.filter(
          (order: any) => {

            // --------------------------------------------------
            // NO ORDER EXPIRY
            // --------------------------------------------------

            if (
              !order.expiryDate
            ) {
              return true;
            }

            const expiry =
              new Date(
                order.expiryDate
              );

            expiry.setHours(
              0,
              0,
              0,
              0
            );

            const diffMs =
              today.getTime() -
              expiry.getTime();

            const expiredDays =
              Math.floor(
                diffMs /
                (
                  1000 *
                  60 *
                  60 *
                  24
                )
              );

            // --------------------------------------------------
            // TODAY / FUTURE
            // --------------------------------------------------

            if (
              expiredDays <= 0
            ) {
              return true;
            }

            // --------------------------------------------------
            // 1-35 DAYS
            // --------------------------------------------------

            if (
              expiredDays <= 35
            ) {
              return true;
            }

            // --------------------------------------------------
            // 36+ DAYS
            // --------------------------------------------------

            return false;
          }
        );

      // ========================================================
      // 20. EMAIL EXPIRY
      // ========================================================

      orders =
        await Promise.all(
          orders.map(
            async (
              order: any
            ) => {

              const emailPlans =
                await OrderPlan.find({
                  orderId:
                    order._id,

                  type:
                    "email",
                })
                  .select(
                    "expiryDate"
                  )
                  .lean();

              const emailExpiryDates =
                emailPlans
                  .map(
                    (item: any) =>
                      item.expiryDate
                  )
                  .filter(Boolean);

              return {
                ...order,

                // ------------------------------------------------
                // DOMAIN EXPIRY
                // ------------------------------------------------

                domainExpiryDate:
                  order.expiryDate ||
                  null,

                // ------------------------------------------------
                // EMAIL EXPIRY
                // ------------------------------------------------

                emailExpiryDate:
                  emailExpiryDates.length
                    ? emailExpiryDates
                    : order.email_expiryDate
                      ? [
                        order.email_expiryDate,
                      ]
                      : [],
              };
            }
          )
        );

      // ========================================================
      // 21. FINAL RESPONSE
      // ========================================================

      return res.json({
        status: "SUCCESS",

        client:
          clientData,

        orders,
      });

    } catch (
    error: any
    ) {

      console.error(
        "================================="
      );

      console.error(
        "❌ Customer Order Details Error:",
        error
      );

      console.error(
        "================================="
      );

      return res.status(500).json({
        status: "ERROR",

        message:
          error?.message ||
          "Server error",
      });
    }
  }
);
/**
 * GET CUSTOMER CANCELLED / TRANSFERRED ORDERS
 *
 * GET /customer_archived_orders/:customerId
 */

/**
 * ============================================================
 * GET CUSTOMER CANCELLED / TRANSFERRED ORDERS
 * ============================================================
 *
 * GET /customer_archived_orders/:customerId
 *
 * Returns only orders belonging to the customer where:
 *
 * order_status = CANCELLED / TRANSFERRED
 * OR
 * domain_status = CANCELLED / TRANSFERRED
 *
 * Plans belonging to those orders are also returned.
 * ============================================================
 */

router.get(
  "/customer_archived_orders/:customerId",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { customerId } = req.params;

      // ========================================================
      // 1. VALIDATE CUSTOMER ID
      // ========================================================

      if (!mongoose.Types.ObjectId.isValid(customerId)) {
        res.status(400).json({
          success: false,
          message: "Invalid customer ID",
        });
        return;
      }

      const customerObjectId =
        new mongoose.Types.ObjectId(customerId);

      // ========================================================
      // 2. FIND CUSTOMER
      // ========================================================

      const client = await Client.findById(customerObjectId).lean();

      if (!client) {
        res.status(404).json({
          success: false,
          message: "Customer not found",
        });
        return;
      }

      // ========================================================
      // 3. FIND CANCELLED / TRANSFERRED STATUS IDs
      // ========================================================
      //
      // IMPORTANT:
      // order_status and domain_status are ObjectId fields.
      // Therefore we cannot query:
      //
      // { domain_status: "CANCELLED" }
      //
      // We first find the corresponding status documents.
      // ========================================================

      const cancelledTransferredStatuses =
        await Status.find({
          name: {
            $in: ["CANCELLED", "TRANSFERRED"],
          },
        })
          .select("_id name type")
          .lean();

      // ========================================================
      // 4. SEPARATE ORDER STATUS AND DOMAIN STATUS
      // ========================================================

      const orderStatusIds =
        cancelledTransferredStatuses
          .filter(
            (status: any) =>
              status.type === "order"
          )
          .map(
            (status: any) => status._id
          );

      const domainStatusIds =
        cancelledTransferredStatuses
          .filter(
            (status: any) =>
              status.type === "domain"
          )
          .map(
            (status: any) => status._id
          );

      console.log(
        "Cancelled / Transferred statuses:",
        cancelledTransferredStatuses
      );

      console.log(
        "Order status IDs:",
        orderStatusIds
      );

      console.log(
        "Domain status IDs:",
        domainStatusIds
      );

      // ========================================================
      // 5. FIND CUSTOMER ORDERS
      // ========================================================

      const orders = await Order.find({
        client: customerObjectId,

        $or: [
          {
            order_status: {
              $in: orderStatusIds,
            },
          },
          {
            domain_status: {
              $in: domainStatusIds,
            },
          },
        ],
      })
        .populate("domainSource")
        .populate("order_status")
        .populate("domain_status")
        .populate("archived_status")
        .lean();

      // ========================================================
      // 6. GET ORDER IDS
      // ========================================================

      const orderIds = orders.map(
        (order: any) => order._id
      );

      // ========================================================
      // 7. GET PLANS FOR THESE ORDERS
      // ========================================================

      let plans: any[] = [];

      if (orderIds.length > 0) {
        plans = await OrderPlan.find({
          orderId: {
            $in: orderIds,
          },
        })
          .populate("emailTypeId")
          .populate("hostTypeId")
          .populate("hostSubTypeId")
          .populate("storageId")
          .populate("primary_status")
          .populate("secondary_status")
          .lean();
      }

      // ========================================================
      // 8. CREATE PLAN MAP
      // ========================================================

      const planMap = new Map<string, any[]>();

      for (const plan of plans) {
        const orderId = String(
          plan.orderId
        );

        if (!planMap.has(orderId)) {
          planMap.set(orderId, []);
        }

        planMap
          .get(orderId)!
          .push(plan);
      }

      // ========================================================
      // 9. ATTACH PLANS TO ORDERS
      // ========================================================

      const result = orders.map(
        (order: any) => ({
          ...order,

          Plans:
            planMap.get(
              String(order._id)
            ) || [],
        })
      );

      // ========================================================
      // 10. RETURN RESPONSE
      // ========================================================

      res.status(200).json({
        success: true,

        message:
          "Customer cancelled / transferred orders fetched successfully",

        client,

        totalOrders: result.length,

        orders: result,
      });
    } catch (error: any) {
      // ========================================================
      // ERROR HANDLING
      // ========================================================

      console.error(
        "Error fetching customer cancelled / transferred orders:",
        error
      );

      res.status(500).json({
        success: false,

        message:
          "Failed to fetch customer cancelled / transferred orders",

        error: error.message,
      });
    }
  }
);
router.get("/orderplans/:orderid", async (req: Request, res: Response): Promise<void> => {
  try {
    const orderplans = await OrderPlan.find({ orderId: req.params.orderid });

    if (!orderplans || orderplans.length === 0) {
      res.status(404).json({ error: "No order plans found for this order" });
      return;
    }

    res.json(orderplans);
  } catch (err) {
    console.error("Error fetching order plans:", err);
    res.status(500).json({ error: "Failed to fetch order plans" });
  }
});
export default router;
