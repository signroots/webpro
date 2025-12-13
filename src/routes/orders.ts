import express, { Request, Response } from "express";
import { IOrder,Order } from "../models/Order";
import Customer, { ICustomer } from "../models/Customer";
import mongoose from "mongoose";
import { authMiddleware,AuthRequest  } from "../middleware/auth"; 
import User from "../models/User";
import UserType, { IUserType } from "../models/UserType"
import Client, { IClient } from "../models/Client";
import Country from "../models/Country";
import State from "../models/State";
import  {OrderPlan, IOrderPlan } from "../models/OrderPlan";
import { Storage } from "../models/Storage";
import { PlanEmail } from "../models/PlanEmail";
import { TypeEmail } from "../models/TypeEmail";
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



router.get('/existing_customers', async (_req: Request, res: Response): Promise<void> => {
  try {
    // Only select email, phone, and name
    const clients = await Client.find({}, 'c_name c_email c_phone').sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: clients });
  } catch (err: any) {
    console.error('Error fetching customers:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch customized customer' });
  }
});
// GET all orders
// router.get("/", async (_req: Request, res: Response): Promise<void> => {
//   try {
//     const orders = await Order.find().populate("customer");
//     res.status(200).json({ success: true, data: orders });
//   } catch (err) {
//     res.status(500).json({ success: false, error: (err as Error).message });
//   }
// });
router.get("/dnsorders", authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const loggedInUser = req.user;

    if (!loggedInUser || !loggedInUser._id) {
      console.log("Unauthorized access attempt.");
      res.status(401).json({ success: false, error: "Unauthorized" });
      return;
    }

    const { filter } = req.query;

    const updateOrderStatuses = async (orders: any[]) => {
      const today = new Date();

      const updates = orders.map(async (order) => {
        let newStatus = "";

        if (!order.expiryDate || isNaN(new Date(order.expiryDate).getTime())) {
          newStatus = "";
        } else {
          const expiryDate = new Date(order.expiryDate);
          newStatus = expiryDate < today ? "EXPIRED" : "ACTIVE";
        }

        if (order.status !== newStatus) {
          order.status = newStatus;
          await order.save();
        }

        return order;
      });

      return Promise.all(updates);
    };

    const user = await User.findById(loggedInUser._id).populate("userType").exec();

    if (user && user.userType && typeof user.userType === "object") {
      const userRole = (user.userType as IUserType).name.toLowerCase();
      console.log("Resolved user role (User model):", userRole);

      // ---------------- ADMIN ----------------
    if (userRole === "admin") {
  const query: any = {};

  if (filter === "Cloudflare") {
    query.domainSource = "Cloudflare";
    query.$or = [
      { expiryDate: null },        // expiryDate is null
      { expiryDate: { $exists: false } }, // expiryDate field does not exist
    ];
  }

 

        let orders = await Order.find(query).populate("client", "c_name c_email").exec();
        orders = await updateOrderStatuses(orders);

        res.status(200).json({ success: true, data: orders });
        return;
      }

      // ---------------- CUSTOMER ----------------
      if (userRole === "customer") {
        const customer = await Client.findOne({ userType: user._id }).exec();

        if (!customer) {
          res.status(404).json({ success: false, error: "Customer profile not found" });
          return;
        }

        const query: any = { customer: customer._id };

        if (filter === "cloudflare") {
          query.domainSource = "cloudflare";
          query.$or = [
            { expiryDate: null },
            { expiryDate: "" },
            { expiryDate: { $exists: false } },
          ];
        }

        let orders = await Order.find(query).populate("customer", "name email").exec();
        orders = await updateOrderStatuses(orders);

        res.status(200).json({
          success: true,
          customer: {
            _id: customer._id,
            name: customer.c_name,
            email: customer.c_email,
          },
          data: orders,
        });
        return;
      }
    }

    // ---------------- CLIENT ----------------
    const client = await Client.findById(loggedInUser._id).populate("userType").exec();

    if (client && client.userType && typeof client.userType === "object") {
      const userRole = (client.userType as IUserType).name.toLowerCase();
      console.log("Resolved user role (Customer model):", userRole);

      if (userRole === "customer") {
        const query: any = { client: client._id };

        if (filter === "Cloudflare") {
          query.domainSource = "Cloudflare";
          query.$or = [
            { expiryDate: null },
            { expiryDate: "" },
            { expiryDate: { $exists: false } },
          ];
        }

        let orders = await Order.find(query).populate("client", "name email").exec();
        orders = await updateOrderStatuses(orders);

        res.status(200).json({
          success: true,
          client: {
            _id: client._id,
            name: client.c_name,
            email: client.c_email,
          },
          data: orders,
        });
        return;
      }
    }

    res.status(403).json({ success: false, error: "Access denied: Invalid role or user not found" });
  } catch (err) {
    console.error("❌ Error fetching orders:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

router.get("/dnsorders", authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const loggedInUser = req.user;

    if (!loggedInUser || !loggedInUser._id) {
      console.log("Unauthorized access attempt.");
      res.status(401).json({ success: false, error: "Unauthorized" });
      return;
    }

    const { filter } = req.query;

    const updateOrderStatuses = async (orders: any[]) => {
      const today = new Date();

      const updates = orders.map(async (order) => {
        let newStatus = "";

        if (!order.expiryDate || isNaN(new Date(order.expiryDate).getTime())) {
          newStatus = "";
        } else {
          const expiryDate = new Date(order.expiryDate);
          newStatus = expiryDate < today ? "EXPIRED" : "ACTIVE";
        }

        if (order.status !== newStatus) {
          order.status = newStatus;
          await order.save();
        }

        return order;
      });

      return Promise.all(updates);
    };

    const user = await User.findById(loggedInUser._id).populate("userType").exec();

    if (user && user.userType && typeof user.userType === "object") {
      const userRole = (user.userType as IUserType).name.toLowerCase();
      console.log("Resolved user role (User model):", userRole);

      // ---------------- ADMIN ----------------
    if (userRole === "admin") {
  const query: any = {};

  if (filter === "Cloudflare") {
    query.domainSource = "Cloudflare";
    query.$or = [
      { expiryDate: null },        // expiryDate is null
      { expiryDate: { $exists: false } }, // expiryDate field does not exist
    ];
  }

 

        let orders = await Order.find(query).populate("client", "c_name c_email").exec();
        orders = await updateOrderStatuses(orders);

        res.status(200).json({ success: true, data: orders });
        return;
      }

      // ---------------- CUSTOMER ----------------
      if (userRole === "customer") {
        const customer = await Client.findOne({ userType: user._id }).exec();

        if (!customer) {
          res.status(404).json({ success: false, error: "Customer profile not found" });
          return;
        }

        const query: any = { customer: customer._id };

        if (filter === "cloudflare") {
          query.domainSource = "cloudflare";
          query.$or = [
            { expiryDate: null },
            { expiryDate: "" },
            { expiryDate: { $exists: false } },
          ];
        }

        let orders = await Order.find(query).populate("customer", "name email").exec();
        orders = await updateOrderStatuses(orders);

        res.status(200).json({
          success: true,
          customer: {
            _id: customer._id,
            name: customer.c_name,
            email: customer.c_email,
          },
          data: orders,
        });
        return;
      }
    }

    // ---------------- CLIENT ----------------
    const client = await Client.findById(loggedInUser._id).populate("userType").exec();

    if (client && client.userType && typeof client.userType === "object") {
      const userRole = (client.userType as IUserType).name.toLowerCase();
      console.log("Resolved user role (Customer model):", userRole);

      if (userRole === "customer") {
        const query: any = { client: client._id };

        if (filter === "Cloudflare") {
          query.domainSource = "Cloudflare";
          query.$or = [
            { expiryDate: null },
            { expiryDate: "" },
            { expiryDate: { $exists: false } },
          ];
        }

        let orders = await Order.find(query).populate("client", "name email").exec();
        orders = await updateOrderStatuses(orders);

        res.status(200).json({
          success: true,
          client: {
            _id: client._id,
            name: client.c_name,
            email: client.c_email,
          },
          data: orders,
        });
        return;
      }
    }

    res.status(403).json({ success: false, error: "Access denied: Invalid role or user not found" });
  } catch (err) {
    console.error("❌ Error fetching orders:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});


router.get("/", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const loggedInUser = req.user;

    if (!loggedInUser || !loggedInUser._id) {
      console.log("Unauthorized access attempt.");
      res.status(401).json({ success: false, error: "Unauthorized" });
      return;
    }

    // 🔵 Attach Email OrderPlans to each Order
    const attachEmailPlans = async (orders: any[]) => {
      const updated = await Promise.all(
        orders.map(async (order) => {
          const emailPlans = await OrderPlan.find({
            orderId: order._id,
            type: "email",
          })
            .populate("planId")
            .populate("emailTypeId")
            .exec();

          return {
            ...order.toObject(),
            emailPlans,
          };
        })
      );

      return updated;
    };

    // 🟡 Update order statuses based on expiry date
    const updateOrderStatuses = async (orders: any[]) => {
      const today = new Date();

      const updates = orders.map(async (order) => {
        let newStatus = "";

        if (!order.expiryDate || isNaN(new Date(order.expiryDate).getTime())) {
          newStatus = "";
        } else {
          const expiryDate = new Date(order.expiryDate);
          newStatus = expiryDate < today ? "EXPIRED" : "ACTIVE";
        }

        if (order.status !== newStatus) {
          order.status = newStatus;
          await order.save();
        }

        return order;
      });

      return Promise.all(updates);
    };

    // 🔍 Find logged-in user in User collection
    const user = await User.findById(loggedInUser._id)
      .populate("userType")
      .exec();

    if (user && user.userType && typeof user.userType === "object") {
      const userRole = (user.userType as IUserType).name.toLowerCase();
      console.log("Resolved user role (User model):", userRole);

      // ---------------- ADMIN ----------------
      if (userRole === "admin") {
        let orders = await Order.find()
          .populate("client", "c_name c_email","c_company")
          .exec();

        orders = await updateOrderStatuses(orders);
        orders = await attachEmailPlans(orders);

        res.status(200).json({ success: true, data: orders });
        return;
      }

      // ---------------- CUSTOMER (via User) ----------------
      if (userRole === "customer") {
        const customer = await Client.findOne({ userType: user._id }).exec();

        if (!customer) {
          res
            .status(404)
            .json({ success: false, error: "Customer profile not found" });
          return;
        }

        let orders = await Order.find({ customer: customer._id })
          .populate("customer", "name email")
          .exec();

        orders = await updateOrderStatuses(orders);
        orders = await attachEmailPlans(orders);

        res.status(200).json({
          success: true,
          customer: {
            _id: customer._id,
            name: customer.c_name,
            email: customer.c_email,
            c_company:customer.c_company
          },
          data: orders,
        });
        return;
      }
    }

    // ---------------- CLIENT (Direct login as Client) ----------------
    const client = await Client.findById(loggedInUser._id)
      .populate("userType")
      .exec();

    if (client && client.userType && typeof client.userType === "object") {
      const userRole = (client.userType as IUserType).name.toLowerCase();
      console.log("Resolved user role (Customer model):", userRole);

      if (userRole === "customer") {
        let orders = await Order.find({ client: client._id })
          .populate("client", "name email")
          .exec();

        orders = await updateOrderStatuses(orders);
        orders = await attachEmailPlans(orders);

        res.status(200).json({
          success: true,
          client: {
            _id: client._id,
            name: client.c_name,
            email: client.c_email,
          },
          data: orders,
        });
        return;
      }
    }

    // ❌ Invalid role
    res
      .status(403)
      .json({ success: false, error: "Access denied: Invalid role or user not found" });
  } catch (err) {
    console.error("❌ Error fetching orders:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});


// GET single order by ID

router.get("/:id", async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: "Invalid order ID" });
      return;
    }

    // Fetch order and populate relevant fields
    const order = await Order.findById(id)
      .populate("customer")
      .populate("client")
      .populate("hosttypeid")
      .populate("subHostTypeId")
      .populate("hoststorageId")
      .exec();

    if (!order) {
      res.status(404).json({ success: false, message: "Order not found" });
      return;
    }

    // Fetch related email plans
    const orderPlansRaw = await OrderPlan.find({ orderId: order._id })
      .populate({ path: "planId", model: "PlanEmail" })
      .populate({ path: "emailTypeId", model: "TypeEmail" })
      .lean({ virtuals: true }); // ← keep all root fields

    const orderPlans: IOrderPlanResponse[] = orderPlansRaw.map((p: any) => ({
      _id: p._id.toString(),
      orderId: p.orderId.toString(),
      planName: p.planId?.plan || "",
      planId: p.planId?._id?.toString() || "",
      emailType: p.emailTypeId?.name || "",
      serviceType: p.serviceType || "", 
      type: p.type || "",               // ← now ensures type is always included
      registrationDate: p.registrationDate,
      expiryDate: p.expiryDate,
      noOfUsers: p.noOfUsers,
    }));

    // Merge client and customer details
    const clientData = order.client ? {
      c_name: (order.client as any).c_name,
      c_email: (order.client as any).c_email,
      c_phone: (order.client as any).c_phone,
      c_company: (order.client as any).c_company,
      c_address: (order.client as any).c_address,
      c_city: (order.client as any).c_city,
      c_state: (order.client as any).c_state,
      c_country: (order.client as any).c_country,
      c_zipCode: (order.client as any).c_zipCode,
    } : {};

    const customerData = order.customer ? {
      name: (order.customer as any).name,
      email: (order.customer as any).email,
      phone: (order.customer as any).phone,
      company: (order.customer as any).company,
      address: (order.customer as any).address,
      city: (order.customer as any).city,
      state: (order.customer as any).state,
      country: (order.customer as any).country,
      zipCode: (order.customer as any).zipCode,
    } : {};

    const mergedCustomerDetails = { ...clientData, ...customerData };

    // Return full response
    res.status(200).json({
      success: true,
      data: {
        ...order.toObject(),
        customerDetails: mergedCustomerDetails,
        plans: orderPlans,
      },
    });
  } catch (err) {
    console.error("❌ Error fetching order:", err);
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});


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
        res.status(400).json({ success: false, message: "Invalid client" });
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
      if (!data.newCustomer.c_email || typeof data.newCustomer.c_email !== "string" || data.newCustomer.c_email.trim() === "") {
        res.status(400).json({ success: false, message: "New customer email is required and must be a valid string" });
        return;
      }

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
      res.status(400).json({ success: false, message: "Domain name is required" });
      return;
    }

    const existingOrder = await Order.findOne({ domainName: data.domainName });
    if (existingOrder) {
      res.status(400).json({ success: false, message: "Domain already exists" });
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
    if (data.emailPlans && Array.isArray(data.emailPlans)) {
      const plansToSave = await Promise.all(
        data.emailPlans.map(async (p: any) => {
          if (!p.email_service || !p.selected_plan) {
            throw new Error("Email type or selected plan is missing for a plan entry");
          }

          // Fetch the actual PlanEmail and TypeEmail documents
          const planDoc = await PlanEmail.findById(p.selected_plan);
          const emailTypeDoc = await TypeEmail.findById(p.email_service);

          if (!planDoc || !emailTypeDoc) {
            throw new Error("Invalid planId or emailTypeId");
          }

          return {
            orderId: savedOrder._id,
            planId: planDoc._id,
            emailTypeId: emailTypeDoc._id,
            registrationDate: p.registrationDate ? new Date(p.registrationDate) : new Date(),
            expiryDate: p.expiryDate ? new Date(p.expiryDate) : new Date(),
            noOfUsers: p.users || 1,
          };
        })
      );

      await OrderPlan.insertMany(plansToSave);
    }

    res.status(201).json({ success: true, data: savedOrder });
  } catch (err: any) {
    console.error(err);
    if (err.name === "ValidationError") {
      res.status(400).json({ success: false, error: err.message });
    } else if (err.code === 11000) {
      res.status(400).json({ success: false, error: "Domain already exists" });
    } else {
      res.status(500).json({ success: false, error: err.message });
    }
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

    const orders = await mongoose
      .model("Order")
      .find({ provider })
      .populate("client")     // ⭐ include related client data
      .populate("customer")   // for backward compatibility
      .exec();

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,           // ✔ identical to /api/orders response
    });

  } catch (err) {
    console.error(err);

    const message = err instanceof Error ? err.message : "Unknown error";

    res.status(500).json({
      success: false,
      error: message,
    });
  }
});


router.get(
  "/customer_order_details/:customerId",
  async (req: Request<{ customerId: string }>, res: Response): Promise<void> => {
    try {
      const { customerId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(customerId)) {
        res.status(400).json({ status: "ERROR", message: "Invalid customer ID" });
        return;
      }

      const client = await Client.findById(customerId);
      if (!client) {
        res.status(404).json({ status: "ERROR", message: "Customer not found" });
        return;
      }

      // Safely fetch state and country names
      let stateName = client.c_state;
      let countryName = client.c_country;

      // Try fetching by ObjectId if possible
      if (mongoose.Types.ObjectId.isValid(client.c_state)) {
        const state = await State.findById(client.c_state);
        if (state) stateName = state.name;
      } else {
        const state = await State.findOne({ name: client.c_state });
        if (state) stateName = state.name;
      }

      if (mongoose.Types.ObjectId.isValid(client.c_country)) {
        const country = await Country.findById(client.c_country);
        if (country) countryName = country.name;
      } else {
        const country = await Country.findOne({ name: client.c_country });
        if (country) countryName = country.name;
      }

      const clientWithNames = {
        ...client.toObject(),
        c_state_name: stateName,
        c_country_name: countryName,
      };

      // Fetch all orders for this client
      const orders = await mongoose
        .model<IOrder>("Order")
        .find({ client: customerId })
        .sort({ createdAt: -1 });

      res.json({ status: "SUCCESS", client: clientWithNames, orders });
    } catch (err) {
      console.error("❌ Error fetching customer orders:", err);
      res.status(500).json({ status: "ERROR", message: "Server error" });
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
