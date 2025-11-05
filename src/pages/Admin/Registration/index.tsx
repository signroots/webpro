import React, { useEffect, useState } from "react";
import { fetchUserTypes, registerUser, IUserType } from "./api";
import { useNavigate } from "react-router-dom";

const Register: React.FC = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    userType: "",
  });

  const [customerDetails, setCustomerDetails] = useState({
    phone: "",
    company: "",
    address: "",
    city: "",
    state: "",
    country: "",
    zipCode: "",
  });

  const [userTypes, setUserTypes] = useState<IUserType[]>([]);

  useEffect(() => {
    const loadTypes = async () => {
      const types = await fetchUserTypes();
      setUserTypes(types);
    };
    loadTypes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.userType) {
      alert("Please select a user type");
      return;
    }

    try {
      const selectedUserType = userTypes.find((ut) => ut._id === form.userType);
      const isCustomer = selectedUserType?.name === "Customer";

      await registerUser(
        form.name,
        form.email,
        form.password,
        form.userType,
        isCustomer ? customerDetails : undefined
      );

      alert("User registered successfully!");

      setForm({ name: "", email: "", password: "", userType: "" });
      setCustomerDetails({
        phone: "",
        company: "",
        address: "",
        city: "",
        state: "",
        country: "",
        zipCode: "",
      });

      navigate("/");
    } catch (err: any) {
      alert(err.response?.data?.error || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Create an Account
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 text-sm mb-1">Full Name</label>
            <input
              type="text"
              placeholder="Enter your name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-gray-300 p-2 rounded focus:ring focus:ring-blue-300"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm mb-1">Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border border-gray-300 p-2 rounded focus:ring focus:ring-blue-300"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm mb-1">Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full border border-gray-300 p-2 rounded focus:ring focus:ring-blue-300"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm mb-1">User Type</label>
            <select
              value={form.userType}
              onChange={(e) => setForm({ ...form, userType: e.target.value })}
              className="w-full border border-gray-300 p-2 rounded focus:ring focus:ring-blue-300"
              required
            >
              <option value="">Select User Type</option>
              {userTypes.map((ut) => (
                <option key={ut._id} value={ut._id}>
                  {ut.name}
                </option>
              ))}
            </select>
          </div>

          {/* 👇 Conditional Customer Fields */}
          {form.userType &&
            userTypes.find((ut) => ut._id === form.userType)?.name === "Customer" && (
              <>
                <h3 className="text-lg font-semibold text-gray-800 mt-4">Customer Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: "Phone", name: "phone" },
                    { label: "Company", name: "company" },
                    { label: "Address", name: "address" },
                    { label: "City", name: "city" },
                    { label: "State", name: "state" },
                    { label: "Country", name: "country" },
                    { label: "ZIP Code", name: "zipCode" },
                  ].map(({ label, name }) => (
                    <div key={name}>
                      <label className="block text-gray-700 text-sm mb-1">{label}</label>
                      <input
                        type="text"
                        name={name}
                        value={(customerDetails as any)[name]}
                        onChange={(e) =>
                          setCustomerDetails((prev) => ({
                            ...prev,
                            [name]: e.target.value,
                          }))
                        }
                        className="w-full border border-gray-300 p-2 rounded focus:ring focus:ring-blue-300"
                      />
                    </div>
                  ))}
                </div>
              </>
            )}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
          >
            Register
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;
