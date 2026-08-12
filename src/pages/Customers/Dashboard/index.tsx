import React from "react";
import { Link } from "react-router-dom";
import {
  ShoppingCart,
  Globe,
  Server,
  Mail,
  ShieldCheck,
} from "lucide-react";

const CustomerDashboard: React.FC = () => {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">

      {/* ================= HEADER ================= */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Dashboard
        </h1>

        <p className="text-gray-500 mt-1">
          Welcome to your customer dashboard
        </p>
      </div>

      {/* ================= QUICK CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

        {/* Orders */}
        <Link
          to="/customer/orders"
          className="bg-white rounded-xl shadow-sm border p-5 hover:shadow-md transition"
        >
          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-gray-500">
                Orders
              </p>

              <h2 className="text-2xl font-bold text-gray-800 mt-2">
                -
              </h2>
            </div>

            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <ShoppingCart
                size={24}
                className="text-blue-600"
              />
            </div>

          </div>
        </Link>

        {/* Domains */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-gray-500">
                Domains
              </p>

              <h2 className="text-2xl font-bold text-gray-800 mt-2">
                -
              </h2>
            </div>

            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <Globe
                size={24}
                className="text-green-600"
              />
            </div>

          </div>
        </div>

        {/* Hosting */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-gray-500">
                Hosting
              </p>

              <h2 className="text-2xl font-bold text-gray-800 mt-2">
                -
              </h2>
            </div>

            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
              <Server
                size={24}
                className="text-purple-600"
              />
            </div>

          </div>
        </div>

        {/* Email */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-gray-500">
                Email Services
              </p>

              <h2 className="text-2xl font-bold text-gray-800 mt-2">
                -
              </h2>
            </div>

            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
              <Mail
                size={24}
                className="text-orange-600"
              />
            </div>

          </div>
        </div>

      </div>

      {/* ================= SERVICES ================= */}
      <div className="mt-8">

        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          My Services
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

          {/* Domain */}
          <Link
            to="/customer/orders"
            className="bg-white border rounded-xl p-6 hover:shadow-md transition"
          >
            <Globe
              size={30}
              className="text-blue-500 mb-4"
            />

            <h3 className="font-semibold text-gray-800">
              Domains
            </h3>

            <p className="text-sm text-gray-500 mt-1">
              Manage your domain services
            </p>
          </Link>

          {/* Email */}
          <Link
            to="/customer/orders"
            className="bg-white border rounded-xl p-6 hover:shadow-md transition"
          >
            <Mail
              size={30}
              className="text-orange-500 mb-4"
            />

            <h3 className="font-semibold text-gray-800">
              Email
            </h3>

            <p className="text-sm text-gray-500 mt-1">
              Manage your email services
            </p>
          </Link>

          {/* SSL */}
          <Link
            to="/customer/orders"
            className="bg-white border rounded-xl p-6 hover:shadow-md transition"
          >
            <ShieldCheck
              size={30}
              className="text-yellow-500 mb-4"
            />

            <h3 className="font-semibold text-gray-800">
              SSL
            </h3>

            <p className="text-sm text-gray-500 mt-1">
              Manage your SSL certificates
            </p>
          </Link>

        </div>

      </div>

      {/* ================= RECENT ORDERS ================= */}
      <div className="mt-8 bg-white border rounded-xl shadow-sm">

        <div className="flex items-center justify-between p-5 border-b">

          <div>
            <h2 className="font-semibold text-gray-800">
              Recent Orders
            </h2>

            <p className="text-sm text-gray-500">
              Your latest orders
            </p>
          </div>

          <Link
            to="/customer/orders"
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            View All
          </Link>

        </div>

        <div className="p-8 text-center text-gray-400">
          No recent orders
        </div>

      </div>

    </div>
  );
};

export default CustomerDashboard;