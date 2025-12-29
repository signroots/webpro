import axios from "axios";

/* ===================== BASIC CUSTOMER (LIST / READ) ===================== */
export interface Customer {
  _id: string;
  name: string;
  email: string[];
  phone: string;
  phoneCc?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  company?: string;
  resellerCustomerId?: string;
}

/* ===================== UPDATE CUSTOMER (PAYLOAD) ===================== */
/**
 * IMPORTANT:
 * - c_country MUST be ObjectId string
 * - c_email MUST be array
 */
export interface ICustomer {
  _id?: string;
  is_customer?: boolean;
  resellerCustomerId?: string;
  password?: string;

  c_name?: string;
  c_email: string[];        // ✅ FIXED (ARRAY)
  c_phone?: string;
  c_phoneCc?: string;

  c_company?: string;
  c_address?: string;
  c_address2?:string;
  c_city?: string;
  c_state?: string;

  c_country?: string;
  c_countryCode?:string;        // ✅ ObjectId ONLY
  c_zipCode?: string;
  c_gst?: string;
  c_bankAccountPayment?:string;
  c_salutation?:string;
  c_placeOfContact?:string;
  c_placeOfContactWithStateCode?:string;
  c_portalEnabled?:boolean;
}

/* ===================== CLIENT (FRONTEND MODEL) ===================== */
export interface Client {
  _id: string;

  c_name: string;
  c_email: string[];         // ✅ FIXED (ARRAY)
  c_phone: string;
  c_phoneCc?: string;

  c_address?: string;
  c_address2?:string;
  c_city?: string;
  c_state?: string;

  c_country?: string;        // ✅ ObjectId (used for update)
  c_country_name?: string;   // ✅ Display only
  c_state_name?: string;
  c_countryCode?:string;

  c_zipCode?: string;
  c_company?: string;
  c_gst?: string;
    c_salutation?: string;
    c_bankAccountPayment?:string;
    c_placeOfContact?:string;
    c_placeOfContactWithStateCode?:string;
    c_portalEnabled?:boolean;
}

/* ===================== ORDER ===================== */
export interface Order {
  _id: string;
  domainName: string;
  domainSource: string;

  microsoft_email: boolean;
  google_email: boolean;
  msoffice_services_flag: boolean;

  lockStatus?: string;
  status?: string;
  registrationDate?: string;
  expiryDate?: string;

  customer?: Customer | null;
  client?: Client | null;
}

/* ===================== API RESPONSE ===================== */
interface CustomerOrdersResponse {
  status: "SUCCESS" | "ERROR";
  customer: Customer;
  client: any;               // backend sends populated object
  orders: Order[];
  message?: string;
}

/* ===================== API ===================== */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/* ===================== FETCH CUSTOMER ORDERS ===================== */
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

/* ===================== UPDATE CUSTOMER ===================== */
export const updateCustomer = async (
  id: string,
  data: Partial<ICustomer>
): Promise<ICustomer> => {
  const res = await axios.put<ICustomer>(
    `${API_BASE_URL}/api/client/${id}`,
    data
  );
  return res.data;
};
