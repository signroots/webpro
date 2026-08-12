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
    name?: string;
    role?: string;
    type?: string;
    clientId?: string | null;
    [key: string]: any;
  };
}

export const loginUser = async (
  email: string,
  password: string
): Promise<LoginResponse> => {
  const url = `${API_BASE_URL}/api/users/login`;

  console.log("[LOGIN API URL]:", url);

  try {
    const response = await axios.post(url, {
      email: email.trim().toLowerCase(),
      password,
    });

    const data = response.data as LoginResponse;

    console.log("[LOGIN API RESPONSE]:", data);

    if (data.success && data.accessToken && data.user) {
      localStorage.setItem("token", data.accessToken);

      if (data.refreshToken) {
        localStorage.setItem(
          "refreshToken",
          data.refreshToken
        );
      }

      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );
    }

    return data;

  } catch (error: any) {
    console.error("[LOGIN ERROR]:", error);

    return {
      success: false,
      error:
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        "Login failed",
    };
  }
};