import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

import axios from "axios";

// =====================================================
// USER TYPE
// =====================================================

export interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  type?: "user" | "admin" | "client" | "customer";
  clientId?: string | null;
}

// =====================================================
// AUTH CONTEXT TYPE
// =====================================================

interface AuthContextType {
  user: User | null;
  isAuthReady: boolean;

  login: (
    accessToken: string,
    refreshToken: string,
    userData: User
  ) => void;

  logout: () => void;

  refreshAccessToken: () => Promise<void>;
}

// =====================================================
// CONTEXT
// =====================================================

const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

// =====================================================
// PROVIDER PROPS
// =====================================================

interface AuthProviderProps {
  children: ReactNode;
}

// =====================================================
// NORMALIZE USER
// =====================================================
const normalizeUser = (data: any): User => {
  const role = String(
    data?.role ?? data?.type ?? ""
  )
    .trim()
    .toLowerCase();

  // ================================
  // NORMALIZED ROLE
  // ================================

  let normalizedRole = "user";

  if (role === "admin") {
    normalizedRole = "admin";
  } else if (
    role === "client" ||
    role === "customer"
  ) {
    normalizedRole = "client";
  }

  // ================================
  // NORMALIZED TYPE
  // ================================

  let normalizedType: User["type"] = "user";

  const originalType = String(
    data?.type ?? ""
  )
    .trim()
    .toLowerCase();

  if (originalType === "admin" || role === "admin") {
    normalizedType = "admin";
  } else if (
    originalType === "client" ||
    originalType === "customer" ||
    role === "client" ||
    role === "customer"
  ) {
    normalizedType = "client";
  }

  return {
    id: String(
      data?.id ??
      data?._id ??
      ""
    ),

    email: String(
      data?.email ?? ""
    ),

    name: String(
      data?.name ?? ""
    ),

    role: normalizedRole,

    type: normalizedType,

    clientId:
      data?.clientId != null
        ? String(data.clientId)
        : null,
  };
};
// =====================================================
// AUTH PROVIDER
// =====================================================

export const AuthProvider = ({
  children,
}: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);

  const [isAuthReady, setIsAuthReady] =
    useState(false);

  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL;

  // ===================================================
  // LOGOUT
  // ===================================================

  const logout = () => {
    console.log("🚪 LOGOUT");

    localStorage.removeItem("token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("token_expire");
    localStorage.removeItem("user");

    setUser(null);

    window.location.href = "/admin/login";
  };

  // ===================================================
  // LOGIN
  // ===================================================

  const login = (
    accessToken: string,
    refreshToken: string,
    userData: User
  ) => {
    console.log("================================");
    console.log("🔥 AUTH LOGIN");
    console.log("RAW USER:", userData);
    console.log("RAW ROLE:", userData.role);
    console.log("RAW TYPE:", userData.type);
    console.log("CLIENT ID:", userData.clientId);
    console.log("================================");

    // Normalize
    const normalizedUser =
      normalizeUser(userData);

    console.log(
      "✅ NORMALIZED USER:",
      normalizedUser
    );

    // -------------------------------------------------
    // ACCESS TOKEN
    // -------------------------------------------------

    localStorage.setItem(
      "token",
      accessToken
    );

    // -------------------------------------------------
    // REFRESH TOKEN
    // -------------------------------------------------

    localStorage.setItem(
      "refresh_token",
      refreshToken
    );

    // Keep compatibility
    localStorage.setItem(
      "refreshToken",
      refreshToken
    );

    // -------------------------------------------------
    // USER
    // -------------------------------------------------

    localStorage.setItem(
      "user",
      JSON.stringify(normalizedUser)
    );

    // -------------------------------------------------
    // ACCESS TOKEN EXPIRY
    // Backend = 7 days
    // -------------------------------------------------

    const expireAt =
      Date.now() +
      7 * 24 * 60 * 60 * 1000;

    localStorage.setItem(
      "token_expire",
      expireAt.toString()
    );

    // -------------------------------------------------
    // REACT STATE
    // -------------------------------------------------

    setUser(normalizedUser);

    console.log(
      "✅ USER SAVED:",
      normalizedUser
    );
  };

  // ===================================================
  // REFRESH ACCESS TOKEN
  // ===================================================

  const refreshAccessToken = async () => {
    console.log(
      "🔄 REFRESH ACCESS TOKEN"
    );

    const refreshToken =
      localStorage.getItem(
        "refresh_token"
      ) ||
      localStorage.getItem(
        "refreshToken"
      );

    if (!refreshToken) {
      console.log(
        "❌ NO REFRESH TOKEN"
      );

      logout();
      return;
    }

    try {
      const response =
        await axios.post(
          `${API_BASE_URL}/api/auth/refresh`,
          {
            refreshToken,
          }
        );

      const newToken =
        response.data?.accessToken;

      if (!newToken) {
        console.error(
          "❌ No accessToken returned"
        );

        logout();
        return;
      }

      localStorage.setItem(
        "token",
        newToken
      );

      // Backend access token = 7 days
      const expireAt =
        Date.now() +
        7 * 24 * 60 * 60 * 1000;

      localStorage.setItem(
        "token_expire",
        expireAt.toString()
      );

      console.log(
        "✅ ACCESS TOKEN REFRESHED"
      );
    } catch (error) {
      console.error(
        "❌ REFRESH FAILED:",
        error
      );

      logout();
    }
  };

  // ===================================================
  // INITIALIZE AUTH
  // ===================================================

  useEffect(() => {
    let timer:
      ReturnType<typeof setTimeout> | null =
      null;

    const initializeAuth = async () => {
      console.log(
        "================================"
      );

      console.log(
        "🔍 AUTH INITIALIZATION"
      );

      const token =
        localStorage.getItem("token");

      const storedUser =
        localStorage.getItem("user");

      const expireAt =
        Number(
          localStorage.getItem(
            "token_expire"
          ) || 0
        );

      console.log(
        "TOKEN:",
        !!token
      );

      console.log(
        "STORED USER:",
        storedUser
      );

      // ------------------------------------------------
      // NO TOKEN
      // ------------------------------------------------

      if (!token) {
        setUser(null);
        setIsAuthReady(true);

        console.log(
          "❌ NO TOKEN"
        );

        return;
      }

      // ------------------------------------------------
      // NO USER
      // ------------------------------------------------

      if (!storedUser) {
        setUser(null);
        setIsAuthReady(true);

        console.log(
          "❌ NO STORED USER"
        );

        return;
      }

      // ------------------------------------------------
      // PARSE USER
      // ------------------------------------------------

      let parsedUser: any;

      try {
        parsedUser =
          JSON.parse(storedUser);
      } catch (error) {
        console.error(
          "❌ INVALID USER JSON",
          error
        );

        localStorage.removeItem(
          "user"
        );

        setUser(null);
        setIsAuthReady(true);

        return;
      }

      // ------------------------------------------------
      // NORMALIZE
      // ------------------------------------------------

      const normalizedUser =
        normalizeUser(parsedUser);

      console.log(
        "🔥 STORED USER:",
        normalizedUser
      );

      console.log(
        "🔥 ROLE:",
        normalizedUser.role
      );

      console.log(
        "🔥 TYPE:",
        normalizedUser.type
      );

      console.log(
        "🔥 CLIENT ID:",
        normalizedUser.clientId
      );

      // Save normalized user
      localStorage.setItem(
        "user",
        JSON.stringify(
          normalizedUser
        )
      );

      // ------------------------------------------------
      // TOKEN EXPIRED
      // ------------------------------------------------

      if (
        expireAt &&
        Date.now() >= expireAt
      ) {
        console.log(
          "⚠️ TOKEN EXPIRED"
        );

        await refreshAccessToken();

        setUser(
          normalizedUser
        );

        setIsAuthReady(true);

        return;
      }

      // ------------------------------------------------
      // TOKEN VALID
      // ------------------------------------------------

      setUser(
        normalizedUser
      );

      // ------------------------------------------------
      // REFRESH TIMER
      // ------------------------------------------------

      if (expireAt) {
        const remaining =
          expireAt - Date.now();

        // Refresh 5 minutes before expiry
        const refreshBefore =
          5 * 60 * 1000;

        const refreshTime =
          remaining >
          refreshBefore
            ? remaining -
              refreshBefore
            : Math.max(
                remaining - 1000,
                1000
              );

        console.log(
          "⏰ REFRESH IN:",
          refreshTime
        );

        timer =
          setTimeout(
            async () => {
              await refreshAccessToken();
            },
            refreshTime
          );
      }

      console.log(
        "✅ AUTH READY"
      );

      setIsAuthReady(true);
    };

    initializeAuth();

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, []);

  // ===================================================
  // PROVIDER
  // ===================================================

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthReady,
        login,
        logout,
        refreshAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// =====================================================
// USE AUTH
// =====================================================

export const useAuth = () => {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used within AuthProvider"
    );
  }

  return context;
};