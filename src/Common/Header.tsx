import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiLogOut, FiUser } from "react-icons/fi";

const Header: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/"); // back to login
  };

  return (
    <header className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-3">
          <Link to="/domain-list">
            <img
              src="/signroots_logo.jpg"
              alt="SignRoots Logo"
              className="h-12 w-auto"
            />
          </Link>
          <span className="text-gray-800 font-bold text-3xl">SignRoots</span>
        </div>

        {/* Center navigation links */}
        {/* <nav className="flex items-center space-x-6 text-gray-700 font-medium">
          <Link to="/domain-list" className="hover:text-green-600 transition-colors">
            Domains
          </Link>
          <Link to="/about" className="hover:text-green-600 transition-colors">
            About
          </Link>
          <Link to="/contact" className="hover:text-green-600 transition-colors">
            Contact
          </Link>
        </nav> */}

        {/* Profile Menu aligned to the right */}
        <div className="absolute top-3 right-6">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center space-x-2 focus:outline-none"
          >
            <div className="w-10 h-10 flex items-center justify-center rounded-full bg-green-500 text-white font-bold">
              {user?.name ? user.name.charAt(0).toUpperCase() : <FiUser />}
            </div>
            <span className="hidden sm:block text-gray-700 font-medium">
              {user?.name || "Profile"}
            </span>
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg">
              <div className="px-4 py-2 border-b">
                <p className="text-sm font-medium text-gray-800">
                  {user?.name || "Guest"}
                </p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
              >
                <FiLogOut className="mr-2" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
