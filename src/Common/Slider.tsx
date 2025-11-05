import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Users,
  BarChart,
  ShoppingCart,
  Settings,
  Layers,
} from "lucide-react";

interface MenuItem {
  name: string;
  icon: React.ReactNode;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  { name: "Order", icon: <ShoppingCart size={20} /> },
  { name: "Customers", icon: <Users size={20} /> },
  {
    name: "Settings",
    icon: <Settings size={20} />,
    children: [
      { name: "Status", icon: <BarChart size={16} /> },
      { name: "User Types", icon: <Layers size={16} /> },
      {name:"Data Management", icon: <Layers size={16} />}

    ],
  },
];

const roleMenus: Record<string, string[]> = {
  Customer: ["Order"],
  Admin: ["Order", "Customers", "Settings"],
};

const Slider: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const userJson = localStorage.getItem("user");
  const user = userJson ? JSON.parse(userJson) : null;
  const userRole = user?.role || "";

  const getPathFor = (name: string): string => {
    if (name === "Order") {
      return userRole === "Admin" ? "/admin/orders" : "/customer/orders";
    }
    if (name === "Customers") return "/admin/customers";
    if (name === "Status") return "/admin/status";
    if (name === "User Types") return "/admin/user-types";
     if (name === "Data Management") return "/admin/data-management";
    return "#";
  };

  const filteredMenuItems = menuItems.filter((item) =>
    roleMenus[userRole]?.includes(item.name)
  );

  const toggleSubMenu = (menuName: string) => {
    setOpenMenu(openMenu === menuName ? null : menuName);
  };

  return (
    <div
      className={`${
        collapsed ? "w-20" : "w-64"
      } bg-gray-900 text-white transition-all duration-300 min-h-screen flex flex-col shadow-xl`}
    >
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center p-4 border-b border-gray-800 hover:bg-gray-800 transition-colors duration-200"
        aria-label={collapsed ? "Expand menu" : "Collapse menu"}
      >
        {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
      </button>

      <nav className="flex-1 mt-4">
        {filteredMenuItems.map((item) =>
          item.children ? (
            <div key={item.name}>
              <button
                onClick={() => toggleSubMenu(item.name)}
                className={`w-full flex items-center p-4 my-2 rounded-lg transition-all duration-200 hover:bg-gray-800 ${
                  openMenu === item.name ? "bg-gray-800" : ""
                }`}
                aria-expanded={openMenu === item.name}
                aria-controls={`${item.name}-submenu`}
              >
                <div className="flex items-center justify-center w-8 h-8 bg-gray-700 rounded-full mr-3">
                  {item.icon}
                </div>
                {!collapsed && (
                  <span className="text-sm flex-1 text-left">{item.name}</span>
                )}
                {!collapsed && <span>{openMenu === item.name ? "−" : "+"}</span>}
              </button>

              {openMenu === item.name && !collapsed && (
                <div
                  id={`${item.name}-submenu`}
                  className="ml-10"
                  role="region"
                  aria-label={`${item.name} submenu`}
                >
                  {item.children.map((child) => (
                    <NavLink
                      key={child.name}
                      to={getPathFor(child.name)}
                      className={({ isActive }) =>
                        `flex items-center p-2 my-1 rounded-lg text-sm transition-all duration-200 hover:bg-gray-800 ${
                          isActive ? "bg-gray-700 font-semibold" : ""
                        }`
                      }
                    >
                      <div className="flex items-center justify-center w-6 h-6 bg-gray-700 rounded-full mr-2">
                        {child.icon}
                      </div>
                      {child.name}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <NavLink
              key={item.name}
              to={getPathFor(item.name)}
              className={({ isActive }) =>
                `flex items-center p-4 my-2 rounded-lg transition-all duration-200 hover:bg-gray-800 ${
                  isActive ? "bg-gray-700 font-semibold" : ""
                }`
              }
            >
              <div className="flex items-center justify-center w-8 h-8 bg-gray-700 rounded-full mr-3">
                {item.icon}
              </div>
              {!collapsed && <span className="text-sm">{item.name}</span>}
            </NavLink>
          )
        )}
      </nav>

      {!collapsed && (
        <div className="p-4 border-t border-gray-800 text-sm text-gray-400">
          © 2025 MyApp
        </div>
      )}
    </div>
  );
};

export default Slider;
