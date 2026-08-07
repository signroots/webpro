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
 updateHostType ,
 updateHostSubType,
 updateStorage,
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
import { notify } from "../../../Common/Toastify";
interface Column {
  header: string;
  field?: string; // e.g., "plan", "emailType.name", "name"
  render?: (item: any) => React.ReactNode; // custom render function
}

interface DataTableProps {
  data: any[];
  onToggle: (item: any) => void;
  onDelete: (id: string) => void;
  showImage?: boolean; 
  columns: Column[];
}

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
  const [editTypePlaneId, setEditTypePlaneId] = useState<string | null>(null);


  const [hostName, setHostName] = useState("");
  const [hostTypes, setHostTypes] = useState<HostType[]>([]);
  // For Host Type section
const [hostTypeName, setHostTypeName] = useState<string>("");
const [editHostTypeId, setEditHostTypeId] = useState<string | null>(null);
const [editHostId, setEditHostId] = useState<string | null>(null);



  const [subTypeName, setSubTypeName] = useState("");
  const [subHostType, setSubHostType] = useState<string>("");
  const [hostSubTypes, setHostSubTypes] = useState<HostSubType[]>([]);
  const [hostSubTypeName, setHostSubTypeName] = useState(""); // dropdown for HostType
const [editHostSubTypeId, setEditHostSubTypeId] = useState<string | null>(null);



  const [storageName, setStorageName] = useState("");
  const [selectedHostType, setSelectedHostType] = useState("");
  const [selectedHostSubType, setSelectedHostSubType] = useState("");
  const [storages, setStorages] = useState<Storage[]>([]);
  const [editStorageId, setEditStorageId] = useState<string | null>(null);


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




const handleUpdatePlaneEmail = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!editTypePlaneId) return showMessage("No plan selected for update", "error");
  if (!planName.trim()) return showMessage("Plan Name is required", "error");
  if (!planEmailType) return showMessage("Select Type Email", "error");

  setLoading(true);
  try {
    const res = await axios.put(
      `${import.meta.env.VITE_API_BASE_URL}/api/plans/${editTypePlaneId}/`,
      { plan: planName, emailType: planEmailType }
    );
    if (res.data.success) {
      showMessage("Plan Email updated successfully!", "success");
      setPlanName("");
      setPlanEmailType("");
      setEditTypePlaneId(null);
      loadPlanEmails();
    } else {
      showMessage("Failed to update Plan Email", "error");
    }
  } catch (err) {
    console.error(err);
    showMessage("Something went wrong", "error");
  } finally {
    setLoading(false);
  }
};

// 3️⃣ Edit Plan Email (populate form)
const handleEditPlaneEmail = (plan: PlanEmail) => {
  setPlanName(plan.plan);
  setPlanEmailType(plan.emailType._id);
  setEditTypePlaneId(plan._id);
};

// Edit button click (fills form)
const handleEditHostType = (item: any) => {
  setEditHostTypeId(item._id);
  setHostTypeName(item.type);
};
const handleEditHostSubType = (item: any) => {
  setEditHostSubTypeId(item._id);
  setHostSubTypeName(item.name);
  setSelectedHostType(item.hostType?._id || "");
};
const handleEditStorage = (item: any) => {
  setEditStorageId(item._id);
  setStorageName(item.storage);
  setSelectedHostType(item.hostType?._id || "");
  setSelectedHostSubType(item.hostSubType?._id || "");
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
const handleCreatePlanEmail = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!planName.trim()) return showMessage("Plan Name is required", "error");
  if (!planEmailType) return showMessage("Select Type Email", "error");

  setLoading(true);

  try {
    // Pass the two arguments separately
    const res = await createPlanEmail(planName, planEmailType);

    if (res.success) {
      showMessage(`Plan Email "${res.data.plan}" created successfully!`, "success");
      setPlanName("");           // reset form
      setPlanEmailType("");      // reset select
      loadPlanEmails();          // refresh table
    } else {
      showMessage("Failed to create Plan Email", "error");
    }
  } catch (err) {
    console.error("Error creating Plan Email:", err);
    showMessage("Something went wrong", "error");
  } finally {
    setLoading(false);
  }
};

const handleCreateHostType = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!hostTypeName.trim()) return alert("Please enter a host name");
  setLoading(true);
  try {
    await createHostType(hostTypeName);
    setHostTypeName("");
    await loadHostTypes();
    notify("Created successfully!", "success");

    // ✅ show success message
    // showMessage("Host type created successfully", "success");
  } catch (error) {
    console.error("Error creating host type:", error);
    notify("Failed to create Host Type", "error");
  } finally {
    setLoading(false);
  }
};
// ✅ Update Storage
const handleUpdateStorage = async (e: React.FormEvent) => {
  e.preventDefault();

  // Basic validation
  if (!editStorageId) return showMessage("No storage selected for update", "error");
  if (!storageName.trim()) return showMessage("Storage name is required", "error");
  if (!selectedHostType) return showMessage("Select Host Type", "error");
  if (!selectedHostSubType) return showMessage("Select Host SubType", "error");

  setLoading(true);
  try {
    // Make API call
    const res = await updateStorage(editStorageId, {
      storage: storageName,
      hostType: selectedHostType,
      hostSubType: selectedHostSubType,
    });

    // Handle response
    if (res.success) {
      showMessage("✅ Storage updated successfully!", "success");
      setEditStorageId(null);
      setStorageName("");
      setSelectedHostType("");
      setSelectedHostSubType("");
      await loadStorages(); // Refresh list
    } else {
      showMessage("❌ Failed to update storage", "error");
    }
  } catch (err) {
    console.error("Error updating storage:", err);
    showMessage("⚠️ Something went wrong while updating storage", "error");
  } finally {
    setLoading(false);
  }
};

// Update Host Type
const handleUpdateHostType = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!hostTypeName.trim() || !editHostTypeId) return alert("Please enter a host name");
  setLoading(true);
  try {
    await updateHostType(editHostTypeId, hostTypeName);
    setHostTypeName("");
    setEditHostTypeId(null);
    await loadHostTypes();
    notify("Updated successfully!", "success");
  } catch (error) {
    console.error("Error updating host type:", error);
  } finally {
    setLoading(false);
  }
};




const handleCreateHostSubType = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!hostSubTypeName.trim()) return showMessage("SubType Name is required", "error");
  if (!selectedHostType) return showMessage("Select Host Type", "error");

  setLoading(true);
  try {
    const res = await createHostSubType({
      name: hostSubTypeName,
      hostType: selectedHostType,
    });

    if (res.success) {
      showMessage(`✅ Host SubType "${res.data.name}" created successfully!`, "success");
      setHostSubTypeName("");
      setSelectedHostType("");
      await loadHostSubTypes();
    } else {
      showMessage("❌ Failed to create Host SubType", "error");
    }
  } catch (err) {
    console.error(err);
    showMessage("⚠️ Something went wrong", "error");
  } finally {
    setLoading(false);
  }
};

const handleUpdateHostSubType = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!hostSubTypeName.trim()) return showMessage("Sub Type Name is required", "error");
  if (!selectedHostType) return showMessage("Select Host Type", "error");

  setLoading(true);
  try {
    const res = await updateHostSubType(editHostSubTypeId!, {
      name: hostSubTypeName,
      hostType: selectedHostType,
    });

    if (res.success) {
      showMessage(`✅ Host Sub Type updated successfully!`, "success");
      setEditHostSubTypeId(null);
      setHostSubTypeName("");
      setSelectedHostType("");
      await loadHostSubTypes();
    } else {
      showMessage("❌ Failed to update Host Sub Type", "error");
    }
  } catch (err) {
    console.error(err);
    showMessage("⚠️ Something went wrong", "error");
  } finally {
    setLoading(false);
  }
};
// EDIT (prefill data into form)

const handleCreateStorage = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!storageName.trim()) return showMessage("Storage name is required", "error");
  if (!selectedHostType) return showMessage("Select Host Type", "error");
  if (!selectedHostSubType) return showMessage("Select Host SubType", "error");

  setLoading(true);
  try {
    const res = await createStorage(storageName, selectedHostType, selectedHostSubType);
    if (res.success) {
      showMessage(`Storage "${res.data.storage}" created successfully!`, "success");
      setStorageName("");
      setSelectedHostType("");
      setSelectedHostSubType("");
      loadStorages();
    } else {
      showMessage("Failed to create Storage", "error");
    }
  } catch (err) {
    console.error(err);
    showMessage("Something went wrong", "error");
  } finally {
    setLoading(false);
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
        showMessage("Deleted Sucessfully.", "success");
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
  onToggle={(item) => handleEditTypeEmail(item)}
  onDelete={(id) => handleDeleteTypeEmail(id)}
  showImage
  columns={[
    { header: "Email Type", field: "name" },
    { header: "Active", render: (item) => (item.isActive ? "Yes" : "No") },
    { header: "Created At", render: (item) => new Date(item.createdAt).toLocaleString() },
  ]}
/>
  </>
)}
{activePage === "planEmail" && (
  <>
    <form
      onSubmit={editTypePlaneId ? handleUpdatePlaneEmail : handleCreatePlanEmail}
      className="mb-6 flex flex-col gap-2"
    >
      <input
        type="text"
        value={planName}
        onChange={(e) => setPlanName(e.target.value)}
        placeholder="Enter Plan Name"
        className="border px-3 py-2 rounded"
      />
      <select
        value={planEmailType}
        onChange={(e) => setPlanEmailType(e.target.value)}
        className="border px-3 py-2 rounded"
      >
        <option value="">Select Type Email</option>
        {typeEmails.map((type) => (
          <option key={type._id} value={type._id}>
            {type.name}
          </option>
        ))}
      </select>

      <button
        type="submit"
        className={`${
          editTypePlaneId ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"
        } text-white px-4 py-2 rounded disabled:opacity-50`}
        disabled={loading}
      >
        {loading ? "Processing..." : editTypePlaneId ? "Update Plan Email" : "Create Plan Email"}
      </button>

      {editTypePlaneId && (
        <button
          type="button"
          onClick={() => {
            setEditTypePlaneId(null);
            setPlanName("");
            setPlanEmailType("");
          }}
          className="bg-gray-400 text-white px-4 py-2 rounded mt-2 hover:bg-gray-500"
        >
          Cancel Edit
        </button>
      )}
    </form>

   <DataTable
  data={planEmails}
  onToggle={(item) => handleEditPlaneEmail(item)}
  onDelete={(id) => handleToggle(deletePlanEmail, id, loadPlanEmails)}
  columns={[
    { header: "Plan Name", field: "plan" },
    { header: "Type Email", field: "emailType.name" },
    { header: "Active", render: (item) => (item.isActive ? "Yes" : "No") },
    { header: "Created At", render: (item) => new Date(item.createdAt).toLocaleString() },
  ]}
/>

  </>
)}


{activePage === "hostType" && (
  <>
    {/* Create / Update Form */}
    <form
      onSubmit={editHostTypeId ? handleUpdateHostType : handleCreateHostType}
      className="mb-6 flex flex-col gap-2"
    >
      {/* Input: Host Type */}
      <input
        type="text"
        value={hostTypeName}
        onChange={(e) => setHostTypeName(e.target.value)}
        placeholder="Enter Host Type Name"
        className="border px-3 py-2 rounded"
      />

      {/* Submit Button */}
      <button
        type="submit"
        className={`${
          editHostTypeId
            ? "bg-green-600 hover:bg-green-700"
            : "bg-blue-600 hover:bg-blue-700"
        } text-white px-4 py-2 rounded disabled:opacity-50`}
        disabled={loading}
      >
        {loading
          ? "Processing..."
          : editHostTypeId
          ? "Update Host Type"
          : "Create Host Type"}
      </button>

      {/* Cancel Edit Button */}
      {editHostTypeId && (
        <button
          type="button"
          onClick={() => {
            setEditHostTypeId(null);
            setHostTypeName("");
          }}
          className="bg-gray-400 text-white px-4 py-2 rounded mt-2 hover:bg-gray-500"
        >
          Cancel Edit
        </button>
      )}
    </form>

    {/* Table */}
    <DataTable
      data={hostTypes}
      onToggle={(item) => handleEditHostType(item)}
      onDelete={(id) => handleToggle(deleteHostType, id, loadHostTypes)}
      columns={[
        { header: "Host Name", field: "type" },
        {
          header: "Active",
          render: (item) => (item.isActive ? "Yes" : "No"),
        },
        {
          header: "Created At",
          render: (item) => new Date(item.createdAt).toLocaleString(),
        },
      ]}
    />
  </>
)}

  {activePage === "hostSubType" && (
  <>
    {/* Create / Update Form */}
    <form
      onSubmit={editHostSubTypeId ? handleUpdateHostSubType : handleCreateHostSubType}
      className="mb-6 flex flex-col gap-3"
    >
      {/* Input: Sub Type Name */}
      <input
        type="text"
        value={hostSubTypeName}
        onChange={(e) => setHostSubTypeName(e.target.value)}
        placeholder="Enter Host Sub Type Name"
        className="border px-3 py-2 rounded"
      />

      {/* Dropdown: Host Type */}
      <select
        value={selectedHostType}
        onChange={(e) => setSelectedHostType(e.target.value)}
        className="border px-3 py-2 rounded"
      >
        <option value="">Select Host Type</option>
        {hostTypes.map((type: any) => (
          <option key={type._id} value={type._id}>
            {type.type}
          </option>
        ))}
      </select>

      {/* Submit Button */}
      <button
        type="submit"
        className={`${
          editHostSubTypeId
            ? "bg-green-600 hover:bg-green-700"
            : "bg-blue-600 hover:bg-blue-700"
        } text-white px-4 py-2 rounded disabled:opacity-50`}
        disabled={loading}
      >
        {loading
          ? "Processing..."
          : editHostSubTypeId
          ? "Update Host Sub Type"
          : "Create Host Sub Type"}
      </button>

      {/* Cancel Button (when editing) */}
      {editHostSubTypeId && (
        <button
          type="button"
          onClick={() => {
            setEditHostSubTypeId(null);
            setHostSubTypeName("");
            setSelectedHostType("");
          }}
          className="bg-gray-400 text-white px-4 py-2 rounded mt-2 hover:bg-gray-500"
        >
          Cancel Edit
        </button>
      )}
    </form>

    {/* Table */}
    <DataTable
      data={hostSubTypes}
      onToggle={(item) => handleEditHostSubType(item)}
      onDelete={(id) =>
        handleToggle(deleteHostSubType, id, loadHostSubTypes)
      }
      columns={[
        { header: "Host Sub Type", field: "name" },
        { header: "Host Type", field: "hostType.type" },
        { header: "Active", render: (item) => (item.isActive ? "Yes" : "No") },
        {
          header: "Created At",
          render: (item) => new Date(item.createdAt).toLocaleString(),
        },
      ]}
    />
  </>
)}


       {activePage === "storage" && (
  <>
    {/* Create / Update Form */}
    <form
      onSubmit={editStorageId ? handleUpdateStorage : handleCreateStorage}
      className="mb-6 flex flex-col gap-3"
    >
      {/* Input: Storage Name */}
      <input
        type="text"
        value={storageName}
        onChange={(e) => setStorageName(e.target.value)}
        placeholder="Enter Storage Name"
        className="border px-3 py-2 rounded"
      />

      {/* Dropdown: Host Type */}
      <select
        value={selectedHostType}
        onChange={(e) => setSelectedHostType(e.target.value)}
        className="border px-3 py-2 rounded"
      >
        <option value="">Select Host Type</option>
        {hostTypes.map((type: any) => (
          <option key={type._id} value={type._id}>
            {type.type}
          </option>
        ))}
      </select>

      {/* Dropdown: Host Sub Type */}
      <select
        value={selectedHostSubType}
        onChange={(e) => setSelectedHostSubType(e.target.value)}
        className="border px-3 py-2 rounded"
      >
        <option value="">Select Host Sub Type</option>
        {hostSubTypes
          .filter((sub: any) => sub.hostType?._id === selectedHostType)
          .map((sub: any) => (
            <option key={sub._id} value={sub._id}>
              {sub.name}
            </option>
          ))}
      </select>

      {/* Submit Button */}
      <button
        type="submit"
        className={`${
          editStorageId
            ? "bg-green-600 hover:bg-green-700"
            : "bg-blue-600 hover:bg-blue-700"
        } text-white px-4 py-2 rounded disabled:opacity-50`}
        disabled={loading}
      >
        {loading
          ? "Processing..."
          : editStorageId
          ? "Update Storage"
          : "Create Storage"}
      </button>

      {/* Cancel Edit Button */}
      {editStorageId && (
        <button
          type="button"
          onClick={() => {
            setEditStorageId(null);
            setStorageName("");
            setSelectedHostType("");
            setSelectedHostSubType("");
          }}
          className="bg-gray-400 text-white px-4 py-2 rounded mt-2 hover:bg-gray-500"
        >
          Cancel Edit
        </button>
      )}
    </form>

    {/* Table */}
    <DataTable
      data={storages}
      onToggle={(item) => handleEditStorage(item)}
      onDelete={(id) => handleToggle(deleteStorage, id, loadStorages)}
      columns={[
        { header: "Storage", field: "storage" },
        { header: "Host Type", field: "hostType.type" },
        { header: "Host Sub Type", field: "hostSubType.name" },
        { header: "Active", render: (item) => (item.isActive ? "Yes" : "No") },
        {
          header: "Created At",
          render: (item) => new Date(item.createdAt).toLocaleString(),
        },
      ]}
    />
  </>
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
  columns,
  showImage,
}) => (
  <table className="w-full border-collapse border border-gray-300">
    <thead>
      <tr className="bg-gray-200 text-center">
        {showImage && <th className="border px-2 py-1">Image</th>}
        {columns.map((col, idx) => (
          <th key={idx} className="border px-2 py-1">{col.header}</th>
        ))}
        <th className="border px-2 py-1">Actions</th>
      </tr>
    </thead>
    <tbody>
      {data.length > 0 ? (
        data.map((item) => (
          <tr key={item._id} className="text-center">
            {/* ✅ Show image if enabled */}
            {showImage && (
              <td className="border px-2 py-1">
                {item.image ? (
                  <img
                    src={`${import.meta.env.VITE_API_BASE_URL}${item.image}`}
                    alt={item.name}
                    className="w-12 h-12 object-cover mx-auto rounded"
                  />
                ) : (
                  "-"
                )}
              </td>
            )}

            {columns.map((col, idx) => (
              <td key={idx} className="border px-2 py-1">
                {col.render
                  ? col.render(item)
                  : col.field?.split(".").reduce((o, k) => o?.[k], item) || "-"}
              </td>
            ))}

            <td className="border px-2 py-1 flex justify-center gap-2">
              <button
                className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600"
                onClick={() => onToggle(item)}
              >
                Edit
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
          <td colSpan={columns.length + (showImage ? 2 : 1)} className="text-center py-4 text-gray-500">
            No records found
          </td>
        </tr>
      )}
    </tbody>
  </table>
);

export default DataManagement;
