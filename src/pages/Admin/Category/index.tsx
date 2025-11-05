import React, { useState, useEffect } from "react";
import {
  fetchCategories,
  addCategory,
  updateCategory,
  toggleCategory,
  deleteCategory,
} from "./api";

interface Category {
  _id: string;
  name: string;
  is_active: boolean;
}

const Categories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await fetchCategories();
      setCategories(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleAdd = async () => {
    if (!newCategory.trim()) return;
    const data = await addCategory(newCategory);
    setCategories([data, ...categories]);
    setNewCategory("");
  };

  const handleEdit = (category: Category) => {
    setEditId(category._id);
    setEditName(category.name);
  };

  const handleUpdate = async () => {
    if (!editId || !editName.trim()) return;
    const data = await updateCategory(editId, editName);
    setCategories(categories.map((c) => (c._id === editId ? data : c)));
    setEditId(null);
    setEditName("");
  };

  const handleToggle = async (id: string) => {
    const data = await toggleCategory(id);
    setCategories(categories.map((c) => (c._id === id ? data : c)));
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure?")) return;
    await deleteCategory(id);
    setCategories(categories.filter((c) => c._id !== id));
  };

  return (
    <div className="p-6 min-h-screen bg-gray-100">
      <h1 className="text-3xl font-bold mb-6">Category Management</h1>

      <div className="flex mb-6 gap-2">
        <input
          type="text"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          placeholder="New category name"
          className="border rounded px-3 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          onClick={handleAdd}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          Add
        </button>
      </div>

      {loading ? (
        <p>Loading categories...</p>
      ) : (
        <table className="w-full bg-white rounded shadow overflow-hidden">
          <thead className="bg-gray-200 text-left">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Active</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <tr key={cat._id} className="border-b">
                <td className="px-4 py-2">
                  {editId === cat._id ? (
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="border rounded px-2 py-1 w-full"
                    />
                  ) : (
                    cat.name
                  )}
                </td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => handleToggle(cat._id)}
                    className={`px-2 py-1 rounded ${
                      cat.is_active ? "bg-green-500 text-white" : "bg-red-500 text-white"
                    }`}
                  >
                    {cat.is_active ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className="px-4 py-2 flex gap-2">
                  {editId === cat._id ? (
                    <>
                      <button
                        onClick={handleUpdate}
                        className="bg-blue-500 text-white px-2 py-1 rounded"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditId(null)}
                        className="bg-gray-400 text-white px-2 py-1 rounded"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleEdit(cat)}
                        className="bg-yellow-500 text-white px-2 py-1 rounded"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(cat._id)}
                        className="bg-red-500 text-white px-2 py-1 rounded"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Categories;
