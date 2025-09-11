// src/api.tsx
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Fetch all domains safely
export const fetchDomains = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/domains_list`);

    // Case 1: API returns an array directly
    if (Array.isArray(response.data)) {
      return response.data;
    }

    // Case 2: API wraps inside "domains" or "data"
    if (Array.isArray(response.data.domains)) {
      return response.data.domains;
    }
    if (Array.isArray(response.data.data)) {
      return response.data.data;
    }

    // Fallback
    return [];
  } catch (error) {
    console.error("Error fetching domains:", error);
    return [];
  }
};
