import React, { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./Auth";

interface RequireAuthProps {
  allowedRoles: string[];
  children: ReactNode;
}

const RequireAuth: React.FC<RequireAuthProps> = ({
  allowedRoles,
  children,
}) => {
  const { user, isAuthReady } = useAuth();
  const location = useLocation();

  const currentRole = String(user?.role || "")
    .trim()
    .toLowerCase();

  const normalizedAllowedRoles = allowedRoles.map((role) =>
    String(role).trim().toLowerCase()
  );

  const hasAccess =
    normalizedAllowedRoles.includes(currentRole);

  console.log("====================================");
  console.log("🔐 REQUIRE AUTH");
  console.log("PATH:", location.pathname);
  console.log("AUTH READY:", isAuthReady);
  console.log("USER:", user);
  console.log("USER ROLE:", currentRole);
  console.log(
    "ALLOWED ROLES:",
    normalizedAllowedRoles
  );
  console.log("HAS ACCESS:", hasAccess);
  console.log("====================================");

  if (!isAuthReady) {
    return <div>Loading...</div>;
  }

  if (!user) {
    console.log("❌ REQUIRE AUTH: NO USER");

    return (
      <Navigate
        to="/customer/login"
        state={{ from: location }}
        replace
      />
    );
  }

  if (!hasAccess) {
    console.log("❌ REQUIRE AUTH: ROLE NOT ALLOWED");
    console.log("ROLE:", currentRole);
    console.log(
      "ALLOWED:",
      normalizedAllowedRoles
    );

    return (
      <Navigate
        to="/unauthorized"
        replace
      />
    );
  }

  console.log("✅ REQUIRE AUTH: ACCESS GRANTED");

  return <>{children}</>;
};

export default RequireAuth;