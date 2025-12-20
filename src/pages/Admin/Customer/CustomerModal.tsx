// src/pages/Admin/Customer/CustomerModal.tsx
import React, { useState, useEffect } from "react";
import { ICustomerForm } from "./Customers";
import { FaEye, FaEyeSlash } from "react-icons/fa";

interface CustomerModalProps {
  mode: "create" | "edit";
  selectedCustomer: any;
  isCustomer: boolean;
  modalForm: ICustomerForm;
  setModalForm: React.Dispatch<React.SetStateAction<ICustomerForm>>;
  countries: { code: string; name: string }[];
  states: { code: string; name: string }[];
  setStates: React.Dispatch<React.SetStateAction<{ code: string; name: string }[]>>;
  fetchStatesByCountry: (countryId: string) => Promise<{ code: string; name: string }[]>;
  closeModal: () => void;
  handleSaveCustomer: (form: ICustomerForm) => void;
}

const CustomerModal: React.FC<CustomerModalProps> = ({
  mode,
  modalForm,
  setModalForm,
  countries,
  states,
  setStates,
  fetchStatesByCountry,
  closeModal,
  selectedCustomer,
  handleSaveCustomer,
}) => {
  const [phoneError, setPhoneError] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (field: keyof ICustomerForm, value: any) => {
    setModalForm((prev) => ({ ...prev, [field]: value }));

    if (field === "c_phone") {
      const phonePattern = /^[0-9]{10}$/;
      if (!phonePattern.test(value)) {
        setPhoneError("Mobile number must be exactly 10 digits");
      } else {
        setPhoneError("");
      }
    }
  };
useEffect(() => {
  if (mode === "edit" && selectedCustomer) {
    const countryId =
      typeof selectedCustomer.c_country === "object"
        ? selectedCustomer.c_country._id
        : selectedCustomer.c_country || "";

    const stateId =
  typeof selectedCustomer.c_state === "object"
    ? selectedCustomer.c_state._id
    : selectedCustomer.c_state || "";


    setModalForm({
      c_name: selectedCustomer.c_name || "",
      c_email: Array.isArray(selectedCustomer.c_email)
        ? selectedCustomer.c_email
        : typeof selectedCustomer.c_email === "string"
        ? selectedCustomer.c_email.split(",").map((e: string) => e.trim())
        : [],
      c_phone: selectedCustomer.c_phone || "",
      c_company: selectedCustomer.c_company || "",
      c_address: selectedCustomer.c_address || "",
      c_city: selectedCustomer.c_city || "",
      c_country: countryId,   // ✅ STRING ID ONLY
      c_state: stateId,     // ✅ STRING NAME ONLY
      c_zipCode: selectedCustomer.c_zipCode || "",
      c_gst: selectedCustomer.c_gst || "",
      c_password: "",
    });

    if (countryId) {
      fetchStatesByCountry(countryId).then(setStates);
    }
  }
}, [mode, selectedCustomer]);



  const handleEnterKey = (e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const formElements = Array.from(
        document.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input, select, textarea')
      ).filter(el => !el.disabled && el.type !== "hidden");
      const currentIndex = formElements.indexOf(e.currentTarget);
      const nextElement = formElements[currentIndex + 1];
      if (nextElement) nextElement.focus();
    }
  };

  useEffect(() => {
    if (!modalForm.c_country) {
      const india = countries.find(c => c.name.toLowerCase() === "india" || c.code === "IN");
      if (india) {
        handleChange("c_country", india.code);
        fetchStatesByCountry(india.code).then((stateList) => {
          setStates(stateList);
          const kerala = stateList.find(s => s.name.toLowerCase() === "kerala");
          handleChange("c_state", kerala ? kerala.name : stateList[0]?.name || "");
        });
      }
    }
  }, [countries]);

  const handleCountryChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const countryId = e.target.value;
    handleChange("c_country", countryId);
    try {
      const stateList = await fetchStatesByCountry(countryId);
      setStates(stateList);
      handleChange("c_state", "");
    } catch {
      setStates([]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded w-11/12 max-w-4xl h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">{mode === "create" ? "New Customer" : "Edit Customer"}</h2>
        <div className="flex gap-4">
          <div className="flex-1 space-y-2">
            <input
              type="text"
              placeholder="Name"
              value={modalForm.c_name || ""}
              onChange={(e) => handleChange("c_name", e.target.value)}
              onKeyDown={handleEnterKey}
              className="w-full p-2 border rounded"
            />

            {/* Emails */}
            <div className="w-full">
              <div className="flex flex-wrap items-center gap-2 p-2 border rounded bg-gray-50">
                {Array.isArray(modalForm.c_email) &&
                  modalForm.c_email
                    .map((em: string) => em.trim())
                    .filter((em: string) => em !== "")
                    .map((em: string) => (
                      <div key={em} className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                        <span className="mr-2">{em}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setModalForm((prev) => ({
                              ...prev,
                              c_email: (prev.c_email ?? []).filter((e) => e !== em),
                            }))
                          }
                          className="text-blue-600 hover:text-red-600 font-bold"
                        >
                          ×
                        </button>
                      </div>
                    ))}

                <input
                  type="text"
                  placeholder="Add email"
                  className="flex-1 min-w-[120px] p-1 outline-none bg-transparent"
                  onKeyDown={(e) => {
                    if (e.key === "Tab") return;
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      const value = (e.currentTarget.value || "").trim();
                      if (!value) return;
                      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                      if (!emailPattern.test(value)) {
                        alert("Invalid email format!");
                        return;
                      }
                      setModalForm((prev) => {
                        const allEmails = prev.c_email ?? [];
                        return {
                          ...prev,
                          c_email: allEmails.includes(value) ? allEmails : [...allEmails, value],
                        };
                      });
                      e.currentTarget.value = "";
                    }
                  }}
                />
              </div>
            </div>

            <input
              type="text"
              placeholder="Phone"
              value={modalForm.c_phone || ""}
              onChange={(e) => { const value = e.target.value.replace(/\D/g, ""); handleChange("c_phone", value); }}
              maxLength={10}
              className={`w-full p-2 border rounded ${phoneError ? "border-red-500" : ""}`}
            />
            {phoneError && <p className="text-red-500 text-sm">{phoneError}</p>}

            <input type="text" placeholder="Company" value={modalForm.c_company || ""} onChange={(e) => handleChange("c_company", e.target.value)} className="w-full p-2 border rounded" />
            <input type="text" placeholder="Address" value={modalForm.c_address || ""} onChange={(e) => handleChange("c_address", e.target.value)} className="w-full p-2 border rounded" />
            <input type="text" placeholder="City" value={modalForm.c_city || ""} onChange={(e) => handleChange("c_city", e.target.value)} className="w-full p-2 border rounded" />

            <select value={modalForm.c_country || ""} onChange={handleCountryChange} className="w-full p-2 border rounded">
              <option value="">Select Country</option>
              {countries.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
            </select>

            <select
  value={modalForm.c_state || ""}
  onChange={(e) => handleChange("c_state", e.target.value)}
  className="w-full p-2 border rounded"
>
  <option value="">Select State</option>
  {states.map((s) => (
    <option key={s.code} value={s.code}>
      {s.name}
    </option>
  ))}
</select>

            <input type="text" placeholder="Zip Code" value={modalForm.c_zipCode || ""} onChange={(e) => handleChange("c_zipCode", e.target.value)} className="w-full p-2 border rounded" />
             <input
              type="text"
              placeholder="GST"
              value={modalForm.c_gst || ""}
              onChange={(e) => handleChange("c_gst", e.target.value)}
              onKeyDown={handleEnterKey}
              className="w-full p-2 border rounded"
            />

            {/* Password */}
          {/* Password field only for CREATE mode */}
{/* {mode === "create" && (
  <div className="relative w-full">
    <input
      type={showPassword ? "text" : "password"}
      placeholder="Password"
      value={modalForm.c_password || ""}
      onChange={(e) => handleChange("c_password", e.target.value)}
      className="w-full p-2 border rounded pr-10"
    />
    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-600"
    >
      {showPassword ? <FaEyeSlash /> : <FaEye />}
    </button>
  </div>
)} */}

          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button onClick={closeModal} className="px-4 py-2 rounded border bg-gray-200">Cancel</button>
          <button
            onClick={() => {
              if (phoneError) { alert("Please fix phone number before saving"); return; }
              handleSaveCustomer(modalForm);
            }}
            disabled={!!phoneError}
            className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerModal;
