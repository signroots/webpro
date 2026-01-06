// src/pages/Admin/Customer/CustomerModal.tsx
import React, { useState, useEffect } from "react";
import { ICustomerForm } from "./Customers";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { fetchCountryCodes } from "./api";

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
  const [phoneCode, setPhoneCode] = useState<string>(""); // selected code
  const [phoneCodes, setPhoneCodes] = useState<string[]>([]); // all codes
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentEmail, setCurrentEmail] = useState("");
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const handleChange = (field: keyof ICustomerForm, value: any) => {
  if (field === "c_phone") value = value.replace(/\D/g, "");
  setModalForm((prev) => ({ ...prev, [field]: value }));

  // Phone validation
  if (field === "c_phone") {
    const phonePattern = /^[0-9]{10}$/;
    if (!phonePattern.test(value)) {
      setPhoneError("Mobile number must be exactly 10 digits");
      setErrors((prev) => ({ ...prev, c_phone: "Valid 10-digit phone number required" }));
    } else {
      setPhoneError("");
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.c_phone; // remove phone error
        return newErrors;
      });
    }
  }
};

const commitCurrentEmail = () => {
  const value = currentEmail.trim();
  if (!value) return;

  if (!emailPattern.test(value)) {
    setErrors((prev) => ({
      ...prev,
      c_email: "Please enter a valid email address",
    }));
    return;
  }

  setModalForm((prev) => {
    if ((prev.c_email ?? []).includes(value)) return prev;
    return {
      ...prev,
      c_email: [...(prev.c_email ?? []), value],
    };
  });

  setCurrentEmail("");
};

const validateForm = () => {
  const newErrors: Record<string, string> = {};

  // Name validation
  if (!modalForm.c_name?.trim()) newErrors.c_name = "Name is required";

// Email validation (FINAL & CORRECT with logs)
const allEmails = (modalForm.c_email ?? [])
  .map((e) => e.trim())
  .filter(Boolean);

console.log("🔹 Emails from modalForm.c_email:", modalForm.c_email);
console.log("🔹 Normalized emails (allEmails):", allEmails);

if (allEmails.length === 0) {
  console.log("❌ Validation failed: No emails provided");
  newErrors.c_email = "At least one email is required";
} else {
  const invalidEmails = allEmails.filter(
    (e) => !emailPattern.test(e)
  );

  console.log("🔹 Invalid emails detected:", invalidEmails);

  if (invalidEmails.length > 0) {
    console.log("❌ Validation failed: Invalid email format");
    newErrors.c_email = "Invalid email format";
  } else {
    console.log("✅ Email validation passed");
  }
}

  // Phone validation
  if (!modalForm.c_phone || modalForm.c_phone.length !== 10) {
    newErrors.c_phone = "Valid 10-digit phone number required";
  }

  // Country validation
  if (!modalForm.c_country || modalForm.c_country === "") {
    newErrors.c_country = "Country is required";
  }
  if (!modalForm.c_city || modalForm.c_city === "") {
      newErrors.c_city = "City is required";
    }

  if (!modalForm.c_company || modalForm.c_company === "") {
      newErrors.c_company = "Company is required";
    }
  if (!modalForm.c_address || modalForm.c_address === "") {
      newErrors.c_address = "Address is required";
    }
  // State validation
  if (!modalForm.c_state || modalForm.c_state === "") {
    newErrors.c_state = "State is required";
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};


  useEffect(() => {
    fetchCountryCodes()
      .then((codes) => setPhoneCodes(codes))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (mode !== "edit" || !selectedCustomer) return;

    let phone = selectedCustomer.c_phone ?? "";
    phone = phone.replace(/\D/g, "");

    const detectedCode = phoneCodes.find((code) =>
      phone.startsWith(code.replace("+", ""))
    );

    if (detectedCode) {
      setModalForm((prev) => ({
        ...prev,
        c_countryCode: detectedCode,
      }));
      phone = phone.slice(detectedCode.replace("+", "").length);
    }

    phone = phone.slice(-10);

    setModalForm((prev) => ({
      ...prev,
      ...selectedCustomer,
      c_phone: phone,
      // c_email: Array.isArray(selectedCustomer.c_email)
      //   ? selectedCustomer.c_email
      //   : [],
      c_email: Array.isArray(selectedCustomer.c_email) ? selectedCustomer.c_email : [],
      c_country:
        typeof selectedCustomer.c_country === "object"
          ? selectedCustomer.c_country._id
          : selectedCustomer.c_country || "",
      c_state:
        typeof selectedCustomer.c_state === "object"
          ? selectedCustomer.c_state._id
          : selectedCustomer.c_state || "",
      c_password: "",
    }));

    if (selectedCustomer.c_country) {
      const cid =
        typeof selectedCustomer.c_country === "object"
          ? selectedCustomer.c_country._id
          : selectedCustomer.c_country;
      fetchStatesByCountry(cid).then(setStates);
    }
  }, [mode, selectedCustomer, phoneCodes]);

  useEffect(() => {
    fetchCountryCodes()
      .then((codes) => {
        setPhoneCodes(codes);

        if (mode === "edit" && selectedCustomer?.c_countryCode) {
          setPhoneCode(selectedCustomer.c_countryCode);
          setModalForm((prev) => ({
            ...prev,
            c_countryCode: selectedCustomer.c_countryCode,
          }));
          return;
        }

        if (codes.includes("+91")) {
          setPhoneCode("+91");
          setModalForm((prev) => ({ ...prev, c_countryCode: "+91" }));
        } else if (codes.length > 0) {
          setPhoneCode(codes[0]);
          setModalForm((prev) => ({ ...prev, c_countryCode: codes[0] }));
        }
      })
      .catch(console.error);
  }, [mode, selectedCustomer]);

 useEffect(() => {
  const setDefaultIndiaState = async () => {
    if (!modalForm.c_country) {
      const india = countries.find(
        (c) => c.name.toLowerCase() === "india" || c.code === "IN"
      );
      if (india) {
        handleChange("c_country", india.code);

        try {
          const stateList = await fetchStatesByCountry(india.code);
          setStates(stateList);

          // Find Kerala by name
          const kerala = stateList.find((s) => s.name.toLowerCase() === "kerala");

          // Set default state to Kerala code
          handleChange("c_state", kerala ? kerala.code : stateList[0]?.code || "");
        } catch (err) {
          console.error("Error fetching states:", err);
        }
      }
    }
  };

  setDefaultIndiaState();
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
    <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-start z-50 pt-10">
      <div className="bg-white p-6 rounded w-11/12 max-w-5xl">
        <h2 className="text-xl font-bold mb-4">
          {mode === "create" ? "New Customer" : "Edit Customer"}
        </h2>

        {/* GRID LAYOUT: 3 FIELDS PER ROW */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            placeholder="Salutation"
            value={modalForm.c_salutation || ""}
            onChange={(e) => handleChange("c_salutation", e.target.value)}
            className="w-full p-2 border rounded"
          />

          <input
            placeholder="Name"
            value={modalForm.c_name || ""}
            onChange={(e) => handleChange("c_name", e.target.value)}
            className={`w-full p-2 border rounded ${
              errors.c_name ? "border-red-500" : ""
            }`}
          />

       {/* Email */}
{/* Email */}
{/* Email */}
<div className="col-span-3">
  <div className="flex flex-wrap items-center gap-2 p-2 border rounded bg-gray-50">
    {Array.isArray(modalForm.c_email) &&
      modalForm.c_email
        .map((em: string) => em.trim())
        .filter((em: string) => em !== "")
        .map((em: string) => (
          <div
            key={em}
            className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full"
          >
            <span className="mr-2">{em}</span>
           <button
  type="button"
  onClick={() => {
    setModalForm((prev) => ({
      ...prev,
      c_email: (prev.c_email ?? []).filter((e) => e !== em),
    }));
  }}
  className="text-blue-600 hover:text-red-600 font-bold"
>
  ×
</button>
          </div>
        ))}
   <input
  type="text"
  placeholder="Add email"
  value={currentEmail}
  onChange={(e) => setCurrentEmail(e.target.value)}
  onBlur={commitCurrentEmail}   // ✅ ADD THIS
  onKeyDown={(e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commitCurrentEmail();
    }
  }}
  className="flex-1 min-w-[120px] p-1 outline-none bg-transparent"
/>

  </div>
  {errors.c_email && (
    <p className="text-red-500 text-sm mt-1">{errors.c_email}</p>
  )}
</div>



          <div className="flex gap-2 col-span-3 md:col-span-3">
            <select
              value={phoneCode}
              onChange={(e) => {
                const code = e.target.value;
                setPhoneCode(code);
                setModalForm((prev) => ({ ...prev, c_countryCode: code }));
              }}
              className="w-28 p-2 border rounded"
            >
              {phoneCodes.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>

            <input
              placeholder="Mobile Number"
              value={modalForm.c_phone || ""}
              onChange={(e) => handleChange("c_phone", e.target.value)}
              maxLength={10}
              className={`flex-1 p-2 border rounded ${
                phoneError || errors.c_phone ? "border-red-500" : ""
              }`}
            />
          </div>
          {errors.c_phone && (
            <p className="text-red-500 text-sm col-span-3">{errors.c_phone}</p>
          )}

          <input
    placeholder="Company"
    value={modalForm.c_company || ""}
    onChange={(e) => handleChange("c_company", e.target.value)}
    className={`w-full p-2 border rounded ${errors.c_company ? "border-red-500" : ""}`}
  />
           <input
    placeholder="Address"
    value={modalForm.c_address || ""}
    onChange={(e) => handleChange("c_address", e.target.value)}
    className={`w-full p-2 border rounded ${errors.c_address ? "border-red-500" : ""}`}
  />
          <input
            placeholder="Address 2"
            value={modalForm.c_address2 || ""}
            onChange={(e) => handleChange("c_address2", e.target.value)}
            className="w-full p-2 border rounded"
          />

            {/* City */}
      <input
        placeholder="City"
        value={modalForm.c_city || ""}
        onChange={(e) => handleChange("c_city", e.target.value)}
        className={`w-full p-2 border rounded ${errors.c_city ? "border-red-500" : ""}`}
      />

         {/* Country */}
<select
  value={modalForm.c_country || ""}
  onChange={handleCountryChange}
  className={`w-full p-2 border rounded ${
    errors.c_country ? "border-red-500" : ""
  }`}
>
  <option value="">Select Country</option>
  {countries.map((c) => (
    <option key={c.code} value={c.code}>
      {c.name}
    </option>
  ))}
</select>
{errors.c_country && (
  <p className="text-red-500 text-sm">{errors.c_country}</p>
)}

          {/* State */}
 <select
            value={modalForm.c_state || ""}
            onChange={(e) => handleChange("c_state", e.target.value)}
            className={`w-full p-2 border rounded ${errors.c_state ? "border-red-500" : ""}`}
          >
            <option value="">Select State</option>
            {states.map(s => <option key={s.code} value={s.code}>{s.name}</option>)}
          </select>
{errors.c_state && (
  <p className="text-red-500 text-sm">{errors.c_state}</p>
)}

          <input
            placeholder="Zip Code"
            value={modalForm.c_zipCode || ""}
            onChange={(e) => handleChange("c_zipCode", e.target.value)}
            className="w-full p-2 border rounded"
          />
          <input
            placeholder="GST"
            value={modalForm.c_gst || ""}
            onChange={(e) => handleChange("c_gst", e.target.value)}
            className="w-full p-2 border rounded"
          />

          <input
            placeholder="Bank Account Payment"
            value={modalForm.c_bankAccountPayment || ""}
            onChange={(e) => handleChange("c_bankAccountPayment", e.target.value)}
            className="w-full p-2 border rounded"
          />
          <input
            placeholder="Place of Contact"
            value={modalForm.c_placeOfContact || ""}
            onChange={(e) => handleChange("c_placeOfContact", e.target.value)}
            className="w-full p-2 border rounded"
          />
          <input
            placeholder="Place of Contact (State Code)"
            value={modalForm.c_placeOfContactWithStateCode || ""}
            onChange={(e) => handleChange("c_placeOfContactWithStateCode", e.target.value)}
            className="w-full p-2 border rounded"
          />

          <div className="col-span-3 flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!modalForm.c_portalEnabled}
              onChange={(e) => handleChange("c_portalEnabled", e.target.checked)}
            />
            <span>Portal Enabled</span>
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={closeModal}
            className="px-4 py-2 rounded border bg-gray-200"
          >
            Cancel
          </button>
         <button
  onClick={() => {
    commitCurrentEmail(); // ✅ ADD THIS LINE FIRST
    setTimeout(() => {
      if (!validateForm()) return;
      handleSaveCustomer(modalForm);
    }, 0);
  }}
  className="px-4 py-2 rounded bg-blue-600 text-white"
>
  Save
</button>
        </div>
      </div>
    </div>
  );
};

export default CustomerModal;
