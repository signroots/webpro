// src/api.tsx
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL; // Replace with your backend URL

// =====================
// TypeEmail APIs
// =====================

// Create a new TypeEmail
export const createTypeEmail = async (formData: FormData) => {
  const res = await axios.post(`${API_BASE_URL}/api/typeemail`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};


// Get all TypeEmails
export const fetchTypeEmails = async () => {
  const res = await axios.get(`${API_BASE_URL}/api/typeemail`);
  return res.data;
};

// Get TypeEmail by ID
export const fetchTypeEmailById = async (id: string) => {
  const res = await axios.get(`${API_BASE_URL}/api/typeemail/${id}`);
  return res.data;
};

// Update TypeEmail by ID
export const updateTypeEmail = async (id: string, updates: any) => {
  const res = await axios.put(`${API_BASE_URL}/api/typeemail/${id}`, updates);
  return res.data;
};

// Delete TypeEmail by ID
export const deleteTypeEmail = async (id: string) => {
  const res = await axios.delete(`${API_BASE_URL}/api/typeemail/${id}`);
  return res.data;
};

// Toggle isActive
export const toggleTypeEmail = async (id: string) => {
  const res = await axios.put(`${API_BASE_URL}/api/typeemail/${id}/toggle`);
  return res.data;
};

// =====================
// PlanEmail APIs
// =====================

// Create a new PlanEmail
export const createPlanEmail = async (plan: string, emailType: string) => {
  const res = await axios.post(`${API_BASE_URL}/api/plans`, { plan, emailType });
  return res.data;
};

// Get all PlanEmails
export const fetchPlanEmails = async () => {
  const res = await axios.get(`${API_BASE_URL}/api/plans`);
  return res.data;
};

// Get PlanEmail by ID
export const fetchPlanEmailById = async (id: string) => {
  const res = await axios.get(`${API_BASE_URL}/api/plans/${id}`);
  return res.data;
};

// Update PlanEmail by ID
export const updatePlanEmail = async (id: string, updates: any) => {
  const res = await axios.put(`${API_BASE_URL}/api/plans/${id}`, updates);
  return res.data;
};

// Delete PlanEmail by ID
export const deletePlanEmail = async (id: string) => {
  const res = await axios.delete(`${API_BASE_URL}/api/plans/${id}`);
  return res.data;
};

// Toggle isActive
export const togglePlanEmail = async (id: string) => {
  const res = await axios.patch(`${API_BASE_URL}/api/plans/${id}/toggle`);
  return res.data;
};
// =====================
// HostType APIs
// =====================

// Create a new HostType
export const createHostType = async (type: string) => {
  const res = await axios.post(`${API_BASE_URL}/api/hosttypes`, { type });
  return res.data;
};

// Get all HostTypes
export const fetchHostTypes = async () => {
  const res = await axios.get(`${API_BASE_URL}/api/hosttypes`);
  return res.data;
};

// Get HostType by ID
export const fetchHostTypeById = async (id: string) => {
  const res = await axios.get(`${API_BASE_URL}/api/hosttypes/${id}`);
  return res.data;
};

// Update HostType by ID
export const updateHostType = async (id: string, type: string) => {
  const response = await axios.put(`${API_BASE_URL}/api/hosttypes/${id}/`, {
    type, // field name must match your backend model field
  });
  return response.data;
};

// Delete HostType by ID
export const deleteHostType = async (id: string) => {
  const res = await axios.delete(`${API_BASE_URL}/api/hosttypes/${id}`);
  return res.data;
};

// Toggle isActive
export const toggleHostType = async (id: string) => {
  const res = await axios.patch(`${API_BASE_URL}/hosttypes/${id}/toggle`);
  return res.data;
};
// HostSubType APIs
// =====================

// Create a new HostSubType
export const createHostSubType = async (payload: { hostType: string; name: string }) => {
  const res = await axios.post(`${API_BASE_URL}/api/hostsubtype`, payload);
  return res.data;
};


// Get all HostSubTypes
export const fetchHostSubTypes = async () => {
  const res = await axios.get(`${API_BASE_URL}/api/hostsubtype`);
  return res.data;
};

// Get HostSubType by ID
export const fetchHostSubTypeById = async (id: string) => {
  const res = await axios.get(`${API_BASE_URL}/api/hostsubtype/${id}`);
  return res.data;
};

// Update HostSubType by ID
export const updateHostSubType = async (id: string, updates: any) => {
  const res = await axios.put(`${API_BASE_URL}/api/hostsubtype/${id}`, updates);
  return res.data;
};

// Delete HostSubType by ID
export const deleteHostSubType = async (id: string) => {
  const res = await axios.delete(`${API_BASE_URL}/api/hostsubtype/${id}`);
  return res.data;
};

// Toggle isActive
export const toggleHostSubType = async (id: string) => {
  const res = await axios.put(`${API_BASE_URL}/api/hostsubtype/${id}`);
  return res.data;
};
// Storage APIs
// =====================
export const createStorage = async (storage: string, hostType: string, hostSubType: string) => {
  const res = await axios.post(`${API_BASE_URL}/api/storage`, { storage, hostType, hostSubType });
  return res.data;
};

export const fetchStorages = async () => {
  const res = await axios.get(`${API_BASE_URL}/api/storage`);
  return res.data;
};

export const fetchStorageById = async (id: string) => {
  const res = await axios.get(`${API_BASE_URL}/api/storage/${id}`);
  return res.data;
};

export const updateStorage = async (id: string, updates: any) => {
  const res = await axios.put(`${API_BASE_URL}/api/storage/${id}`, updates);
  return res.data;
};

export const deleteStorage = async (id: string) => {
  const res = await axios.delete(`${API_BASE_URL}/api/storage/${id}`);
  return res.data;
};

export const toggleStorage = async (id: string) => {
  const res = await axios.patch(`${API_BASE_URL}/api/storage/${id}/toggle`);
  return res.data;
};