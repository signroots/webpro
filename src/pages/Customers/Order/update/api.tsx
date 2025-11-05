import axios from "axios";

// Base API URL (adjust if needed)
const API_BASE_URL = "http://192.168.220.37:5000/api/orders";

// Define Order interface for TypeScript
export interface Order {
  _id: string;
  domainName: string;
  status?: string;
  customer?: string;
  registrarName?: string;
  managedBy: "Signroots" | "Customer";
  registrationDate?: string;
  expiryDate?: string;
  originalRegistrar?: string;
  reseller_outside_inside?: string;
  reseller_id?: number;
  nameServers?: string[];
  dnsDetails?: string[];
  lockStatus?: string;
  domainSource?: string[];
  resellerCustomerId?: string;
  businessEmail?: boolean;
  hosting?: boolean;
  subResellerName?: string;
  subResellerEmail?: string;
  cloudflareRegistered?: boolean;
  modified_on?: string;
  created_on?: string;
  activated_on?: string;
  order_id?: string;
  subscription?: string;
  plan?: string;
  email_status?: string;
  username?: string;
  password?: string;
  users?: number;
  creationDate?: string | null;
  email_expiryDate?: string | null;
  email_customer?: string;
  provider?: string;
  google_email?: boolean;
  microsoft_email?: boolean;
  email_flag?: boolean;
  website_flag?: boolean;
  domain_flag?: boolean;
  ssl_flag?: boolean;
  host_flag?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ✅ Fetch single order
export const fetchOrderById = async (id: string): Promise<Order> => {
  const response = await axios.get(`${API_BASE_URL}/${id}`);
  return response.data;
};

// ✅ Update order (PUT)
export const updateOrder = async (id: string, data: Partial<Order>): Promise<Order> => {
  const response = await axios.put(`${API_BASE_URL}/${id}`, data);
  return response.data;
};

// ✅ Partial update (PATCH) if you want
export const patchOrder = async (id: string, data: Partial<Order>): Promise<Order> => {
  const response = await axios.patch(`${API_BASE_URL}/${id}`, data);
  return response.data;
};
