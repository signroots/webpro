import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// ---------------- Interfaces ----------------
export interface ICustomer {
  _id?: string;

  // ---------------- System ----------------
  is_customer?: boolean;
  resellerCustomerId?: string;

  // ---------------- Auth ----------------
  password?: string;
  encryptedPassword?: string;
  generatedPassword?: string;

  // ---------------- Personal ----------------
  c_salutation?: string;
  c_firstName?: string;
  c_lastName?: string;
  c_name?: string;

  // ---------------- Contact ----------------
  c_email?: string | string[];
  c_phone?: string;
  c_mobilePhone?: string;

  // ---------------- Company ----------------
  c_company?: string;
  c_gst?: string;

  // ---------------- Address ----------------
  c_address?: string;
  c_address2?: string;
  c_city?: string;
  c_zipCode?: string;

  c_state?: string | {
    _id: string;
    name: string;
    code?: string;
  };

  c_country?: string | {
    _id: string;
    name: string;
    code?: string;
  };
c_countryCode?:string;
  // ---------------- Settings ----------------
  c_status?: string;
  c_bankAccountPayment?: string;
  c_portalEnabled?: boolean;

  c_placeOfContact?: string;
  c_placeOfContactWithStateCode?: string;

  // ---------------- API helpers ----------------
  success?: boolean;
  error?: string;
}

// ✅ Define a proper API response type
export interface ICustomerResponse {
  success: boolean;
  data: ICustomer;
  generatedPassword?: string;
  error?:string;
}
export interface ICountryCodeResponse {
  success: boolean;
  data: string[];
}

export interface ICountry {
  _id: string;
  name: string;
  code?: string;
}

export interface IState {
  _id: string;
  name: string;
  code?: string;
}

// ---------------- Customer APIs ----------------

// Fetch all customers
export const fetchCustomers = async (): Promise<ICustomer[]> => {
  const res = await axios.get<ICustomer[]>(`${API_BASE_URL}/api/client`);
  return res.data;
};

// ✅ Create customer (correct response type)
// ✅ Create customer (handles both success and error responses)
export const createCustomer = async (
  data: Partial<ICustomer>
): Promise<ICustomerResponse> => {
  try {
    const res = await axios.post<ICustomerResponse>(`${API_BASE_URL}/api/client`, data);
    return res.data; // e.g. { success: true, data: {...} }
  } catch (err: any) {
    if (err.response && err.response.data) {
      // backend sent structured error response
      return err.response.data; // e.g. { success: false, error: "Customer email is required." }
    }
    console.error("createCustomer error:", err);
    return { success: false, data: {} as ICustomer, error: "Network or server error" };
  }
};


// Update customer
export const updateCustomer = async (
  id: string,
  data: Partial<ICustomer>
): Promise<ICustomer> => {
  const res = await axios.put<ICustomer>(`${API_BASE_URL}/api/client/${id}`, data);
  return res.data;
};

// Delete customer
export const deleteCustomer = async (id: string): Promise<{ message: string }> => {
  const res = await axios.delete<{ message: string }>(`${API_BASE_URL}/api/client/${id}`);
  return res.data;
};


// ---------------- Country / State APIs ----------------

// Fetch countries
export const fetchCountries = async (): Promise<{ code: string; name: string }[]> => {
  const res = await axios.get<ICountry[]>(`${API_BASE_URL}/api/settings/countries`);

  return res.data.map((c) => ({
    code: c._id || "",
    name: c.name || "",
  }));
};

// Fetch states by country
export const fetchStatesByCountry = async (
  countryId: string
): Promise<{ code: string; name: string }[]> => {
  const res = await axios.get<IState[]>(
    `${API_BASE_URL}/api/settings/states-by-country`,
    { params: { countryId } }
  );

  return res.data.map((s) => ({
    code: s._id!,
    name: s.name,
  }));
};
// Fetch country phone codes
export const fetchCountryCodes = async (): Promise<string[]> => {
  const res = await axios.get<ICountryCodeResponse>(
    `${API_BASE_URL}/api/client/client-country-codes`
  );

  if (!res.data.success) return [];

  // Clean & normalize country codes
  return res.data.data
    .filter((c) => c && c.trim() !== "")
    .map((c) => (c.startsWith("+") ? c : `+${c}`))
    .sort((a, b) => a.localeCompare(b));
};