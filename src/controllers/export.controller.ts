import { Request, Response } from "express";
import ExcelJS from "exceljs";
import Order from "../models/Order";
import { OrderPlan } from "../models/OrderPlan";

export const exportOrders = async (req: Request, res: Response) => {
  try {
    const orders = await Order.find()
      .populate("customer", "customerName")
      .populate("client", "clientName")
      .populate("registrarName", "name")
      .populate("emailtypeid", "name")
      .populate("planid", "planName")
      .populate("hosttypeid", "name")
      .populate("subHostTypeId", "name")
      .populate("hoststorageId", "name")
      .lean();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Orders");

    worksheet.columns = [
      { header: "Domain", key: "domainName", width: 30 },
      { header: "Customer", key: "customer", width: 25 },
      { header: "Client", key: "client", width: 25 },
      { header: "Managed By", key: "managedBy", width: 15 },
      { header: "Registration Date", key: "registrationDate", width: 18 },
      { header: "Expiry Date", key: "expiryDate", width: 18 },

      { header: "Subscription", key: "subscription", width: 20 },
      { header: "Email Status", key: "email_status", width: 20 },
      { header: "Username", key: "username", width: 25 },
      { header: "Password", key: "password", width: 25 },
      { header: "Users", key: "users", width: 10 },
      { header: "Email Customer", key: "email_customer", width: 25 },
      { header: "Provider", key: "provider", width: 20 },

      { header: "Business Email", key: "businessEmail", width: 15 },
      { header: "Hosting", key: "hosting", width: 15 },
      { header: "Google Email", key: "google_email", width: 15 },
      { header: "Microsoft Email", key: "microsoft_email", width: 18 },

      { header: "Website Flag", key: "website_flag", width: 15 },
      { header: "Domain Flag", key: "domain_flag", width: 15 },
      { header: "SSL Flag", key: "ssl_flag", width: 15 },
      { header: "Host Flag", key: "host_flag", width: 15 },
      { header: "Storage Flag", key: "storage_services_flag", width: 15 },
      { header: "MS Office Flag", key: "msoffice_services_flag", width: 18 },
      { header: "DNS Flag", key: "dns_flag", width: 15 },

      { header: "Name Servers", key: "nameServers", width: 35 },
      { header: "DNS Details", key: "dnsDetails", width: 35 },

      { header: "Registrar", key: "registrar", width: 20 },
      { header: "Original Registrar", key: "originalRegistrar", width: 20 },

      { header: "Cloudflare", key: "cloudflareRegistered", width: 15 },

      { header: "Created On", key: "created_on", width: 20 },
      { header: "Modified On", key: "modified_on", width: 20 },
      { header: "Activated On", key: "activated_on", width: 20 },
      { header: "Order ID", key: "order_id", width: 20 },

      { header: "Plan", key: "plan", width: 20 },
      { header: "Email Type", key: "emailType", width: 20 },

      { header: "Plan Registration", key: "planRegistration", width: 20 },
      { header: "Plan Expiry", key: "planExpiry", width: 20 },
      { header: "Plan Users", key: "planUsers", width: 15 },
      { header: "Plan Type", key: "planType", width: 15 },
      { header: "Admin Email", key: "adminEmail", width: 25 },
      { header: "Admin Password", key: "adminPassword", width: 25 },
      { header: "Plan Status", key: "planStatus", width: 20 },
    ];

    for (const order of orders) {
      const plans = await OrderPlan.find({ orderId: order._id })
        .populate("planId", "planName")
        .populate("emailTypeId", "name")
        .lean();

      if (plans.length === 0) {
        worksheet.addRow({
          domainName: order.domainName,
          customer: (order.customer as any)?.customerName || "",
          client: (order.client as any)?.clientName || "",
          managedBy: order.managedBy,
          registrationDate: order.registrationDate,
          expiryDate: order.expiryDate,
          subscription: order.subscription,
          email_status: order.email_status,
          username: order.username,
          password: order.password,
          users: order.users,
          email_customer: order.email_customer,
          provider: order.provider,
          businessEmail: order.businessEmail,
          hosting: order.hosting,
          google_email: order.google_email,
          microsoft_email: order.microsoft_email,
          website_flag: order.website_flag,
          domain_flag: order.domain_flag,
          ssl_flag: order.ssl_flag,
          host_flag: order.host_flag,
          storage_services_flag: order.storage_services_flag,
          msoffice_services_flag: order.msoffice_services_flag,
          dns_flag: order.dns_flag,
          nameServers: order.nameServers?.join(", "),
          dnsDetails: order.dnsDetails?.join(", "),
          registrar: (order.registrarName as any)?.name || "",
          originalRegistrar: order.originalRegistrar,
          cloudflareRegistered: order.cloudflareRegistered,
          created_on: order.created_on,
          modified_on: order.modified_on,
          activated_on: order.activated_on,
          order_id: order.order_id,
        });
      } else {
        for (const plan of plans) {
          worksheet.addRow({
            domainName: order.domainName,
            customer: (order.customer as any)?.customerName || "",
            client: (order.client as any)?.clientName || "",
            managedBy: order.managedBy,
            registrationDate: order.registrationDate,
            expiryDate: order.expiryDate,
            subscription: order.subscription,
            email_status: order.email_status,
            username: order.username,
            password: order.password,
            users: order.users,
            email_customer: order.email_customer,
            provider: order.provider,
            businessEmail: order.businessEmail,
            hosting: order.hosting,
            google_email: order.google_email,
            microsoft_email: order.microsoft_email,
            website_flag: order.website_flag,
            domain_flag: order.domain_flag,
            ssl_flag: order.ssl_flag,
            host_flag: order.host_flag,
            storage_services_flag: order.storage_services_flag,
            msoffice_services_flag: order.msoffice_services_flag,
            dns_flag: order.dns_flag,
            nameServers: order.nameServers?.join(", "),
            dnsDetails: order.dnsDetails?.join(", "),
            registrar: (order.registrarName as any)?.name || "",
            originalRegistrar: order.originalRegistrar,
            cloudflareRegistered: order.cloudflareRegistered,
            created_on: order.created_on,
            modified_on: order.modified_on,
            activated_on: order.activated_on,
            order_id: order.order_id,

            plan: (plan.planId as any)?.planName || "",
            emailType: (plan.emailTypeId as any)?.name || "",
            planRegistration: plan.registrationDate,
            planExpiry: plan.expiryDate,
            planUsers: plan.noOfUsers,
            planType: plan.type,
            adminEmail: plan.adminEmail,
            adminPassword: plan.adminPassword,
            planStatus: plan.status,
          });
        }
      }
    }

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=Orders.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Export failed" });
  }
};