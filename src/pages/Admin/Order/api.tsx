import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const FULL_API_URL = `${API_BASE_URL}/api`;

export interface Order {
  _id: string;
  domainName: string;
  status?: string;
  managedBy: "Signroots" | "Customer";
  registrationDate: string;
  expiryDate: string;
  subscription: string;
  plan: string;
  email_status: string;
  username: string;
  password: string;
  users: number;
  email_customer: string;
  provider: string;
  customer?: {
    _id: string;
   c_name: string;
  c_email: string;
   
  };
}
interface TypeEmail {
  _id: string;
  name: string;
  isActive: boolean;
}

const token = localStorage.getItem("token");
export const fetchOrders = async (): Promise<Order[]> => {
  const token = localStorage.getItem("token");  // always fresh token

  const response = await axios.get(`${FULL_API_URL}/orders`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data.data;
};
// ✅ Fetch DNS Orders (Cloudflare filter)
// api.tsx
export const fetchDNSOrders = async () => {
  const token = localStorage.getItem("token"); 
  const response = await axios.get(`${API_BASE_URL}/api/orders/dnsorders?filter=DNSCloudflare`,{
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response?.data?.data || [];
};

// ✅ Fetch orders by provider (Google Workspace or Microsoft 365)
export const fetchOrdersByProvider = async (provider: string): Promise<Order[]> => {
  const response = await axios.get(`${FULL_API_URL}/orders/provider/${encodeURIComponent(provider)}`);
  return response.data.data;
};

// ✅ Create a new order (POST)
export const createOrder = async (orderData: Partial<Order>): Promise<Order> => {
  const response = await axios.post(`${FULL_API_URL}/orders`, orderData);
  return response.data.data;
};
export const fetchCustomerOrders = async (customerId: string) => {
  const token = localStorage.getItem("token"); // fresh token
  const res = await fetch(`${API_BASE_URL}/api/orders/customer_order_details/${customerId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error("Failed to fetch customer orders");
  const data = await res.json();
  return data;
};

export const fetchCustomerOrder = async (id: string) => {
  const token = localStorage.getItem("token"); // fresh token
  const res = await fetch(`${API_BASE_URL}/api/orders/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error("Failed to fetch customer order");
  const data = await res.json();
  return data;
};
export const fetchOrderById = async (id: string): Promise<Order> => {
  const response = await axios.get(`${API_BASE_URL}/${id}`);
  return response.data;   // ❌ This returns { success, data }
};
// ✅ Update order (PUT)
export const updateOrder = async (id: string, data: Partial<Order>): Promise<Order> => {
  const token = localStorage.getItem("token"); // always fresh token
  const response = await axios.put(`${FULL_API_URL}/orders/${id}`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data.data; // assuming your backend returns { success, data }
};
// Fetch plans by Email Type ID
// Fetch plans by Email Type ID
export const fetchPlanEmailsByType = async (emailTypeId: string): Promise<any[]> => {
  const res = await axios.get(`${FULL_API_URL}/plans/planlist/${emailTypeId}`);
  return res.data.data; // array of plan objects
};
