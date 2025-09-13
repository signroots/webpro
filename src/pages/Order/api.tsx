import axios from "axios";
import type { DomainWithEmails } from "./types"; // Your type

const API_BASE = "http://localhost:5000/api";

// Fetch merged domains + emails
export const fetchdistinctDomain = async (): Promise<DomainWithEmails[]> => {
  try {
    const res = await axios.get(`${API_BASE}/domains_list/distinct-domains`);
    // ⚡ Ensure the response maps to the correct structure
    return (res.data.data as DomainWithEmails[]).map(domain => ({
      ...domain,
      emails: domain.emails.map(email => ({
        ...email,
        users: Array.isArray(email.users) ? email.users : [], // always array
      })),
    }));
  } catch (error) {
    console.error("❌ Error fetching domains with emails:", error);
    throw error;
  }
};

// Update domain + emails
export const updateDomainWithEmails = async (
  domainName: string,
  payload: any
): Promise<DomainWithEmails> => {
  try {
    const res = await axios.put(`${API_BASE}/domains_list/${domainName}`, payload);
    return res.data as DomainWithEmails; // ✅ Cast to correct type
  } catch (error) {
    console.error("❌ Error updating domain and emails:", error);
    throw error;
  }
};