import axios from "axios";

const API_BASE = "http://localhost:5000/api"; 
const baseURL = "http://192.168.220.43:5000/api/emails";
import { DomainWithEmails } from "./types";
// Fetch merged domains + emails
export const fetchdistinctDomain = async (): Promise<DomainWithEmails[]> => {
  try {
    const res = await axios.get<{
      success: boolean;
      count: number;
      data: DomainWithEmails[];
    }>(`${API_BASE}/domains_list/distinct-domains`);

    return res.data.data; // ✅ strongly typed
  } catch (error) {
    console.error("❌ Error fetching domains with emails:", error);
    throw error;
  }
};


// 🔹 Update domain + emails
export const updateDomainWithEmails = async (
  domainName: string,
  payload: Partial<DomainWithEmails>
): Promise<DomainWithEmails> => {
  try {
    const res = await axios.put<{
      success: boolean;
      message: string;
      data: DomainWithEmails;
    }>(`${API_BASE}/domains_list/${domainName}`, payload);

    return res.data.data; // ✅ strongly typed
  } catch (error) {
    console.error("❌ Error updating domain and emails:", error);
    throw error;
  }
};