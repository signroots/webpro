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
export interface Order {
  _id: string;
  domainName: string;
  lockStatus?: string;
  status?: string;
  registrationDate?: string;
  expiryDate?: string;
  customer?: Customer | null;
}

interface CustomerOrdersResponse {
  status: "SUCCESS" | "ERROR";
  customer: Customer;
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

export const updateCustomer = async (
  customerId: string,
  data: Partial<Omit<Customer, "resellerCustomerId">>
) => {
  try {
    const res = await axios.post(
      `${API_BASE_URL}/api/customers/reseller_customer/${customerId}`,
      data
    );
    return res.data;
  } catch (err) {
    console.error("❌ Error updating customer (local + reseller):", err);
    throw err;
  }
};
