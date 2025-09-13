import axios from "axios";
import type { DomainWithEmails } from "./types";

const API_BASE = "http://localhost:5000/api";

// Define the expected Axios response type
interface DomainResponse {
  data: DomainWithEmails[];
}

// Fetch merged domains + emails
export const fetchdistinctDomain = async (): Promise<DomainWithEmails[]> => {
  try {
    const res = await axios.get<DomainResponse>(
      `${API_BASE}/domains_list/distinct-domains`
    );

    // Map over domains and normalize emails
    return res.data.data.map((domain) => ({
      ...domain,
      emails: (domain.emails || []).map((email) => ({
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
  payload: Partial<DomainWithEmails>
): Promise<DomainWithEmails> => {
  try {
    const res = await axios.put<DomainWithEmails>(
      `${API_BASE}/domains_list/${domainName}`,
      payload
    );
    return res.data;
  } catch (error) {
    console.error("❌ Error updating domain and emails:", error);
    throw error;
  }
};
