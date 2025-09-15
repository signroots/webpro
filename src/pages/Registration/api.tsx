import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL; // your backend

export const registerUser = async (name: string, email: string, password: string) => {
  const res = await axios.post(`${API_BASE_URL}/register`, { name, email, password });
  return res.data;
};
