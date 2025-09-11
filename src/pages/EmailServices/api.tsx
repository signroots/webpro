import axios from "axios";

const baseURL = "http://192.168.220.44:5000/api/emails";

// ✅ Fetch all emails
export const fetchEmails = async (provider?: string) => {
  const url = provider ? `${baseURL}?provider=${encodeURIComponent(provider)}` : baseURL;
  const res = await axios.get(url);
  return res.data;
};

// ✅ Fetch single email
export const fetchEmailById = async (id: string) => {
  const res = await axios.get(`${baseURL}/${id}`);
  return res.data;
};

// ✅ Update email
export const updateEmail = async (id: string, data: any) => {
  const res = await axios.put(`${baseURL}/${id}`, data);
  return res.data;
};
