// src/api.tsx
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface IUserType {
  _id: string;
  name: string;
  is_active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ✅ Get all user types
export const fetchUserTypes = async (): Promise<IUserType[]> => {
  const res = await axios.get(`${API_BASE_URL}/api/users/types`);
  // Ensure it always returns an array
  return res.data.data || res.data || [];
};

// ✅ Create new user type
export const createUserType = async (data: Partial<IUserType>) => {
  const res = await axios.post(`${API_BASE_URL}/api/users/types`, data);
  return res.data;
};

// ✅ Update user type
export const updateUserType = async (id: string, data: Partial<IUserType>) => {
  const res = await axios.put(`${API_BASE_URL}/api/users/types/${id}`, data);
  return res.data;
};

// ✅ Delete user type
export const deleteUserType = async (id: string) => {
  const res = await axios.delete(`${API_BASE_URL}/api/users/types/${id}`);
  return res.data;
};
