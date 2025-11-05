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
    customer?: { _id: string; name: string; email: string }
}

export interface Customer {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: string;
  city?: string;
  country?: string;
  c_name?: string;
  c_email?: string;
  c_phone?: string;
  c_company?: string;
  c_address?: string;
  c_city?: string;
  c_country?: string;

}

// ✅ Create a new order (POST)
export const createOrder = async (orderData: Partial<Order>): Promise<Order> => {
  const response = await axios.post(`${FULL_API_URL}/orders`, orderData);
  return response.data.data;
};

// ✅ Get existing customers
export const getExistingCustomers = async (): Promise<Customer[]> => {
  const response = await axios.get(`${FULL_API_URL}/orders/existing_customers`);
  return response.data.data; // Only the data array
};
