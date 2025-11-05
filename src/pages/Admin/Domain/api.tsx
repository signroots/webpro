import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface DomainResponse {
  domains?: any[];
  data?: any[];
}

export const fetchDomains = async () => {
  try {
    const response = await axios.get<DomainResponse>(`${API_BASE_URL}/api/domains_list`);

    const data = response.data;

    // Case 1: API returns an array directly
    if (Array.isArray(data)) {
      return data;
    }

    // Case 2: API wraps inside "domains" or "data"
    if (Array.isArray((data as DomainResponse).domains)) {
      return (data as DomainResponse).domains!;
    }
    if (Array.isArray((data as DomainResponse).data)) {
      return (data as DomainResponse).data!;
    }

    return [];
  } catch (error) {
    console.error("Error fetching domains:", error);
    return [];
  }
};
