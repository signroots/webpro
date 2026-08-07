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
export interface DomainSource {
  _id: string;
  name: string;
  code: string;
  image?: string;
}
export interface ApiPerson {
  _id?: string;
  c_name?: string;
  c_email?: string[] | string;
  c_phone?: string;
  c_company?: string;
  c_address?: string;
  c_city?: string;
  c_state?: { name?: string };
  c_country?: { name?: string };
}

export interface OrderApiResponse {
  _id: string;
  domainName: string;
  status?: string;
  managedBy?: string;
  registrationDate?: string;
  expiryDate?: string;
 domainSource?: DomainSource | null;

  customer?: ApiPerson | null;
  client?: ApiPerson | null;

  [key: string]: any; // allow other backend fields
}

const token = localStorage.getItem("token");
// orders/api.ts (or ./api.ts – wherever fetchOrders is defined)

export const fetchOrders = async (
  params:{
    search?: string;
    emailType?: string;
    page?: number;
    limit?: number;
  } = {}
): Promise<{
  data: Order[];
  totalPages: number;
  total: number;
}> => {

  const token = localStorage.getItem("token");

  const queryParams:any = {
    search: params.search || "",
  };


  // emailType filter ആണെങ്കിൽ pagination വേണ്ട
  if(params.emailType){

    queryParams.emailType = params.emailType;

  } else {

    queryParams.page = params.page || 1;
    queryParams.limit = params.limit || 50;

  }


  const response = await axios.get(
    `${FULL_API_URL}/orders`,
    {
      headers:{
        Authorization:`Bearer ${token}`,
      },

      params: queryParams

    }
  );


  return {

    data: response.data.data,

    totalPages:
      response.data.pagination?.totalPages || 1,

    total:
      response.data.pagination?.total || response.data.data.length,

  };

};

// ✅ Fetch DNS Orders (Cloudflare filter)
// api.tsx
export const fetchDNSOrders = async () => {
  const token = localStorage.getItem("token"); 
  const response = await axios.get(`${API_BASE_URL}/api/orders/dnsorders?filter=DNS-Cloudflare`,{
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response?.data?.data || [];
};
export const fetchRenewListOrders = async (
  month: "previous" | "current" | "next" = "current"
) => {
  const token = localStorage.getItem("token");

  return axios.get(
    `${import.meta.env.VITE_API_BASE_URL}/api/orders/orders-by-month?month=${month}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
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
export const fetchOrderById = async (
  id: string
): Promise<OrderApiResponse> => {

  const token = localStorage.getItem("token");

  const response = await axios.get(
    `${API_BASE_URL}/api/orders/${id}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  return response.data.data;
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
