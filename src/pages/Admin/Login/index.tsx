import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "./api";
import { useAuth } from "../../../Common/AuthContext/Auth";
import "./style.css";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { notify } from "../../../Common/Toastify"; // ✅ for toast

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const data = await loginUser(email, password);
      console.log("Login API response:", data);

      if (data.success && data.accessToken && data.refreshToken && data.user) {
        const safeUser = {
          id: data.user.id,
          email: data.user.email,
          role: data.user.role || "Unknown",
          name: data.user.name || "Unknown",
          type: data.user.type || "user",
          clientId: data.user.clientId ?? null,
        };

        // ✅ Save user in context
        login(data.accessToken, data.refreshToken, safeUser);

        // ✅ Show success toast
        notify("Login successful.", "success");

        // ✅ Navigate based on role
        if (safeUser.role === "Admin") {
          navigate("/admin/orders");
        } else if (safeUser.role === "Customer") {
          navigate("/customer/orders");
        } else {
          notify("Unauthorized role", "warning");
        }
      } else {
        // ❌ Show backend message in toast if available
        const errorMessage =
          data.message || data.error || "Invalid credentials";
        notify(errorMessage, "error");
      }
    } catch (err: any) {
      // ❌ Handle axios errors
      const backendError =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Login failed";
      notify(backendError, "error");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
          Login
        </h2>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border p-3 pr-10 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
            <div
              className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-gray-500"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <AiOutlineEyeInvisible size={20} />
              ) : (
                <AiOutlineEye size={20} />
              )}
            </div>
          </div>

          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-semibold transition duration-200"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
