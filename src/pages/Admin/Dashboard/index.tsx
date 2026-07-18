import React, { useEffect, useState } from "react";
import { fetchDashboardMetrics, DashboardMetrics } from "./api";
import { ShoppingCart, Globe, Users, RefreshCw, Store } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard metrics on component mount
  useEffect(() => {
    fetchDashboardMetrics()
      .then((data) => setMetrics(data))
      .catch(() => setError("Failed to load dashboard metrics"))
      .finally(() => setLoading(false));
  }, []);

  // Show loading or error states
  if (loading) return <p className="p-6 text-gray-700">Loading dashboard…</p>;
  if (error) return <p className="p-6 text-red-600">{error}</p>;

  // Prepare renewal chart data (Previous, Current, Next month)
  const renewalChartData = metrics
    ? [
        { month: "Previous Month", count: metrics.renewals.previousMonth },
        { month: "Current Month", count: metrics.renewals.currentMonth },
        { month: "Next Month", count: metrics.renewals.nextMonth },
      ]
    : [];

  return (
    <div className="min-h-screen p-6 bg-gray-100">
      {/* Dashboard Header */}
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Admin Dashboard</h1>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Total Orders */}
        <MetricCard
          icon={<ShoppingCart size={36} className="text-blue-500" />}
          label="Total Orders"
          value={metrics?.totalOrders}
        />

        {/* DNS Orders */}
        <MetricCard
          icon={<Globe size={36} className="text-green-500" />}
          label="DNS Orders"
          value={metrics?.dnsOrders}
        />

        {/* Registrar Orders */}
        <MetricCard
          icon={<Store size={36} className="text-indigo-500" />}
          label="Registrar Orders"
          value={metrics?.registrarOrder}
        />

        {/* Reseller Club Orders */}
        <MetricCard
          icon={<Store size={36} className="text-teal-500" />}
          label="Reseller Club Orders"
          value={metrics?.resellerOrder}
        />

        {/* Total Customers */}
        <MetricCard
          icon={<Users size={36} className="text-purple-500" />}
          label="Total Customers"
          value={metrics?.totalCustomers}
        />
      </div>

      {/* Renewal Chart Section */}
      <div className="mt-10 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">
          Renewals Overview
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={renewalChartData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="#facc15" barSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

/**
 * MetricCard Component
 * Reusable card for displaying a metric with icon, label, and value.
 */
interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | undefined;
}

const MetricCard: React.FC<MetricCardProps> = ({ icon, label, value }) => (
  <div className="bg-white rounded-lg shadow p-6 flex items-center gap-4 hover:shadow-lg transition-shadow">
    {icon}
    <div>
      <p className="text-gray-500 text-sm">{label}</p>
      <p className="text-xl font-bold text-gray-800">{value ?? 0}</p>
    </div>
  </div>
);

export default Dashboard;



