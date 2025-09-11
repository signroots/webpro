import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { ChevronLeft, ChevronRight, Home, Users, Mail,BarChart,ShoppingCart   } from "lucide-react"; // ✅ added Mail

const menuItems = [
  { name: "Order", path: "/order", icon: <ShoppingCart  size={20} /> },
  { name: "Domains", path: "/domains", icon: <Home size={20} /> },
  { name: "Customers", path: "/customers", icon: <Users size={20} /> },
  { name: "Emails", path: "/emails", icon: <Mail size={20} /> }, // ✅ new menu item
  { name: "Status", path: "/status", icon: <BarChart  size={20} /> },
];

const Slider: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className={`${
        collapsed ? "w-20" : "w-64"
      } bg-gray-900 text-white transition-all duration-300 min-h-screen flex flex-col shadow-xl`}
    >
      {/* Collapse/Expand Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center p-4 border-b border-gray-800 hover:bg-gray-800 transition-colors duration-200"
      >
        {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
      </button>

      {/* Menu Items */}
      <nav className="flex-1 mt-4">
        {menuItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center p-4 my-2 rounded-lg transition-all duration-200 hover:bg-gray-800 ${
                isActive ? "bg-gray-700 font-semibold" : ""
              }`
            }
          >
            {/* Icon */}
            <div className="flex items-center justify-center w-8 h-8 bg-gray-700 rounded-full mr-3">
              {item.icon}
            </div>
            {!collapsed && <span className="text-sm">{item.name}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer / Extra Info */}
      {!collapsed && (
        <div className="p-4 border-t border-gray-800 text-sm text-gray-400">
          © 2025 MyApp
        </div>
      )}
    </div>
  );
};

export default Slider;
