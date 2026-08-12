// import axios from "axios";

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
// const FULL_API_URL = `${API_BASE_URL}/api`;

// const token = () => localStorage.getItem("token") || "";

// /* -------------------- DASHBOARD METRICS -------------------- */

// export interface Renewals {
//   previousMonth: number;
//   currentMonth: number;
//   nextMonth: number;
// }

// export interface DashboardMetrics {
//   totalOrders: number;
//   dnsOrders: number;
//   registrarOrder: number;
//   resellerOrder: number;
//   renewals: Renewals;       // updated from renewalsThisMonth
//   totalCustomers: number;
// }

// export const fetchDashboardMetrics = async (): Promise<DashboardMetrics> => {
//   const response = await axios.get(`${FULL_API_URL}/dashboard/metrics`, {
//     headers: {
//       Authorization: `Bearer ${token()}`,
//     },
//   });

//   // Backend now returns: { success: true, data: { ..., renewals: { previousMonth, currentMonth, nextMonth } } }
//   return response.data.data;
// };
