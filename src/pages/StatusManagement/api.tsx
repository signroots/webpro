import axios from "axios"; 
interface Status {
  _id: string;
  name: string;
  is_active: boolean;
}

const API_URL = "http://localhost:5000/api/status";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const handleError = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    console.error("API Error:", error.response?.data || error.message);
    throw error.response?.data || error;
  } else {
    console.error("Unexpected Error:", error);
    throw error;
  }
};
export const fetchStatuses = async (): Promise<Status[]> => {
  try {
    const res = await api.get("/");
    return res.data as Status[];
  } catch (error: unknown) {
    handleError(error);
    return [];
  }
}

export const fetchStatusById = async (id: string): Promise<Status> => {
  try {
    const res = await api.get(`/${id}`);
    return res.data as Status;
  } catch (error) {
    handleError(error);
    throw error;
  }
};

export const createStatus = async (data: { name: string; is_active: boolean }): Promise<Status> => {
  try {
    const res = await api.post("/", data);
    return res.data as Status;
  } catch (error) {
    handleError(error);
    throw error;
  }
};

export const updateStatus = async (id: string, data: { name: string; is_active: boolean }): Promise<Status> => {
  try {
    const res = await api.put(`/${id}`, data);
    return res.data as Status;
  } catch (error) {
    handleError(error);
    throw error;
  }
};

export const deleteStatus = async (id: string): Promise<void> => {
  try {
    await api.delete(`/${id}`);
  } catch (error) {
    handleError(error);
    throw error;
  }
};
