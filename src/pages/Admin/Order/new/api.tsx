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
  email_registrationDate: string;
  provider: string;
    customer?: { _id: string; name: string; email: string }
}

export interface Client {
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
export interface Client {
  _id: string;
  c_name?: string;
  c_email?: string;
  c_phone?: string;
  c_company?: string;
  c_address?: string;
  c_city?: string;
  c_country?: string;

}
const getToken = (): string | null => {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("authToken")
  );
};
// ✅ Create a new order (POST)
export const createOrder = async (
  orderData: Partial<Order>
): Promise<Order> => {

  console.log("========== CREATE ORDER START ==========");

  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("authToken");

  console.log("TOKEN:", token);
  console.log("TOKEN EXISTS:", !!token);
  console.log("API URL:", `${FULL_API_URL}/orders`);

  try {
    const response = await axios.post(
      `${FULL_API_URL}/orders`,
      orderData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      }
    );

    console.log("CREATE ORDER SUCCESS:", response.data);

    return response.data.data;

  } catch (error: any) {

    console.log("CREATE ORDER ERROR:", error.response?.data);
    console.log("CREATE ORDER STATUS:", error.response?.status);

    throw error;
  }
};
// ✅ Get existing customers
export const getExistingCustomers = async (): Promise<Client[]> => {

  const token = localStorage.getItem("token");

  const response = await axios.get(
    `${FULL_API_URL}/orders/existing_customers`,
    {
      headers:{
        Authorization:`Bearer ${token}`
      }
    }
  );

  return response.data.data;
};
// ✅ Get all active email types
export const getEmailTypes = async (): Promise<any[]> => {
  try {
    const response = await axios.get(`${FULL_API_URL}/typeemail`, {
      timeout: 5000, // 5-second timeout
    });

    if (response.data.success) {
      // Return only active email types
      return response.data.data.filter((t: any) => t.isActive);
    } else {
      throw new Error(response.data.message || "Failed to load email types");
    }
  } catch (err: any) {
    if (err.code === "ECONNABORTED") {
      throw new Error("⏳ Connection timed out. Please check the backend server.");
    } else if (err.code === "ERR_NETWORK") {
      throw new Error("🚫 Cannot connect to the server. Please check your backend.");
    } else {
      throw new Error("⚠️ Something went wrong while loading email types.");
    }
  }
};

// ✅ Get all hosting types
export const getHostTypes = async (): Promise<any[]> => {
  try {
    const response = await axios.get(`${FULL_API_URL}/hosttypes`, {
      timeout: 5000, // optional safety timeout
    });

    if (response.data.success) {
      return response.data.data; // return all types
    } else {
      throw new Error(response.data.message || "Failed to load hosting types");
    }
  } catch (err: any) {
    if (err.code === "ECONNABORTED") {
      throw new Error("⏳ Connection timed out. Please check the backend server.");
    } else if (err.code === "ERR_NETWORK") {
      throw new Error("🚫 Cannot connect to the server. Please check your backend.");
    } else {
      throw new Error("⚠️ Something went wrong while loading hosting types.");
    }
  }
};

// ✅ Get plans by email type
export const getPlansByEmailType = async (typeId: string): Promise<any[]> => {
  try {
    const response = await axios.get(`${FULL_API_URL}/plans/planlist/${typeId}`, {
      timeout: 5000, // optional safety timeout
    });

    if (response.data.success) {
      // Return only active plans
      return response.data.data.filter((p: any) => p.isActive);
    } else {
      throw new Error(response.data.message || "Failed to load plans");
    }
  } catch (err: any) {
    if (err.code === "ECONNABORTED") {
      throw new Error("⏳ Connection timed out. Please check the backend server.");
    } else if (err.code === "ERR_NETWORK") {
      throw new Error("🚫 Cannot connect to the server. Please check your backend.");
    } else {
      throw new Error("⚠️ Something went wrong while loading plans.");
    }
  }
};

// ✅ Fetch host subtypes by type ID
export const getHostSubTypes = async (hostTypeId: string) => {
  const response = await axios.get(`${FULL_API_URL}/hostsubtype/subhosttypelist/${hostTypeId}`);
  return response.data.data || [];
};

// ✅ Fetch storage list by host type ID
export const getStoragesByHostType = async (hostTypeId: string) => {
  const response = await axios.get(`${FULL_API_URL}/storage/storagelist/${hostTypeId}`);
  return response.data.data || [];
};
