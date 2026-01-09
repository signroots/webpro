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
  Globe,
} from "lucide-react";

interface MenuItem {
  name: string;
  icon: React.ReactNode;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  { name: "Dashboard", icon: <BarChart size={20} /> },
  { name: "Orders", icon: <ShoppingCart size={20} /> },
  { name: "Renew List", icon: <BarChart size={16} /> },
  { name: "DNS Orders", icon: <Globe size={20} /> },
  { name: "Customers", icon: <Users size={20} /> },
  {
    name: "Settings",
    icon: <Settings size={20} />,
    children: [
      { name: "Status", icon: <BarChart size={16} /> },
      { name: "User Types", icon: <Layers size={16} /> },
      { name: "Data Management", icon: <Layers size={16} /> },
    ],
  },
];

// ✅ Role-based menu visibility
const roleMenus: Record<string, string[]> = {
  Customer: ["Dashboard", "Orders", "DNS Orders"],
  Admin: ["Dashboard", "Orders", "Renew List", "DNS Orders", "Customers", "Settings"],
};

const Slider: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const userJson = localStorage.getItem("user");
  const user = userJson ? JSON.parse(userJson) : null;
  const userRole = user?.role || "";

  const getPathFor = (name: string): string => {
    switch (name) {
      case "Dashboard":
        return "/admin/dashboard_management";
      case "Orders":
        return "/admin/orders";
      case "DNS Orders":
        return "/admin/dns-order";
      case "Renew List":
        return "/admin/renew-list";
      case "Customers":
        return "/admin/customers";
      case "Status":
        return "/admin/status";
      case "User Types":
        return "/admin/user-types";
      case "Data Management":
        return "/admin/data-management";
      default:
        return "#";
    }
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
      {/* Collapse Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center p-4 border-b border-gray-800 hover:bg-gray-800"
      >
        {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
      </button>

      {/* Menu */}
      <nav className="flex-1 mt-4">
        {filteredMenuItems.map((item) =>
          item.children ? (
            <div key={item.name}>
              <button
                onClick={() => toggleSubMenu(item.name)}
                className={`w-full flex items-center p-4 my-2 rounded-lg hover:bg-gray-800 ${
                  openMenu === item.name ? "bg-gray-800" : ""
                }`}
              >
                <div className="w-8 h-8 flex items-center justify-center bg-gray-700 rounded-full mr-3">
                  {item.icon}
                </div>
                {!collapsed && <span className="text-sm flex-1 text-left">{item.name}</span>}
                {!collapsed && <span>{openMenu === item.name ? "−" : "+"}</span>}
              </button>

              {openMenu === item.name && !collapsed && (
                <div className="ml-10">
                  {item.children.map((child) => (
                    <NavLink
                      key={child.name}
                      to={getPathFor(child.name)}
                      className={({ isActive }) =>
                        `flex items-center p-2 my-1 rounded-lg text-sm hover:bg-gray-800 ${
                          isActive ? "bg-gray-700 font-semibold" : ""
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
            <NavLink
              key={item.name}
              to={getPathFor(item.name)}
              className={({ isActive }) =>
                `flex items-center p-4 my-2 rounded-lg hover:bg-gray-800 ${
                  isActive ? "bg-gray-700 font-semibold" : ""
                }`
              }
            >
              <div className="w-8 h-8 flex items-center justify-center bg-gray-700 rounded-full mr-3">
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
