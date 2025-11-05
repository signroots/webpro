import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

// Axios instance (optional, for future interceptors)
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

// Categories APIs
export const fetchCategories = async () => {
  const res = await api.get("/api/categories");
  return res.data.data;
};

export const addCategory = async (name: string) => {
  const res = await api.post("/api/categories", { name });
  return res.data.data;
};

export const updateCategory = async (id: string, name: string) => {
  const res = await api.put(`/api/categories/${id}`, { name });
  return res.data.data;
};

export const toggleCategory = async (id: string) => {
  const res = await api.patch(`/api/categories/${id}/toggle`);
  return res.data.data;
};

export const deleteCategory = async (id: string) => {
  await api.delete(`/api/categories/${id}`);
};
