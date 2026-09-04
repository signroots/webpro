
// src/api/status.ts

import axios from "axios";

// =====================================================
// STATUS TYPES
// =====================================================

export type StatusType = "order" | "plan" | "domain";

// =====================================================
// STATUS INTERFACE
// =====================================================

export interface Status {
  _id: string;
  name: string;
  code: string;
  type: StatusType;
  is_custom: boolean;
  is_active: boolean;
}

// =====================================================
// STATUS PAYLOAD
// =====================================================

export interface StatusPayload {
  name: string;
  code: string;
  type: StatusType;
  is_custom: boolean;
  is_active: boolean;
}

// =====================================================
// API URL
// =====================================================

const API_URL = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
  baseURL: `${API_URL}/api/status`,
  headers: {
    "Content-Type": "application/json",
  },
});

// =====================================================
// AXIOS ERROR HANDLER
// =====================================================

const isAxiosError = (
  error: unknown
): error is {
  response?: {
    data?: any;
  };
  message: string;
} => {
  return (
    (error as any)?.isAxiosError !== undefined ||
    (error as any)?.response !== undefined
  );
};

const handleError = (error: unknown): never => {
  if (isAxiosError(error)) {
    console.error(
      "API Error:",
      (error as any).response?.data ||
        (error as any).message
    );

    throw (
      (error as any).response?.data ||
      error
    );
  }

  console.error(
    "Unexpected Error:",
    error
  );

  throw error;
};

// =====================================================
// FETCH ALL STATUSES
// =====================================================

export const fetchStatuses = async (): Promise<Status[]> => {
  try {
    const res = await api.get("/");

    return (
      res.data.data ||
      res.data ||
      []
    ) as Status[];
  } catch (error: unknown) {
    return handleError(error);
  }
};

// =====================================================
// FETCH STATUS BY ID
// =====================================================

export const fetchStatusById = async (
  id: string
): Promise<Status> => {
  try {
    const res = await api.get(`/${id}`);

    return (
      res.data.data ||
      res.data
    ) as Status;
  } catch (error: unknown) {
    return handleError(error);
  }
};

// =====================================================
// CREATE STATUS
// =====================================================

export const createStatus = async (
  data: StatusPayload
): Promise<Status> => {
  try {
    const res = await api.post(
      "/",
      data
    );

    return (
      res.data.data ||
      res.data
    ) as Status;
  } catch (error: unknown) {
    return handleError(error);
  }
};

// =====================================================
// UPDATE STATUS
// =====================================================

export const updateStatus = async (
  id: string,
  data: StatusPayload
): Promise<Status> => {
  try {
    const res = await api.put(
      `/${id}`,
      data
    );

    return (
      res.data.data ||
      res.data
    ) as Status;
  } catch (error: unknown) {
    return handleError(error);
  }
};

// =====================================================
// DELETE STATUS
// =====================================================

export const deleteStatus = async (
  id: string
): Promise<void> => {
  try {
    await api.delete(`/${id}`);
  } catch (error: unknown) {
    return handleError(error);
  }
};

