import axios from "axios";
import type { DomainWithEmails } from "./types";

const API_BASE = "http://localhost:5000/api";

// Fetch merged domains + emails
export const fetchdistinctDomain = async (): Promise<DomainWithEmails[]> => {
  try {
    const res = await axios.get(`${API_BASE}/domains_list/distinct-domains`);

    return (res.data.data as any[]).map(domain => ({
      ...domain,
      emails: domain.emails.map((email: any) => ({
        ...email,
        users: Array.isArray(email.users) ? email.users : [], // normalize to array
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
    return res.data as DomainWithEmails;
  } catch (error) {
    console.error("❌ Error updating domain and emails:", error);
    throw error;
  }
};
