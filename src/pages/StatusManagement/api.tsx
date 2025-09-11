// src/api/status.ts
import axios, { AxiosError } from "axios";

const API_URL = "http://localhost:5000/api/status"; // Base endpoint for statuses

// ✅ Axios instance (easier if you add auth headers later)
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ Generic error handler
const handleError = (error: AxiosError) => {
  console.error("API Error:", error.response?.data || error.message);
  throw error.response?.data || error;
};

// Fetch all statuses
export const fetchStatuses = async () => {
  try {
    const res = await api.get("/");
    return res.data;
  } catch (error) {
    handleError(error as AxiosError);
  }
};

// Fetch one status by ID
export const fetchStatusById = async (id: string) => {
  try {
    const res = await api.get(`/${id}`);
    return res.data;
  } catch (error) {
    handleError(error as AxiosError);
  }
};

// Create a new status
export const createStatus = async (data: { name: string; is_active: boolean }) => {
  try {
    const res = await api.post("/", data);
    return res.data;
  } catch (error) {
    handleError(error as AxiosError);
  }
};

// Update a status
export const updateStatus = async (id: string, data: { name: string; is_active: boolean }) => {
  try {
    const res = await api.put(`/${id}`, data);
    return res.data;
  } catch (error) {
    handleError(error as AxiosError);
  }
};

// Delete a status
export const deleteStatus = async (id: string) => {
  try {
    const res = await api.delete(`/${id}`);
    return res.data;
  } catch (error) {
    handleError(error as AxiosError);
  }
};
