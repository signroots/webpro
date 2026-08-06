import express, { Request, Response } from "express";
import { IOrder,Order } from "../models/Order";
import mongoose from "mongoose";
import { authMiddleware,AuthRequest  } from "../middleware/auth"; 
import User from "../models/User";
import  { IUserType } from "../models/UserType"
import DomainSource from "../models/DomainSource";
import Client from "../models/Client";
import  {OrderPlan } from "../models/OrderPlan";
import { PlanEmail } from "../models/PlanEmail";
import { TypeEmail } from "../models/TypeEmail";
import State from "../models/State";
import Country from "../models/Country";
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
          success:false,
          error:"Admin access required",
        });

      }


      const now = new Date();



      // ================= MONTH RANGE =================


      const startOfCurrentMonth = new Date(
        now.getFullYear(),
        now.getMonth(),
        1,
        0,0,0
      );


      const endOfCurrentMonth = new Date(
        now.getFullYear(),
        now.getMonth()+1,
        0,
        23,59,59
      );



      const startOfPrevMonth = new Date(
        now.getFullYear(),
        now.getMonth()-1,
        1,
        0,0,0
      );


      const endOfPrevMonth = new Date(
        now.getFullYear(),
        now.getMonth(),
        0,
        23,59,59
      );



      const startOfNextMonth = new Date(
        now.getFullYear(),
        now.getMonth()+1,
        1,
        0,0,0
      );


      const endOfNextMonth = new Date(
        now.getFullYear(),
        now.getMonth()+2,
        0,
        23,59,59
      );





      // ================= MONTH PARAM =================


      const month =
        (_req.query.month as string) || "current";



      let startDate:Date;
      let endDate:Date;



      switch(month){


        case "previous":

          startDate=startOfPrevMonth;
          endDate=endOfPrevMonth;

          break;



        case "next":

          startDate=startOfNextMonth;
          endDate=endOfNextMonth;

          break;



        default:

          startDate=startOfCurrentMonth;
          endDate=endOfCurrentMonth;

      }





      // =================================================
      // GET PLANS WHICH EXPIRE IN SELECTED MONTH
      // =================================================


      const plans:any[] = await OrderPlan.find({

        expiryDate:{
          $gte:startDate,
          $lte:endDate
        }

      })
      .select(
        "orderId type expiryDate emailTypeId planId"
      )
      .populate({

        path:"emailTypeId",

        select:"name image"

      })
      .lean();







      // =================================================
      // PLAN ORDER IDS
      // =================================================


      const planOrderIds = [

        ...new Set(

          plans.map(
            plan=>String(plan.orderId)
          )

        )

      ];







      // =================================================
      // GET ORDERS
      // Domain expiry OR Plan expiry
      // =================================================


      const orders:any[] = await Order.find({

        $or:[


          // Domain expiry

          {

            expiryDate:{

              $gte:startDate,

              $lte:endDate

            }

          },



          // Email / Hosting / SSL plan expiry

          {

            _id:{

              $in:planOrderIds

            }

          }


        ]

      })

      .populate({

        path:"customer",

        select:"name email mobile"

      })

      .populate({

        path:"client",

        select:"_id c_name c_company c_email c_phone"

      })

      .populate({

        path:"domainSource",

        select:"name code image"

      })

      .lean();








      // =================================================
      // MAP PLANS WITH ORDER
      // =================================================


      const planMap = new Map();



      plans.forEach(plan=>{


        const key =
          String(plan.orderId);



        if(!planMap.has(key)){


          planMap.set(
            key,
            []
          );


        }



        planMap.get(key).push({


          type:plan.type,


          expiryDate:plan.expiryDate,


          emailType:
            plan.emailTypeId?.name || null,


          emailTypeImage:
            plan.emailTypeId?.image || null,


          planId:plan.planId


        });



      });








      // =================================================
      // FINAL RESPONSE DATA
      // =================================================


      const finalOrders = orders.map(order=>{


        const orderPlans =
          planMap.get(
            String(order._id)
          ) || [];




        const expiryDates:any[]=[];



        // Domain expiry

        if(order.expiryDate){

          expiryDates.push(
            new Date(order.expiryDate)
          );

        }




        // Plan expiry

        orderPlans.forEach((plan:any)=>{


          if(plan.expiryDate){


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
                d=>d.getTime()
              )

            )

          )

          :

          null;





        return {

          ...order,

          nearestExpiryDate,

          Plans:orderPlans

        };


      });







      // =================================================
      // SORT BY NEAREST EXPIRY
      // =================================================


      finalOrders.sort((a,b)=>{


        if(!a.nearestExpiryDate)
          return 1;


        if(!b.nearestExpiryDate)
          return -1;



        return (

          new Date(a.nearestExpiryDate).getTime()

          -

          new Date(b.nearestExpiryDate).getTime()

        );


      });







      return res.status(200).json({

        success:true,


        counts:{


          total:finalOrders.length,


          month,


          startDate,


          endDate


        },


        data:finalOrders


      });



    }


    catch(error){


      console.error(
        "Error fetching orders by month:",
        error
      );



      return res.status(500).json({

        success:false,

        message:"Server Error"

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
      success:false,
      error:"Admin access required"
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


      if(!loggedInUser?._id){

        res.status(401).json({
          success:false,
          message:"Unauthorized"
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



      if(
        !user ||
        typeof user.userType !== "object"
      ){

        res.status(403).json({
          success:false,
          message:"Invalid user"
        });

        return;
      }



      const role =
        (user.userType as IUserType)
        .name
        .toLowerCase();




      // ================= PLAN MAPPING =================


      const attachPlans = async(
        orders:any[]
      )=>{


        if(!orders.length)
          return orders;



        const orderIds =
          orders.map(
            order=>order._id
          );



        const plans =
          await OrderPlan.find({

            orderId:{
              $in:orderIds
            }

          })
          .populate({

            path:"emailTypeId",
            select:"name image"

          })
          .populate({

            path:"hostTypeId",
            select:"type"

          })
          .populate({

            path:"hostSubTypeId",
            select:"name"

          })
          .populate({

            path:"storageId",
            select:"name storage"

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



        plans.forEach((plan:any)=>{


          const key =
            plan.orderId.toString();



          if(!planMap.has(key)){

            planMap.set(
              key,
              []
            );

          }




          planMap.get(key)
          .push({

            type:plan.type,


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



        return orders.map(order=>({

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
    code:"DNS-CLOUDFLARE"
  });


console.log(
  "cloudflareSource",
  dnscloudflareSource
);
const filters:any[]=[

  {
    dns_flag:true
  },

  {
    domainSource: dnscloudflareSource?._id
  }

];


// ================= ONLY DNS ORDERS WITHOUT PLANS =================

const planOrderIds =
  await OrderPlan.distinct("orderId");


filters.push({

  _id:{
    $nin: planOrderIds
  }

});



if(search){

  filters.push({

    $or:[

      {
        domainName:{
          $regex:search,
          $options:"i"
        }
      },

      {
        managedBy:{
          $regex:search,
          $options:"i"
        }
      }

    ]

  });

}

      // ================= ADMIN =================



      if(role==="admin"){



        const finalFilter={

          $and:filters

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
            _id:1,
            domainName:1,
            dns_flag:1,
            order_status:1,
            client:1,
            managedBy:1,
            registrationDate:1,
            expiryDate:1,
            domainSource:1,
            lockStatus:1

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

          success:true,

          data:orders,


          pagination:{

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



      if(role==="customer"){



        const client =
          await Client.findOne({

            userType:user._id

          });



        if(!client){

          res.status(404).json({

            success:false,

            message:"Client not found"

          });

          return;

        }





        filters.push({

          client:client._id

        });





        const finalFilter={

          $and:filters

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
             _id:1,
            domainName:1,
            dns_flag:1,
            order_status:1,
            client:1,
            managedBy:1,
            registrationDate:1,
            expiryDate:1,
            domainSource:1,
            lockStatus:1

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

          success:true,


          // client:{

          //   _id:client._id,

          //   c_name:client.c_name,

          //   c_email:client.c_email,

          //   c_company:client.c_company

          // },



          data:orders,



          pagination:{

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

        success:false,

        message:"Access denied"

      });



    }
    catch(error){


      console.error(
        "DNS ORDER ERROR:",
        error
      );



      res.status(500).json({

        success:false,

        message:"Internal server error"

      });


    }


  }
);
router.get("/", authMiddleware, async (req: AuthRequest, res: Response) => {

  try {

    const loggedInUser = req.user;


    if (!loggedInUser?._id) {

      return res.status(401).json({
        success:false,
        message:"Unauthorized"
      });

    }



    // ================= QUERY VALIDATION =================


    const search =
      typeof req.query.search === "string"
        ? req.query.search.trim()
        : "";

const emailType =
  typeof req.query.emailType === "string"
    ? req.query.emailType.trim()
    : "";
    const page =
      Math.max(Number(req.query.page) || 1, 1);


    const limit =
      Math.min(Number(req.query.limit) || 50, 100);


    const skip =
      (page - 1) * limit;





    // ================= ATTACH EMAIL EXPIRY =================


   const attachEmailPlans = async (orders:any[]) => {

  if(!orders.length)
    return orders;


  const orderIds = orders.map(
    order => order._id
  );


  const plans = await OrderPlan.find({

    orderId:{
      $in: orderIds
    }

  })
  .populate({
    path:"emailTypeId",
    select:"name image"
  })
  .populate({
    path:"hostTypeId",
    select:"type"
  })
  .populate({
    path:"hostSubTypeId",
    select:"name"
  })
  .populate({
    path:"storageId",
    select:"storage"
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



  plans.forEach((plan:any)=>{


    const key =
      plan.orderId.toString();



    if(!planMap.has(key)){

      planMap.set(
        key,
        []
      );

    }



    planMap.get(key).push({

      type:plan.type,


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
        ? {
            _id:plan.hostTypeId._id,
            type:plan.hostTypeId.type
          }
        : null,



      hostSubType:
        plan.hostSubTypeId
        ? {
            _id:plan.hostSubTypeId._id,
            name:plan.hostSubTypeId.name
          }
        : null,



      storage:
        plan.storageId
        ? {
            _id:plan.storageId._id,
            name:plan.storageId.name
          }
        : null


    });


  });



  return orders.map(order=>({

    ...order,

    Plans:
      planMap.get(
        order._id.toString()
      ) || []

  }));


};



    // ================= STATUS UPDATE =================


   const updateOrderStatuses = async (orders:any[]) => {

  const today = new Date();

  today.setHours(0,0,0,0);

  const bulkOps:any[] = [];


  orders.forEach(order => {

    let isExpired = false;


    if(order.expiryDate){

      const expiry = new Date(order.expiryDate);

      expiry.setHours(0,0,0,0);

      if(expiry < today){
        isExpired = true;
      }

    }


    if(order.Plans && order.Plans.length > 0){

      const planExpired = order.Plans.some(
        (plan:any)=>{

          if(!plan.expiryDate)
            return false;


          const expiry = new Date(plan.expiryDate);

          expiry.setHours(0,0,0,0);


          return expiry < today;

        }
      );


      if(planExpired){
        isExpired = true;
      }

    }



    const newStatus = isExpired
      ? "EXPIRED"
      : "ACTIVE";


    if(order.order_status !== newStatus){

      bulkOps.push({

        updateOne:{

          filter:{
            _id:order._id
          },

          update:{
            $set:{
              order_status:newStatus
            }
          }

        }

      });


      order.order_status=newStatus;

    }

  });


  if(bulkOps.length){

    await Order.bulkWrite(bulkOps);

  }


  return orders;

};

// ================= EXPIRY 65 DAYS FILTER =================

const expiryLimitDate = new Date();

expiryLimitDate.setDate(
  expiryLimitDate.getDate() - 65
);
// ================= COMMON EXPIRY FILTER =================

const getExpiryFilter = () => {

  const expiryLimitDate = new Date();

  expiryLimitDate.setDate(
    expiryLimitDate.getDate() - 65
  );


  return {
    $or:[

      // Plan ഉള്ള orders എല്ലാം
      {
        _id:{
          $in: planOrderIds
        }
      },


      // Plan ഇല്ലാത്ത normal domains
      {
        dns_flag:false,
        expiryDate:{
          $gte:expiryLimitDate
        }
      },


      // Plan ഇല്ലാത്ത expiryDate ഇല്ലാത്ത domains
      {
        dns_flag:false,
        expiryDate:null
      }

    ]
  };

};

    // ================= SEARCH FILTER =================



    const filters:any[]=[];
    // ================= ONLY ORDERS HAVING PLANS =================
const planOrderIds = await OrderPlan.distinct("orderId");

filters.push({
  $or:[
    {
      // Plan ഉള്ള എല്ലാ orders
      _id:{
        $in:planOrderIds
      }
    },
    {
      // Plan ഇല്ലെങ്കിലും normal domain കാണിക്കുക
      dns_flag:false
    }
  ]
});

if(emailType){

  console.log(
    "SEARCH EMAIL TYPE:",
    emailType
  );


  const emailPlans =
    await OrderPlan.find({
      type:"email"
    })
    .populate({
      path:"emailTypeId",
      select:"name"
    })
    .select(
      "orderId emailTypeId"
    )
    .lean();



  const orderIds =
    emailPlans
    .filter((plan:any)=>{

      const name =
        plan.emailTypeId?.name || "";


      return (
        name.trim()
        .toLowerCase()
        ===
        emailType.trim()
        .toLowerCase()
      );

    })
    .map(
      (plan:any)=>plan.orderId
    )
    .filter(
      (id:any)=>
        mongoose.Types.ObjectId.isValid(id)
    );



  console.log(
    "FILTER IDS:",
    orderIds
  );



  filters.push({

    _id:{
      $in:
        orderIds.length
        ? orderIds
        : []
    }

  });

}

    if(search){


      filters.push({

        $or:[

          {
            domainName:{
              $regex:search,
              $options:"i"
            }
          },


          {
            managedBy:{
              $regex:search,
              $options:"i"
            }
          }


        ]


      });


    }






    // ================= USER =================



    const user =

      await User.findById(
        loggedInUser._id
      )
      .populate("userType");





    const orderFields = {

  domainName:1,

  order_status:1,

  is_active:1,
  dns_flag:1,

  client:1,

  managedBy:1,

  registrationDate:1,

  expiryDate:1,

  lockStatus:1,

  domainSource:1

};






    // ================= ADMIN =================



    if(

      user?.userType &&

      (user.userType as IUserType)
      .name
      .toLowerCase()
      === "admin"

    ){

const expiryFilter = getExpiryFilter();


const finalFilter = {
  $and: [
    ...filters,
    expiryFilter
  ]
};



      const total =

        await Order.countDocuments(
          finalFilter
        );





     let orderQuery = Order.find(finalFilter)
  .select(orderFields)
  .populate(
    "client",
    "_id c_name c_company"
  )
  .populate(
    "domainSource",
    "name code image"
  );

if(!emailType){
  orderQuery = orderQuery
    .skip(skip)
    .limit(limit);
}

let orders:any = await orderQuery.lean();




      orders =
 await attachEmailPlans(
   orders
 );

      orders =
        await updateOrderStatuses(
          orders
        );







      return res.status(200).json({

  success:true,

  data:orders,

  ...(emailType ? {} : {

    pagination:{
      page,
      limit,
      total,
      totalPages:Math.ceil(total/limit)
    }

  })

});


    }








    // ================= CUSTOMER =================



    const client =

      await Client.findById(
        loggedInUser._id
      )
      .populate("userType");






    if(

      client?.userType &&

      (client.userType as IUserType)
      .name
      .toLowerCase()
      === "customer"

    ){



      filters.push({

        client:client._id

      });



 const expiryFilter = getExpiryFilter();


const finalFilter = {
  $and:[
    ...filters,
    expiryFilter
  ]
};




      const total =

        await Order.countDocuments(
          finalFilter
        );




let orderQuery = Order.find(finalFilter)
  .select(orderFields)
  .populate(
    "client",
    "_id c_name c_company"
  )
  .populate(
    "domainSource",
    "name code image"
  );

if(!emailType){
  orderQuery = orderQuery
    .skip(skip)
    .limit(limit);
}

let orders:any = await orderQuery.lean();




      orders =
 await attachEmailPlans(
   orders
 );

      orders =
        await updateOrderStatuses(
          orders
        );



 return res.status(200).json({

  success:true,

  data:orders,

  ...(emailType ? {} : {

    pagination:{
      page,
      limit,
      total,
      totalPages:Math.ceil(total/limit)
    }

  })

});


    }






    return res.status(403).json({

      success:false,

      message:"Access denied"

    });




  } catch(error){


    console.error(
      "ORDER GET ERROR:",
      error
    );


    return res.status(500).json({

      success:false,

      message:"Internal server error"

    });


  }


});
// GET single order by ID

router.get(
  "/:id",
  authMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      // Validate ObjectId
      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ success: false, message: "Invalid order ID" });
        return;
      }

      // Fetch order
      const order = await Order.findById(id)
  .populate({
    path: "customer",
    select: "name email phone company address city state country zipCode"
  })
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
   .populate({
    path: "domainSource",
    model: "DomainSource",
    select: "name code image"
  })
  .populate("hosttypeid")
  .populate("subHostTypeId")
  .populate("hoststorageId")
  .exec();
      if (!order) {
        res.status(404).json({ success: false, message: "Order not found" });
        return;
      }
      if (
        req.user?.role?.toLowerCase() !== "admin" &&
        order.client?._id?.toString() !== req.user?._id
      ) {
        res.status(403).json({
          success:false,
          error:"Access denied"
        });
        return;
      }

      // Fetch related plans
      const orderPlansRaw = await OrderPlan.find({
  orderId: order._id
})
.populate({
  path: "planId",
  model: "PlanEmail"
})
.populate({
  path: "emailTypeId",
  model: "TypeEmail"
})
.populate({
  path: "hostTypeId",
  model: "HostType"
})
.populate({
  path: "hostSubTypeId",
  model: "HostSubType"
})
.populate({
  path: "storageId",
  model: "Storage"
})
.lean();

     const orderPlans: IOrderPlanResponse[] = orderPlansRaw.map((p:any) => ({
  _id: p._id.toString(),
  orderId: p.orderId.toString(),

  serviceType: p.type,
  type: p.type,

  planName: p.planId?.plan || "",
  planId: p.planId?._id?.toString() || "",

  emailType: p.emailTypeId?.name || "",


  hostType: p.hostTypeId
    ? {
        _id: p.hostTypeId._id,
        name: p.hostTypeId.type,
      }
    : null,


  hostSubType: p.hostSubTypeId
    ? {
        _id: p.hostSubTypeId._id,
        name: p.hostSubTypeId.name,
      }
    : null,


  storage: p.storageId
    ? {
        _id: p.storageId._id,
        name: p.storageId.storage,
      }
    : null,


  registrationDate: p.registrationDate,
  expiryDate: p.expiryDate,
  noOfUsers: p.noOfUsers,
}));

      // Merge client + customer details
      const clientData = order.client
        ? {
            c_name: (order.client as any).c_name,
            c_email: (order.client as any).c_email,
            c_phone: (order.client as any).c_phone,
            c_company: (order.client as any).c_company,
            c_address: (order.client as any).c_address,
            c_city: (order.client as any).c_city,
            c_state: (order.client as any).c_state,
            c_country: (order.client as any).c_country,
            c_zipCode: (order.client as any).c_zipCode,
          }
        : {};

      const customerData = order.customer
        ? {
            name: (order.customer as any).name,
            email: (order.customer as any).email,
            phone: (order.customer as any).phone,
            company: (order.customer as any).company,
            address: (order.customer as any).address,
            city: (order.customer as any).city,
            state: (order.customer as any).state,
            country: (order.customer as any).country,
            zipCode: (order.customer as any).zipCode,
          }
        : {};

      // const mergedCustomerDetails = { ...clientData, ...customerData };

      // ✅ IMPORTANT: convert once and reuse
      const orderObj = order.toObject();

      // Final response
      res.status(200).json({
  success: true,
  data: {
    _id: orderObj._id,
    domainName: orderObj.domainName,
    status: orderObj.status,
    managedBy: orderObj.managedBy,
    domainSource: orderObj.domainSource
  ? {
      ...orderObj.domainSource,
      image: orderObj.domainSource.image
        ? `/uploads/domainsources/${orderObj.domainSource.image}`
        : null
    }
  : null,
    registrationDate: orderObj.registrationDate,
    expiryDate: orderObj.expiryDate,
    lockStatus: orderObj.lockStatus,
    domain_flag: orderObj.domain_flag,
    nameServers: orderObj.nameServers,
    client: orderObj.client,
    customer: orderObj.customer,
    plans: orderPlans,
    __v: orderObj.__v
  }
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
//       } else if (data.newCustomer) {
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
router.post("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const data = req.body;
    let customerId: string | undefined;

    // ===== Customer Handling =====
    if (data.is_customer) {
      if (!data.client || !(await Client.findById(data.client))) {
        res.status(400).json({
          success:false,
          error:{
            code:"INVALID_CLIENT",
            message:"Invalid client"
          }
        });
        return;
      }
      customerId = data.client.toString();
    } else if (data.newCustomer) {
      // Ensure 'c_name' is provided
      if (!data.newCustomer.c_name || data.newCustomer.c_name.trim() === "") {
        res.status(400).json({ success: false, message: "New customer name is required" });
        return;
      }

      // Ensure 'c_email' is provided and is a valid string
      // if (!data.newCustomer.c_email || typeof data.newCustomer.c_email !== "string" || data.newCustomer.c_email.trim() === "") {
      //   res.status(400).json({ success: false, message: "New customer email is required and must be a valid string" });
      //   return;
      // }

      // Check if the email already exists
      const existingCustomer = await Client.findOne({
        c_email: data.newCustomer.c_email,
      });

      if (existingCustomer) {
        customerId = existingCustomer._id.toString();
      } else {
        // Create new customer
        const newCust = new Client(data.newCustomer);
        const savedCustomer = await newCust.save();
        customerId = savedCustomer._id.toString();
      }
    }

    // ===== Domain Validation =====
    if (!data.domainName) {
      res.status(400).json({
      success:false,
      error:{
        code:"DOMAIN_REQUIRED",
        message:"Domain name is required"
      }
    });

    return;
    }

    const existingOrder = await Order.findOne({ domainName: data.domainName });
    if (existingOrder) {
      res.status(400).json({
      success:false,
      error:{
        code:"DOMAIN_EXISTS",
        message:"Domain already exists"
      }
    });

    return;
    }

    // ===== Provider Validation =====
    const allowedProviders = ["Google Workspace", "Microsoft 365"];
    if (data.provider && !allowedProviders.includes(data.provider)) {
      res.status(400).json({ success: false, message: "Invalid provider" });
      return;
    }

    // ===== Map References =====
    const mappedData: any = {
      ...data,
      client: customerId,
      hosttypeid: data.hosting_plan || undefined,
      subHostTypeId: data.hosting_subplan || undefined,
      hoststorageId: data.storage || undefined,
    };

    // Ensure domainSource is an array
    // ===== Domain Source Mapping =====
if (data.domainSource) {

  if (mongoose.Types.ObjectId.isValid(data.domainSource)) {

    mappedData.domainSource = data.domainSource;

  } else {

    const domainSourceDoc = await DomainSource.findOne({
      name: data.domainSource
    });

    if (!domainSourceDoc) {
      res.status(400).json({
        success:false,
        error:{
          code:"INVALID_DOMAIN_SOURCE",
          message:"Domain source not found"
        }
      });
      return;
    }

    mappedData.domainSource = domainSourceDoc._id;
  }
}

    // ===== Create Order =====
    const newOrder = new Order(mappedData);
    const savedOrder = await newOrder.save();

    // ===== Save Multiple Email Plans =====
    // ===== Save Multiple Order Plans =====
if (data.plans && Array.isArray(data.plans)) {

  const plansToSave = await Promise.all(
    data.plans.map(async (p: any) => {


      // ===== Validate Plans =====
      if (
        !p.type ||
        (
          (p.type === "email" ||
           p.type === "storage" ||
           p.type === "msoffice") &&
          (!p.planId || !p.emailTypeId)
        )
      ) {

        const error:any = new Error(
          "PlanId and EmailTypeId are required for email, storage and msoffice"
        );

        error.statusCode = 400;

        throw error;
      }


      let planDoc = null;
      let emailTypeDoc = null;


      // Only email/storage/msoffice have plan & email type
     if(!p.type){
 throw new Error("Service type required");
}


// email/storage/msoffice validation

if(
 p.type==="email" ||
 p.type==="storage" ||
 p.type==="msoffice"
){

 if(!p.planId || !p.emailTypeId){
   const error:any = new Error(
    "Plan and Email Type required"
   );

   error.statusCode=400;

   throw error;
 }

}


// hosting validation

if(p.type==="hosting"){

 if(
  !p.hostingType ||
  !p.hostingSubType ||
  !p.storage
 ){

  const error:any = new Error(
    "Hosting details required"
  );

  error.statusCode = 400;

  throw error;
 }

}if(
 p.type==="email" ||
 p.type==="storage" ||
 p.type==="msoffice"
){

 planDoc = await PlanEmail.findById(p.planId);

 emailTypeDoc = await TypeEmail.findById(
   p.emailTypeId
 );


 if (!planDoc || !emailTypeDoc) {
   throw new Error(
    "Invalid planId or emailTypeId"
   );
 }

}

    return {

  orderId: savedOrder._id,

  // Email / Storage / MS Office
  planId: planDoc?._id || null,

  emailTypeId: emailTypeDoc?._id || null,

  // Hosting
  hostTypeId: p.hostingType || null,

  hostSubTypeId: p.hostingSubType || null,

  storageId: p.storage || null,

  type: p.type,

  registrationDate: p.registrationDate
    ? new Date(p.registrationDate)
    : new Date(),

  expiryDate: p.expiryDate
    ? new Date(p.expiryDate)
    : new Date(),

  noOfUsers: Number(p.noOfUsers || 1)

};

    })
  );


  await OrderPlan.insertMany(plansToSave);

}

    res.status(201).json({ success: true, data: savedOrder });
  } catch(err:any){

    console.error(err);


    if(err.statusCode){

      res.status(err.statusCode).json({
        success:false,
        error:{
          code:"VALIDATION_ERROR",
          message:err.message
        }
      });

      return;
    }


    if(err.name==="ValidationError"){

      res.status(400).json({
        success:false,
        error:{
          code:"VALIDATION_ERROR",
          message:err.message
        }
      });

      return;

    }


    if(err.code===11000){

      res.status(400).json({
        success:false,
        error:{
          code:"DUPLICATE_ENTRY",
          message:"Domain already exists"
        }
      });

      return;

    }



    res.status(500).json({
      success:false,
      error:{
        code:"INTERNAL_SERVER_ERROR",
        message:"Something went wrong"
      }
    });


    }
});


// PUT update order
router.put("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { newCustomer, client: existingClient, is_customer, plans, ...rest }: any = req.body;

    let clientId;

    // -------------------------
    // Determine client
    // -------------------------
    if (is_customer) {
      if (existingClient) {
        // ✅ Handle both object and string client
        const clientIdValue =
          typeof existingClient === "object" && existingClient._id
            ? existingClient._id
            : existingClient;

        if (!mongoose.Types.ObjectId.isValid(clientIdValue)) {
          res.status(400).json({ success: false, message: "Invalid client ID" });
          return;
        }

        clientId = new mongoose.Types.ObjectId(clientIdValue);
      } else {
        res.status(400).json({ success: false, message: "Existing client ID is required" });
        return;
      }
    } else if (newCustomer?.c_name && newCustomer?.c_email?.length) {
      // ✅ Create new client if not existing
      const { _id, ...customerData } = newCustomer;
      const createdClient = await Client.create(customerData);
      clientId = createdClient._id;
    } else {
      res.status(400).json({ success: false, message: "New customer data is required" });
      return;
    }

    // -------------------------
    // Prepare update payload
    // -------------------------
    const updatePayload: any = {
      ...rest,
      client: clientId,
      hoststorageId: rest.hoststorageId?._id || rest.hoststorageId,
  
    };

    // -------------------------
    // Update order
    // -------------------------
    const updatedOrder = await Order.findByIdAndUpdate(req.params.id, updatePayload, {
      new: true,
      runValidators: true,
    });

    if (!updatedOrder) {
      res.status(404).json({ success: false, message: "Order not found" });
      return;
    }

    // -------------------------
    // Handle Order Plans
    // -------------------------
    // -------------------------
// Handle Order Plans
// -------------------------
if (plans && Array.isArray(plans)) {

  // Remove old plans
  await OrderPlan.deleteMany({
    orderId: updatedOrder._id
  });

  const planDocs = await Promise.all(
    plans.map(async (p: any) => {

      let planId = p.planId || null;
      let emailTypeId = p.emailTypeId || null;


      // -------------------------
      // EMAIL / STORAGE / MS OFFICE
      // Need PlanEmail + TypeEmail
      // -------------------------
      if (
        p.type === "email" ||
        p.type === "storage" ||
        p.type === "msoffice"
      ) {

        // Plan validation
        if (!planId && p.planName) {

          const plan = await PlanEmail.findOne({
            plan: p.planName
          });

          if (!plan) {
            throw new Error(
              `PlanEmail not found: ${p.planName}`
            );
          }

          planId = plan._id;
        }


        // Email type validation
        if (!emailTypeId && p.emailType) {

          const emailType = await TypeEmail.findOne({
            type: p.emailType
          });

          if (!emailType) {
            throw new Error(
              `TypeEmail not found: ${p.emailType}`
            );
          }

          emailTypeId = emailType._id;
        }
      }


      // -------------------------
      // HOSTING / WEBSITE / SSL
      // No PlanEmail validation
      // -------------------------


      return {

  orderId: updatedOrder._id,


  planId:
    planId &&
    mongoose.Types.ObjectId.isValid(planId)
      ? new mongoose.Types.ObjectId(planId)
      : null,


  emailTypeId:
    emailTypeId &&
    mongoose.Types.ObjectId.isValid(emailTypeId)
      ? new mongoose.Types.ObjectId(emailTypeId)
      : null,


  // ✅ HOSTING FIELDS
  hostTypeId:
    p.hostingType &&
    mongoose.Types.ObjectId.isValid(p.hostingType)
      ? new mongoose.Types.ObjectId(p.hostingType)
      : null,


  hostSubTypeId:
    p.hostingSubType &&
    mongoose.Types.ObjectId.isValid(p.hostingSubType)
      ? new mongoose.Types.ObjectId(p.hostingSubType)
      : null,


  storageId:
    p.storage &&
    mongoose.Types.ObjectId.isValid(p.storage)
      ? new mongoose.Types.ObjectId(p.storage)
      : null,


  registrationDate:
    p.registrationDate
      ? new Date(p.registrationDate)
      : null,


  expiryDate:
    p.expiryDate
      ? new Date(p.expiryDate)
      : null,


  noOfUsers:
    Number(p.noOfUsers || 1),


  type: p.type,

};
    })
  );


  await OrderPlan.insertMany(planDocs);
}
    // -------------------------
    // Populate for response
    // -------------------------
    const populatedOrder = await Order.findById(updatedOrder._id)
      .populate("client")
      .populate({
        path: "hoststorageId",
        populate: [{ path: "hostType" }, { path: "hostSubType" }],
      });

    // ✅ Send success response
    res.status(200).json({ success: true, data: populatedOrder });
  } catch (err: any) {
    console.error("Error updating order:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});
router.put(
  "/assignclient/:id",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const {
        is_customer,
        client,
        newCustomer
      } = req.body;


      // Validate Order ID
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid order ID"
        });
      }


      // Find Order
      const order = await Order.findById(id);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found"
        });
      }



      let clientId;



      // =========================
      // EXISTING CLIENT
      // =========================

      if (is_customer === true) {


        if (!client || !mongoose.Types.ObjectId.isValid(client)) {
          return res.status(400).json({
            success: false,
            message: "Invalid client ID"
          });
        }



        const existingClient = await Client.findById(client);


        if (!existingClient) {
          return res.status(404).json({
            success: false,
            message: "Client not found"
          });
        }


        clientId = existingClient._id;

      }



      // =========================
      // NEW CLIENT CREATE
      // =========================

      else {


        if (!newCustomer) {
          return res.status(400).json({
            success: false,
            message: "New customer details required"
          });
        }



        const createdClient = await Client.create({

          c_salutation:
            newCustomer.c_salutation || "",

          c_firstName:
            newCustomer.c_firstName || "",

          c_lastName:
            newCustomer.c_lastName || "",

          c_name:
            newCustomer.c_name,

          c_email:
            newCustomer.c_email,

          c_phone:
            newCustomer.c_phone,

          c_company:
            newCustomer.c_company || "",

          c_address:
            newCustomer.c_address || "",

          c_address2:
            newCustomer.c_address2 || "",

          c_city:
            newCustomer.c_city || "",

          c_country:
            newCustomer.c_country || null,

          c_state:
            newCustomer.c_state || null,

          c_zipCode:
            newCustomer.c_zipCode || "",

          c_gst:
            newCustomer.c_gst || "",

          c_countryCode:
            newCustomer.c_countryCode || "",

          c_portalEnabled:
            newCustomer.c_portalEnabled || false,

          c_bankAccountPayment:
            newCustomer.c_bankAccountPayment || "",

          c_placeOfContact:
            newCustomer.c_placeOfContact || "",

          c_placeOfContactWithStateCode:
            newCustomer.c_placeOfContactWithStateCode || ""

        });



        clientId = createdClient._id;

      }




      // =========================
      // ASSIGN CLIENT TO ORDER
      // =========================


      order.client = clientId;


      await order.save();



      return res.status(200).json({

        success: true,

        message:
          is_customer
            ? "Existing client assigned successfully"
            : "New client created and assigned successfully",

        data: {

          orderId: order._id,

          clientId: clientId

        }

      });



    } catch(error) {


      console.error(
        "Assign client error:",
        error
      );


      return res.status(500).json({

        success:false,

        error:
          (error as Error).message

      });

    }
  }
);
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


router.get("/customer_order_details/:customerId", async (req, res) => {
  try {

    const { customerId } = req.params;


    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({
        status: "ERROR",
        message: "Invalid customer ID"
      });
    }



    // ================= CLIENT =================

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
        status:"ERROR",
        message:"Customer not found"
      });
    }




    // ================= HELPERS =================

    const getName = async (
      value:any,
      model:any
    ) => {

      if(!value) return undefined;


      if(typeof value === "string"){
        const doc = await model.findById(value);
        return doc?.name;
      }


      return value.name;

    };



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

      c_state_name: stateName,

      c_country_name: countryName

    };







    // ================= ORDERS =================


    let orders = await Order.find({
      client: customerId
    })
    .populate(
  "domainSource",
  "name image code"
)

    .select(`
      domainName
      domainSource

      expiryDate
      status

      // google_email
      // microsoft_email

      // hosting
      // website_flag

      // msoffice_services_flag
      // storage_services_flag

      email_expiryDate

      createdAt
    `)
    .sort({
      createdAt:-1
    })
    .lean();



// ================= ADD PLANS =================

const orderIds = orders.map(
  (order:any)=>order._id
);


const plans = await OrderPlan.find({

  orderId:{
    $in:orderIds
  }

})
.populate({
  path:"emailTypeId",
  select:"name image"
})
.populate({
  path:"hostTypeId",
  select:"type"
})
.populate({
  path:"hostSubTypeId",
  select:"name"
})
.populate({
  path:"storageId",
  select:"name storage"
})
.lean();



const planMap = new Map();


plans.forEach((plan:any)=>{

  const key = plan.orderId.toString();


  if(!planMap.has(key)){
    planMap.set(key,[]);
  }


  planMap.get(key).push({

    type:plan.type,

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
        _id:plan.hostTypeId._id,
        type:plan.hostTypeId.type
      }
      :
      null,


    hostSubType:
      plan.hostSubTypeId
      ?
      {
        _id:plan.hostSubTypeId._id,
        name:plan.hostSubTypeId.name
      }
      :
      null,


    storage:
      plan.storageId
      ?
      {
        _id:plan.storageId._id,
        name:plan.storageId.name
      }
      :
      null

  });

});


orders = orders.map((order:any)=>({

  ...order,


  domainSource: order.domainSource
    ? {
        ...order.domainSource,

        image:
          order.domainSource.image
          ? (
              order.domainSource.image.startsWith("/uploads")
              ?
              order.domainSource.image
              :
              `/uploads/domainsources/${order.domainSource.image}`
            )
          : null
      }
    : null,


  Plans:
    planMap.get(
      order._id.toString()
    ) || []

}));
// Remove orders without domainSource and Plans
orders = orders.filter((order:any) => {

  const hasDomainSource = !!order.domainSource;

  const hasPlans =
    order.Plans &&
    order.Plans.length > 0;

  return hasDomainSource || hasPlans;

});
    // ================= EMAIL EXPIRY =================


    orders = await Promise.all(

      orders.map(async(order:any)=>{


        const emailPlans = await OrderPlan.find({

          orderId:order._id,

          type:"email"

        })
        .select("expiryDate")
        .lean();



        const emailExpiryDates = emailPlans

          .map(
            (item:any)=>item.expiryDate
          )

          .filter(Boolean);





        return {


          ...order,


          // Domain expiry

          domainExpiryDate:
            order.expiryDate || null,



          // Email expiry

          emailExpiryDate:

            emailExpiryDates.length

            ? emailExpiryDates

            :

            order.email_expiryDate

            ? [order.email_expiryDate]

            :

            []

        };


      })

    );








    // ================= STATUS UPDATE =================


    const today = new Date();


    orders = await Promise.all(

      orders.map(async(order:any)=>{


        let newStatus = order.status || "";



        if(order.expiryDate){

          newStatus =
            new Date(order.expiryDate) < today
            ?
            "EXPIRED"
            :
            "ACTIVE";

        }




        if(order.status !== newStatus){


          await Order.updateOne(

            {
              _id:order._id
            },

            {
              status:newStatus
            }

          );


          order.status = newStatus;

        }



        return order;


      })

    );





// orders = orders.map((order:any)=>({

//   ...order,

//   client: clientData

// }));

    // ================= RESPONSE =================


    return res.json({

      status:"SUCCESS",
      client: clientData,
      orders


    });



  } catch(error){


    console.error(
      "❌ Customer Order Details Error:",
      error
    );


    return res.status(500).json({

      status:"ERROR",

      message:"Server error"

    });


  }

});
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


// router.put("/:id", async (req: Request, res: Response): Promise<void> => {
//   try {
//     const { id } = req.params;
//     const updateData = req.body as Partial<IOrder>;

//     const updatedOrder = await mongoose.model<IOrder>("Order").findByIdAndUpdate(id, updateData, {
//       new: true, // return the updated document
//       runValidators: true, // validate before updating
//     }).populate("customer registrarName"); // optional: populate references

//     if (!updatedOrder) {
//       res.status(404).json({ message: "Order not found" });
//       return;
//     }

//     res.status(200).json(updatedOrder);
//   } catch (error) {
//     console.error("Error updating order:", error);
//     res.status(500).json({ message: "Server error", error });
//   }
// });


export default router;
