import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "./api";
import {
  useAuth,
  User,
} from "../../../Common/AuthContext/Auth";
import { notify } from "../../../Common/Toastify";
import {
  AiOutlineEye,
  AiOutlineEyeInvisible,
} from "react-icons/ai";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    setMessage("");
    setLoading(true);

    try {
      const data = await loginUser(email, password);

      console.log("🔥 LOGIN RESPONSE:", data);
      console.log("🔥 SUCCESS:", data?.success);
      console.log("🔥 USER:", data?.user);
      console.log("🔥 ROLE:", data?.user?.role);
      console.log("🔥 TYPE:", data?.user?.type);

      // ============================================
      // LOGIN SUCCESS
      // ============================================

if (data.success && data.accessToken && data.user) {
  console.log("================================");
  console.log("🔥 LOGIN SUCCESS");
  console.log("RAW USER:", data.user);
  console.log("RAW ROLE:", data.user.role);
  console.log("RAW TYPE:", data.user.type);
  console.log("================================");

  // --------------------------------------------
  // NORMALIZE ROLE
  // --------------------------------------------

  const normalizedRole = String(
    data.user.role || data.user.type || ""
  )
    .trim()
    .toLowerCase();

  // --------------------------------------------
  // NORMALIZE TYPE
  // --------------------------------------------

  let normalizedType: User["type"] = "user";

  if (normalizedRole === "client") {
    normalizedType = "client";
  } else if (normalizedRole === "customer") {
    normalizedType = "customer";
  }

  // --------------------------------------------
  // SAFE USER
  // --------------------------------------------

const safeUser: User = {
  id: String(data.user.id || ""),
  email: String(data.user.email || ""),
  name: data.user.name || "Unknown",
  role: normalizedRole,
  type: normalizedType,
  clientId: data.user.clientId
    ? String(data.user.clientId)
    : null,
};

console.log("================================");
console.log("🔥 BEFORE AUTH LOGIN");
console.log("API USER:", data.user);
console.log("API USER TYPE:", data.user.type);
console.log("API USER CLIENT ID:", data.user.clientId);
console.log("SAFE USER:", safeUser);
console.log("SAFE USER TYPE:", safeUser.type);
console.log("SAFE USER CLIENT ID:", safeUser.clientId);
console.log("================================");

login(
  data.accessToken,
  data.refreshToken || "",
  safeUser
);

  notify("Login successful.", "success");

  // --------------------------------------------
  // NAVIGATION
  // --------------------------------------------

  if (
    safeUser.role === "client" ||
    safeUser.role === "customer"
  ) {
    console.log("✅ CUSTOMER/CLIENT LOGIN");
    console.log("➡️ /customer/orders");

    navigate("/customer/orders", {
      replace: true,
    });

    return;
  }

  // --------------------------------------------
  // UNKNOWN ROLE
  // --------------------------------------------

  console.log("❌ UNKNOWN ROLE:", safeUser.role);

  notify(
    `Unauthorizzzzzzzzzzzzzzed role: ${safeUser.role}`,
    "error"
  );

  setMessage(
    `Unnnnnnnnnnauthorized role: ${safeUser.role}`
  );

  return;
}

      // ============================================
      // LOGIN FAILED
      // ============================================

      const errorMsg =
        data.error ||
        data.message ||
        "Invalid credentials";

      console.log("❌ LOGIN FAILED:", errorMsg);

      notify(errorMsg, "error");

      setMessage(errorMsg);

    } catch (err: any) {
      console.error("❌ Login error:", err);

      const errorMsg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Login failed";

      notify(errorMsg, "error");

      setMessage(errorMsg);

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">

      <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md">

        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
          Login
        </h2>

        <form
          onSubmit={handleLogin}
          className="flex flex-col gap-4"
        >

          {/* EMAIL */}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />

          {/* PASSWORD */}

          <div className="relative">

            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              className="border p-3 pr-10 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />

            <div
              className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-gray-500"
              onClick={() =>
                setShowPassword(!showPassword)
              }
            >
              {showPassword ? (
                <AiOutlineEyeInvisible size={20} />
              ) : (
                <AiOutlineEye size={20} />
              )}
            </div>

          </div>

          {/* ERROR MESSAGE */}

          {message && (
            <p className="text-red-500 text-sm">
              {message}
            </p>
          )}

          {/* LOGIN BUTTON */}

          <button
            type="submit"
            disabled={loading}
            className={`text-white py-3 rounded-lg font-semibold transition duration-200 ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600"
            }`}
          >
            {loading ? "Logging in..." : "Login"}
          </button>

        </form>

      </div>

    </div>
  );
};

export default Login;