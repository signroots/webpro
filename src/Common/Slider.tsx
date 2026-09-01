import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Users,
  BarChart,
  ShoppingCart,
  Settings,
  Layers,
  Globe,
  Database,
  Archive,
} from "lucide-react";

interface MenuItem {
  name: string;
  icon: React.ReactNode;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  {
    name: "Dashboard",
    icon: <BarChart size={20} />,
  },
  {
    name: "Orders",
    icon: <ShoppingCart size={20} />,
  },
  {
    name: "Renew List",
    icon: <BarChart size={16} />,
  },
  {
    name: "Archived Orders",
    icon: <Archive size={20} />,
  },
  {
    name: "DNS Orders",
    icon: <Globe size={20} />,
  },
  {
    name: "Customers",
    icon: <Users size={20} />,
  },
  {
  name: "User Activity",
  icon: <Layers size={20} />,
},
  {
    name: "Settings",
    icon: <Settings size={20} />,
    children: [
      {
        name: "Status",
        icon: <BarChart size={16} />,
      },
      {
        name: "User Types",
        icon: <Layers size={16} />,
      },
      {
        name: "Data Management",
        icon: <Layers size={16} />,
      },
      {
        name: "Domain Source",
        icon: <Database size={16} />,
      },
    ],
    
  },
  
];

// =====================================================
// ROLE BASED MENU
// =====================================================

const roleMenus: Record<string, string[]> = {
  // ================= ADMIN =================
  admin: [
    "Dashboard",
    "Orders",
    "Renew List",
     "Archived Orders",
    "DNS Orders",
    "Customers",
      "User Activity",
    "Settings",
  ],

  // ================= CLIENT =================
  client: [
    "Dashboard",
    "Orders",
  ],

  // ================= CUSTOMER =================
  customer: [
    "Orders",
  ],

  // ================= USER =================
  user: [
    "Orders",
  ],
};

const Slider: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
const location = useLocation();
  // =====================================================
  // GET USER
  // =====================================================

  const userJson = localStorage.getItem("user");

  let user: any = null;

  try {
    user = userJson ? JSON.parse(userJson) : null;
  } catch (error) {
    console.error("❌ Failed to parse sidebar user:", error);
    user = null;
  }

  // =====================================================
  // NORMALIZE ROLE
  // =====================================================

  const userRole = String(user?.role || "")
    .trim()
    .toLowerCase();

  console.log("====================================");
  console.log("🔥 SIDEBAR");
  console.log("USER:", user);
  console.log("ROLE:", userRole);
  console.log("MENU:", roleMenus[userRole]);
  console.log("====================================");

  // =====================================================
  // PATH
  // =====================================================

  const getPathFor = (name: string): string => {
  const isClientOrCustomer =
    userRole === "client" ||
    userRole === "customer";

  switch (name) {
    case "Dashboard":
      return isClientOrCustomer
        ? "/customer/dashboard"
        : "/admin/dashboard_management";

    case "Orders":
      return isClientOrCustomer
        ? "/customer/orders"
        : "/admin/orders";

    case "DNS Orders":
      return "/admin/dns-order";

    case "Renew List":
      return "/admin/renew-list";
    case "Archived Orders":
      return "/admin/archived-orders";
    case "Customers":
      return "/admin/customers";
case "User Activity":
  return "/admin/user-activity";
    case "Status":
      return "/admin/status";

    case "User Types":
      return "/admin/user-types";

    case "Data Management":
      return "/admin/data-management";

    case "Domain Source":
      return "/admin/domain-source";

    default:
      return "#";
  }
};


const isMenuActive = (name: string): boolean => {
  const pathname = location.pathname;
  const from = location.state?.from;

  // Edit page
  if (pathname.startsWith("/admin/orders/update/")) {
    if (from === "renewal" && name === "Renew List") {
      return true;
    }

    if (from === "dns" && name === "DNS Orders") {
      return true;
    }

    if (from === "orders" && name === "Orders") {
      return true;
    }

    return false;
  }

  // Normal pages
  switch (name) {
    case "Orders":
      return pathname === "/admin/orders";

    case "Renew List":
      return pathname === "/admin/renew-list";
    case "Archived Orders":
      return pathname === "/admin/archived-orders";
    case "DNS Orders":
      return pathname === "/admin/dns-order";

    case "Dashboard":
      return pathname === "/admin/dashboard_management";

    case "Customers":
      return pathname === "/admin/customers";
case "User Activity":
  return pathname === "/admin/user-activity";
    case "Status":
      return pathname === "/admin/status";

    case "User Types":
      return pathname === "/admin/user-types";

    case "Data Management":
      return pathname === "/admin/data-management";

    case "Domain Source":
      return pathname === "/admin/domain-source";

    default:
      return false;
  }
};

  // =====================================================
  // FILTER MENU BASED ON ROLE
  // =====================================================

  const allowedMenu = roleMenus[userRole] || [];

  const filteredMenuItems = menuItems.filter((item) =>
    allowedMenu.includes(item.name)
  );

  // =====================================================
  // SUB MENU
  // =====================================================

  const toggleSubMenu = (menuName: string) => {
    setOpenMenu((current) =>
      current === menuName ? null : menuName
    );
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div
      className={`${
        collapsed ? "w-20" : "w-64"
      } bg-gray-900 text-white transition-all duration-300 min-h-screen flex flex-col shadow-xl`}
    >
      {/* =================================================
          COLLAPSE BUTTON
      ================================================= */}

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center p-4 border-b border-gray-800 hover:bg-gray-800"
      >
        {collapsed ? (
          <ChevronRight size={20} />
        ) : (
          <ChevronLeft size={20} />
        )}
      </button>

      {/* =================================================
          MENU
      ================================================= */}

      <nav className="flex-1 mt-4">
        {filteredMenuItems.map((item) =>
          item.children ? (
            <div key={item.name}>
              {/* SETTINGS BUTTON */}

              <button
                onClick={() => toggleSubMenu(item.name)}
                className={`w-full flex items-center p-4 my-2 rounded-lg hover:bg-gray-800 ${
                  openMenu === item.name
                    ? "bg-gray-800"
                    : ""
                }`}
              >
                <div className="w-8 h-8 flex items-center justify-center bg-gray-700 rounded-full mr-3">
                  {item.icon}
                </div>

                {!collapsed && (
                  <span className="text-sm flex-1 text-left">
                    {item.name}
                  </span>
                )}

                {!collapsed && (
                  <span>
                    {openMenu === item.name ? "−" : "+"}
                  </span>
                )}
              </button>

              {/* SETTINGS CHILDREN */}

              {openMenu === item.name &&
                !collapsed && (
                  <div className="ml-10">
                    {item.children.map((child) => (
                      <NavLink
                        key={child.name}
                        to={getPathFor(child.name)}
                        className={({ isActive }) =>
                          `flex items-center p-2 my-1 rounded-lg text-sm hover:bg-gray-800 ${
                            isActive
                              ? "bg-gray-700 font-semibold"
                              : ""
                          }`
                        }
                      >
                        <div className="w-6 h-6 flex items-center justify-center bg-gray-700 rounded-full mr-2">
                          {child.icon}
                        </div>

                        {child.name}
                      </NavLink>
                    ))}
                  </div>
                )}
            </div>
          ) : (
            /* =================================================
               NORMAL MENU ITEM
            ================================================= */

            <NavLink
  key={item.name}
  to={getPathFor(item.name)}
  className={() =>
    `flex items-center p-4 my-2 rounded-lg hover:bg-gray-800 ${
      isMenuActive(item.name)
        ? "bg-gray-700 font-semibold"
        : ""
    }`
  }
>

              <div className="w-8 h-8 flex items-center justify-center bg-gray-700 rounded-full mr-3">
                {item.icon}
              </div>

              {!collapsed && (
                <span className="text-sm">
                  {item.name}
                </span>
              )}
            </NavLink>
          )
        )}
      </nav>

      {/* =================================================
          FOOTER
      ================================================= */}

      {!collapsed && (
        <div className="p-4 border-t border-gray-800 text-sm text-gray-400">
          © 2025 MyApp
        </div>
      )}
    </div>
  );
};

export default Slider;