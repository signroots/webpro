import axios from "axios";

const API_URL = "http://localhost:5000/api/users"; // your backend

export const registerUser = async (name: string, email: string, password: string) => {
  const res = await axios.post(`${API_URL}/register`, { name, email, password });
  return res.data;
};
