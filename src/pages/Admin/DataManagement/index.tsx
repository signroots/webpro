import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  createTypeEmail,
  fetchTypeEmails,
  toggleTypeEmail,
  deleteTypeEmail,
  createPlanEmail,
  fetchPlanEmails,
  togglePlanEmail,
  deletePlanEmail,
  createHostType,
  fetchHostTypes,
  toggleHostType,
  deleteHostType,
  createHostSubType,
  fetchHostSubTypes,
  toggleHostSubType,
  deleteHostSubType,
  fetchStorages,
  createStorage,
  deleteStorage,
  toggleStorage,
} from "./api";
import { ArrowLeft } from "lucide-react";

interface TypeEmail {
  _id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  image?: string;
}

interface PlanEmail {
  _id: string;
  plan: string;
  emailType: TypeEmail;
  isActive: boolean;
  createdAt: string;
}

interface HostType {
  _id: string;
  type: string;
  isActive: boolean;
  createdAt: string;
}

interface HostSubType {
  _id: string;
  hostType: HostType;
  name: string;
  isActive: boolean;
  createdAt: string;
}

interface Storage {
  _id: string;
  storage: string;
  hostType: HostType;
  hostSubType: HostSubType;
  isActive: boolean;
  createdAt: string;
}

const DataManagement: React.FC = () => {
  const [activePage, setActivePage] = useState<
    "home" | "typeEmail" | "planEmail" | "hostType" | "hostSubType" | "storage"
  >("home");

  // ----- States -----
  const [typeName, setTypeName] = useState("");
  const [typeImage, setTypeImage] = useState<File | null>(null);
  const [typeEmails, setTypeEmails] = useState<TypeEmail[]>([]);
  const [editTypeId, setEditTypeId] = useState<string | null>(null);


  const [planName, setPlanName] = useState("");
  const [planEmailType, setPlanEmailType] = useState<string>("");
  const [planEmails, setPlanEmails] = useState<PlanEmail[]>([]);

  const [hostName, setHostName] = useState("");
  const [hostTypes, setHostTypes] = useState<HostType[]>([]);

  const [subTypeName, setSubTypeName] = useState("");
  const [subHostType, setSubHostType] = useState<string>("");
  const [hostSubTypes, setHostSubTypes] = useState<HostSubType[]>([]);

  const [storageName, setStorageName] = useState("");
  const [selectedHostType, setSelectedHostType] = useState("");
  const [selectedHostSubType, setSelectedHostSubType] = useState("");
  const [storages, setStorages] = useState<Storage[]>([]);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | null>(null);

  // ----- Fetchers -----
  const loadTypeEmails = async () => {
    const res = await fetchTypeEmails();
    if (res.success) setTypeEmails(res.data);
  };
  const loadPlanEmails = async () => {
    const res = await fetchPlanEmails();
    if (res.success) setPlanEmails(res.data);
  };
  const loadHostTypes = async () => {
    const res = await fetchHostTypes();
    if (res.success) setHostTypes(res.data);
  };
  const loadHostSubTypes = async () => {
    const res = await fetchHostSubTypes();
    if (res.success) setHostSubTypes(res.data);
  };
  const loadStorages = async () => {
    const res = await fetchStorages();
    if (res.success) setStorages(res.data);
  };
  const handleEditTypeEmail = (item: TypeEmail) => {
  setEditTypeId(item._id);       // save which record is being edited
  setTypeName(item.name);        // prefill name field
  setTypeImage(null);            // reset image input (optional)
};

  useEffect(() => {
    if (activePage === "typeEmail") loadTypeEmails();
    if (activePage === "planEmail") {
      loadPlanEmails();
      loadTypeEmails();
    }
    if (activePage === "hostType") loadHostTypes();
    if (activePage === "hostSubType") {
      loadHostSubTypes();
      loadHostTypes();
    }
    if (activePage === "storage") {
      loadStorages();
      loadHostTypes();
      loadHostSubTypes();
    }
  }, [activePage]);

  // ----- Helper -----
  const showMessage = (msg: string, type: "success" | "error") => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(null), 3000);
  };

  // ----- Type Email -----
  const handleCreateTypeEmail = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!typeName.trim()) return showMessage("Name is required", "error");

  setLoading(true);
  try {
    const formData = new FormData();
    formData.append("name", typeName);
    if (typeImage) formData.append("image", typeImage);

    let res;
    if (editTypeId) {
      // 🔁 Update existing type email
      res = await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/api/typeemail/${editTypeId}/toggle`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      showMessage(`Updated "${res.data.data.name}" successfully!`, "success");
    } else {
      // 🆕 Create new type email
      res = await createTypeEmail(formData);
      showMessage(`Created "${res.data.name}" successfully!`, "success");
    }

    setTypeName("");
    setTypeImage(null);
    setEditTypeId(null);
    loadTypeEmails();
  } catch (err: any) {
    console.error(err);
    showMessage("Something went wrong", "error");
  } finally {
    setLoading(false);
  }
};
const handleUpdateTypeEmail = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!editTypeId) return showMessage("No record selected for update", "error");
  if (!typeName.trim()) return showMessage("Name is required", "error");

  setLoading(true);

  try {
    // ✅ Always send FormData
    const formData = new FormData();
    formData.append("name", typeName);

    // ✅ Append image only if user selected it
    if (typeImage instanceof File) {
      formData.append("image", typeImage);
    }

    const res = await axios.put(
      `${import.meta.env.VITE_API_BASE_URL}/api/typeemail/${editTypeId}/toggle`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );

    if (res.data.success) {
      showMessage("Type Email updated successfully!", "success");
      setTypeName("");
      setTypeImage(null);
      setEditTypeId(null);
      loadTypeEmails(); // refresh table
    } else {
      showMessage("Failed to update Type Email", "error");
    }
  } catch (err) {
    console.error("Error updating Type Email:", err);
    showMessage("Error updating Type Email", "error");
  } finally {
    setLoading(false);
  }
};


  const handleToggleTypeEmail = async (item: any) => {
    try {
      const res = await toggleTypeEmail(item._id);
      if (res.success) {
        showMessage("Status updated!", "success");
        loadTypeEmails();
      }
    } catch (err) {
      showMessage("Failed to toggle status", "error");
    }
  };

  const handleDeleteTypeEmail = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    setLoading(true);
    try {
      const res = await deleteTypeEmail(id);
      if (res.success) {
        showMessage("Deleted successfully!", "success");
        setTypeEmails((prev) => prev.filter((i) => i._id !== id));
      }
    } catch {
      showMessage("Failed to delete", "error");
    } finally {
      setLoading(false);
    }
  };

  // ----- Similar Handlers (Plan, HostType, HostSubType, Storage) -----
  const handleToggle = async (apiToggleFunc: any, id: string, reloadFunc: any) => {
    try {
      const res = await apiToggleFunc(id);
      if (res.success) {
        showMessage("Status updated!", "success");
        reloadFunc();
      }
    } catch {
      showMessage("Failed to update status", "error");
    }
  };

  // ----- UI -----
  if (activePage === "home") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6">
        <h1 className="text-3xl font-bold mb-8">Manage Data</h1>
        <div className="flex flex-row flex-wrap gap-6 w-full max-w-6xl justify-center">
          {["typeEmail", "planEmail", "hostType", "hostSubType", "storage"].map(
            (page) => (
              <button
                key={page}
                className={`px-6 py-4 rounded-lg shadow text-white transition transform hover:-translate-y-1 ${
                  page === "typeEmail"
                    ? "bg-blue-600 hover:bg-blue-700"
                    : page === "planEmail"
                    ? "bg-green-600 hover:bg-green-700"
                    : page === "hostType"
                    ? "bg-purple-600 hover:bg-purple-700"
                    : page === "hostSubType"
                    ? "bg-indigo-600 hover:bg-indigo-700"
                    : "bg-orange-600 hover:bg-orange-700"
                }`}
                onClick={() => setActivePage(page as any)}
              >
                {page
                  .replace(/([A-Z])/g, " $1")
                  .replace(/^./, (str) => str.toUpperCase())}
              </button>
            )
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-3xl mx-auto bg-white p-6 rounded shadow">
        <button
          className="flex items-center gap-2 mb-4 text-blue-600 font-semibold hover:text-blue-800"
          onClick={() => setActivePage("home")}
        >
          <ArrowLeft size={18} /> Back
        </button>

        <h1 className="text-2xl font-bold mb-4">
          {activePage === "typeEmail"
            ? "Manage Type Emails"
            : activePage === "planEmail"
            ? "Manage Plan Emails"
            : activePage === "hostType"
            ? "Manage Host Types"
            : activePage === "hostSubType"
            ? "Manage Host SubTypes"
            : "Manage Storages"}
        </h1>

        {message && (
          <div
            className={`mb-4 font-semibold ${
              messageType === "success" ? "text-green-600" : "text-red-600"
            }`}
          >
            {message}
          </div>
        )}

        {activePage === "typeEmail" && (
  <>
    <form  onSubmit={editTypeId ? handleUpdateTypeEmail : handleCreateTypeEmail} className="mb-6 flex flex-col gap-2">
      <input
        type="text"
        value={typeName}
        onChange={(e) => setTypeName(e.target.value)}
        placeholder="Enter Type Email name"
        className="border px-3 py-2 rounded"
      />
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setTypeImage(e.target.files?.[0] || null)}
        className="border px-3 py-2 rounded"
      />

      <button
        type="submit"
        className={`${
          editTypeId ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"
        } text-white px-4 py-2 rounded disabled:opacity-50`}
        disabled={loading}
      >
        {loading ? "Processing..." : editTypeId ? "Update" : "Create"}
      </button>

      {editTypeId && (
        <button
          type="button"
          onClick={() => {
            setEditTypeId(null);
            setTypeName("");
            setTypeImage(null);
          }}
          className="bg-gray-400 text-white px-4 py-2 rounded mt-2 hover:bg-gray-500"
        >
          Cancel Edit
        </button>
      )}
    </form>

    <DataTable
      data={typeEmails}
      onToggle={(item) => handleEditTypeEmail(item)} // 👈 changed this
      onDelete={(id) => handleDeleteTypeEmail(id)}
      showImage
    />
  </>
)}

        {activePage === "planEmail" && (
          <DataTable
            data={planEmails}
            onToggle={(item) => handleToggle(togglePlanEmail, item._id, loadPlanEmails)}
            onDelete={(id) => handleToggle(deletePlanEmail, id, loadPlanEmails)}
          />
        )}

        {activePage === "hostType" && (
          <DataTable
            data={hostTypes}
            onToggle={(item) => handleToggle(toggleHostType, item._id, loadHostTypes)}
            onDelete={(id) => handleToggle(deleteHostType, id, loadHostTypes)}
          />
        )}

        {activePage === "hostSubType" && (
          <DataTable
            data={hostSubTypes}
            onToggle={(item) =>
              handleToggle(toggleHostSubType, item._id, loadHostSubTypes)
            }
            onDelete={(id) => handleToggle(deleteHostSubType, id, loadHostSubTypes)}
          />
        )}

        {activePage === "storage" && (
          <DataTable
            data={storages}
            onToggle={(item) => handleToggle(toggleStorage, item._id, loadStorages)}
            onDelete={(id) => handleToggle(deleteStorage, id, loadStorages)}
          />
        )}
      </div>
    </div>
  );
};

// ✅ Reusable DataTable
interface DataTableProps {
  data: any[];
  onToggle: (item: any) => void;
  onDelete: (id: string) => void;
  showImage?: boolean;
}

const DataTable: React.FC<DataTableProps> = ({
  data,
  onToggle,
  onDelete,
  showImage,
}) => (
  <table className="w-full border-collapse border border-gray-300">
    <thead>
      <tr className="bg-gray-200 text-center">
        <th className="border px-2 py-1">Name</th>
        {showImage && <th className="border px-2 py-1">Image</th>}
        <th className="border px-2 py-1">Active</th>
        <th className="border px-2 py-1">Created At</th>
        <th className="border px-2 py-1">Actions</th>
      </tr>
    </thead>
    <tbody>
      {data.length > 0 ? (
        data.map((item) => (
          <tr key={item._id} className="text-center">
            <td className="border px-2 py-1">
              {item.name || item.type || item.plan || item.storage}
            </td>
            {showImage && (
              <td className="border px-2 py-1">
                {item.image ? (
                  <img
                    src={`${import.meta.env.VITE_API_BASE_URL.replace(/\/$/, "")}/${
                      item.image.startsWith("/") ? item.image.slice(1) : item.image
                    }`}
                    alt={item.name}
                    className="w-12 h-12 object-cover mx-auto rounded"
                  />
                ) : (
                  <span className="text-gray-400">No image</span>
                )}
              </td>
            )}
            <td className="border px-2 py-1">{item.isActive ? "Yes" : "No"}</td>
            <td className="border px-2 py-1">
              {new Date(item.createdAt).toLocaleString()}
            </td>
            <td className="border px-2 py-1 flex justify-center gap-2">
              <button
                className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600"
                onClick={() => onToggle(item)}
              >
                Toggle
              </button>
              <button
                className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                onClick={() => onDelete(item._id)}
              >
                Delete
              </button>
            </td>
          </tr>
        ))
      ) : (
        <tr>
          <td
            colSpan={showImage ? 5 : 4}
            className="text-center py-4 text-gray-500"
          >
            No records found
          </td>
        </tr>
      )}
    </tbody>
  </table>
);

export default DataManagement;
