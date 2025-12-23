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
  const [phoneCode, setPhoneCode] = useState("+91");
const PHONE_CODES = [
  { code: "IN", dial: "+91", name: "India" },
  { code: "US", dial: "+1", name: "USA" },
  { code: "AE", dial: "+971", name: "UAE" },
  { code: "UK", dial: "+44", name: "UK" },
];

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
    let phone = selectedCustomer.c_phone || "";

      const detected = PHONE_CODES.find(p =>
        phone.startsWith(p.dial.replace("+", ""))
      );

      if (detected) {
        setPhoneCode(detected.dial);
        phone = phone.replace(detected.dial.replace("+", ""), "");
      }
    setModalForm({
      c_salutation: selectedCustomer.c_salutation || "",
      c_firstName: selectedCustomer.c_firstName || "",
      c_lastName: selectedCustomer.c_lastName || "",
      c_name: selectedCustomer.c_name || "",

      c_email: Array.isArray(selectedCustomer.c_email)
        ? selectedCustomer.c_email
        : [],

      c_phone: phone,
      c_mobilePhone: selectedCustomer.c_mobilePhone || "",

      c_company: selectedCustomer.c_company || "",
      c_address: selectedCustomer.c_address || "",
      c_address2: selectedCustomer.c_address2 || "",
      c_city: selectedCustomer.c_city || "",

      c_country:
        typeof selectedCustomer.c_country === "object"
          ? selectedCustomer.c_country._id
          : selectedCustomer.c_country || "",

      c_state:
        typeof selectedCustomer.c_state === "object"
          ? selectedCustomer.c_state._id
          : selectedCustomer.c_state || "",

      c_zipCode: selectedCustomer.c_zipCode || "",
      c_gst: selectedCustomer.c_gst || "",

      c_status: selectedCustomer.c_status || "",
      c_bankAccountPayment: selectedCustomer.c_bankAccountPayment || "",
      c_portalEnabled: !!selectedCustomer.c_portalEnabled,

      c_placeOfContact: selectedCustomer.c_placeOfContact || "",
      c_placeOfContactWithStateCode:
        selectedCustomer.c_placeOfContactWithStateCode || "",

      c_password: "",
    });

    if (selectedCustomer.c_country) {
      const cid =
        typeof selectedCustomer.c_country === "object"
          ? selectedCustomer.c_country._id
          : selectedCustomer.c_country;
      fetchStatesByCountry(cid).then(setStates);
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
  <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-start z-50 pt-10">
      <div className="bg-white p-6 rounded w-11/12 max-w-5xl">
        <h2 className="text-xl font-bold mb-4">{mode === "create" ? "New Customer" : "Edit Customer"}</h2>

        {/* GRID LAYOUT: 3 FIELDS PER ROW */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input placeholder="Salutation" value={modalForm.c_salutation || ""} onChange={e => handleChange("c_salutation", e.target.value)} className="w-full p-2 border rounded"/>
          {/* <input placeholder="First Name" value={modalForm.c_firstName || ""} onChange={e => handleChange("c_firstName", e.target.value)} className="w-full p-2 border rounded"/>
          <input placeholder="Last Name" value={modalForm.c_lastName || ""} onChange={e => handleChange("c_lastName", e.target.value)} className="w-full p-2 border rounded"/> */}

          <input placeholder="Name" value={modalForm.c_name || ""} onChange={e => handleChange("c_name", e.target.value)} className="w-full p-2 border rounded"/>
          {/* Emails */} <div className="col-span-3"> <div className="flex flex-wrap items-center gap-2 p-2 border rounded bg-gray-50"> {Array.isArray(modalForm.c_email) && modalForm.c_email .map((em: string) => em.trim()) .filter((em: string) => em !== "") .map((em: string) => ( <div key={em} className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full"> <span className="mr-2">{em}</span> <button type="button" onClick={() => setModalForm((prev) => ({ ...prev, c_email: (prev.c_email ?? []).filter((e) => e !== em), })) } className="text-blue-600 hover:text-red-600 font-bold" > × </button> </div> ))} <input type="text" placeholder="Add email" className="flex-1 min-w-[120px] p-1 outline-none bg-transparent" onKeyDown={(e) => { if (e.key === "Tab") return; if (e.key === "Enter" || e.key === ",") { e.preventDefault(); const value = (e.currentTarget.value || "").trim(); if (!value) return; const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; if (!emailPattern.test(value)) { alert("Invalid email format!"); return; } setModalForm((prev) => { const allEmails = prev.c_email ?? []; return { ...prev, c_email: allEmails.includes(value) ? allEmails : [...allEmails, value], }; }); e.currentTarget.value = ""; } }} /> </div> </div>

          <div className="flex gap-2 col-span-3 md:col-span-3">
            <select value={phoneCode} onChange={e => setPhoneCode(e.target.value)} className="w-32 p-2 border rounded">
              {PHONE_CODES.map(p => (
                <option key={p.code} value={p.dial}>{p.dial} ({p.name})</option>
              ))}
            </select>
            <input placeholder="Mobile Number" value={modalForm.c_phone || ""} onChange={e => handleChange("c_phone", e.target.value.replace(/\D/g, ""))} maxLength={10} className={`flex-1 p-2 border rounded ${phoneError ? "border-red-500" : ""}`}/>
            {/* <input placeholder="Mobile Phone" value={modalForm.c_mobilePhone || ""} onChange={e => handleChange("c_mobilePhone", e.target.value)} className="flex-1 p-2 border rounded"/> */}
          </div>

          {phoneError && <p className="text-red-500 text-sm col-span-3">{phoneError}</p>}

          <input placeholder="Company" value={modalForm.c_company || ""} onChange={e => handleChange("c_company", e.target.value)} className="w-full p-2 border rounded"/>
          <input placeholder="Address" value={modalForm.c_address || ""} onChange={e => handleChange("c_address", e.target.value)} className="w-full p-2 border rounded"/>
          <input placeholder="Address 2" value={modalForm.c_address2 || ""} onChange={e => handleChange("c_address2", e.target.value)} className="w-full p-2 border rounded"/>

          <input placeholder="City" value={modalForm.c_city || ""} onChange={e => handleChange("c_city", e.target.value)} className="w-full p-2 border rounded"/>
          <select value={modalForm.c_country || ""} onChange={handleCountryChange} className="w-full p-2 border rounded">
            <option value="">Select Country</option>
            {countries.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
          </select>
          <select value={modalForm.c_state || ""} onChange={e => handleChange("c_state", e.target.value)} className="w-full p-2 border rounded">
            <option value="">Select State</option>
            {states.map(s => <option key={s.code} value={s.code}>{s.name}</option>)}
          </select>

          <input placeholder="Zip Code" value={modalForm.c_zipCode || ""} onChange={e => handleChange("c_zipCode", e.target.value)} className="w-full p-2 border rounded"/>
          <input placeholder="GST" value={modalForm.c_gst || ""} onChange={e => handleChange("c_gst", e.target.value)} className="w-full p-2 border rounded"/>
          {/* <input placeholder="Status" value={modalForm.c_status || ""} onChange={e => handleChange("c_status", e.target.value)} className="w-full p-2 border rounded"/> */}

          <input placeholder="Bank Account Payment" value={modalForm.c_bankAccountPayment || ""} onChange={e => handleChange("c_bankAccountPayment", e.target.value)} className="w-full p-2 border rounded"/>
          <input placeholder="Place of Contact" value={modalForm.c_placeOfContact || ""} onChange={e => handleChange("c_placeOfContact", e.target.value)} className="w-full p-2 border rounded"/>
          <input placeholder="Place of Contact (State Code)" value={modalForm.c_placeOfContactWithStateCode || ""} onChange={e => handleChange("c_placeOfContactWithStateCode", e.target.value)} className="w-full p-2 border rounded"/>

          <div className="col-span-3 flex items-center gap-2">
            <input type="checkbox" checked={!!modalForm.c_portalEnabled} onChange={e => handleChange("c_portalEnabled", e.target.checked)}/>
            <span>Portal Enabled</span>
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button onClick={closeModal} className="px-4 py-2 rounded border bg-gray-200">Cancel</button>
          <button onClick={() => { if (phoneError) { alert("Please fix phone number before saving"); return; } handleSaveCustomer(modalForm); }} disabled={!!phoneError} className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50">Save</button>
        </div>
      </div>
    </div>
  );
};

export default CustomerModal;
