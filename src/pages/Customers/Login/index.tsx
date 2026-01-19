import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "./api";
import { useAuth } from "../../../Common/AuthContext/Auth";
import { notify } from "../../../Common/Toastify";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    try {
      const data = await loginUser(email, password);
      console.log("Login API response:", data);

      // ✅ If login is successful
      if (data.success && data.token && data.user) {
        const safeUser = {
          id: data.user.id,
          email: data.user.email,
          role: data.user.role || "Unknown",
          name: data.user.name || "Unknown",
        };

        // ✅ Call context login
        login(data.token, data.refreshToken || "", safeUser);

        // ✅ Show success toast
        notify("Login successful.", "success");

        // ✅ Navigate based on role
        if (safeUser.role === "Customer") {
          navigate("/customer/orders");
        } else if (safeUser.role === "Admin") {
          navigate("/admin/orders");
        } else {
          setMessage("Unauthorized role");
        }
      }
      // ❌ If login failed
      else {
        const errorMsg = data.error || data.message || "Invalid credentials";
        notify(errorMsg, "error");
        setMessage(errorMsg);
      }
    } catch (err: any) {
      console.error("Login error:", err);
      const errorMsg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Login failed";
      notify(errorMsg, "error");
      setMessage(errorMsg);
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
