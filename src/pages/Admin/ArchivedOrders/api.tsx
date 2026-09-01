
import axios from "axios";

// =====================================================
// API BASE URL
// =====================================================

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL;


// =====================================================
// GET ARCHIVED ORDERS
// =====================================================

export const getArchivedOrders = async (
  page = 1,
  limit = 25,
  search = ""
) => {
  try {

    // =================================================
    // GET TOKEN
    // =================================================

    const token =
      localStorage.getItem("token");

    // =================================================
    // CHECK TOKEN
    // =================================================

    if (!token) {
      throw {
        success: false,
        error: "No token found in localStorage",
      };
    }

    // =================================================
    // API REQUEST
    // =================================================

    const response = await axios.get(
      `${API_BASE_URL}/api/orders/archived`,
      {
        params: {
          page,
          limit,
          ...(search
            ? { search }
            : {}),
        },

        // Send JWT token
        headers: {
          Authorization: `Bearer ${token}`,
        },

        // Send cookies also
        withCredentials: true,
      }
    );

    // =================================================
    // RETURN RESPONSE
    // =================================================

    return response.data;

  } catch (error: any) {

    // =================================================
    // ERROR
    // =================================================

    console.error(
      "GET ARCHIVED ORDERS ERROR:",
      error?.response?.data || error
    );

    throw (
      error?.response?.data || {
        success: false,
        message:
          "Failed to fetch archived orders",
      }
    );
  }
};

