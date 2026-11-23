
import React, { useEffect, useState } from "react";

import {
  Tag,
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Eye,
  Loader2,
} from "lucide-react";

import {
  Label,
  LabelPayload,
  fetchLabels,
  createLabel,
  updateLabel,
  deleteLabel,
} from "./api";

// =====================================================
// INITIAL FORM
// =====================================================

const initialForm: LabelPayload = {
  statusLabelName: "",
  code: "",
  type: "",
  service: "",
  status: true,
  displayArea: "",
  visibleTo: ["ADMIN", "CUSTOMER"],
};

// =====================================================
// COMPONENT
// =====================================================

const Labels: React.FC = () => {
  const [labels, setLabels] = useState<Label[]>([]);
  const [formData, setFormData] =
    useState<LabelPayload>({ ...initialForm });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingLabel, setViewingLabel] = useState<Label | null>(null);

  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  // =====================================================
  // FETCH LABELS
  // =====================================================

  const loadLabels = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await fetchLabels();
      setLabels(data || []);
    } catch (err: any) {
      console.error("Fetch Labels Error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to load labels"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLabels();
  }, []);

  // =====================================================
  // INPUT CHANGE
  // =====================================================

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "code"
          ? value.toUpperCase()
          : value,
    }));
  };

  // =====================================================
  // VISIBILITY CHANGE
  // =====================================================

  const handleVisibilityChange = (
    visibility: "ADMIN" | "CUSTOMER",
    checked: boolean
  ) => {
    setFormData((prev) => {
      const currentVisibility = prev.visibleTo || [];

      const updatedVisibility = checked
        ? [...currentVisibility, visibility]
        : currentVisibility.filter(
            (item) => item !== visibility
          );

      return {
        ...prev,
        visibleTo: [...new Set(updatedVisibility)],
      };
    });
  };

  // =====================================================
  // OPEN CREATE MODAL
  // =====================================================

  const handleCreate = () => {
    setEditingId(null);
    setFormData({ ...initialForm });
    setError("");
    setShowModal(true);
  };

  // =====================================================
  // OPEN EDIT MODAL
  // =====================================================

  const handleEdit = (label: Label) => {
    setEditingId(label._id);

    setFormData({
      statusLabelName: label.statusLabelName,
      code: label.code,
      type: label.type,
      service: label.service,
      status: label.status,
      displayArea: label.displayArea,
      visibleTo: label.visibleTo?.length
        ? [...label.visibleTo]
        : ["ADMIN", "CUSTOMER"],
    });

    setError("");
    setShowModal(true);
  };

  // =====================================================
  // CLOSE FORM MODAL
  // =====================================================

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingId(null);
    setFormData({ ...initialForm });
    setError("");
  };

  // =====================================================
  // SAVE LABEL
  // =====================================================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.visibleTo.length) {
      setError("Please select at least one visibility option");
      return;
    }

    try {
      setSaving(true);
      setError("");

      if (editingId) {
        await updateLabel(editingId, formData);
        alert("Label updated successfully");
      } else {
        await createLabel(formData);
        alert("Label created successfully");
      }

      setShowModal(false);
      setEditingId(null);
      setFormData({ ...initialForm });

      await loadLabels();
    } catch (err: any) {
      console.error("Save Label Error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to save label"
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // DELETE LABEL
  // =====================================================

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this label?"
    );

    if (!confirmed) return;

    try {
      await deleteLabel(id);

      alert("Label deleted successfully");

      await loadLabels();
    } catch (err: any) {
      console.error("Delete Label Error:", err);

      alert(
        err.response?.data?.message ||
          "Failed to delete label"
      );
    }
  };

  // =====================================================
  // FILTER LABELS
  // =====================================================

  const filteredLabels = labels.filter((label) =>
    [
      label.statusLabelName,
      label.code,
      label.type,
      label.service,
      label.displayArea,
      ...(label.visibleTo || []),
    ]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  // =====================================================
  // INPUT STYLES
  // =====================================================

  const inputClass =
    "w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500";

  const labelClass =
    "block text-sm font-medium text-gray-700 mb-1.5";

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="p-6 bg-gray-50 min-h-screen">

      {/* HEADER */}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Tag size={24} />
            Labels
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            Manage labels and their display settings
          </p>
        </div>

        <button
          onClick={handleCreate}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition"
        >
          <Plus size={18} />
          Add Label
        </button>
      </div>

      {/* SEARCH */}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-5">
        <div className="relative max-w-md">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type="text"
            placeholder="Search labels..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* ERROR MESSAGE */}

      {error && !showModal && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}

      {/* TABLE */}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-gray-600">
              <tr>
                <th className="px-5 py-4 text-left">#</th>
                <th className="px-5 py-4 text-left">Label Name</th>
                <th className="px-5 py-4 text-left">Code</th>
                <th className="px-5 py-4 text-left">Type</th>
                <th className="px-5 py-4 text-left">Service</th>
                <th className="px-5 py-4 text-left">Visible To</th>
                <th className="px-5 py-4 text-center">Status</th>
                <th className="px-5 py-4 text-center">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-10">
                    <Loader2
                      className="animate-spin inline-block text-blue-600"
                      size={24}
                    />

                    <p className="text-gray-500 mt-2">
                      Loading labels...
                    </p>
                  </td>
                </tr>
              ) : filteredLabels.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="text-center py-10 text-gray-500"
                  >
                    {search
                      ? "No matching labels found"
                      : "No labels found"}
                  </td>
                </tr>
              ) : (
                filteredLabels.map((label, index) => (
                  <tr
                    key={label._id}
                    className="hover:bg-gray-50 transition"
                  >
                    <td className="px-5 py-4">
                      {index + 1}
                    </td>

                    <td className="px-5 py-4 font-medium text-gray-800">
                      {label.statusLabelName}
                    </td>

                    <td className="px-5 py-4">
                      <span className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">
                        {label.code}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      {label.type}
                    </td>

                    <td className="px-5 py-4">
                      {label.service}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1">
                        {(label.visibleTo?.length
                          ? label.visibleTo
                          : ["ADMIN", "CUSTOMER"]
                        ).map((visibility) => (
                          <span
                            key={visibility}
                            className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs"
                          >
                            {visibility}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          label.status
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {label.status ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-center items-center gap-3">
                        <button
                          onClick={() => setViewingLabel(label)}
                          title="View"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Eye size={18} />
                        </button>

                        <button
                          onClick={() => handleEdit(label)}
                          title="Edit"
                          className="text-green-600 hover:text-green-800"
                        >
                          <Edit size={18} />
                        </button>

                        <button
                          onClick={() => handleDelete(label._id)}
                          title="Delete"
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* TABLE FOOTER */}

        <div className="px-5 py-3 border-t text-sm text-gray-500">
          Total Labels: {filteredLabels.length}
        </div>
      </div>

      {/* CREATE / EDIT MODAL */}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">

            <div className="flex justify-between items-center p-5 border-b">
              <h2 className="text-lg font-semibold text-gray-800">
                {editingId ? "Edit Label" : "Create Label"}
              </h2>

              <button
                type="button"
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-800"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-5 space-y-4"
            >
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* LABEL NAME */}

              <div>
                <label className={labelClass}>
                  Label Name *
                </label>

                <input
                  type="text"
                  name="statusLabelName"
                  value={formData.statusLabelName}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Enter label name"
                  required
                />
              </div>

              {/* CODE */}

              <div>
                <label className={labelClass}>
                  Code
                </label>

                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Enter unique code"
                />
              </div>

              {/* TYPE */}

              <div>
                <label className={labelClass}>
                  Type *
                </label>

                <input
                  type="text"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Enter type"
                  required
                />
              </div>

              {/* SERVICE */}

              <div>
                <label className={labelClass}>
                  Service *
                </label>

                <input
                  type="text"
                  name="service"
                  value={formData.service}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Enter service"
                  required
                />
              </div>

              {/* DISPLAY AREA */}

              <div>
                <label className={labelClass}>
                  Display Area *
                </label>

                <input
                  type="text"
                  name="displayArea"
                  value={formData.displayArea}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Enter display area"
                  required
                />
              </div>

              {/* VISIBLE TO */}

              <div>
                <label className={labelClass}>
                  Visible To *
                </label>

                <div className="border border-gray-300 rounded-lg p-3 space-y-3">
                  <label className="flex items-center gap-3 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.visibleTo.includes("ADMIN")}
                      onChange={(e) =>
                        handleVisibilityChange(
                          "ADMIN",
                          e.target.checked
                        )
                      }
                      className="w-4 h-4 accent-blue-600"
                    />
                    Admin
                  </label>

                  <label className="flex items-center gap-3 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.visibleTo.includes("CUSTOMER")}
                      onChange={(e) =>
                        handleVisibilityChange(
                          "CUSTOMER",
                          e.target.checked
                        )
                      }
                      className="w-4 h-4 accent-blue-600"
                    />
                    Customer
                  </label>
                </div>

                <p className="text-xs text-gray-500 mt-1">
                  Select where this label should be visible.
                </p>
              </div>

              {/* STATUS */}

              <div>
                <label className={labelClass}>
                  Status
                </label>

                <select
                  name="status"
                  value={String(formData.status)}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      status: e.target.value === "true",
                    }))
                  }
                  className={inputClass}
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>

              {/* BUTTONS */}

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving || formData.visibleTo.length === 0}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {saving && (
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                  )}

                  {editingId ? "Update Label" : "Create Label"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW LABEL MODAL */}

      {viewingLabel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">

            <div className="flex justify-between items-center p-5 border-b">
              <h2 className="text-lg font-semibold text-gray-800">
                Label Details
              </h2>

              <button
                onClick={() => setViewingLabel(null)}
                className="text-gray-500 hover:text-gray-800"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {[
                ["Label Name", viewingLabel.statusLabelName],
                ["Code", viewingLabel.code],
                ["Type", viewingLabel.type],
                ["Service", viewingLabel.service],
                ["Display Area", viewingLabel.displayArea],
                [
                  "Status",
                  viewingLabel.status ? "Active" : "Inactive",
                ],
                [
                  "Visible To",
                  (
                    viewingLabel.visibleTo?.length
                      ? viewingLabel.visibleTo
                      : ["ADMIN", "CUSTOMER"]
                  ).join(", "),
                ],
              ].map(([title, value]) => (
                <div
                  key={title}
                  className="flex justify-between gap-4 border-b pb-3"
                >
                  <span className="text-gray-500">
                    {title}
                  </span>

                  <span className="font-medium text-gray-800 text-right">
                    {value}
                  </span>
                </div>
              ))}
            </div>

            <div className="p-5 border-t flex justify-end">
              <button
                onClick={() => setViewingLabel(null)}
                className="px-5 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Labels;
