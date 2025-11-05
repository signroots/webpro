// src/pages/Login/api.ts

import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface LoginResponse {
  success: boolean;
  token?: string;
  message?: string;
  error?:string;
  refreshToken?:string;
  user?: {
    id: string;
    email: string;
    role?: string;
    [key: string]: any;
  };
}

export const loginUser = async (
  email: string,
  password: string
): Promise<LoginResponse> =>
{
  console.log("[DEBUG] loginUser called with URL:", `${API_BASE_URL}/api/users/customer/login`);
  try {
    const response = await axios.post(`${API_BASE_URL}/api/users/customer/login`, {
      email,
      password,
    });

    const data = response.data as LoginResponse;

    if (data.success && data.token) {
      // Store token and user info safely
      localStorage.setItem("token", data.token);
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }
    }

    return data;
  } catch (error: any) {
    console.error("[Login Error]", error);

    // Extract error message safely from backend response
    const message =
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      error.message ||
      "Login failed";

    return {
      success: false,
      message,
    };
  }
};
