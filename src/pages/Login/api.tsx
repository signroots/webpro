import axios from "axios";

const API_URL = "http://localhost:5000/api/users"; // your backend

export const loginUser = async (email: string, password: string) => {
  const res = await axios.post(`${API_URL}/login`, { email, password });
  return res.data;
};
