import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Define user type structure
export interface IUserType {
  _id: string;
  name: string;
  is_active: boolean;
}

// Fetch user types from backend
export const fetchUserTypes = async (): Promise<IUserType[]> => {
  const res = await axios.get(`${API_BASE_URL}/api/users/types`);
  return res.data;
};

// Register user (with optional customerDetails)
export const registerUser = async (
  name: string,
  email: string,
  password: string,
  userType: string,
  customerDetails?: Record<string, any>
) => {
  const res = await axios.post(`${API_BASE_URL}/api/users/register`, {
    name,
    email,
    password,
    userType,
    ...(customerDetails ? { customerDetails } : {}),
  });
  return res.data;
};
