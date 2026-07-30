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
      res.status(403).json({
        success:false,
        error:"Admin access required"
      });
      return;
    }
    const now = new Date();

    // Current month
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Previous month
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
    const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // Next month
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0);
    const endOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 2, 0, 23, 59, 59);

    const orders = await Order.find({
      expiryDate: {
        $gte: startOfPrevMonth,
        $lte: endOfNextMonth,
      },
    })
      .populate({
        path: "customer",
        select: "name email mobile", // adjust fields as per Customer schema
      })
      .populate({
        path: "client",
        select: "companyName", // adjust as per Client schema
      })
      .sort({ expiryDate: 1 });

    res.status(200).json({
      success: true,
      counts: {
        total: orders.length,
        previousMonthRange: { startOfPrevMonth, endOfPrevMonth },
        currentMonthRange: { startOfCurrentMonth, endOfCurrentMonth },
        nextMonthRange: { startOfNextMonth, endOfNextMonth },
      },
      data: orders,
    });
  } catch (error) {
    console.error("Error fetching orders by month:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});


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

      if (!loggedInUser?._id) {
        res.status(401).json({ success: false, error: "Unauthorized" });
        return;
      }

      const { filter } = req.query;

      // ---------------- LOAD USER ----------------
      const user = await User.findById(loggedInUser._id)
        .populate("userType")
        .exec();

      if (!user || typeof user.userType !== "object") {
        res.status(403).json({ success: false, error: "Invalid user role" });
        return;
      }

      const userRole = (user.userType as IUserType).name.toLowerCase();

      // =====================================================
      // ===================== ADMIN =========================
      // =====================================================
    if (userRole === "admin") {
 const cloudflareSource = await DomainSource.findOne({
  name: {
    $regex: "Cloudflare",
    $options: "i"
  }
});


const query:any = {
  dns_flag:true,
  $or:[
    { expiryDate:null },
    { expiryDate:{ $exists:false } },
    { expiryDate:"" }
  ]
};


if(cloudflareSource){
  query.domainSource = cloudflareSource._id;
}
else{
  query.domainSource = null;
}

  const orders = await Order.find(query)
    .populate("customer", "name email company")
    .populate("client", "c_name c_email c_company")
    .exec();
    const orderIds = orders.map(order => order._id);

const plans = await OrderPlan.find({
  orderId: {
    $in: orderIds
  }
}).select("orderId");


const planOrderIds = new Set(
  plans.map(plan => plan.orderId.toString())
);


const filteredOrders = orders.filter(
  order => !planOrderIds.has(order._id.toString())
);

  res.status(200).json({
    success: true,
    data: filteredOrders,
  });
  return;
}

      // =====================================================
      // =================== CUSTOMER ========================
      // =====================================================
      if (userRole === "customer") {
        const client = await Client.findOne({ userType: user._id }).exec();

        if (!client) {
          res.status(404).json({
            success: false,
            error: "Customer profile not found",
          });
          return;
        }

        const query: any = { client: client._id };

        if (filter === "Cloudflare") {
        // Correct way to add multiple fields
        const cloudflareSource = await DomainSource.findOne({
  name:{
    $regex:"Cloudflare",
    $options:"i"
  }
});


Object.assign(query,{
  dns_flag:true,
  $or:[
    { expiryDate:null },
    { expiryDate:{ $exists:false }},
    { expiryDate:"" }
  ],
  domainSource: cloudflareSource?._id || null
});
      }

        const orders = await Order.find(query)
          .populate("client", "c_name c_email c_company")
          .exec();
          const orderIds = orders.map(order => order._id);

const plans = await OrderPlan.find({
  orderId: {
    $in: orderIds
  }
}).select("orderId");


const planOrderIds = new Set(
  plans.map(plan => plan.orderId.toString())
);


const filteredOrders = orders.filter(
  order => !planOrderIds.has(order._id.toString())
);

        res.status(200).json({
          success: true,
          customer: {
            _id: client._id,
            name: client.c_name,
            c_company: client.c_company,
            email: client.c_email,
          },
          data: filteredOrders,
        });
        return;
      }

      res.status(403).json({ success: false, error: "Access denied" });
    } catch (err) {
      console.error("❌ Error fetching DNS orders:", err);
      res.status(500).json({ success: false, error: "Server error" });
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


  const emailPlans = await OrderPlan.find({

    orderId:{
      $in: orderIds
    }

  })
  .populate(
    {
      path:"emailTypeId",
      select:"name image"
    }
  )
  .select(
    "orderId type expiryDate emailTypeId planId"
  )
  .lean();



  const planMap = new Map();



  emailPlans.forEach(plan=>{


    const key =
      plan.orderId.toString();



    if(!planMap.has(key)){

      planMap.set(
        key,
        []
      );

    }



    planMap.get(key).push({

      type: plan.type,


      expiryDate:
        plan.expiryDate || null,


      emailType:
        (plan.emailTypeId as any)?.name || null,


      emailTypeImage:
        (plan.emailTypeId as any)?.image || null,


      planId:
        plan.planId

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

  const bulkOps:any[] = [];


  orders.forEach(order => {

    let isExpired = false;


    // 1. Check Order expiryDate
    if(order.expiryDate){

      if(new Date(order.expiryDate) < today){
        isExpired = true;
      }

    }


    // 2. Check Plans expiryDate
    if(order.Plans && order.Plans.length > 0){

      const planExpired = order.Plans.some(
        (plan:any) =>
          plan.expiryDate &&
          new Date(plan.expiryDate) < today
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


      order.order_status = newStatus;

    }


  });



  if(bulkOps.length){

    await Order.bulkWrite(
      bulkOps
    );

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
  return {
    $and: [
      {
        $or: [
          {
            expiryDate: {
              $gte: expiryLimitDate
            }
          },
          {
            expiryDate: null
          }
        ]
      },
      {
        dns_flag: {
          $ne: true
        }
      }
    ]
  };
};


    // ================= SEARCH FILTER =================



    const filters:any[]=[];

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





      let orders:any =

        await Order.find(
          finalFilter
        )
        .select(orderFields)
        .skip(skip)
        .limit(limit)
        .populate(
          "client",
          "_id c_name c_company"
        )
        .populate(
    "domainSource",
    "name code image"
        )
        .lean();




      orders =
 await attachEmailPlans(
   orders
 );

      orders =
        await updateOrderStatuses(
          orders
        );




orders = orders.filter(
  (order:any) =>
    order.Plans &&
    order.Plans.length > 0
);




      return res.status(200).json({

        success:true,

        data:orders,


        pagination:{

          page,

          limit,

          total,

          totalPages:
            Math.ceil(
              total/limit
            )

        }

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





      let orders:any =

        await Order.find(
          finalFilter
        )
        .select(orderFields)
        .skip(skip)
        .limit(limit)
        .populate(
          "client",
          "_id c_name c_company"
        )
        .populate(
        "domainSource",
        "name code image"
        )
        .lean();




      orders =
 await attachEmailPlans(
   orders
 );

      orders =
        await updateOrderStatuses(
          orders
        );





orders = orders.filter(
  (order:any) =>
    order.Plans &&
    order.Plans.length > 0
);


      return res.status(200).json({

        success:true,


        client:{

          _id:client._id,

          c_name:client.c_name,

          c_email:client.c_email,

          c_company:client.c_company

        },


        data:orders,


        pagination:{

          page,

          limit,

          total,

          totalPages:
            Math.ceil(
              total/limit
            )

        }


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
      const orderPlansRaw = await OrderPlan.find({ orderId: order._id })
        .populate({ path: "planId", model: "PlanEmail" })
        .populate({ path: "emailTypeId", model: "TypeEmail" })
        .lean();

      const orderPlans: IOrderPlanResponse[] = orderPlansRaw.map((p: any) => ({
        _id: p._id.toString(),
        orderId: p.orderId.toString(),
        planName: p.planId?.plan || "",
        planId: p.planId?._id?.toString() || "",
        emailType: p.emailTypeId?.name || "",
        serviceType: p.type,
        type: p.type,
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
    domainSource: orderObj.domainSource,
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
    if (data.domainSource && typeof data.domainSource === "string") {
      mappedData.domainSource = data.domainSource;
    }

    // ===== Create Order =====
    const newOrder = new Order(mappedData);
    const savedOrder = await newOrder.save();

    // ===== Save Multiple Email Plans =====
    // ===== Save Multiple Order Plans =====
if (data.plans && Array.isArray(data.plans)) {

  const plansToSave = await Promise.all(
    data.plans.map(async (p: any) => {

      if (!p.planId || !p.emailTypeId || !p.type) {
        

        const error:any = new Error(
          "PlanId, EmailTypeId or type is missing"
        );

        error.statusCode = 400;

        throw error;

        }
      


      const planDoc = await PlanEmail.findById(p.planId);

      const emailTypeDoc = await TypeEmail.findById(
        p.emailTypeId
      );


      if (!planDoc || !emailTypeDoc) {
        throw new Error("Invalid planId or emailTypeId");
      }


      return {

        orderId: savedOrder._id,

        planId: planDoc._id,

        emailTypeId: emailTypeDoc._id,

        type: p.type,


        registrationDate:
          p.registrationDate
            ? new Date(p.registrationDate)
            : new Date(),


        expiryDate:
          p.expiryDate
            ? new Date(p.expiryDate)
            : new Date(),


        noOfUsers:
          Number(p.noOfUsers || 1),


        google_email:
          p.google_email || false,


        microsoft_email:
          p.microsoft_email || false,


        businessEmail:
          p.businessEmail || false,


        email_flag:
          p.email_flag || false,


        msoffice_services_flag:
          p.msoffice_services_flag || false,


        storage_services_flag:
          p.storage_services_flag || false,

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
    if (plans && Array.isArray(plans)) {
      // ✅ Clear existing plans first
      await OrderPlan.deleteMany({ orderId: updatedOrder._id });

      const planDocs = await Promise.all(
        plans.map(async (p: any) => {
          // ✅ Validate PlanEmail
          let planId = p.planId;
          if (!planId) {
            const plan = await PlanEmail.findOne({ name: p.planName });
            if (!plan) throw new Error(`PlanEmail not found: ${p.planName}`);
            planId = plan._id;
          }

          // ✅ Validate TypeEmail
          let emailTypeId = p.emailTypeId;
          if (!emailTypeId) {
            const emailType = await TypeEmail.findOne({ type: p.emailType });
            if (!emailType) throw new Error(`TypeEmail not found: ${p.emailType}`);
            emailTypeId = emailType._id;
          }

          return {
            orderId: updatedOrder._id,
            planId: new mongoose.Types.ObjectId(planId),
            emailTypeId: new mongoose.Types.ObjectId(emailTypeId),
            registrationDate: new Date(p.registrationDate),
            expiryDate: new Date(p.expiryDate),
            noOfUsers: Number(p.noOfUsers || 1),
             type: p.type,
          };
        })
      );

      // ✅ Insert all plans
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
    .select(`
      domainName
      domainSource

      expiryDate
      status

      google_email
      microsoft_email

      hosting
      website_flag

      msoffice_services_flag
      storage_services_flag

      email_expiryDate

      createdAt
    `)
    .sort({
      createdAt:-1
    })
    .lean();






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







    // ================= RESPONSE =================


    return res.json({

      status:"SUCCESS",

      client:clientData,

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
