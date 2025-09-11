// src/Layout.tsx
import React from "react";
import { Outlet } from "react-router-dom";
import Slider from "../Common/Slider";
import Footer from "./Footer";
import Header from "./Header";

const Layout: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <Header />

      {/* Main content with sidebar */}
      <div className="flex flex-1 bg-gray-100">
        {/* Sidebar */}
        <Slider />

        {/* Page content */}
        <main className="flex-1 p-2 overflow-auto">
          <Outlet />
        </main>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Layout;
