import axios from "axios";

const API_BASE = "http://localhost:5000/api"; 
const baseURL = "http://192.168.220.43:5000/api/emails";

// Fetch merged domains + emails
export const fetchdistinctDomain = async () => {
  try {
    const res = await axios.get(`${API_BASE}/domains_list/distinct-domains`);
    return res.data.data; // { success, count, data }
  } catch (error) {
    console.error("❌ Error fetching domains with emails:", error);
    throw error;
  }
};

// 🔹 Update domain + emails
export const updateDomainWithEmails = async (domainName: string, payload: any) => {
  try {
    const res = await axios.put(`${API_BASE}/domains_list/${domainName}`, payload);
    return res.data; // { success, message, data }
  } catch (error) {
    console.error("❌ Error updating domain and emails:", error);
    throw error;
  }
};
