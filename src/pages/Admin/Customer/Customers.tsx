import React, { useEffect, useState } from "react";
import {
  ICustomer,
  fetchCustomers,
  createCustomer,
  deleteCustomer,
  updateCustomer,
  fetchCountries,
  fetchStatesByCountry,
  fetchCountryCodes 
} from "./api";
import CustomerList from "./CustomerList";
import CustomerModal from "./CustomerModal";
import CustomerViewModal from "./CustomerViewModal";
import { FaPlus } from "react-icons/fa";
import { notify } from "../../../Common/Toastify";

// ✅ Success Popup Component
const SuccessPopup: React.FC<{ email: string; password: string; onClose: () => void }> = ({
  email,
  password,
  onClose,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

const handleCopy = () => {
  const textToCopy = `Email: ${email}\nPassword: ${password}`;

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(textToCopy)
      .then(() => notify("Login details copied to clipboard!", "success"))
      .catch(() => fallbackCopy(textToCopy));
  } else {
    fallbackCopy(textToCopy);
  }
};

// fallback for non-https / restricted browsers
const fallbackCopy = (text: string) => {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  textArea.style.left = "-9999px";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    document.execCommand("copy");
    notify("Login details copied to clipboard!", "success");
  } catch (err) {
    notify("Failed to copy login details!", "error");
  }
  document.body.removeChild(textArea);
};


  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 text-center w-[480px] max-w-[90%]">
        <h2 className="text-xl font-bold mb-3 text-green-600">
          Customer Created Successfully...
        </h2>
         {/* Email */}
       <div className="mb-4 flex justify-center items-center gap-3">
  <p className="text-gray-600 text-lg font-medium">Email:</p>
  <p className="text-xl font-semibold break-all text-gray-800">{email}</p>
</div>

        {/* Password */}
        <div className="mb-6 flex justify-center items-center gap-3">
  <p className="text-gray-600 text-lg font-medium">Password:</p>
  <div className="flex items-center gap-2">
    <p className="text-xl font-semibold text-gray-800">
      {showPassword ? password : "•".repeat(password.length)}
    </p>
    <button
      onClick={() => setShowPassword(!showPassword)}
      className="text-blue-500 underline text-sm"
    >
      {showPassword ? "Hide" : "Show"}
    </button>
  </div>
</div>

        {/* Buttons */}
        <div className="flex justify-center gap-4">
          <button
            onClick={handleCopy}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

// ✅ Form interface
export interface ICustomerForm {
  c_password?: string;
  c_gst?: string;
  c_name?: string;
  c_email?: string[];
  c_phone?: string;
  c_company?: string;
  c_address?: string;
  c_city?: string;
  c_state?: string;
  c_country?: string;
  c_countryCode?:string;
  c_zipCode?: string;
    c_status?: string;
  c_bankAccountPayment?: string;
  c_portalEnabled?: boolean;
c_salutation?: string;
  c_firstName?: string;
  c_lastName?: string;
  c_placeOfContact?: string;
  c_placeOfContactWithStateCode?: string;
  c_mobilePhone?: string;
  c_address2?:string;
}

const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<ICustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedCustomer, setSelectedCustomer] = useState<ICustomer | null>(null);
  const [highlightCustomerId, setHighlightCustomerId] = useState<string | null>(null);

  const [modalForm, setModalForm] = useState<ICustomerForm>({
    c_name: "",
    c_email: [],
    c_phone: "",
    c_mobilePhone:"",
    c_company: "",
    c_address: "",
    c_city: "",
    c_state: "",
    c_country: "",
    c_countryCode:"",
    c_zipCode: "",
    c_password: "",
    c_gst: "",
  });

  const [countries, setCountries] = useState<{ code: string; name: string }[]>([]);
  const [states, setStates] = useState<{ code: string; name: string }[]>([]);

  // ✅ Popup state
  const [showSuccessPopup, setShowSuccessPopup] = useState<{
    visible: boolean;
    email?: string;
    password?: string;
  }>({
    visible: false,
  });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const customerList = await fetchCustomers();
        setCustomers(customerList);

        const countryList = await fetchCountries();
        setCountries(countryList);
      } catch (err) {
        console.error("Error loading customers:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const refreshCustomers = async () => {
    setLoading(true);
    try {
      const customerList = await fetchCustomers();
      setCustomers(customerList);
    } catch (err) {
      console.error("Error refreshing customers:", err);
    } finally {
      setLoading(false);
    }
  };
const handleDeleteCustomer = async (id: string) => {
  try {

    const response = await deleteCustomer(id);

    if (response?.success) {
      notify("Customer deleted successfully!", "success");
      refreshCustomers();
    } else {
      notify(response?.error || "Failed to delete customer", "error");
    }

  } catch (error) {
    console.error("Delete customer error:", error);
    notify("Failed to delete customer", "error");
  }
};
  const handleCreate = () => {
    setSelectedCustomer(null);
    setModalForm({
      c_name: "",
      c_email: [""],
      c_phone: "",
      c_mobilePhone:"",
      c_company: "",
      c_address: "",
      c_city: "",
      c_state: "",
      c_country: "",
      c_countryCode:"",
      c_zipCode: "",
      c_password: "",
      c_gst: "",
    });
    setModalMode("create");
    setStates([]);
    setIsModalOpen(true);
  };

  const handleView = (customer: ICustomer) => {
    setSelectedCustomer(customer);
    setIsViewModalOpen(true);
  };

  const handleEdit = (customer: ICustomer) => {
  setSelectedCustomer(customer);

  const countryId =
    typeof customer.c_country === "object"
      ? customer.c_country._id
      : customer.c_country || "";

  setModalForm({
    c_name: customer.c_name || "",
    // c_email: Array.isArray(customer.c_email)
    //   ? customer.c_email
    //   : customer.c_email
    //   ? customer.c_email.split(",")
    //   : [""],
    c_email: Array.isArray(customer.c_email) ? customer.c_email : [""],
    c_phone: customer.c_phone || "",
    c_company: customer.c_company || "",
    c_address: customer.c_address || "",
    c_city: customer.c_city || "",
    c_state:
      typeof customer.c_state === "object"
        ? customer.c_state.name
        : customer.c_state || "",
    c_country: countryId, // ✅ ID ONLY
    c_zipCode: customer.c_zipCode || "",
    c_password: "",
  });

  setModalMode("edit");

  if (countryId) {
    fetchStatesByCountry(countryId).then(setStates);
  } else {
    setStates([]);
  }

  setIsModalOpen(true);
};

// ✅ Submit (create/edit)
const handleSubmitCustomer = async (form: ICustomerForm) => {
  const cleanedEmails = (form.c_email || []).filter((e) => e.trim() !== "");

  try {
    const payload = {
  c_name: form.c_name,
  c_email: cleanedEmails, 
  c_phone: form.c_phone,
  c_company: form.c_company,
  c_address: form.c_address,
  c_address2: form.c_address2,
  c_city: form.c_city,
  c_state: form.c_state,
  c_country: form.c_country,
  c_countryCode:form.c_countryCode,
  c_zipCode: form.c_zipCode,
  c_gst: form.c_gst,
  c_status: form.c_status,
  c_bankAccountPayment: form.c_bankAccountPayment,
  c_portalEnabled: form.c_portalEnabled,
  c_salutation: form.c_salutation,
  c_firstName: form.c_firstName,
  c_lastName: form.c_lastName,
  c_placeOfContact: form.c_placeOfContact,
  c_placeOfContactWithStateCode: form.c_placeOfContactWithStateCode,
  c_mobilePhone: form.c_phone,
  password: form.c_password || undefined,
};

    let response;

    if (modalMode === "create") {
      response = await createCustomer(payload);

      if (response?.success) {
        notify("Customer created successfully!", "success");

        // ✅ Show popup with created email + password
        setShowSuccessPopup({
          visible: true,
          email: Array.isArray(response.data?.c_email)
            ? response.data.c_email[0]
            : response.data?.c_email || "",
          password:
            response.data?.generatedPassword ||
            response.generatedPassword ||
            form.c_password ||
            "",
        });
      } else {
        // ✅ Show backend error
        notify(response?.error || "Something went wrong!", "error");
      }
    }  else if (modalMode === "edit" && selectedCustomer?._id) {
  response = await updateCustomer(selectedCustomer._id, payload);

  if (response?.success) {
    notify("Customer updated successfully!", "success");

    // ✅ SET HIGHLIGHT ID
    setHighlightCustomerId(selectedCustomer._id);

    // ✅ AUTO REMOVE HIGHLIGHT AFTER 3 SECONDS
    setTimeout(() => {
      setHighlightCustomerId(null);
    }, 3000);
  } else {
    notify(response?.error || "Failed to update customer!", "error");
  }
}

    setIsModalOpen(false);
    refreshCustomers();
  } catch (error: any) {
    console.error("Error saving customer:", error);

    // ✅ If backend returns { success: false, error: "Customer email is required." }
    const backendError = error?.response?.data?.error;
    if (backendError) {
      notify(backendError, "error");
    } else {
      notify("An unexpected error occurred!", "error");
    }
  }
};
useEffect(() => {
  if (highlightCustomerId) {
    const t = setTimeout(() => setHighlightCustomerId(null), 2500);
    return () => clearTimeout(t);
  }
}, [highlightCustomerId]);


  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Customers</h1>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-blue-600 text-white rounded flex items-center gap-2"
        >
          <FaPlus /> New Customer
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <CustomerList
          customers={customers}
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDeleteCustomer}
          highlightCustomerId={highlightCustomerId}
        />
      )}

      {isModalOpen && (
        <CustomerModal
          mode={modalMode}
          selectedCustomer={selectedCustomer}
          isCustomer={!!selectedCustomer?.is_customer}
          modalForm={modalForm}
          setModalForm={setModalForm}
          countries={countries}
          states={states}
          setStates={setStates}
          fetchStatesByCountry={fetchStatesByCountry}
          closeModal={() => setIsModalOpen(false)}
          handleSaveCustomer={handleSubmitCustomer}
          
        />
      )}

      {isViewModalOpen && selectedCustomer && (
        <CustomerViewModal
          customer={selectedCustomer}
          countries={countries}
          states={states}
          closeModal={() => setIsViewModalOpen(false)}
        />
      )}

      {/* ✅ Show popup after successful creation */}
      {showSuccessPopup.visible && (
        <SuccessPopup
          email={showSuccessPopup.email || ""}
          password={showSuccessPopup.password || ""}
          onClose={() => setShowSuccessPopup({ visible: false })}
        />
      )}
    </div>
  );
};

export default Customers;
