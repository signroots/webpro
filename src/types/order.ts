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

export interface Order {
  _id: string;
  domainName: string;

  lockStatus?: string;
  status?: string;
  order_status?: string;

  users?: number;
  domain_flag?: boolean;
  managedBy?: string;

  registrationDate?: string;
  expiryDate?: string;

  domainSource?: {
    _id: string;
    name: string;
    code: string;
    image?: string;
  };

  google_email?: boolean;
  microsoft_email?: boolean;
  cloudflareRegistered?: boolean;
  hosting?: boolean;
  email_flag?: boolean;
  website_flag?: boolean;
  ssl_flag?: boolean;
  host_flag?: boolean;
  msoffice_services_flag?: boolean;

  customer?: Customer | null;
  client?: Client | null;

  subResellerName?: string;
  subResellerEmail?: string;
  subscription?: string;
  provider?: string;
  email_status?: string;

  emailPlans?: {
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
    createdAt: string;
    updatedAt: string;
  }[];

  plans?: {
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
  }[];

  email_service?: "Google Workspace" | "Microsoft 365";
  email_expiryDate?: string;

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

  Plans?: {
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
  }[];
}
