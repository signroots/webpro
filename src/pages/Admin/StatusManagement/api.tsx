// src/api/status.ts
import axios from "axios";

// Status interface
export interface Status {
  _id: string;
  name: string;
  is_active: boolean;
  typeEmail: {
    _id: string;
    name: string;
  };
}

const API_URL = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
  baseURL: `${API_URL}/api/status`,
  headers: { "Content-Type": "application/json" },
});

// ✅ Custom type guard for Axios errors
const isAxiosError = (error: unknown): error is { response?: { data?: any }; message: string } => {
  return (error as any)?.isAxiosError !== undefined || (error as any)?.response !== undefined;
};

const handleError = (error: unknown) => {
  if (isAxiosError(error)) {
    console.error("API Error:", (error as any).response?.data || (error as any).message);
    throw (error as any).response?.data || error;
  } else {
    console.error("Unexpected Error:", error);
    throw error;
  }
};

// ✅ Fetch all statuses
export const fetchStatuses = async (): Promise<Status[]> => {
  try {
    const res = await api.get("/");
    return (res.data.data || res.data || []) as Status[];
  } catch (error: unknown) {
    handleError(error);
    return [];
  }
};

// ✅ Fetch one status
export const fetchStatusById = async (id: string): Promise<Status> => {
  try {
    const res = await api.get(`/${id}`);
    return (res.data.data || res.data) as Status;
  } catch (error: unknown) {
    handleError(error);
    throw error;
  }
};

// ✅ Create status
export const createStatus = async (data: {
  name: string;
  is_active: boolean;
  typeEmail: string;
}): Promise<Status> => {
  try {
    const res = await api.post("/", data);
    return (res.data.data || res.data) as Status;
  } catch (error: unknown) {
    handleError(error);
    throw error;
  }
};
// ✅ Update status
export const updateStatus = async (
  id: string,
  data: {
    name: string;
    is_active: boolean;
    typeEmail: string;
  }
): Promise<Status> => {
  try {
    const res = await api.put(`/${id}`, data);
    return (res.data.data || res.data) as Status;
  } catch (error: unknown) {
    handleError(error);
    throw error;
  }
};
// ✅ Delete status
export const deleteStatus = async (id: string): Promise<void> => {
  try {
    await api.delete(`/${id}`);
  } catch (error: unknown) {
    handleError(error);
    throw error;
  }
};
