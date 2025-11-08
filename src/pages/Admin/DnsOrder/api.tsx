// // src/api.tsx
// import axios from "axios";

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
// const token = localStorage.getItem("token");
// export const fetchOrders = async (): Promise<DNSOrder[]> => {
//   const token = localStorage.getItem("token");  // always fresh token

//   const response = await axios.get(`${API_BASE_URL}/orders`, {
//     headers: {
//       Authorization: `Bearer ${token}`,
//     },
//   });
//   return response.data.data;
// };
// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
// export const fetchDNSOrders = async () => {
//   const res = await axios.get(`${API_BASE_URL}/api/orders/dnsorders?filter=cloudflare`);
//   return res.data;
// };
