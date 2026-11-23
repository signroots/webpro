
import axios from "axios";

const API_URL = import.meta.env.VITE_API_BASE_URL;

// =====================================================
// LABEL INTERFACE
// =====================================================

export type LabelVisibility = "ADMIN" | "CUSTOMER";

export interface Label {
  _id: string;
  statusLabelName: string;
  code: string;
  type: string;
  service: string;
  status: boolean;
  displayArea: string;
  visibleTo?: LabelVisibility[];
  createdAt?: string;
  updatedAt?: string;
}

// =====================================================
// LABEL PAYLOAD
// =====================================================

export interface LabelPayload {
  statusLabelName: string;
  code: string;
  type: string;
  service: string;
  status: boolean;
  displayArea: string;
  visibleTo: LabelVisibility[];
}

// =====================================================
// AUTH CONFIG
// =====================================================

const getAuthConfig = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = user?.token || localStorage.getItem("token");

  return {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "Content-Type": "application/json",
    },
  };
};

// =====================================================
// FETCH ALL LABELS
// GET /api/labels
// =====================================================

export const fetchLabels = async (): Promise<Label[]> => {
  const response = await axios.get(
    `${API_URL}/api/labels`,
    getAuthConfig()
  );

  const result = response.data;

  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.data)) return result.data;
  if (Array.isArray(result?.labels)) return result.labels;

  return [];
};

// =====================================================
// FETCH ACTIVE LABELS
// GET /api/labels/active
//
// type = ORDER or PLAN
// role = ADMIN or CUSTOMER
// =====================================================

export const fetchActiveLabels = async (
  type?: string,
  role?: LabelVisibility
): Promise<Label[]> => {
  const response = await axios.get(
    `${API_URL}/api/labels/active`,
    {
      ...getAuthConfig(),
      params: {
        ...(type ? { type: type.toUpperCase() } : {}),
        ...(role ? { role } : {}),
      },
    }
  );

  const result = response.data;

  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.data)) return result.data;
  if (Array.isArray(result?.labels)) return result.labels;

  return [];
};

// =====================================================
// CREATE LABEL
// POST /api/labels
// =====================================================

export const createLabel = async (
  payload: LabelPayload
) => {
  return axios.post(
    `${API_URL}/api/labels`,
    payload,
    getAuthConfig()
  );
};

// =====================================================
// UPDATE LABEL
// PUT /api/labels/:id
// =====================================================

export const updateLabel = async (
  id: string,
  payload: LabelPayload
) => {
  return axios.put(
    `${API_URL}/api/labels/${id}`,
    payload,
    getAuthConfig()
  );
};

// =====================================================
// DELETE LABEL
// DELETE /api/labels/:id
// =====================================================

export const deleteLabel = async (id: string) => {
  return axios.delete(
    `${API_URL}/api/labels/${id}`,
    getAuthConfig()
  );
};

// =====================================================
// FETCH SINGLE LABEL
// GET /api/labels/:id
// =====================================================

export const fetchLabelById = async (
  id: string
): Promise<Label> => {
  const response = await axios.get(
    `${API_URL}/api/labels/${id}`,
    getAuthConfig()
  );

  return response.data?.data || response.data;
};

// =====================================================
// UPDATE ORDER LABELS
// PATCH /api/labels/order/:orderId
//
// Request:
// { labelIds: ["id1", "id2"] }
// =====================================================

export const updateOrderLabel = async (
  orderId: string,
  labelIds: string[]
) => {
  const response = await axios.patch(
    `${API_URL}/api/labels/order/${orderId}`,
    { labelIds },
    getAuthConfig()
  );

  return response.data?.data;
};

// =====================================================
// UPDATE ORDER PLAN LABELS
// PATCH /api/labels/plan/:planId
//
// Request:
// { labelIds: ["id1", "id2"] }
// =====================================================

export const updateOrderPlanLabel = async (
  planId: string,
  labelIds: string[]
) => {
  const response = await axios.patch(
    `${API_URL}/api/labels/plan/${planId}`,
    { labelIds },
    getAuthConfig()
  );

  return response.data?.data;
};
