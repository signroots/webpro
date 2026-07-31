import express, { Request, Response } from "express";
import Order from "../models/Order";
import Customer from "../models/Customer";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import DomainSource from "../models/DomainSource";
const router = express.Router();

// GET /api/dashboard/metrics
router.get(
  "/metrics",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {

    try {


      // ================= DOMAIN SOURCES =================


      const cloudflareSource = await DomainSource.findOne({
        name: {
          $regex: "cloudflare",
          $options: "i"
        }
      });


      const resellerclubSource = await DomainSource.findOne({
        name: {
          $regex: "resellerclub",
          $options: "i"
        }
      });



      // -------------------- TOTAL ORDERS --------------------


      const totalOrders = await Order.countDocuments();



      // -------------------- CLOUDFLARE REGISTRAR ORDERS --------------------


      const registrarOrder =
        cloudflareSource
          ?
          await Order.countDocuments({
            domainSource: cloudflareSource._id,
            domain_flag: false
          })
          :
          0;



      // -------------------- RESELLER CLUB ORDERS --------------------


      const resellerOrder =
        resellerclubSource
          ?
          await Order.countDocuments({
            domainSource: resellerclubSource._id
          })
          :
          0;




      // -------------------- DNS ORDERS --------------------


      const dnsOrders =
        cloudflareSource
          ?
          await Order.countDocuments({
            domainSource: cloudflareSource._id,
            domain_flag: true
          })
          :
          0;




      // -------------------- TOTAL CUSTOMERS --------------------


      const totalCustomers =
        await Customer.countDocuments();




      // ================= RENEWALS =================


      const now = new Date();



      // Previous Month

      const prevMonthStart =
        new Date(
          now.getFullYear(),
          now.getMonth() - 1,
          1
        );


      const prevMonthEnd =
        new Date(
          now.getFullYear(),
          now.getMonth(),
          0,
          23,
          59,
          59,
          999
        );




      // Current Month

      const currentMonthStart =
        new Date(
          now.getFullYear(),
          now.getMonth(),
          1
        );


      const currentMonthEnd =
        new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          0,
          23,
          59,
          59,
          999
        );




      // Next Month


      const nextMonthStart =
        new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          1
        );


      const nextMonthEnd =
        new Date(
          now.getFullYear(),
          now.getMonth() + 2,
          0,
          23,
          59,
          59,
          999
        );





      // -------------------- RENEWAL COUNTS --------------------


      const prevMonthRenewals =
        await Order.countDocuments({

          expiryDate:{
            $gte:prevMonthStart,
            $lte:prevMonthEnd
          }

        });




      const currentMonthRenewals =
        await Order.countDocuments({

          expiryDate:{
            $gte:currentMonthStart,
            $lte:currentMonthEnd
          }

        });




      const nextMonthRenewals =
        await Order.countDocuments({

          expiryDate:{
            $gte:nextMonthStart,
            $lte:nextMonthEnd
          }

        });







      return res.json({

        success:true,


        data:{


          totalOrders,


          registrarOrder,


          resellerOrder,


          dnsOrders,


          totalCustomers,



          renewals:{


            previousMonth:
              prevMonthRenewals,


            currentMonth:
              currentMonthRenewals,


            nextMonth:
              nextMonthRenewals


          }


        }


      });




    }
    catch(error){


      console.error(
        "Dashboard metrics error:",
        error
      );


      return res.status(500).json({

        success:false,

        message:"Failed to fetch metrics"

      });


    }

  }
);

export default router;
