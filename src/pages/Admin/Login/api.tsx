import axios from "axios";


const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface LoginResponse {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  message?: string;
  error?: string;
  user?: {
    id: string;
    email: string;
    role?: string;
    name?: string;
    [key: string]: any;
  };
}

export const loginUser = async (
  email: string,
  password: string
): Promise<LoginResponse> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/users/login`, {
      email,
      password,
    });

    const data = response.data as LoginResponse;

    // ✅ Store both tokens safely if present
    if (data.success && data.accessToken && data.refreshToken) {
      localStorage.setItem("token", data.accessToken);
      localStorage.setItem("refresh_token", data.refreshToken);

      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }
    }

    return data;
  } catch (error: any) {
    console.error("[Login Error]", error);

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
