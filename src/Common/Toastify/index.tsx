// src/Common/Toastify.tsx
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export const notify = (
  msg: string,
  type: "success" | "error" | "info" | "warning" = "info"
) => {
  toast[type](msg, {
    style: {
      backgroundColor: "#fff",
      color:
        type === "success"
          ? "#16a34a"
          : type === "error"
          ? "#dc2626"
          : "#000000",
      fontWeight: "600",
      border: `1px solid ${
        type === "success" ? "#16a34a" : type === "error" ? "#dc2626" : "#000"
      }`,
    },
  });
};

// 👇 Add this in App.tsx (only once)
export const ToastContainerGlobal = () => (
  <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
);
