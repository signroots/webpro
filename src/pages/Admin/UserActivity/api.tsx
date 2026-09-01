import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const FULL_API_URL = `${API_BASE_URL}/api`;

export interface ActivityUser {
  _id: string;
  name?: string;
  email?: string;
  role?: string;
}

export interface UserActivity {
  _id: string;

  entityType: string;
  entityId: string;

  orderId?: string;

  domainName?: string;

  action: string;

  performedBy?: ActivityUser | string;

  performedByName?: string;

  changes?: any[];

  description?: string;

  source?: string;

  ipAddress?: string;

  userAgent?: string;

  isSystemAction?: boolean;

  metadata?: any;

  createdAt: string;
  updatedAt?: string;
}

export interface ActivityResponse {
  success: boolean;

  data: UserActivity[];

  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ActivityFilterOptions {
  users: {
    _id: string;
    name?: string;
  }[];

  actions: string[];

  domains: string[];
}

const getToken = (): string | null => {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("authToken")
  );
};

// =====================================================
// GET USER ACTIVITIES
// =====================================================

export const getUserActivities = async (
  page = 1,
  limit = 25,
  filters?: {
    domainName?: string;
    performedBy?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }
): Promise<ActivityResponse> => {
  const token = getToken();

  const response = await axios.get(
    `${FULL_API_URL}/activity`,
    {
      params: {
        page,
        limit,

        domainName:
          filters?.domainName || undefined,

        performedBy:
          filters?.performedBy || undefined,

        action:
          filters?.action || undefined,

        startDate:
          filters?.startDate || undefined,

        endDate:
          filters?.endDate || undefined,

        search:
          filters?.search || undefined,
      },

      headers: {
        Authorization: `Bearer ${token}`,
      },

      withCredentials: true,
    }
  );

  return response.data;
};

// =====================================================
// GET FILTER OPTIONS
// =====================================================

export const getActivityFilterOptions =
  async (): Promise<ActivityFilterOptions> => {
    const token = getToken();

    const response = await axios.get(
      `${FULL_API_URL}/activity/filters/options`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },

        withCredentials: true,
      }
    );

    return response.data.data;
  };

// =====================================================
// GET SINGLE ACTIVITY
// =====================================================

export const getActivityById = async (
  id: string
): Promise<UserActivity> => {
  const token = getToken();

  const response = await axios.get(
    `${FULL_API_URL}/activity/${id}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },

      withCredentials: true,
    }
  );

  return response.data.data;
};