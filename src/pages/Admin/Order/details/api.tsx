import axios from "axios";

export interface Customer
{
   _id: string; 
  name: string;
  email: string;
  phone: string;
  phoneCc?: string; // optional
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string; // ✅ match backend
  company?: string;
  resellerCustomerId?: string;
}
export interface ICustomer {
  _id?: string;
  is_customer?: boolean;
  resellerCustomerId?: string;
  password?: string;
  c_name?: string;
  c_email?: string;
  c_phone?: string;
  c_company?: string;
  c_address?: string;
  c_city?: string;
  c_state?: string;
  c_country?: string;
  c_zipCode?: string;
  c_gst?: string;
}

export interface Client
{
   _id: string; 
  c_name: string;
  c_email: string;
  c_phone: string;
  c_phoneCc?: string; // optional
  c_address?: string;
  c_city?: string;
  c_state?: string;
  c_country?: string;
  c_zipCode?: string; // ✅ match backend
  c_company?: string;
  c_country_name?: string;
  c_state_name?: string
  c_gst?: string;


}
export interface Order {
  _id: string;
  domainName: string;
  domainSource:string;
  microsoft_email:boolean;
  google_email:boolean;
  msoffice_services_flag:boolean;
  lockStatus?: string;
  status?: string;
  registrationDate?: string;
  expiryDate?: string;
  customer?: Customer | null;
  client?: Client | null;
}

interface CustomerOrdersResponse {
  status: "SUCCESS" | "ERROR";
  customer: Customer;
  client: Client;
  orders: Order[];
  message?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const fetchCustomerOrders = async (
  customerId: string
): Promise<CustomerOrdersResponse> => {
  try {
    const res = await fetch(
      `${API_BASE_URL}/api/orders/customer_order_details/${customerId}`
    );
    return await res.json();
  } catch (err) {
    console.error("❌ Error fetching customer orders:", err);
    throw err;
  }
};

export const updateCustomer = async (id: string, data: Partial<ICustomer>): Promise<ICustomer> => {
  const res = await axios.put<ICustomer>(`${API_BASE_URL}/api/client/${id}`, data);
  return res.data;
};

