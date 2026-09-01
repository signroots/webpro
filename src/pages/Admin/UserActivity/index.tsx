import React, { useEffect, useState } from "react";

import {
  Search,
  Filter,
  RefreshCw,
  Eye,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";

import {
  getUserActivities,
  getActivityFilterOptions,
  getActivityById,
  UserActivity,
  ActivityFilterOptions,
} from "./api";

import { notify } from "../../../Common/Toastify";

const UserActivityPage: React.FC = () => {
  // =====================================================
  // ACTIVITY DATA
  // =====================================================

  const [activities, setActivities] =
    useState<UserActivity[]>([]);

  // =====================================================
  // FILTER OPTIONS
  // =====================================================

  const [filterOptions, setFilterOptions] =
    useState<ActivityFilterOptions>({
      users: [],
      actions: [],
      domains: [],
    });

  // =====================================================
  // FILTER STATES
  // =====================================================

  const [search, setSearch] =
    useState("");

  const [domainName, setDomainName] =
    useState("");

  const [performedBy, setPerformedBy] =
    useState("");

  const [action, setAction] =
    useState("");

  const [startDate, setStartDate] =
    useState("");

  const [endDate, setEndDate] =
    useState("");

  // =====================================================
  // PAGINATION
  // =====================================================

  const [page, setPage] =
    useState(1);

  const [limit] =
    useState(25);

  const [total, setTotal] =
    useState(0);

  const [totalPages, setTotalPages] =
    useState(0);

  // =====================================================
  // LOADING
  // =====================================================

  const [loading, setLoading] =
    useState(false);

  // =====================================================
  // DETAIL MODAL
  // =====================================================

  const [selectedActivity, setSelectedActivity] =
    useState<UserActivity | null>(null);

  const [detailLoading, setDetailLoading] =
    useState(false);

  // =====================================================
  // LOAD FILTER OPTIONS
  // =====================================================

  const loadFilterOptions = async () => {
    try {
      const data =
        await getActivityFilterOptions();

      setFilterOptions(data);
    } catch (error: any) {
      console.error(
        "Failed to load activity filters:",
        error
      );

      notify(
        "Failed to load activity filters",
        "error"
      );
    }
  };

  // =====================================================
  // LOAD ACTIVITIES
  // =====================================================

  const loadActivities = async () => {
    try {
      setLoading(true);

      const response =
        await getUserActivities(
          page,
          limit,
          {
            domainName,
            performedBy,
            action,
            startDate,
            endDate,
            search,
          }
        );

      setActivities(
        response.data || []
      );

      setTotal(
        response.pagination?.total || 0
      );

      setTotalPages(
        response.pagination?.totalPages || 0
      );
    } catch (error: any) {
      console.error(
        "Failed to load activities:",
        error
      );

      notify(
        error?.response?.data?.error?.message ||
          "Failed to load user activities",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    loadFilterOptions();
  }, []);

  // =====================================================
  // LOAD WHEN PAGE CHANGES
  // =====================================================

  useEffect(() => {
    loadActivities();
  }, [page]);

  // =====================================================
  // SEARCH
  // =====================================================

  const handleSearch = () => {
    setPage(1);

    loadActivities();
  };

  // =====================================================
  // CLEAR FILTERS
  // =====================================================

  const clearFilters = () => {
    setSearch("");
    setDomainName("");
    setPerformedBy("");
    setAction("");
    setStartDate("");
    setEndDate("");

    setPage(1);

    setTimeout(() => {
      loadActivities();
    }, 0);
  };

  // =====================================================
  // VIEW ACTIVITY
  // =====================================================

  const handleViewActivity = async (
    id: string
  ) => {
    try {
      setDetailLoading(true);

      const activity =
        await getActivityById(id);

      setSelectedActivity(activity);
    } catch (error: any) {
      console.error(
        "Failed to load activity:",
        error
      );

      notify(
        "Failed to load activity details",
        "error"
      );
    } finally {
      setDetailLoading(false);
    }
  };

  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDate = (
    date?: string
  ) => {
    if (!date) return "-";

    return new Date(date).toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  // =====================================================
  // ACTION BADGE
  // =====================================================

  const getActionClass = (
    action: string
  ) => {
    switch (
      action?.toUpperCase()
    ) {
      case "CREATED":
        return "bg-green-100 text-green-700";

      case "UPDATED":
        return "bg-blue-100 text-blue-700";

      case "PLAN_CHANGED":
        return "bg-purple-100 text-purple-700";

      case "DELETED":
        return "bg-red-100 text-red-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="p-6 bg-gray-50 min-h-screen">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex items-center justify-between mb-6">

        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            User Activity
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            View all user activities and order changes
          </p>
        </div>

        <button
          onClick={loadActivities}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-100"
        >
          <RefreshCw
            size={16}
            className={
              loading
                ? "animate-spin"
                : ""
            }
          />

          Refresh
        </button>

      </div>

      {/* =================================================
          FILTER SECTION
      ================================================= */}

      <div className="bg-white border rounded-xl shadow-sm p-5 mb-6">

        <div className="flex items-center gap-2 mb-4">

          <Filter size={18} />

          <h2 className="font-semibold text-gray-800">
            Filters
          </h2>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">

          {/* SEARCH */}

          <div className="xl:col-span-2">

            <label className="block text-xs font-medium text-gray-600 mb-1">
              Search
            </label>

            <div className="relative">

              <Search
                size={16}
                className="absolute left-3 top-3 text-gray-400"
              />

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter"
                  ) {
                    handleSearch();
                  }
                }}
                placeholder="Search domain, user, action..."
                className="w-full h-10 border border-gray-300 rounded-lg pl-9 pr-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />

            </div>

          </div>

          {/* DOMAIN */}

          <div>

            <label className="block text-xs font-medium text-gray-600 mb-1">
              Domain Name
            </label>

            <input
              type="text"
              value={domainName}
              onChange={(e) =>
                setDomainName(
                  e.target.value
                )
              }
              placeholder="Domain name"
              className="w-full h-10 border border-gray-300 rounded-lg px-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />

          </div>

          {/* CREATED BY */}

          <div>

            <label className="block text-xs font-medium text-gray-600 mb-1">
              Created By
            </label>

            <select
              value={performedBy}
              onChange={(e) =>
                setPerformedBy(
                  e.target.value
                )
              }
              className="w-full h-10 border border-gray-300 rounded-lg px-3 text-sm bg-white"
            >

              <option value="">
                All Users
              </option>

              {filterOptions.users.map(
                (user) => (
                  <option
                    key={user._id}
                    value={user._id}
                  >
                    {user.name ||
                      "Unknown"}
                  </option>
                )
              )}

            </select>

          </div>

          {/* ACTION */}

          <div>

            <label className="block text-xs font-medium text-gray-600 mb-1">
              Action
            </label>

            <select
              value={action}
              onChange={(e) =>
                setAction(
                  e.target.value
                )
              }
              className="w-full h-10 border border-gray-300 rounded-lg px-3 text-sm bg-white"
            >

              <option value="">
                All Actions
              </option>

              {filterOptions.actions.map(
                (item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                )
              )}

            </select>

          </div>

          {/* START DATE */}

          <div>

            <label className="block text-xs font-medium text-gray-600 mb-1">
              Start Date
            </label>

            <input
              type="date"
              value={startDate}
              onChange={(e) =>
                setStartDate(
                  e.target.value
                )
              }
              className="w-full h-10 border border-gray-300 rounded-lg px-3 text-sm"
            />

          </div>

          {/* END DATE */}

          <div>

            <label className="block text-xs font-medium text-gray-600 mb-1">
              End Date
            </label>

            <input
              type="date"
              value={endDate}
              onChange={(e) =>
                setEndDate(
                  e.target.value
                )
              }
              className="w-full h-10 border border-gray-300 rounded-lg px-3 text-sm"
            />

          </div>

        </div>

        {/* FILTER BUTTONS */}

        <div className="flex justify-end gap-3 mt-5">

          <button
            onClick={clearFilters}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-100"
          >
            <X size={15} />

            Clear
          </button>

          <button
            onClick={handleSearch}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
          >
            <Search size={15} />

            Search
          </button>

        </div>

      </div>

      {/* =================================================
          ACTIVITY TABLE
      ================================================= */}

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">

        {/* TABLE HEADER */}

        <div className="px-5 py-4 border-b flex items-center justify-between">

          <div>

            <h2 className="font-semibold text-gray-800">
              Activity Logs
            </h2>

            <p className="text-xs text-gray-500 mt-1">
              {total} activities found
            </p>

          </div>

        </div>

        {/* TABLE */}

        <div className="overflow-x-auto">

          <table className="w-full text-sm">

            <thead className="bg-gray-50 border-b">

              <tr>

                <th className="px-4 py-3 text-left font-semibold text-gray-600">
                  Date & Time
                </th>

                <th className="px-4 py-3 text-left font-semibold text-gray-600">
                  Domain
                </th>

                <th className="px-4 py-3 text-left font-semibold text-gray-600">
                  Action
                </th>

                <th className="px-4 py-3 text-left font-semibold text-gray-600">
                  Created By
                </th>

                <th className="px-4 py-3 text-left font-semibold text-gray-600">
                  Description
                </th>

                <th className="px-4 py-3 text-center font-semibold text-gray-600">
                  Source
                </th>

                <th className="px-4 py-3 text-center font-semibold text-gray-600">
                  Action
                </th>

              </tr>

            </thead>

            <tbody>

              {loading ? (

                <tr>

                  <td
                    colSpan={7}
                    className="text-center py-10 text-gray-500"
                  >
                    Loading activities...
                  </td>

                </tr>

              ) : activities.length === 0 ? (

                <tr>

                  <td
                    colSpan={7}
                    className="text-center py-10 text-gray-500"
                  >
                    No activity found
                  </td>

                </tr>

              ) : (

                activities.map(
                  (activity) => (
                    <tr
                      key={activity._id}
                      className="border-b hover:bg-gray-50"
                    >

                      {/* DATE */}

                      <td className="px-4 py-4 whitespace-nowrap">

                        <span className="text-gray-700">
                          {formatDate(
                            activity.createdAt
                          )}
                        </span>

                      </td>

                      {/* DOMAIN */}

                      <td className="px-4 py-4">

                        <span className="font-medium text-gray-800">
                          {activity.domainName ||
                            "-"}
                        </span>

                      </td>

                      {/* ACTION */}

                      <td className="px-4 py-4">

                        <span
                          className={`inline-flex px-2.5 py-1 rounded-md text-xs font-medium ${getActionClass(
                            activity.action
                          )}`}
                        >
                          {activity.action}
                        </span>

                      </td>

                      {/* CREATED BY */}

                      <td className="px-4 py-4">

                        <div>

                          <p className="font-medium text-gray-700">
                            {activity.performedByName ||
                              "Unknown"}
                          </p>

                          {typeof activity.performedBy ===
                            "object" &&
                            activity.performedBy?.email && (
                              <p className="text-xs text-gray-400">
                                {
                                  activity
                                    .performedBy
                                    .email
                                }
                              </p>
                            )}

                        </div>

                      </td>

                      {/* DESCRIPTION */}

                      <td className="px-4 py-4 max-w-xs">

                        <p className="text-gray-600 truncate">
                          {activity.description ||
                            "-"}
                        </p>

                      </td>

                      {/* SOURCE */}

                      <td className="px-4 py-4 text-center">

                        <span className="text-xs font-medium text-gray-600">
                          {activity.source ||
                            "-"}
                        </span>

                      </td>

                      {/* VIEW */}

                      <td className="px-4 py-4 text-center">

                        <button
                          onClick={() =>
                            handleViewActivity(
                              activity._id
                            )
                          }
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 text-gray-600"
                          title="View activity"
                        >

                          <Eye size={16} />

                        </button>

                      </td>

                    </tr>
                  )
                )

              )}

            </tbody>

          </table>

        </div>

        {/* =================================================
            PAGINATION
        ================================================= */}

        {totalPages > 0 && (

          <div className="flex items-center justify-between px-5 py-4 border-t">

            <p className="text-sm text-gray-500">

              Page{" "}
              <span className="font-medium">
                {page}
              </span>{" "}
              of{" "}
              <span className="font-medium">
                {totalPages}
              </span>

            </p>

            <div className="flex items-center gap-2">

              <button
                disabled={page <= 1}
                onClick={() =>
                  setPage(
                    (prev) =>
                      Math.max(
                        prev - 1,
                        1
                      )
                  )
                }
                className="flex items-center gap-1 px-3 py-2 border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50"
              >

                <ChevronLeft
                  size={16}
                />

                Previous

              </button>

              <button
                disabled={
                  page >= totalPages
                }
                onClick={() =>
                  setPage(
                    (prev) =>
                      Math.min(
                        prev + 1,
                        totalPages
                      )
                  )
                }
                className="flex items-center gap-1 px-3 py-2 border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50"
              >

                Next

                <ChevronRight
                  size={16}
                />

              </button>

            </div>

          </div>

        )}

      </div>

      {/* =================================================
          DETAIL MODAL
      ================================================= */}

      {selectedActivity && (

        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">

          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

            {/* MODAL HEADER */}

            <div className="flex items-center justify-between px-6 py-4 border-b">

              <div>

                <h2 className="text-lg font-semibold text-gray-800">
                  Activity Details
                </h2>

                <p className="text-xs text-gray-500 mt-1">
                  {formatDate(
                    selectedActivity.createdAt
                  )}
                </p>

              </div>

              <button
                onClick={() =>
                  setSelectedActivity(null)
                }
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100"
              >
                <X size={18} />
              </button>

            </div>

            {/* MODAL BODY */}

            {detailLoading ? (

              <div className="p-10 text-center text-gray-500">
                Loading...
              </div>

            ) : (

              <div className="p-6 space-y-5">

                {/* DOMAIN */}

                <div>

                  <label className="text-xs font-medium text-gray-500">
                    Domain Name
                  </label>

                  <p className="mt-1 font-medium text-gray-800">
                    {
                      selectedActivity.domainName ||
                      "-"
                    }
                  </p>

                </div>

                {/* ACTION */}

                <div>

                  <label className="text-xs font-medium text-gray-500">
                    Action
                  </label>

                  <div className="mt-1">

                    <span
                      className={`inline-flex px-3 py-1 rounded-md text-xs font-medium ${getActionClass(
                        selectedActivity.action
                      )}`}
                    >
                      {
                        selectedActivity.action
                      }
                    </span>

                  </div>

                </div>

                {/* CREATED BY */}

                <div>

                  <label className="text-xs font-medium text-gray-500">
                    Created By
                  </label>

                  <p className="mt-1 text-gray-800">
                    {
                      selectedActivity.performedByName ||
                      "Unknown"
                    }
                  </p>

                </div>

                {/* DESCRIPTION */}

                <div>

                  <label className="text-xs font-medium text-gray-500">
                    Description
                  </label>

                  <p className="mt-1 text-gray-700">
                    {
                      selectedActivity.description ||
                      "-"
                    }
                  </p>

                </div>

                {/* SOURCE */}

                <div>

                  <label className="text-xs font-medium text-gray-500">
                    Source
                  </label>

                  <p className="mt-1 text-gray-700">
                    {
                      selectedActivity.source ||
                      "-"
                    }
                  </p>

                </div>

                {/* IP */}

                <div>

                  <label className="text-xs font-medium text-gray-500">
                    IP Address
                  </label>

                  <p className="mt-1 text-gray-700">
                    {
                      selectedActivity.ipAddress ||
                      "-"
                    }
                  </p>

                </div>

                {/* USER AGENT */}

                <div>

                  <label className="text-xs font-medium text-gray-500">
                    User Agent
                  </label>

                  <p className="mt-1 text-xs text-gray-600 break-all">
                    {
                      selectedActivity.userAgent ||
                      "-"
                    }
                  </p>

                </div>

                {/* CHANGES */}

                <div>

                  <label className="text-xs font-medium text-gray-500">
                    Changes
                  </label>

                  <pre className="mt-2 bg-gray-50 border rounded-lg p-4 text-xs overflow-auto">
                    {JSON.stringify(
                      selectedActivity.changes ||
                        [],
                      null,
                      2
                    )}
                  </pre>

                </div>

                {/* METADATA */}

                <div>

                  <label className="text-xs font-medium text-gray-500">
                    Metadata
                  </label>

                  <pre className="mt-2 bg-gray-50 border rounded-lg p-4 text-xs overflow-auto">
                    {JSON.stringify(
                      selectedActivity.metadata ||
                        {},
                      null,
                      2
                    )}
                  </pre>

                </div>

              </div>

            )}

          </div>

        </div>

      )}

    </div>
  );
};

export default UserActivityPage;