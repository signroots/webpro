// src/pages/EmailServices/api.tsx
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface Email {
  _id: string;
  domain: string;
  subscription: string;
  plan?: string;
  status: string;
  username: string;
  password?: string;
  users: number;
  creationDate?: string;
  expiryDate?: string;
  customer?: string;
  provider: string;
}

export const fetchEmails = async (provider?: string): Promise<Email[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/emails${provider ? `?provider=${provider}` : ""}`);
    return response.data as Email[]; // ✅ Type assertion
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const updateEmail = async (id: string, payload: Partial<Email>): Promise<Email> => {
  try {
    const response = await axios.put(`${API_BASE_URL}/api/email/${id}`, payload);
    return response.data as Email; // ✅ Type assertion
  } catch (error) {
    console.error(error);
    throw error;
  }
};
