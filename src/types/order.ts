export interface Customer {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
  city?: string;
  country?: string;
}

export interface Client {
  _id: string;
  c_name?: string;
  c_email?: string[];
  c_phone?: string;
  c_company?: string;
  c_address?: string;
  c_city?: string;
  c_country?: string;
}

export interface ICountry {
  _id: string;
  name: string;
}

export interface MSOfficeDetails {
  _id: string;
  orderId: string;
  planName: string;
  emailType: string;
  noOfUsers: number;
  serviceType: string;
  type: string;
  registrationDate: string;
  expiryDate: string;
  planId?: string;
}

/* =========================================================
   STATUS TYPE
========================================================= */

export interface Status {
  _id: string;
  name: string;
  code?: string;
  type: "order" | "plan" | "domain";
  is_active?: boolean;
}

/* =========================================================
   PLAN TYPE
========================================================= */

export interface OrderPlan {
  _id: string;
  orderId?: string;

  planName?: string;
  emailType?: string;
  emailTypeImage?: string;

  noOfUsers?: number;

  serviceType?: string;

  type:
    | "email"
    | "storage"
    | "msoffice"
    | "hosting"
    | "website"
    | "ssl"
    | string;

  registrationDate?: string;
  expiryDate?: string;

  planId?: string;

  /*
   * IMPORTANT:
   * Plan icon status must use ONLY this status.
   */
  primary_status?: Status | null;

  /*
   * Optional fields already used in some API responses
   */
  primaryStatus?: Status | string | null;
  status?: Status | string | null;

  isTransferred?: boolean;
}

/* =========================================================
   EMAIL PLAN TYPE
========================================================= */

export interface EmailPlan {
  _id: string;
  orderId: string;

  planId: {
    _id: string;
    plan: string;
    emailType: string;
    isActive: boolean;
  };

  emailTypeId: {
    _id: string;
    name: string;
  };

  registrationDate: string;
  expiryDate: string;
  noOfUsers: number;

  type:
    | "email"
    | "storage"
    | "msoffice"
    | "hosting"
    | "website"
    | "ssl";

  adminEmail: string;
  adminPassword: string;

  status: string;

  /*
   * Plan status
   */
  primary_status?: Status | null;

  createdAt: string;
  updatedAt: string;
}

/* =========================================================
   MAIN ORDER TYPE
========================================================= */

export interface Order {
  _id: string;

  domainName: string;

  lockStatus?: string;

  /*
   * General order status
   */
  status?: Status | null;

  /*
   * IMPORTANT:
   * Domain icon must use ONLY domain_status.
   */
  domain_status?: Status | null;

  /*
   * Archived status
   */
  archived_status?: Status | null;

  /*
   * Order status
   *
   * This should NOT be used for deciding whether
   * domain / plan icons are disabled.
   */
  order_status?: Status | null;

  users?: number;

  domain_flag?: boolean;

  managedBy?: string;

  registrationDate?: string;

  expiryDate?: string;

  /* =======================================================
     DOMAIN SOURCE
  ======================================================= */

  domainSource?: {
    _id: string;
    name: string;
    code: string;
    image?: string;
  };

  /* =======================================================
     SERVICE FLAGS
  ======================================================= */

  google_email?: boolean;

  microsoft_email?: boolean;

  cloudflareRegistered?: boolean;

  hosting?: boolean;

  email_flag?: boolean;

  website_flag?: boolean;

  ssl_flag?: boolean;

  host_flag?: boolean;

  msoffice_services_flag?: boolean;

  /* =======================================================
     CUSTOMER / CLIENT
  ======================================================= */

  customer?: Customer | null;

  client?: Client | null;

  /* =======================================================
     SUB RESELLER
  ======================================================= */

  subResellerName?: string;

  subResellerEmail?: string;

  subscription?: string;

  provider?: string;

  email_status?: string;

  /* =======================================================
     EMAIL PLANS
  ======================================================= */

  emailPlans?: EmailPlan[];

  /* =======================================================
     NORMAL PLANS
  ======================================================= */

  plans?: OrderPlan[];

  /* =======================================================
     EMAIL SERVICE
  ======================================================= */

  email_service?:
    | "Google Workspace"
    | "Microsoft 365";

  email_expiryDate?: string;

  /* =======================================================
     NEW CUSTOMER
  ======================================================= */

  newCustomer?: {
    c_salutation?: string;

    c_firstName?: string;

    c_lastName?: string;

    c_name?: string;

    c_email?: string[];

    c_phone?: string;

    c_company?: string;

    c_address?: string;

    c_address2?: string;

    c_city?: string;

    c_state?: string;

    c_country?: string;

    c_countryCode?: string;

    c_zipCode?: string;

    c_gst?: string;

    c_bankAccountPayment?: string;

    c_placeOfContact?: string;

    c_placeOfContactWithStateCode?: string;

    c_portalEnabled?: boolean;
  };

  /* =======================================================
     DISPLAY PLANS
  ======================================================= */

  Plans?: Array<
    OrderPlan & {
      type:
        | "email"
        | "storage"
        | "msoffice"
        | "hosting"
        | "website"
        | "ssl";

      expiryDate: string;

      emailType: string;

      emailTypeImage: string;

      planId: string;
    }
  >;
}