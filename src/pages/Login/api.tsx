// src/pages/Login/api.ts
export interface LoginResponse {
  message: string;
  user: {
    id: string;
    email: string;
    role?: string;
    token?: string;
    [key: string]: any;
  };
}

import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const loginUser = async (email: string, password: string): Promise<LoginResponse> => {
  const response = await axios.post(`${API_BASE_URL}/api/login`, { email, password });
  return response.data as LoginResponse; // ✅ Type assertion
};
