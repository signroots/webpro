// import axios from "axios";
// import { notify } from "../Common/Toastify";

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// const api = axios.create({
//   baseURL: `${API_BASE_URL}/api`,
// });

// // ✅ Show success toast automatically for 200–299 responses
// api.interceptors.response.use(
//   (response) => {
//     if (response.status >= 200 && response.status < 300) {
//       notify(" Request successful", "success");
//     }
//     return response;
//   },
//   (error) => {
//     const status = error.response?.status;
//     const message =
//       error.response?.data?.message ||
//       error.response?.data?.error ||
//       "Something went wrong";

//     if (status === 404) {
//       notify("❌ Not Found: " + message, "error");
//     } else {
//       notify("⚠️ Error: " + message, "error");
//     }

//     return Promise.reject(error);
//   }
// );

// export default api;
