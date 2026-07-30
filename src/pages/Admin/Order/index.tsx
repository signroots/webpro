import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  FaEye,
  FaEdit,
  FaEnvelope,
  FaServer,
  FaLock,
  FaLaptopCode,
  FaGlobe,

} from "react-icons/fa";
import { useLocation } from "react-router-dom";
import { SiCloudflare, SiHostinger } from "react-icons/si";
import { Link, useNavigate, useParams } from "react-router-dom";
import { fetchOrders, fetchCustomerOrder } from "./api";
import { fetchOrderById } from "./update/api";
import { createOrder } from "./new/api";
import axios from "axios";
import { updateOrder } from "./update/api";
import { fetchCountries, fetchStatesByCountry } from "../Customer/api";
import { notify } from "../../../Common/Toastify";
import { Select } from "antd";
import { fetchCountryCodes } from "../Customer/api";
import { toast } from "react-toastify";


// -------------------- Types --------------------
interface Customer {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
  city?: string;
  country?: string;

}
interface Client {
  _id: string;
  c_name?: string;
  c_email?: string[];
  c_phone?: string;
  c_company?: string;
  c_address?: string;
  c_city?: string;
  c_country?: string;

}
interface ICountry {
  _id: string;
  name: string;
}
interface MSOfficeDetails {
  _id: string;
  orderId: string;
  planName: string;
  emailType: string;
  noOfUsers: number;
  serviceType: string;
  type: string;
  registrationDate: string;
  expiryDate: string;
  planId?: string;
}

interface Order {
  _id: string;
  domainName: string;
  lockStatus?: string;
  status?: string;
  order_status?:string;
  users?: number;
  domain_flag?: boolean;
  managedBy?: string;
  registrationDate?: string;
  expiryDate?: string;
 domainSource?: {
  _id:string;
  name:string;
  code:string;
  image?:string;
};
  google_email?: boolean;
  microsoft_email?: boolean;
  cloudflareRegistered?: boolean;
  hosting?: boolean;
  email_flag?: boolean;
  
  website_flag?: boolean;
  ssl_flag?: boolean;
  host_flag?: boolean;
  msoffice_services_flag?: boolean;
  customer?: Customer | null;
  client?: Client | null;
  subResellerName?: string;
  subResellerEmail?: string;
  subscription?: string;
  provider?: string;
  email_status?: string;

  // ✅ Email Plans (OrderPlanSchema)
  emailPlans?: {
    _id: string;
    orderId: string;
    planId: {
      _id: string;
      plan: string;
      emailType: string;
      isActive: boolean;
    };
    emailTypeId: {
      _id: string;
      name: string;
    };
    registrationDate: string;
    expiryDate: string; // 👈 IMPORTANT
    noOfUsers: number;
    type: "email" | "storage" | "msoffice";
    adminEmail: string;
    adminPassword: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  }[];

  // ✅ Plans array (From your previous system)
  plans?: {
    _id: string;
    orderId: string;
    planName: string;
    emailType: string;
    noOfUsers: number;
    serviceType: string;
    type: string;
    registrationDate: string;
    expiryDate: string;
    planId?: string;
  }[];

  // Flags merged from API
  email_service?: "Google Workspace" | "Microsoft 365";
  email_expiryDate?: string;

  // Customer Details
  // Customer Details
  newCustomer?: {
    c_salutation?: string;
    c_firstName?: string;
    c_lastName?: string;
    c_name?: string;
    c_email?: string[];
    c_phone?: string;
    c_company?: string;
    c_address?: string;
    c_address2?: string;
    c_city?: string;
    c_state?: string;
    c_country?: string;
    c_countryCode?: string;
    c_zipCode?: string;
    c_gst?: string;
    c_bankAccountPayment?: string;
    c_placeOfContact?: string;
    c_placeOfContactWithStateCode?: string;
    c_portalEnabled?: boolean;
  };
  // API Response Plans
Plans?: {
  type: "email" | "storage" | "msoffice";
  expiryDate: string;
  emailType: string;
  emailTypeImage: string;
  planId: string;
}[];

}

// -------------------- Component --------------------
const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const modalRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const { orderId } = useParams<{ orderId: string }>();
  const [error, setError] = useState<string | null>(null);
  const [client, setClient] = useState<Client[]>([]);
  const navigate = useNavigate();
  const [phoneCodes, setPhoneCodes] = useState<string[]>([]);
  const [phoneCode, setPhoneCode] = useState<string>("");
const [totalPages, setTotalPages] = useState(1);
const [totalOrders, setTotalOrders] = useState(0);
  const [highlightedOrderId, setHighlightedOrderId] =
    useState<string | null>(null);
  const isUpdatingRef = useRef(false);
  const location = useLocation();
  const restorePageRef = useRef(true);
const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
  const updatedOrderId: string | null =
    typeof location.state?.updatedOrderId === "string"
      ? location.state.updatedOrderId
      : null;
const [emailType, setEmailType] = useState<string | undefined>(undefined);
  const fromPage: number | null =
    typeof location.state?.fromPage === "number"
      ? location.state.fromPage
      : null;
  const highlightOrderId = location.state?.highlightOrderId;
  const targetPageRef = useRef<number | null>(null);
  const [formData, setFormData] = useState<Order>({
    _id: "",
    domainName: "",
    managedBy: "Signroots",
    users: 1,
    // domainSource:"",
    newCustomer: {
      c_salutation: "",
      c_firstName: "",
      c_lastName: "",
      c_name: "",
      c_email: [],
      c_phone: "",
      c_company: "",
      c_address: "",
      c_address2: "",
      c_city: "",
      c_state: "",
      c_country: "",
      c_countryCode: "",
      c_zipCode: "",
      c_gst: "",
      c_bankAccountPayment: "",
      c_placeOfContact: "",
      c_placeOfContactWithStateCode: "",
      c_portalEnabled: false,
    }

  });




  // Filters
  // const [provider, setProvider] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [customerType, setCustomerType] = useState<"existing" | "new" | undefined>(undefined);
  const [emailChecked, setEmailChecked] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);


  // Selected order & modal type
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [modalType, setModalType] = useState<"view" | "edit" | "addCustomer" | null>(null);
  const [countries, setCountries] = useState<{ code: string; name: string }[]>([]);
  const [msofficeDetails, setMsofficeDetails] = useState<MSOfficeDetails[]>([]);
  const [isHovering, setIsHovering] = useState(false);
  const [hasFetchedMsoffice, setHasFetchedMsoffice] = useState(false);
  const [msofficeCache, setMsofficeCache] = useState<Record<string, any[]>>({});
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const isRestoringRef = useRef(false);



  const [states, setStates] = useState<{ code: string; name: string }[]>([]);
  const InfoItem = ({
    label,
    value,
  }: {
    label: string;
    value: string | React.ReactNode;
  }) => (
    <div className="p-4 border rounded-lg shadow-sm bg-gray-50">
      <p className="font-semibold">{label}</p>
      <p>{value || "N/A"}</p>
    </div>
  );

  const handlePageChange = (page: number) => {
    restorePageRef.current = false;
    setCurrentPage(page);
  };



const closeCustomerModal = () => {
  setModalType(null);
  setSelectedOrder(null);

  setCustomerType("existing");

  setFormData((prev) => ({
    ...prev,
    client: null,
    newCustomer: {},
  }));
};

useEffect(() => {

  const loadOrders = async () => {

    try {

      setLoading(true);


      const response = await fetchOrders({

        search: debouncedSearch,

        page: currentPage,

        limit: itemsPerPage,

      });



      setOrders(
        response.data || []
      );


      setTotalPages(
        response.totalPages || 1
      );


      setTotalOrders(
        response.total || 0
      );


    } catch (err) {

      console.error(
        "Failed to fetch orders",
        err
      );


    } finally {

      setLoading(false);

    }

  };


  loadOrders();


}, [
  debouncedSearch,
  currentPage,
  itemsPerPage
]);

useEffect(() => {
  const handler = setTimeout(() => {
    setDebouncedSearch(searchTerm);
    setCurrentPage(1); // reset to page 1 on new search
  }, 500); // 👈 delay in ms (300–600 is ideal)

  return () => {
    clearTimeout(handler);
  };
}, [searchTerm]);

  useEffect(() => {
    fetchCountryCodes()
      .then((codes) => {
        setPhoneCodes(codes);

        const defaultCode = codes.includes("+91") ? "+91" : codes[0] || "";
        setPhoneCode(defaultCode);

        // ✅ Also set it in the formData
        setFormData((prev) => ({
          ...prev,
          newCustomer: {
            ...(prev.newCustomer || {}),
            c_countryCode: defaultCode,
          },
        }));
      })
      .catch((err) => {
        console.error("Failed to load country codes", err);
      });
  }, []);

  useEffect(() => {
    const loadCountries = async () => {
      const data = await fetchCountries();
      setCountries(data);
    };

    if (modalType === "addCustomer") loadCountries();
  }, [modalType]);
  useEffect(() => {
    if (modalType === "addCustomer") {
      setTimeout(() => {
        firstFieldRef.current?.focus();
      }, 100);
    }
  }, [modalType]);

  // Fetch existing customers when "existing" is selected
 useEffect(() => {
  if (customerType === "existing") {

    const token = localStorage.getItem("token");

    axios
      .get(
        `${import.meta.env.VITE_API_BASE_URL}/api/orders/existing_customers`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      .then((res) => setClient(res.data.data))
      .catch((err) => console.error(err));

  }
}, [customerType]);
  useEffect(() => {
    if (typeof location.state?.fromPage === "number") {
      isRestoringRef.current = true;
      setCurrentPage(location.state.fromPage);
    }
  }, [location.state]);

  const handleTabKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Tab") return;
    if (!modalRef.current) return;

    const focusableElements = modalRef.current.querySelectorAll<
      HTMLInputElement | HTMLSelectElement | HTMLButtonElement | HTMLTextAreaElement
    >(
      'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled])'
    );

    const first = focusableElements[0];
    const last = focusableElements[focusableElements.length - 1];

    if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    }
  };


  useEffect(() => {
    const setDefaultCountryAndState = async () => {
      // Only run when creating a new customer
      if (customerType === "new" && !formData.newCustomer?.c_country) {
        // Find India from the country list
        const india = countries.find(
          (c) => c.name.toLowerCase() === "india" || c.code === "IN"
        );

        if (india) {
          // Update formData with India
          setFormData((prev) => ({
            ...prev,
            newCustomer: {
              ...(prev.newCustomer || {}),
              c_country: india.code,
            },
          }));

          try {
            // Fetch states for India
            const stateList = await fetchStatesByCountry(india.code);
            setStates(stateList);

            // Find Kerala
            const kerala = stateList.find(
              (s) => s.name.toLowerCase() === "kerala"
            );

            // Update formData with Kerala
            setFormData((prev) => ({
              ...prev,
              newCustomer: {
                ...(prev.newCustomer || {}),
                c_country: india.code,
                c_state: kerala ? kerala.name : stateList[0]?.name || "",
              },
            }));
          } catch (err) {
            console.error("Failed to fetch Indian states:", err);
          }
        }
      }
    };

    setDefaultCountryAndState();
  }, [customerType, countries]);

  const handleEdit = (orderId: string) => {
    navigate(`/admin/orders/update/${orderId}`, {
      state: {
        fromPage: currentPage,
        highlightOrderId: orderId,
      },
    });
  };


  const closeModal = () => {
    setSelectedOrder(null);
    setModalType(null);
  };
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    if (customerType === "new" && name.startsWith("newCustomer.")) {
      const key = name.split(".")[1] as keyof NonNullable<Order["newCustomer"]>;

      setFormData((prev) => ({
        ...prev,
        newCustomer: {
          ...(prev.newCustomer || {
            resellerCustomerId: "",
            c_name: "",
            c_email: [],
            c_phone: "",
            c_company: "",
            c_address: "",
            c_city: "",
            c_state: "",
            c_country: "",
            c_zipCode: "",
            c_countryCode: "", // ensure default exists
          }),
          [key]: type === "checkbox" ? checked : value,
        },
      }));
    } else if (customerType === "new" && name === "newCustomer.c_countryCode") {
      // Handle phone code changes explicitly if using a Select
      setFormData((prev) => ({
        ...prev,
        newCustomer: {
          ...(prev.newCustomer || {}),
          c_countryCode: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };


  useEffect(() => {
    if (!highlightedOrderId) return;

    const timer = setTimeout(() => {
      setHighlightedOrderId(null);
      targetPageRef.current = null; // ✅ reset
    }, 5000);

    return () => clearTimeout(timer);
  }, [highlightedOrderId]);

  console.log("🛠 Updating orderIdSSS:", orderId);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload: any = {
        ...formData,
        is_customer: customerType === "existing",
      };

      if (customerType === "existing" && formData.client) {
        payload.client = formData.client;
        delete payload.newCustomer;
        payload.domainName = selectedOrder?.domainName;
        payload.is_customer = true;
      } else if (
        customerType === "new" &&
        formData.newCustomer?.c_name &&
        formData.newCustomer?.c_email
      ) {
        if (formData.newCustomer.c_email.length === 0) {
          alert("At least one email is required.");
          return;
        }
        payload.newCustomer = formData.newCustomer;
        delete payload.client;
        payload.domainName = selectedOrder?.domainName;
        payload.is_customer = false;
      } else {
        delete payload.client;
        delete payload.newCustomer;
        delete payload.is_customer;
      }

      delete payload._id;

      const orderId = selectedOrder?._id;
      if (!orderId) throw new Error("Order ID is missing");

      // ✅ API call
      await updateOrder(orderId, payload);


      console.log("🧠 allOrders BEFORE update:", allOrders.map(o => o._id));

      setAllOrders(prev => {
        const updated = prev.map(o =>
          o._id === orderId ? { ...o, ...payload } : o
        );
        console.log("🧠 allOrders AFTER update:", updated.map(o => o._id));
        return updated;
      });

      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, ...payload } : o))
      );

      closeModal();
      resetFormData();
      notify("Order Updated Successfully...", "success");
      // same page maintain
setCurrentPage(currentPage);

// refresh order list
const response = await fetchOrders({
  search: debouncedSearch,
  page: currentPage,
  limit: itemsPerPage,
});

setOrders(response.data || []);
setTotalPages(response.totalPages || 1);
setTotalOrders(response.total || 0);



    } catch (err) {
      console.error(err);
      setError((err as Error).message || "Failed to update order");
    } finally {
      setLoading(false);
    }
  };

  console.log("updatedOrderId:", updatedOrderId);
  console.log("fromPage:", fromPage);
  console.log("currentPage:", currentPage);


  const resetFormData = () => {
    setFormData({
      _id: "",
      domainName: "",
      managedBy: "Signroots",
      users: 1,
      newCustomer: {
        c_name: "",
        c_email: [],
        c_phone: "",
        c_company: "",
        c_address: "",
        c_city: "",
        c_state: "",
        c_country: "",
        c_zipCode: "",
        c_gst: "",
      },
    });
  };

  // Close modal and reset selectedOrder
  // const closeModal = () => {
  //   setSelectedOrder(null);
  //   setModalType(null); // Close the modal
  // };
  // -------------------- Apply Filters --------------------
  useEffect(() => {
  setCurrentPage(1);
}, [searchTerm])
useEffect(()=>{

 const applyFilters = async()=>{


   let filtered = allOrders;


   if(emailType){

     const response = await fetchOrders({

       emailType:emailType

     });


     filtered = response.data;

   }


   setOrders(filtered);


 };


 applyFilters();


},[
 emailType,
 allOrders
]);
  // const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = orders;
const getStatusClass = (status?: string) => {
  const value = status?.trim().toLowerCase();

  // N/A or empty → YELLOW
  if (!value) {
    return "bg-blue-100 text-blue-800";
  }

  // EXPIRED → RED
  if (value === "expired") {
    return "bg-red-600 text-white";
  }

  // ACTIVE → GREEN
  if (value === "active") {
    return "bg-gray-100 text-green-700";
  }

  // fallback
  return "bg-gray-200 text-gray-800";
};



  useEffect(() => {
    if (!updatedOrderId) return;

    // wait until correct page is set
    if (isRestoringRef.current) {
      isRestoringRef.current = false;
      return;
    }

    setHighlightedOrderId(updatedOrderId);

    const timer = setTimeout(() => {
      document
        .getElementById(`order-row-${updatedOrderId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 300);

    const clear = setTimeout(() => {
      setHighlightedOrderId(null);
    }, 4000);

    return () => {
      clearTimeout(timer);
      clearTimeout(clear);
    };
  }, [updatedOrderId, currentPage]);

{loading && (
  <div className="py-6 text-center text-gray-500">
    Loading orders...
  </div>
)}
{loading && debouncedSearch && (
  <span className="text-sm text-gray-400">Searching…</span>
)}
  // -------------------- JSX --------------------
  return (
    <div className="min-h-screen w-full bg-gray-100 p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold mb-4 text-black">Orders</h1>
        <Link
          to="/admin/orders/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + New Order
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-4 items-center">
       <div className="relative">
  <input
    type="text"
    placeholder="Search domain..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    className="border px-3 py-2 pr-10 rounded-lg text-black w-64"
  />

  {/* Clear Button */}
  {searchTerm && (
    <button
      onClick={() => setSearchTerm("")}
      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
      title="Clear search"
    >
      ✕
    </button>
  )}
</div>

        {/* 🌐 Provider Dropdown */}
        {/* Provider Dropdown */}
        <div className="relative inline-block w-60">
          <button
            type="button"
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="w-full border px-4 py-2 rounded-lg bg-white flex items-center justify-between text-black"
          >
            <div className="flex items-center gap-2">
              {emailType === "Google Workspace" && (
                <img src="/download.png" alt="Google Workspace" className="w-5 h-5" />
              )}
              {emailType === "Microsoft 365" && (
                <img src="/microsoft.png" alt="Microsoft 365" className="w-5 h-5" />
              )}
              {!emailType && (
                <img src="/reset.png" alt="All Providers" className="w-5 h-5" />
              )}
              <span>
                {emailType || "All Providers"}
              </span>
            </div>
            <span className="text-gray-500">▼</span>
          </button>

          {dropdownOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg">
              <div
                onClick={() => {
                  setEmailType(undefined);
                  setDropdownOpen(false);
                }}
                className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 cursor-pointer"
              >
                <img src="/reset.png" alt="All Providers" className="w-5 h-5" />
                <span>All Providers</span>
              </div>

              <div
                onClick={() => {
                  setEmailType("Google Workspace");
                  setDropdownOpen(false);
                }}
                className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 cursor-pointer"
              >
                <img src="/download.png" alt="Google Workspace" className="w-5 h-5" />
                <span>Google Workspace</span>
              </div>

              <div
                onClick={() => {
                  setEmailType("Microsoft 365");
                  setDropdownOpen(false);
                }}
                className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 cursor-pointer"
              >
                <img src="/microsoft.png" alt="Microsoft 365" className="w-5 h-5" />
                <span>Microsoft 365</span>
              </div>
            </div>
          )}
        </div>



        {/* ⚙️ Status Filter */}
        {/* <select
    value={statusFilter || ""}
    onChange={(e) => setStatusFilter(e.target.value || undefined)}
    className="border px-3 py-2 rounded-lg text-black bg-white"
  >
    <option value="">All Status</option>
    <option value="Active">Active</option>
    <option value="Inactive">Inactive</option>
    <option value="Expired">Expired</option>
  </select> */}
      </div>
{/* PAGINATION — TOP */}
{ !emailType && (
  <div className="mb-3 flex justify-end gap-4 text-black">
    <button
      disabled={currentPage === 1}
      onClick={() => handlePageChange(currentPage - 1)}
      className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
    >
      Prev
    </button>

    <span className="py-2">
      Page {currentPage} of {totalPages}
    </span>

    <button
      disabled={currentPage === totalPages}
      onClick={() => handlePageChange(currentPage + 1)}
      className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
    >
      Next
    </button>
  </div>
)}
      {/* Orders Table */}
      <div className="bg-white shadow rounded-lg overflow-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm table-fixed">


          {/* ================= HEADER ================== */}
          <thead className="bg-gray-100 text-gray-600 uppercase text-xs tracking-wider">
            <tr>
              {["SL No", "Domain Name", "Customer", "Services", "Expiry Date", "Status", "Actions"].map(
                (col) => (
                  <th key={col} className="px-1 py-2 text-left font-medium">
                    {col}
                  </th>
                )
              )}
            </tr>
          </thead>


          {/* ================= BODY ================== */}
          <tbody className="divide-y divide-gray-100 text-gray-900">
            {paginatedOrders.map((order, idx) => (
              <tr
                key={order._id}                     // ✅ ADD THIS
                id={`order-row-${order._id}`}
                className={`transition-all duration-500 ${highlightedOrderId === order._id
                    ? "bg-blue-50 border-l-4 border-blue-500"
                    : "hover:bg-gray-50"
                  }`}
              >

                {/* SL NO */}
                <td className="px-6 py-4">
                  {(currentPage - 1) * itemsPerPage + idx + 1}
                </td>

                {/* DOMAIN + LOCK */}
                <td className="px-2 py-4 flex items-center gap-2 max-w-[200px] truncate">
                  <span className="flex items-center justify-center w-5 h-5 shrink-0">
                    {order.lockStatus === "Locked" ? (
                      <FaLock className="text-red-500 w-4 h-4" />
                    ) : (
                      <FaLock className="text-green-500 w-4 h-4" />
                    )}
                  </span>
                  <span className="font-medium truncate">
                    {order.domainName}
                  </span>
                </td>


                {/* CUSTOMER */}
                <td className="px-2 py-4 max-w-[200px] truncate">
                  {order.client ? (
                    <Link
                        to={`/admin/orders/customer/${order.client?._id}`}
                      className="text-blue-600 hover:underline"
                      title={order.client.c_company} // Full name on hover tooltip
                    >
                      {(() => {
                        const words = order.client.c_company?.trim().split(/\s+/) || [];
                        if (words.length <= 4) {
                          return order.client.c_company;
                        }
                        // Join first 3 words + "..."
                        return words.slice(0, 3).join(" ") + " ...";
                      })()}
                    </Link>
                  ) : (
                    <button
                      className="text-red-600 hover:underline font-medium"
                      onClick={() => {
                        setSelectedOrder(order);
                        setModalType("addCustomer");
                      }}
                    >
                      Add Customer
                    </button>
                  )}
                </td>

                {/* SERVICES */}
                <td className="px-1 py-2">
                  <div className="flex items-center gap-3">
                    

                    {/* Domain Source */}
                    {/* Domain Source */}

{
  order.domainSource && order.domainSource.image ? (

    <img
      src={
        order.domainSource.image.startsWith("/uploads")
          ? `${import.meta.env.VITE_API_BASE_URL}${order.domainSource.image}`
          : `/images/${order.domainSource.image}`
      }
      className="w-7 h-7 object-contain"
      title={order.domainSource.name}
      onError={(e)=>{
        e.currentTarget.src="/images/default-domain.png";
      }}
    />

  ) : (

    <FaGlobe
      className="w-6 h-6 text-gray-400"
      title="No Domain Source"
    />

  )
}

                    {/* EMAIL PLANS */}

{order.Plans?.filter(
(plan)=>plan.type==="email"
)
.map((plan,index)=>(

<div
key={index}
className="relative group"
>
<img
  src={`${import.meta.env.VITE_API_BASE_URL}${plan.emailTypeImage}`}
  className="w-5 h-5 cursor-pointer"
  title={plan.emailType}
/>
<div
className="
hidden group-hover:block
absolute left-0 top-full mt-2
bg-gray-900 text-white
text-xs
p-3
rounded-lg
w-64
shadow-xl
z-50
"
>

<p>
<b>Email:</b> {plan.emailType}
</p>


<p>
<b>Expiry:</b>{" "}
{new Date(plan.expiryDate)
.toLocaleDateString()}
</p>


<p>
<b>Plan ID:</b> {plan.planId}
</p>


</div>

</div>

))}


                    {/* MS OFFICE */}
                    {/* MS OFFICE */}
                    {order.msoffice_services_flag && (
                      <div
                        className="relative"
                        onMouseEnter={async () => {
                          setSelectedOrderId(order._id); // track which row is hovered
                          setIsHovering(true);

                          // Only fetch if this order's data hasn't been fetched yet
                          if (msofficeCache[order._id]) return;

                          try {
                            const fullOrder = await fetchOrderById(order._id);
                            const plans = fullOrder?.data?.plans || [];

                            const msofficePlans = plans.filter(
                              (p) =>
                                p?.serviceType?.toLowerCase() === "msoffice" ||
                                p?.type?.toLowerCase() === "msoffice"
                            );

                            // Save in cache keyed by order ID
                            setMsofficeCache((prev) => ({ ...prev, [order._id]: msofficePlans }));
                          } catch (err) {
                            console.error("Error fetching MS Office details:", err);
                          }
                        }}
                        onMouseLeave={() => setIsHovering(false)}
                      >
                        <img
                          src="/MSOffice.png"
                          className="w-5 h-5 cursor-pointer"
                          title="MS Office Services"
                        />

                        {/* POPUP */}
                        {isHovering &&
                          selectedOrderId === order._id &&
                          msofficeCache[order._id]?.length > 0 && (
                            <div className="
          absolute left-0 top-full mt-2
          bg-gray-900 text-white text-xs
          p-3 w-64 max-h-64 overflow-y-auto
          rounded-lg shadow-xl z-50
        ">
                              {msofficeCache[order._id].map((plan, idx) => (
                                <div
                                  key={idx}
                                  className="mb-2 pb-2 border-b border-gray-700 last:border-0"
                                >
                                  <p><b>Plan:</b> {plan.planName}</p>
                                  <p><b>Users:</b> {plan.noOfUsers}</p>
                                  <p><b>Type:</b> {plan.emailType}</p>
                                  <p>
                                    <b>Registered:</b>{" "}
                                    {plan.registrationDate
                                      ? new Date(plan.registrationDate).toLocaleDateString()
                                      : "-"}
                                  </p>
                                  <p>
                                    <b>Expires:</b>{" "}
                                    {plan.expiryDate
                                      ? new Date(plan.expiryDate).toLocaleDateString()
                                      : "-"}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                      </div>
                    )}



                    {/* Hosting */}
                    {/* <FaServer
                      className={`w-5 h-5 ${order.hosting ? "text-purple-500" : "text-gray-400 opacity-40"
                        }`}
                      title="Hosting"
                    /> */}
                    {order.hosting && (
                      <FaServer
                        className="w-5 h-5 text-purple-500"
                        title="Hosting"
                      />
                    )}

                    {/* Website */}
                    {/* <FaLaptopCode
                      className={`w-5 h-5 ${order.website_flag ? "text-purple-500" : "text-gray-400 opacity-40"
                        }`}
                      title="Website"
                    /> */}
                    {order.website_flag && (
                      <FaLaptopCode
                        className="w-5 h-5 text-purple-500"
                        title="Website"
                      />
                    )}
                  </div>
                </td>

               <td className="px-1 py-2 font-medium">
  {(() => {
    const formatDate = (date?: string) => {
      if (!date) return null;
      const d = new Date(date);
      const day = d.getUTCDate().toString().padStart(2, "0");
      const month = (d.getUTCMonth() + 1).toString().padStart(2, "0");
      const year = d.getUTCFullYear();
      return `${day}/${month}/${year}`;
    };

    const domainDate = formatDate(order.expiryDate);

    const emailDates = (order.Plans || [])
      .map(plan => formatDate(plan.expiryDate))
      .filter((d): d is string => Boolean(d));

    const isSameExpiry =
      domainDate &&
      emailDates.length > 0 &&
      emailDates.every(d => d === domainDate);

    const badgeBase =
      "inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium w-fit";

    const iconBase =
      "w-4 h-4 flex justify-center items-center rounded-full bg-white text-black text-[9px]";

    return (
      <div className="flex flex-col gap-1">
        {/* 🟢 ED – Same Email & Domain Expiry */}
        {isSameExpiry && domainDate && (
          <div className={`${badgeBase} bg-green-100 text-green-800`}>
            <span className={iconBase}>ED</span>
            {domainDate}
          </div>
        )}

        {/* 🔵 EE – Email Expiry */}
        {!isSameExpiry &&
          emailDates.map((date, idx) => (
            <div
              key={idx}
              className={`${badgeBase} bg-blue-100 text-blue-800`}
            >
              <span className={iconBase}>EE</span>
              {date}
            </div>
          ))}

        {/* 🟣 DE – Domain Expiry */}
        {!isSameExpiry && domainDate && (
          <div className={`${badgeBase} bg-purple-100 text-purple-800`}>
            <span className={iconBase}>DE</span>
            {domainDate}
          </div>
        )}

        {/* ⚪ No Data */}
        {!domainDate && emailDates.length === 0 && (
          <span className="text-gray-400 text-xs">N/A</span>
        )}
      </div>
    );
  })()}
</td>



<td className="px-2 py-4">
  <span
    className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium
      ${getStatusClass(order.order_status)}`}
  >
    <span className="w-4 h-4 flex justify-center items-center rounded-full bg-white text-black text-[9px]">
      D
    </span>

    {order.order_status || "N/A"}

  </span>
</td>



                {/* ACTIONS */}
                <td className="px-2 py-4 flex gap-3 text-gray-500">
                  <button
                    className="hover:text-blue-600"
                    title="View"
                    onClick={() =>
                      navigate(`/admin/orders/order-details/${order._id}`, {
                        state: {
                          fromPage: currentPage,
                        },
                      })
                    }
                  >
                    <FaEye />
                  </button>
                  <button
                    onClick={() => handleEdit(order._id)}
                    className="hover:text-yellow-600"
                    title="Edit"
                  >
                    <FaEdit />
                  </button>


                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!emailType && (
        <div className="mt-4 flex justify-center gap-4 text-black">
          <button
            disabled={currentPage === 1}
            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
          >
            Prev
          </button>

          <span className="py-2">
            Page {currentPage} of {totalPages}
          </span>

          <button
            disabled={currentPage === totalPages}
            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* -------------------- Modal -------------------- */}
      {modalType && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-[600px] relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={closeModal}
              className="absolute top-2 right-2 text-gray-600 hover:text-black"
            >
              ✕
            </button>

            {/* View Order Modal */}
            {modalType === "view" && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                {/* Modal Container */}
                <div className="relative bg-white rounded-2xl shadow-2xl p-8 w-[90%] max-w-6xl max-h-[90vh] overflow-y-auto">

                  {/* Close Button */}
                  <button
                    onClick={closeModal}
                    className="absolute top-3 right-3 text-gray-500 hover:text-black text-2xl font-bold"
                  >
                    ✕
                  </button>

                  {/* Header */}
                  <h2 className="text-2xl font-bold mb-6 border-b pb-3 text-gray-800">
                    View Order
                  </h2>

                  {/* Main Content */}
                  {selectedOrder ? (
                    <div className="text-gray-900 space-y-10">

                      {/* Order Details */}
                      <section>
                        <h3 className="text-lg font-semibold mb-3 border-b pb-2 text-gray-700">
                          Order Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                          <InfoItem label="Domain" value={selectedOrder.domainName} />
                          <InfoItem label="Status" value={selectedOrder.status || "Unknown"} />
                          <InfoItem
                            label="Registration Date"
                            value={
                              selectedOrder.registrationDate
                                ? new Date(selectedOrder.registrationDate).toLocaleDateString("en-GB", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                }).replaceAll(" ", "-")
                                : "N/A"
                            }
                          />

                          <InfoItem
                            label="Expiry Date"
                            value={
                              selectedOrder.expiryDate
                                ? new Date(selectedOrder.expiryDate).toLocaleDateString("en-GB", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                }).replaceAll(" ", "-")
                                : "N/A"
                            }
                          />

                          {/* <InfoItem label="Expiry Date" value={selectedOrder.expiryDate? new Date(selectedOrder.expiryDate).toLocaleDateString("en-GB"):"N/A"} /> */}
                      
                          <InfoItem label="Subscription" value={selectedOrder.subscription} />
                        </div>
                      </section>

                      {/* Client Details */}
                      <section>
                        <h3 className="text-lg font-semibold mb-3 border-b pb-2 text-gray-700">
                          Registrant Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                          <InfoItem label="Name" value={selectedOrder.client?.c_name || "-"} />
                          <InfoItem
                            label="Email"
                            value={
                              Array.isArray(selectedOrder.client?.c_email)
                                ? selectedOrder.client.c_email.join(", ")
                                : selectedOrder.client?.c_email || "-"
                            }
                          />
                          <InfoItem label="Phone" value={selectedOrder.client?.c_phone || "-"} />
                          <InfoItem label="Company" value={selectedOrder.client?.c_company || "-"} />
                        </div>
                      </section>

                      {/* Customer Details */}
                      <section>
                        <h3 className="text-lg font-semibold mb-3 border-b pb-2 text-gray-700">
                          Customer Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                          <InfoItem label="Name" value={selectedOrder.customer?.name || "-"} />
                          <InfoItem
                            label="Email"
                            value={
                              Array.isArray(selectedOrder.customer?.email)
                                ? selectedOrder.customer.email.join(", ")
                                : selectedOrder.customer?.email || "-"
                            }
                          />
                          <InfoItem label="Phone" value={selectedOrder.customer?.phone || "-"} />
                          <InfoItem label="Company" value={selectedOrder.customer?.company || "-"} />
                          <InfoItem label="Address" value={selectedOrder.customer?.address || "-"} />
                        </div>
                      </section>

                    </div>
                  ) : (
                    <div className="text-center py-10 text-gray-500">
                      No order details found.
                    </div>
                  )}

                  {/* Footer Button */}
                  <div className="mt-8 text-right">
                    <button
                      onClick={closeModal}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-all"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}


            {/* Edit Order */}
            {modalType === "edit" && selectedOrder && (
              <div>
                <h2 className="text-xl font-bold mb-4 text-black">Edit Order</h2>
                <form className="space-y-3">
                  <label className="block">
                    Domain:
                    <input
                      type="text"
                      value={selectedOrder.domainName}
                      className="border px-3 py-2 rounded w-full text-black"
                      readOnly
                    />
                  </label>
                  <label className="block">
                    Domain:
                    <input
                      type="text"
                      value={selectedOrder.domainSource?.name || ""}
                      className="border px-3 py-2 rounded w-full text-black"
                      readOnly
                    />
                  </label>


                  <label className="block">
                    Status:
                    <select
                      defaultValue={selectedOrder.order_status}
                      className="border px-3 py-2 rounded w-full text-black"
                    >
                      <option>Active</option>
                      <option>Inactive</option>
                      <option>Expired</option>
                    </select>
                  </label>

                  <label className="block">
                    Customer Name:
                    <input
                      type="text"
                      defaultValue={selectedOrder.customer?.name}
                      className="border px-3 py-2 rounded w-full text-black"
                    />
                  </label>

                  <label className="block">
                    Customer Email:
                    <input
                      type="email"
                      defaultValue={selectedOrder.customer?.email}
                      className="border px-3 py-2 rounded w-full text-black"
                    />
                  </label>

                  <label className="block">
                    Customer Phone:
                    <input
                      type="text"
                      defaultValue={selectedOrder.customer?.phone}
                      className="border px-3 py-2 rounded w-full text-black"
                    />
                  </label>

                  <label className="block">
                    Expiry Date:
                    <input
                      type="date"
                      defaultValue={selectedOrder.expiryDate}
                      className="border px-3 py-2 rounded w-full text-black"
                    />
                  </label>

                  <button className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg">
                    Save Changes
                  </button>
                </form>
              </div>
            )}

            {/* Add Customer Modal */}
            {/* Add Customer Modal */}
            {modalType === "addCustomer" && selectedOrder && (
              // <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50 p-4">
              //   <div className="bg-white p-6 rounded w-11/12 max-w-5xl shadow-lg">
              //     {/* Close Button */}
              //     <button
              //       className="absolute top-3 right-3 text-black text-2xl font-bold hover:text-red-500"
              //       onClick={() => setModalType(null)} // Close the modal
              //     >
              //       ×
              //     </button>
              <>
                {/* Disable background interaction */}
                <div className="fixed inset-0 bg-black bg-opacity-30 z-40" />
                <div
                  className="fixed inset-0 bg-black bg-opacity-30 z-50 flex justify-center items-center"
                  onClick={closeCustomerModal}
                >
                  <div
                    ref={modalRef}
                    onKeyDown={handleTabKey}
                    tabIndex={-1}
                    className="bg-white rounded w-8/12 max-w-5xl shadow-lg relative p-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Close Button at Top Right */}
                    <button
                      className="absolute top-3 right-3 text-black text-2xl font-bold hover:text-red-500"
                      onClick={closeCustomerModal}
                    >
                      ×
                    </button>
                    <h2 className="text-xl font-bold mb-4 text-black">
                      {customerType === "existing"
                        ? "Add Customer"
                        : customerType === "new"
                          ? "New Customer"
                          : "Customer"} {/* default if none selected */}
                    </h2>


                    <form className="space-y-6" onSubmit={handleSubmit}>
                      {/* Customer Type */}
                      <div className="flex gap-4 mb-4">
                        <label className="text-black flex items-center gap-1">
                          <input
                            type="radio"
                            value="existing"
                            checked={customerType === "existing"}
                            onChange={() => setCustomerType("existing")}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") setCustomerType("existing");
                            }}
                          />
                          Existing Customer
                        </label>
                        <label className="text-black flex items-center gap-1">
                          <input
                            type="radio"
                            value="new"
                            checked={customerType === "new"}
                            onChange={() => setCustomerType("new")}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") setCustomerType("new");
                            }}
                          />
                          New Customer
                        </label>
                      </div>

                      {customerType === "existing" && (
                        <div className="mb-4">
                          <label className="block mb-2 text-black">Select Customer</label>

                          <Select
                            showSearch
                            placeholder="Search by customer name or email"
                            className="w-full"
                            value={formData.client?._id || undefined}
                            onChange={(value) => {
                              const selected = client.find((c) => c._id === value) || null;
                              setFormData((prev) => ({ ...prev, client: selected }));
                            }}
                            filterOption={(input, option) =>
                              (option?.searchText ?? "")
                                .toLowerCase()
                                .includes(input.toLowerCase())
                            }
                            options={client.map((c) => ({
                              value: c._id,
                              label: `${c.c_company || c.c_name || "-"} (${Array.isArray(c.c_email)
                                  ? c.c_email.join(", ")
                                  : c.c_email
                                })`,
                              searchText: `
          ${c.c_company || ""}
          ${c.c_name || ""}
          ${Array.isArray(c.c_email)
                                  ? c.c_email.join(" ")
                                  : c.c_email || ""
                                }
        `,
                            }))}
                          />
                        </div>
                      )}





                      {/* New Customer Form */}
                      {customerType === "new" && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Salutation */}
                          <div>
                            {/* <label className="block text-gray-700 font-medium mb-2">Salutation</label> */}
                            <input
                              placeholder="Salutation"
                              type="text"
                              name="newCustomer.c_salutation"
                              value={formData.newCustomer?.c_salutation || ""}
                              onChange={handleInputChange}
                              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                            />
                          </div>




                          {/* Name */}
                          <div>
                            {/* <label className="block text-gray-700 font-medium mb-2">Name</label> */}
                            <input
                              placeholder="Name"
                              type="text"
                              name="newCustomer.c_name"
                              value={formData.newCustomer?.c_name || ""}
                              onChange={handleInputChange}
                              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                              required
                            />
                          </div>

                          {/* Emails as pills */}
                          <div className="col-span-3">
                            {/* <label className="block text-gray-700 font-medium mb-1">Emails</label> */}
                            <div className="flex flex-wrap gap-1 p-2 border rounded min-h-[40px] bg-gray-50">
                              {/* Map emails as pills */}
                              {formData.newCustomer?.c_email?.map((email: string, idx: number) => (
                                <div
                                  key={idx}
                                  className="flex flex-wrap items-center gap-2 p-2 border rounded bg-gray-50"
                                >
                                  {email}
                                  <button
                                    type="button"
                                    className="ml-2 text-red-500 font-bold"
                                    onClick={() =>
                                      setFormData((prev: any) => ({
                                        ...prev,
                                        newCustomer: {
                                          ...(prev.newCustomer || {}),
                                          c_email: (prev.newCustomer?.c_email || []).filter((email: string, i: number) => i !== idx), // Explicitly typing the parameters
                                        },
                                      }))
                                    }
                                  >
                                    ×
                                  </button>



                                </div>
                              ))}

                              {/* Input for adding new emails */}
                              <input
                                type="text"
                                placeholder="Add email"
                                className="flex-1 min-w-[120px] p-2 outline-none border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === ",") {
                                    e.preventDefault();
                                    const value = (e.currentTarget.value || "").trim();
                                    if (!value) return;

                                    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                                    if (!emailPattern.test(value)) {
                                      alert("Invalid email format!"); // You can replace this with custom validation message
                                      return;
                                    }

                                    setFormData((prev: any) => ({
                                      ...prev,
                                      newCustomer: {
                                        ...(prev.newCustomer || {}),
                                        c_email: prev.newCustomer?.c_email
                                          ? [...prev.newCustomer.c_email, value]
                                          : [value],
                                      },
                                    }));

                                    e.currentTarget.value = ""; // Clear input field after adding email
                                  }
                                }}
                              />
                            </div>
                          </div>
                          {/* Phone */}
                          <div className="flex gap-2 col-span-3 md:col-span-3">
                            {/* Country Code */}
                            <select
                              value={phoneCode}
                              onChange={(e) => {
                                const code = e.target.value; // <-- get the selected value
                                setPhoneCode(code); // update local phoneCode state
                                setFormData((prev) => ({
                                  ...prev,
                                  newCustomer: {
                                    ...(prev.newCustomer || {}),
                                    c_countryCode: code, // update formData
                                  },
                                }));
                              }}
                              className="w-24 border px-3 py-2 rounded-lg text-black"
                            >
                              {phoneCodes.map((code) => (
                                <option key={code} value={code}>
                                  {code}
                                </option>
                              ))}
                            </select>


                            {/* Phone Number */}
                            <input
                              type="text"
                              name="newCustomer.c_phone"
                              placeholder="Phone Number"
                              value={formData.newCustomer?.c_phone || ""}
                              inputMode="numeric"
                              pattern="[0-9]*"
                              maxLength={10}
                              onChange={(e) => {
                                // Only allow digits and max 10 characters
                                const numericValue = e.target.value.replace(/\D/g, "").slice(0, 10);
                                setFormData((prev) => ({
                                  ...prev,
                                  newCustomer: {
                                    ...(prev.newCustomer || {}),
                                    c_phone: numericValue,
                                  },
                                }));
                              }}
                              className="border px-3 py-2 rounded-lg text-black flex-1"
                            />
                          </div>



                          {/* Company */}
                          <div>
                            {/* <label className="block text-gray-700 font-medium mb-2">Company</label> */}
                            <input
                              placeholder="Company"
                              type="text"
                              name="newCustomer.c_company"
                              value={formData.newCustomer?.c_company || ""}
                              onChange={handleInputChange}
                              className="w-full p-2 border rounded"
                            />
                          </div>

                          {/* Address */}
                          <div>
                            {/* <label className="block text-gray-700 font-medium mb-2">Address</label> */}
                            <input
                              placeholder="Address"
                              type="text"
                              name="newCustomer.c_address"
                              value={formData.newCustomer?.c_address || ""}
                              onChange={handleInputChange}
                              className="w-full p-2 border rounded"
                            />
                          </div>

                          {/* Address 2 */}
                          <div >
                            {/* <label className="block text-gray-700 font-medium mb-2">Address 2</label> */}
                            <input
                              placeholder="Address 2"
                              type="text"
                              name="newCustomer.c_address2"
                              value={formData.newCustomer?.c_address2 || ""}
                              onChange={handleInputChange}
                              className="w-full p-2 border rounded"
                            />
                          </div>

                          {/* City */}
                          <div>
                            {/* <label className="block text-gray-700 font-medium mb-2">City</label> */}
                            <input
                              placeholder="City"
                              type="text"
                              name="newCustomer.c_city"
                              value={formData.newCustomer?.c_city || ""}
                              onChange={handleInputChange}
                              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                            />
                          </div>
                          {/* Country */}
                          <div>
                            {/* <label className="block text-gray-700 font-medium mb-2">Country</label> */}
                            <select
                              name="newCustomer.c_country"
                              value={formData.newCustomer?.c_country || ""}
                              onChange={async (e) => {
                                const countryCode = e.target.value;
                                setFormData((prev) => ({
                                  ...prev,
                                  newCustomer: { ...(prev.newCustomer || {}), c_country: countryCode, c_state: "" },
                                }));
                                if (countryCode) {
                                  try {
                                    const statesData = await fetchStatesByCountry(countryCode);
                                    setStates(statesData);
                                  } catch {
                                    setStates([]);
                                  }
                                } else setStates([]);
                              }}
                              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                            >
                              <option value="">-- Select Country --</option>
                              {countries.map((c) => (
                                <option key={c.code} value={c.code}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* State */}
                          <div>
                            {/* <label className="block text-gray-700 font-medium mb-2">State</label> */}
                            <select
                              name="newCustomer.c_state"
                              value={formData.newCustomer?.c_state || ""}
                              onChange={handleInputChange}
                              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                            >
                              <option value="">-- Select State --</option>
                              {states.map((s) => (
                                <option key={s.code} value={s.code}>
                                  {s.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          {/* ZipCode */}
                          <div>
                            {/* <label className="block text-gray-700 font-medium mb-2">Zip Code</label> */}
                            <input
                              placeholder="Zipcode"
                              type="text"
                              name="newCustomer.c_zipCode"
                              value={formData.newCustomer?.c_zipCode || ""}
                              onChange={handleInputChange}
                              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                            />
                          </div>

                          {/* GST */}
                          <div>
                            {/* <label className="block text-gray-700 font-medium mb-2">GST</label> */}
                            <input
                              placeholder="GST"
                              type="text"
                              name="newCustomer.c_gst"
                              value={formData.newCustomer?.c_gst || ""}
                              onChange={handleInputChange}
                              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                            />
                          </div>



                          {/* Bank Account Payment */}
                          <div>
                            {/* <label className="block text-gray-700 font-medium mb-2">Bank Account Payment</label> */}
                            <input
                              placeholder="Bank Account Payment"
                              type="text"
                              name="newCustomer.c_bankAccountPayment"
                              value={formData.newCustomer?.c_bankAccountPayment || ""}
                              onChange={handleInputChange}
                              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                            />
                          </div>

                          {/* Place of Contact */}
                          <div>
                            {/* <label className="block text-gray-700 font-medium mb-2">Place of Contact</label> */}
                            <input
                              placeholder="Place of Contact"
                              type="text"
                              name="newCustomer.c_placeOfContact"
                              value={formData.newCustomer?.c_placeOfContact || ""}
                              onChange={handleInputChange}
                              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                            />
                          </div>

                          {/* Place of Contact (State Code) */}
                          <div>
                            {/* <label className="block text-gray-700 font-medium mb-2">Place of Contact (State Code)</label> */}
                            <input
                              placeholder="Place of Contact (State Code)"
                              type="text"
                              name="newCustomer.c_placeOfContactWithStateCode"
                              value={formData.newCustomer?.c_placeOfContactWithStateCode || ""}
                              onChange={handleInputChange}
                              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                            />
                          </div>

                          {/* Portal Enabled */}
                          <div className="md:col-span-3 flex items-center gap-2">
                            <input
                              type="checkbox"
                              name="newCustomer.c_portalEnabled"
                              checked={!!formData.newCustomer?.c_portalEnabled}
                              onChange={handleInputChange}
                            />
                            <span>Portal Enabled</span>
                          </div>
                        </div>
                      )}

                      {/* Submit/Add Customer Button */}
                      <div className="mt-4 text-right">
                        <button
                          type="button"
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                          onClick={handleSubmit} // <-- call handleSubmit here
                        >
                          Save
                        </button>
                      </div>

                    </form>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
