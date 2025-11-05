// src/pages/UserTypes.tsx
import React, { useEffect, useState } from "react";
import {
  fetchUserTypes,
  createUserType,
  updateUserType,
  deleteUserType,
  IUserType,
} from "./api";

const UserTypes: React.FC = () => {
  const [userTypes, setUserTypes] = useState<IUserType[]>([]);
  const [form, setForm] = useState<{ name: string; is_active: boolean }>({
    name: "",
    is_active: true,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Load all user types
  useEffect(() => {
    loadUserTypes();
  }, []);

  const loadUserTypes = async () => {
    const data = await fetchUserTypes();
    setUserTypes(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      alert("Please enter a user type name");
      return;
    }

    if (editingId) {
      await updateUserType(editingId, form);
    } else {
      await createUserType(form);
    }

    setForm({ name: "", is_active: true });
    setEditingId(null);
    setShowModal(false); // close modal after submit
    await loadUserTypes();
  };

  const handleEdit = (ut: IUserType) => {
    setForm({ name: ut.name, is_active: ut.is_active });
    setEditingId(ut._id);
    setShowModal(true); // open modal in edit mode
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this user type?")) {
      await deleteUserType(id);
      await loadUserTypes();
    }
  };

  return (
    <div className="p-5 text-black">
      <h2 className="text-xl font-bold mb-4">User Types</h2>

      {/* Add button */}
      <button
        onClick={() => {
          setForm({ name: "", is_active: true }); // reset form
          setEditingId(null);
          setShowModal(true);
        }}
        className="mb-4 px-4 py-2 bg-green-600 text-white rounded"
      >
        + Add User Type
      </button>

      {/* Table */}
      <table className="w-full border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-3 py-2">Name</th>
            <th className="border px-3 py-2">Status</th>
            <th className="border px-3 py-2">Created</th>
            <th className="border px-3 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {userTypes.map((ut) => (
            <tr key={ut._id}>
              <td className="border px-3 py-2">{ut.name}</td>
              <td className="border px-3 py-2">
                {ut.is_active ? "Active ✅" : "Inactive ❌"}
              </td>
              <td className="border px-3 py-2">
                {ut.createdAt
                  ? new Date(ut.createdAt).toLocaleDateString()
                  : "-"}
              </td>
              <td className="border px-3 py-2">
                <button
                  onClick={() => handleEdit(ut)}
                  className="px-3 py-1 bg-yellow-500 text-white rounded"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(ut._id)}
                  className="ml-2 px-3 py-1 bg-red-500 text-white rounded"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}

          {userTypes.length === 0 && (
            <tr>
              <td colSpan={4} className="text-center py-3 text-gray-500">
                No user types found
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">
              {editingId ? "Edit User Type" : "Add User Type"}
            </h3>

            <form onSubmit={handleSubmit}>
              <input
                placeholder="User Type Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border p-2 rounded mb-3"
              />
              <label className="flex items-center mb-4">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) =>
                    setForm({ ...form, is_active: e.target.checked })
                  }
                  className="mr-2"
                />
                Active
              </label>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-400 text-white rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                >
                  {editingId ? "Update" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserTypes;
