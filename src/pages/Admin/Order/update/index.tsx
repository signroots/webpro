import React, { useState, useEffect } from "react";
import { useNavigate, useLocation,useParams } from "react-router-dom";
import axios from "axios";
import Select from "react-select";
import { notify } from "../../../../Common/Toastify";
import { fetchCountries, fetchStatesByCountry, fetchCountryCodes } from "../../Customer/api";
import { BiLabel } from "react-icons/bi";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
interface Status {
  _id: string;
  name: string;
}
interface EmailPlan {
  email_service: string;
  workspace_plan?: string;
  microsoft_plan?: string;
  registrationDate?: string;
  expiryDate?: string;
  users: number;
  type: string;
  email_flag?: boolean;
  google_email?: boolean;
  microsoft_email?: boolean;
  businessEmail?: boolean;
  email_service_id: string;
  planName?: string;
  selected_plan?: string;
  email_services?: string;
  emailTypeId?: string;
  plans?: { _id: string; plan: string }[];
  status?: string;
}

interface MsofficeOrderPlan {
  email_service_id?: string;
  emailType?: string;
  planId?: string;
  selected_plan?: string;
  planName?: string;
  plans?: { _id: string; plan: string }[];
  registrationDate?: string;
  expiryDate?: string;
  noOfUsers?: number;
  type?: string;
  msoffice_services_flag?: boolean;
  users?: string;
  email_service?: string;
}


interface OrderPlan {
  _id?: string;
  type: string;
  emailType?: string;
  selected_plan?: string;
  planId?: string;
  planName?: string;
  registrationDate?: string;
  expiryDate?: string;
  noOfUsers?: number;
  plans?: { _id: string; plan: string }[];
}

interface storagePlans {
  email_service?: string;
  selected_plan?: string;
  email_service_id?: string;
  plans?: { _id: string; plan: string }[]
  workspace_plan?: string;
  microsoft_plan?: string;
  registrationDate?: string;
  expiryDate?: string;
  planName?: string;
  users?: number;
  google_email?: boolean;
  microsoft_email?: boolean;
  businessEmail?: boolean;
  email_flag?: boolean;
  storage_services_flag?: boolean;
  type: string;
}


interface HostType {
  _id: string;
  type: string;
  isActive: boolean;
  createdAt: string;
  lockStatus?: string;
  managedBy?: string;
}

interface SubHostType {
  _id: string;
  name: string;
  hostType: string;
  isActive?: boolean;
  createdAt?: string;
}

interface Storage {
  _id: string;
  storage: string;
}
interface OrderForm {
  domainName: string;
  status?: string;
  managedBy: "Signroots" | "Customer";
  registrationDate?: string;
  expiryDate?: string;
  client?: string;
  plans?: any[];
  hosting_expiry_date?:string;
  hosting_registration_date?:string;
  newCustomer: {
    c_salutation?: string;
    c_name?: string;
    c_email?: string[];
    c_country_code?: string;
    c_phone?: string;
    c_mobilePhone?: string;
    c_company?: string;
    c_address?: string;
    c_address2?: string;
    c_city?: string;
    c_state?: string;
    c_country?: string;
    c_zipCode?: string;
    c_bankAccountPayment?: string;
    c_portalEnabled?: boolean;
    c_gst?: string;
    c_placeOfContact?: string;
    c_placeOfContactWithStateCode?: string;

  };
  storage: string;
  // hoststorageId: string | null;
  hosting_subplan: string;
  hosting_plan: string;
  email_service?: "Google Workspace" | "Microsoft 365" | "Business Email" | "Titan Email";
  // hosting?: boolean;
  // website_flag?: boolean;
  // ssl_flag?: boolean;
  // host_flag?: boolean;
  domainSource?: string | null;
  email_expiryDate?: string;
  users?: number;
  hostType?: any;
  hostSubType?: any;

  dns_flag?: boolean;
  //  hosttypeid?: string | null;
  // subHostTypeId?: string | null;
  hosttypeid: HostType | null;
  subHostTypeId: SubHostType | null;
  hoststorageId: Storage | null;
}

const UpdateOrder: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { orderId } = useParams<{ orderId: string }>();
  const inputClass =
    "w-full h-11 border border-gray-300 rounded-md px-3 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500";

  // const [confirmIndex, setConfirmIndex] = useState<number | null>(null);
  type RemoveTarget =
    "email" |
    "storage" |
    "msoffice" |
    "hosting" |
    "website" |
    "ssl";
  const [highlightedOrderId, setHighlightedOrderId] = useState<string | null | undefined>(null);
  const [domainSources, setDomainSources] = useState<any[]>([]);

  const [confirmRemove, setConfirmRemove] = useState<{
    index: number;
    type: RemoveTarget;
  } | null>(null);
  const [formData, setFormData] = useState<OrderForm>({
    domainName: "",
    managedBy: "Signroots",

    dns_flag: false,
    newCustomer: {
      c_salutation: "",
      c_name: "",
      c_email: [],
      c_country_code: "",
      c_phone: "",
      c_mobilePhone: "",
      c_company: "",
      c_address: "",
      c_address2: "",
      c_city: "",
      c_state: "",
      c_country: "",
      c_zipCode: "",
      c_portalEnabled: false,
      c_gst: "",
      c_placeOfContact: "",
      c_placeOfContactWithStateCode: "",
    },
    storage: "",

    hosting_subplan: "",
    hosting_plan: "",
    plans: [],
    domainSource: null,
    hosttypeid: null,
    subHostTypeId: null,
    hoststorageId: null,
  });

  const [loading, setLoading] = useState(false);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusList, setStatusList] = useState<Status[]>([]);
  const [domainStatus, setDomainStatus] = useState("");
  const [emailChecked, setEmailChecked] = useState(false);
  const [msofficeChecked, setMsofficeChecked] = useState(false)
  const [customerType, setCustomerType] = useState<"existing" | "new">("new");
  const [clients, setClients] = useState<any[]>([]);
  const [countries, setCountries] = useState<{ code: string; name: string }[]>([]);
  const [states, setStates] = useState<{ code: string; name: string }[]>([]);
  const [phoneCodes, setPhoneCodes] = useState<string[]>([]);
  const [phoneCode, setPhoneCode] = useState<string>("");
  const [emailPlans, setEmailPlans] = useState<EmailPlan[]>([
    {
      email_service: "",
      registrationDate: "",
      expiryDate: "",
      users: 1,
      google_email: false,
      microsoft_email: false,
      businessEmail: false,
      email_flag: false,
      plans: [],
      type: "",
      selected_plan: "",
      planName: "",
      email_service_id: "",
      status: "",
    },
  ]);
  const [storagePlans, setStoragePlans] = useState<storagePlans[]>([
    { email_service: "", workspace_plan: "", microsoft_plan: "", registrationDate: "", expiryDate: "", users: 1, type: "" },
  ]);
  const [emailTypes, setEmailTypes] = useState<{ _id: string; name: string }[]>([]);
  const [storageChecked, setStorageChecked] = useState(false);

  const [hostTypes, setHostTypes] = useState<HostType[]>([]);
  const [hostSubTypes, setHostSubTypes] = useState<SubHostType[]>([]);
  const [storages, setStorages] = useState<Storage[]>([]);

  const [msofficePlans, setMsofficePlans] = useState<any[]>([]);
  const [hostingPlans, setHostingPlans] = useState<any[]>([]);
  const [hostingChecked, setHostingChecked] = useState(false);
  const [websiteChecked, setWebsiteChecked] = useState(false);
  const [sslChecked, setSslChecked] = useState(false);

  // ------------------- FETCH EMAIL TYPES -------------------
  const fetchPlansByEmailType = async (
    typeId: string,
    index: number
  ) => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/plans/planlist/${typeId}`
      );

      const plans = res.data.data
        .filter((p: any) => p.isActive)
        .map((p: any) => ({
          _id: p._id,
          plan: p.plan,
        }));

      setMsofficePlans((prev) =>
        prev.map((item, i) =>
          i === index
            ? {
              ...item,
              plans: plans,
            }
            : item
        )
      );

    } catch (err) {
      console.error("Failed to fetch plans", err);
    }
  };
  // const fetchPlansByEmailType = async (typeId: string, index: number) => {
  //   try {
  //     const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/plans/planlist/${typeId}`);
  //     if (res.data.success) {
  //       setMsofficePlans((prev) => {
  //         const updated = [...prev];
  //         // updated[index].plans = res.data.data.filter((p: any) => p.isActive);
  //         // updated[index].msoffice_plan = "";  // reset plan
  //         return updated;
  //       });
  //     }
  //   } catch (err) {
  //     console.error("Failed to fetch plans", err);
  //   }
  // };
  // ------------------- FETCH STATUSES -------------------

  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/api/status`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = res.data?.data || res.data || [];

        setStatusList(data);
      } catch (err) {
        console.error("Failed to fetch statuses", err);
      }
    };

    fetchStatuses();
  }, []);
  useEffect(() => {
    if (highlightedOrderId) {
      const timer = setTimeout(() => setHighlightedOrderId(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [highlightedOrderId]);

  const addEmailPlan = () => {
    setEmailPlans((prev) => [
      ...prev,
      {
        email_service: "",
        email_service_id: "",
        planName: "",
        workspace_plan: "",
        microsoft_plan: "",
        registrationDate: "",
        expiryDate: "",
        users: 1,
        google_email: false,
        microsoft_email: false,
        businessEmail: false,
        plans: [],         // initially empty
        selected_plan: "",
        type: "email",     // <-- IMPORTANT: set type so backend validation passes
        status: "",
      },
    ]);
  };
  const addStoragePlan = () => {
    setStoragePlans((prev) => [
      ...prev,
      {
        email_service: "",
        email_service_id: "",
        planName: "",
        workspace_plan: "",
        microsoft_plan: "",
        registrationDate: "",
        expiryDate: "",
        users: 1,
        google_email: false,
        microsoft_email: false,
        businessEmail: false,
        plans: [],         // initially empty
        selected_plan: "",
        type: "storage",     // <-- IMPORTANT: set type so backend validation passes
      },
    ]);
  };
  const addMsofficePlan = () => {
    setMsofficePlans((prev) => [
      ...prev,
      {
        email_service: "",
        email_service_id: "",
        planName: "",
        workspace_plan: "",
        microsoft_plan: "",
        registrationDate: "",
        expiryDate: "",
        users: 1,
        google_email: false,
        microsoft_email: false,
        businessEmail: false,
        plans: [],         // initially empty
        selected_plan: "",
        type: "msoffice",     // <-- IMPORTANT: set type so backend validation passes
      },
    ]);
  };
  const removeEmailPlan = (index: number) => {
    setEmailPlans((prev) => prev.filter((_, i) => i !== index));
  };
  useEffect(() => {
    fetchCountryCodes()
      .then((codes) => {
        setPhoneCodes(codes);

        setPhoneCode((prev) => {
          // if API value exists, keep it
          if (formData.newCustomer.c_country_code) {
            return formData.newCustomer.c_country_code;
          }

          // else fallback to +91
          if (codes.includes("+91")) {
            setFormData((prevForm) => ({
              ...prevForm,
              newCustomer: {
                ...prevForm.newCustomer,
                c_country_code: "+91",
              },
            }));
            return "+91";
          }

          return prev;
        });
      })
      .catch(console.error);
  }, []);
  useEffect(() => {
    if (formData.newCustomer.c_country_code) {
      setPhoneCode(formData.newCustomer.c_country_code);
    }
  }, [formData.newCustomer.c_country_code]);
  const handleEmailPlanChange = async (
    index: number,
    key: keyof EmailPlan,
    value: any
  ) => {
    if (key === "email_service_id") {
      const typeObj = emailTypes.find((t: any) => t._id === value);
      if (!typeObj) {
        console.log("❌ No matching email type found");
        return;
      }

      let activePlans: any[] = [];
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/api/plans/planlist/${typeObj._id}`
        );
        activePlans = res.data.data.filter((p: any) => p.isActive);
      } catch (err) {
        console.log("❌ Error loading plans", err);
      }

      // Update state atomically
      setEmailPlans(prev => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          email_service_id: typeObj._id,
          email_service: typeObj.name,
          emailTypeId: typeObj._id, // ensures backend gets correct ID
          selected_plan: "",
          plans: activePlans,
          google_email: typeObj.name === "Google Workspace",
          microsoft_email: typeObj.name === "Microsoft 365",
          businessEmail: typeObj.name === "Business Email",
          type: "email",
        };
        return updated;
      });
      return;
    }

    // Update other fields
    setEmailPlans(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [key]: value,
      };
      return updated;
    });
  };


  const handleMsofficePlanChange = async (
    index: number,
    key: keyof MsofficeOrderPlan,
    value: any
  ) => {
    if (key === "email_service_id") {
      const typeObj = emailTypes.find((t: any) => t._id === value);
      if (!typeObj) {
        console.log("❌ No matching email type found");
        return;
      }

      let activePlans: { _id: string; plan: string }[] = [];
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/api/plans/planlist/${typeObj._id}`
        );
        activePlans = res.data.data
          .filter((p: any) => p.isActive)
          .map((p: any) => ({ _id: p._id, plan: p.plan }));
      } catch (err) {
        console.log("❌ Error loading plans", err);
      }

      // ✅ Use map to safely update state
      setMsofficePlans((prevPlans) =>
        prevPlans.map((plan, i) =>
          i === index
            ? {
              ...plan,
              email_service_id: value,
              plans: activePlans,      // assign fetched plans
              selected_plan: "",       // reset selected plan
              email_flag: !!value,
              google_email: typeObj.name === "Google Workspace",
              microsoft_email: typeObj.name === "Microsoft 365",
              businessEmail: typeObj.name === "Business Email",
            }
            : plan
        )
      );
    } else {
      // update other keys like selected_plan, users, etc.
      setMsofficePlans((prevPlans) =>
        prevPlans.map((plan, i) =>
          i === index ? { ...plan, [key]: value } : plan
        )
      );
    }
  };



  const handleStoragePlanChange = async (
    index: number,
    key: keyof storagePlans,
    value: any
  ) => {

    if (key === "email_service_id") {

      const typeObj = emailTypes.find(
        (t: any) => t._id === value
      );

      if (!typeObj) {
        console.log("❌ No matching storage type found");
        return;
      }


      let activePlans: { _id: string; plan: string }[] = [];

      try {

        const res = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/api/plans/planlist/${typeObj._id}`
        );


        activePlans = res.data.data
          .filter((p: any) => p.isActive)
          .map((p: any) => ({
            _id: p._id,
            plan: p.plan
          }));


      } catch (err) {

        console.log("❌ Error loading storage plans", err);

      }



      setStoragePlans(prev =>
        prev.map((plan, i) =>

          i === index
            ?
            {
              ...plan,

              email_service_id: value,

              email_service: typeObj.name,

              plans: activePlans,

              selected_plan: "",

              storage_services_flag: true,

              google_email:
                typeObj.name === "Google Workspace",

              microsoft_email:
                typeObj.name === "Microsoft 365",

              businessEmail:
                typeObj.name === "Business Email",

            }

            :

            plan

        )
      );


    }

    else {

      setStoragePlans(prev =>
        prev.map((plan, i) =>

          i === index
            ?
            {
              ...plan,
              [key]: value
            }
            :
            plan

        )
      );

    }

  };


  // ------------------- INPUT & CHECKBOX HANDLERS -------------------
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    // NEW CUSTOMER HANDLING (unchanged)
    if (customerType === "new" && name.startsWith("newCustomer.")) {
      const key = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        newCustomer: {
          ...(prev.newCustomer || {}),
          [key]: value,
        },
      }));
    }
    // DOMAIN SOURCE LOGIC
    else if (name === "domainSource") {

      const selectedSource = domainSources.find(
        (source: any) => source._id === value
      );

      setFormData((prev) => ({
        ...prev,
        domainSource: value,

        // only Cloudflare enable DNS flag
        dns_flag:
          selectedSource?.name?.toLowerCase() === "cloudflare"
            ? prev.dns_flag
            : false,
      }));

    }
    // DEFAULT
    else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };
  useEffect(() => {

    if (!domainSources.length) return;


    if (formData.managedBy === "Signroots" ||
      formData.managedBy === "Customer") {

      setFormData(prev => ({
        ...prev,
        domainSource: prev.domainSource || "",
        dns_flag: false
      }));

    }

  }, [formData.managedBy, domainSources]);

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;

    switch (name) {
      case "email_services":
        setEmailChecked(checked);
        if (checked && emailPlans.length === 0) addEmailPlan();
        break;

      case "storage_services":
        setStorageChecked(checked);
        if (checked && storagePlans.length === 0) addStoragePlan(); // <-- use storagePlans
        break;

      case "msoffice_services":
        setMsofficeChecked(checked);
        if (checked && msofficePlans.length === 0) addMsofficePlan();
        break;

      default:
        setFormData((prev) => ({ ...prev, [name]: checked }));
    }
  };
  useEffect(() => {
    const countryCode = formData.newCustomer.c_country;
    if (!countryCode) return;

    fetchStatesByCountry(countryCode)
      .then((data) => {
        setStates(data);

        // ✅ IMPORTANT: re-select state after states are loaded
        const existingState = formData.newCustomer.c_state;

        if (existingState) {
          const match = data.find(
            (s: any) =>
              s.name === existingState ||
              s._id === existingState ||
              s.code === existingState
          );

          if (match) {
            setFormData(prev => ({
              ...prev,
              newCustomer: {
                ...prev.newCustomer,
                c_state: match.name, // or match.code / match._id
              },
            }));
          }
        }
      })
      .catch(console.error);
  }, [formData.newCustomer.c_country]);

  const handleCountryChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const countryCode = e.target.value;
    handleInputChange(e);
    if (countryCode) {
      const data = await fetchStatesByCountry(countryCode);
      setStates(data);
    } else {
      setStates([]);
    }
  };
  // ------------------- INITIAL FETCHES -------------------
  useEffect(() => {
    const fetchEmailTypes = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/typeemail`);
        if (res.data.success) setEmailTypes(res.data.data.filter((t: any) => t.isActive));
      } catch (err) {
        console.error(err);
      }
    };

    const fetchHostTypes = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/hosttypes`);
        setHostTypes(res.data.data || []);
      } catch (err) {
        console.error(err);
      }
    };

    fetchEmailTypes();
    fetchHostTypes();
  }, []);

  useEffect(() => {
    const fetchDomainSources = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/api/domain-sources`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setDomainSources(res.data.data || []);

      } catch (error) {
        console.error("Failed to fetch domain sources", error);
      }
    };

    fetchDomainSources();
  }, []);


  // ------------------- FETCH ORDER DATA -------------------
  // useEffect to fetch order and initialize formData
  useEffect(() => {
    if (!orderId) return setLoadingOrder(false);

    const fetchOrder = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/api/orders/${orderId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        const order = res.data.data || res.data;

        const existingDomainStatus =
          typeof order.status === "object"
            ? order.status?._id
            : order.status || "";

        setDomainStatus(existingDomainStatus);
        const hostingPlan = order.plans?.some(
          (p: any) => p.type === "hosting"
        );

        const websitePlan = order.plans?.some(
          (p: any) => p.type === "website"
        );

        const sslPlan = order.plans?.some(
          (p: any) => p.type === "ssl"
        );
        const emailOnly = order.plans?.filter(
          (p: any) => p.serviceType === "email" || p.type === "email"
        ) || [];

        const storageOnly = order.plans?.filter(
          (p: any) => p.serviceType === "storage" || p.type === "storage"
        ) || [];

        const msofficeOnly = order.plans?.filter(
          (p: any) => p.serviceType === "msoffice" || p.type === "msoffice"
        ) || [];
        const hostingOnly = order.plans?.filter(
          (p: any) => p.type === "hosting" || p.serviceType === "hosting"
        ) || [];
        setEmailChecked(emailOnly.length > 0);
        setStorageChecked(storageOnly.length > 0);
        setMsofficeChecked(msofficeOnly.length > 0);
        setHostingChecked(hostingPlan);
        setWebsiteChecked(websitePlan);
        setSslChecked(sslPlan);
        setCustomerType(order.client ? "existing" : "new");
        setCustomerType(order.client ? "existing" : "new");

        // Extract hosting details safely
        const hostingPlanData =
          order.plans?.find(
            (p: any) =>
              p.type === "hosting" ||
              p.serviceType === "hosting"
          );


        const hostTypeObj =
          hostingPlanData?.hostType || null;


        const subHostObj =
          hostingPlanData?.hostSubType || null;


        const storageObj =
          hostingPlanData?.storage || null;
        // const emailOnly = order.plans?.filter((p: OrderPlan) => p.type === "email") || [];
        // const storageOnly = order.plans?.filter((p: OrderPlan) => p.type === "storage") || [];
        // const msofficeOnly = order.plans?.filter((p: OrderPlan) => p.type === "msoffice") || [];

        // Set Email Plans
        // When mapping emailOnly
        setEmailPlans(
          emailOnly.map((p: any) => {
            // find the corresponding email type object in emailTypes
            const typeObj = emailTypes.find((t: any) => t.name === p.emailType || t._id === p.emailType);

            return {
              email_service: typeObj?.name || p.emailType,    // name to display
              email_service_id: typeObj?._id || "",          // ID for <select>
              selected_plan: p.planId || "",
              registrationDate: p.registrationDate?.slice(0, 10),
              expiryDate: p.expiryDate?.slice(0, 10),
              users: p.noOfUsers || 1,
              type: p.type || "email",
              plans: [
                {
                  _id: p.planId,
                  plan: p.planName
                }
              ],
              google_email: typeObj?.name === "Google Workspace",
              microsoft_email: typeObj?.name === "Microsoft 365",
              businessEmail: typeObj?.name === "Business Email",
              email_flag: true,

            };
          })
        );



        // Set Storage Plans
        setStoragePlans(
          storageOnly.map((p: OrderPlan) => ({
            email_service: p.emailType,
            selected_plan: p.planId,
            registrationDate: p.registrationDate?.slice(0, 10),
            expiryDate: p.expiryDate?.slice(0, 10),
            users: p.noOfUsers,
            type: p.type,
            plans: [], // ❌ currently empty, must fetch plans for this type
          }))
        );


        // Set MS Office Plans
        setMsofficePlans(
          msofficeOnly.map((p: any) => ({
            email_service: p.emailType,
            selected_plan: p.planId,
            planName: p.planName, // ✅ Show plan name in UI
            registrationDate: p.registrationDate?.slice(0, 10),
            expiryDate: p.expiryDate?.slice(0, 10),
            users: p.noOfUsers, // ✅ Correct user count (1)
            type: p.type,
          }))
        );

        setHostingPlans(
  hostingOnly.map((p: any) => ({
    type: "hosting",

    hosting_plan:
      p.hostingType?._id ||
      p.hostType?._id ||
      "",

    hosting_subplan:
      p.hostingSubType?._id ||
      p.hostSubType?._id ||
      "",

    storage:
      p.storage?._id ||
      "",

    registrationDate:
      p.registrationDate?.slice(0, 10) || "",

    expiryDate:
      p.expiryDate?.slice(0, 10) || "",

    users:
      p.noOfUsers || 1,
  }))
);


        // Set formData
        setFormData((prev) => ({
          ...prev,
          domainName: order.domainName || "",
          dns_flag: order.dns_flag,
          managedBy: order.managedBy || "Signroots",
          registrationDate: order.registrationDate?.slice(0, 10) || "",
          expiryDate: order.expiryDate?.slice(0, 10) || "",
          status: order.status || "Active",
          client: order.client?._id || "",
          newCustomer: {
            ...prev.newCustomer,

            c_salutation: order.client?.c_salutation || "",
            c_name: order.client?.c_name || "",
            c_email: order.client?.c_email || [],
            c_country_code: order.client?.c_countryCode || "+91",
            c_phone: order.client?.c_phone || "",
            c_mobilePhone: order.client?.c_phone || " ",
            c_company: order.client?.c_company || "",
            c_address: order.client?.c_address || "",
            c_address2: order.client?.c_address2 || "",
            c_city: order.client?.c_city || "",

            // ⭐ IMPORTANT PART
            c_country: order.client?.c_country?._id || "",
            c_state: order.client?.c_state?._id || "",

            c_zipCode: order.client?.c_zipCode || "",
            c_bankAccountPayment: order.client?.c_bankAccountPayment || "",
            c_portalEnabled: order.client?.c_portalEnabled || false,
            c_gst: order.client?.c_gst || "",
            c_placeOfContact: order.client?.c_placeOfContact || "",
            c_placeOfContactWithStateCode:
              order.client?.c_placeOfContactWithStateCode || "",
          },

          // hosting: !!order.hosting,
          // website_flag: !!order.website_flag,
          // ssl_flag: !!order.ssl_flag,
          // host_flag: !!order.host_flag,

          domainSource:
            order.domainSource?._id ||
            order.domainSource ||
            "",
          email_expiryDate: order.email_expiryDate?.slice(0, 10) || "",
          users: order.users || 1,
          plans: order.plans || [],

          // hosttypeid: hostTypeObj,
          // hosting_plan: hostTypeObj?._id || "",
          // subHostTypeId: subHostObj,
          // hosting_subplan: subHostObj?._id || "",
          // hoststorageId: storageObj,
          // storage: storageObj?._id || "",
        }));

        // Initially populate host types dropdown
        const allHostTypes = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/hosttypes`);
        setHostTypes(allHostTypes.data.data || []);

        // If a host type is selected, fetch its subtypes and storage
        if (hostTypeObj?._id) {

          setFormData(prev => ({
            ...prev,

            hosttypeid: hostTypeObj,
            hosting_plan: hostTypeObj._id,

            subHostTypeId: subHostObj,
            hosting_subplan: subHostObj?._id || "",

            hoststorageId: storageObj,
            storage: storageObj?._id || "",
          }));


          fetchSubTypesAndStorage(
            hostTypeObj._id,
            subHostObj?._id,
            storageObj?._id
          );

        }
        // ---------------- Email Plans ----------------
        if (order.email_flag && order.plans && order.plans.length > 0 && emailTypes.length > 0) {
          const updatedPlans = await Promise.all(
            order.plans
              .filter((p: any) => p.type === "email")
              .map(async (p: any) => {
                // ✅ Find the email type object by ID or name
                const typeObj = emailTypes.find(
                  (t: any) =>
                    t._id === p.emailTypeId ||
                    t._id === p.email_service_id ||
                    t.name === p.emailType
                );

                let plans: any[] = [];
                if (typeObj) {
                  try {
                    const planRes = await axios.get(
                      `${import.meta.env.VITE_API_BASE_URL}/api/plans/planlist/${typeObj._id}`
                    );
                    plans = planRes.data.data.filter((pl: any) => pl.isActive);

                    // Ensure selected plan exists in plans array
                    if (!plans.some((pl) => pl._id === p.planId) && p.planId && p.planName) {
                      plans.unshift({
                        _id: p.planId,
                        plan: p.planName,
                        planName: p.planName
                      });
                    }
                  } catch (err) {
                    console.error("Failed to fetch plans for email type", err);
                  }
                }

                return {
                  email_service: typeObj?.name || p.emailType || "", // ✅ display name
                  email_service_id:
                    typeObj?._id ||
                    p.emailTypeId ||
                    p.email_service_id ||
                    "",// ✅ ID for <select>
                  selected_plan: p.planId || "",
                  registrationDate: p.registrationDate?.slice(0, 10) || "",
                  expiryDate: p.expiryDate?.slice(0, 10) || "",
                  users: p.noOfUsers || 1,
                  // google_email: typeObj?.name === "Google Workspace",
                  // microsoft_email: typeObj?.name === "Microsoft 365",
                  // businessEmail: typeObj?.name === "Business Email",
                  email_flag: true,
                  type: p.type || "email",
                  plans,
                  status:
                    typeof p.status === "object"
                      ? p.status?._id
                      : p.status || "",
                };
              })
          );

          setEmailPlans(updatedPlans);
        }

        // ---------------- Storage Plans ----------------
        if (order.plans && order.plans.length > 0) {
          const updatedStoragePlans = await Promise.all(
            order.plans
              .filter((p: any) => p.type === "storage")
              .map(async (p: any) => {
                const typeObj = emailTypes.find(
                  (t: any) =>
                    t.name === p.emailType ||
                    t._id === p.emailTypeId ||
                    t._id === p.email_service_id
                );
                // Find the type object if needed (you may have a storageTypes array similar to emailTypes)
                let plans: any[] = [];
                if (typeObj) {
                  try {
                    // Example: fetch plans by storage type ID or emailType if needed
                    const res = await axios.get(
                      `${import.meta.env.VITE_API_BASE_URL}/api/plans/planlist/${typeObj._id}` // adjust this if storage type API differs
                    );
                    plans = res.data.data.filter((pl: any) => pl.isActive);

                    // Make sure the selected plan is included
                    const exists = plans.some((pl) => pl._id === p.planId);
                    if (!exists && p.planId && p.planName) {
                      plans.unshift({
                        _id: p.planId,
                        plan: p.planName,
                        planName: p.planName
                      });
                    }
                  } catch (err) {
                    console.error("Failed to fetch storage plans", err);
                  }
                }
                return {
                  email_service: typeObj?.name || p.emailType || "", // ✅ display name
                  email_service_id:
                    typeObj?._id ||
                    p.emailTypeId ||
                    p.email_service_id ||
                    "",// ✅ ID for <select>
                  selected_plan: p.planId || "",
                  registrationDate: p.registrationDate?.slice(0, 10) || "",
                  expiryDate: p.expiryDate?.slice(0, 10) || "",
                  users: p.noOfUsers || 1,
                  type: p.type || "storage",
                  plans, // ✅ include all plans including selected
                };
              })
          );

          setStoragePlans(updatedStoragePlans);
        }
        // ---------------- MS Office Plans ----------------
        if (order.plans && order.plans.length > 0) {
          const updatedMsofficePlans = await Promise.all(
            order.plans
              .filter((p: any) => p.type === "msoffice")
              .map(async (p: any) => {
                // Find the MS Office type object
                const typeObj = emailTypes.find(
                  (t: any) =>
                    t.name === p.emailType ||
                    t._id === p.emailTypeId ||
                    t._id === p.email_service_id
                );// or use a msofficeTypes array if needed

                // Fetch plans for this MS Office type
                let plans: any[] = [];
                if (typeObj) {
                  try {
                    const planRes = await axios.get(
                      `${import.meta.env.VITE_API_BASE_URL}/api/plans/planlist/${typeObj._id}`
                    );
                    plans = planRes.data.data.filter((pl: any) => pl.isActive);

                    // Ensure the selected plan is included
                    const exists = plans.some((pl) => pl._id === p.planId);
                    if (!exists && p.planId && p.planName) {
                      plans.unshift({
                        _id: p.planId,
                        plan: p.planName,
                        planName: p.planName
                      });
                    }
                  } catch (err) {
                    console.error("Failed to fetch MS Office plans", err);
                  }
                }

                return {
                  email_service: typeObj?.name || p.emailType || "", // ✅ display name
                  email_service_id:
                    typeObj?._id ||
                    p.emailTypeId ||
                    p.email_service_id ||
                    "",// ✅ ID for <select>
                  selected_plan: p.planId || "", // Must match option value
                  registrationDate: p.registrationDate?.slice(0, 10) || "",
                  expiryDate: p.expiryDate?.slice(0, 10) || "",
                  users: p.noOfUsers || 1,
                  microsoft_email: p.emailType === "Microsoft 365",
                  email_flag: true,
                  type: p.type || "msoffice",
                  plans: plans, // ✅ all plans including selected plan
                };
              })
          );

          setMsofficePlans(updatedMsofficePlans);
        }
      } catch (err) {
        console.error("Failed to fetch order data", err);
        setError("Failed to fetch order data");
      } finally {
        setLoadingOrder(false);
      }
    };

    fetchOrder();
  }, [orderId, emailTypes]);

  // Function to fetch subtypes and storage when host type changes
  const fetchSubTypesAndStorage = async (
    hostTypeId: string,
    selectedSubId?: string,
    selectedStorageId?: string
  ) => {
    try {
      const [subTypeRes, storageRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/hostsubtype/subhosttypelist/${hostTypeId}`),
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/storage/storagelist/${hostTypeId}`),
      ]);

      setHostSubTypes(subTypeRes.data.data || []);
      setStorages(storageRes.data.data || []);

      // Optionally set previously selected sub type and storage
      const subObj = subTypeRes.data.data.find((s: any) => s._id === selectedSubId) || null;
      const storageObj = storageRes.data.data.find((s: any) => s._id === selectedStorageId) || null;

      setFormData((prev) => ({
        ...prev,
        subHostTypeId: subObj,
        hosting_subplan: subObj?._id || "",
        hoststorageId: storageObj,
        storage: storageObj?._id || "",
      }));
    } catch (err) {
      console.error("Failed to fetch host subtypes or storages", err);
      setHostSubTypes([]);
      setStorages([]);
    }
  };

  // Handler for Host Type change
  const handleHostTypeChange = async (
  index: number,
  hostTypeId: string
) => {
  const selectedHostType =
    hostTypes.find((ht: any) => ht._id === hostTypeId) || null;

  // Update hosting plan
  setHostingPlans((prev) =>
    prev.map((plan, i) =>
      i === index
        ? {
            ...plan,
            hosting_plan: hostTypeId,
            hosting_subplan: "",
            storage: "",
          }
        : plan
    )
  );

  if (hostTypeId) {
    await fetchSubTypesAndStorage(hostTypeId);
  } else {
    setHostSubTypes([]);
    setStorages([]);
  }
};


  // ------------------- FETCH CLIENTS -------------------
  useEffect(() => {
    const fetchClients = async () => {
      if (customerType === "existing") {
        try {
          const token = localStorage.getItem("token"); // നിങ്ങളുടെ token key

          const res = await axios.get(
            `${import.meta.env.VITE_API_BASE_URL}/api/orders/existing_customers`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          setClients(res.data.data);
        } catch (err) {
          console.error(err);
        }
      }
    };

    fetchClients();
  }, [customerType]);

  // ------------------- FETCH COUNTRIES -------------------
  useEffect(() => {
    const loadCountries = async () => {
      try {
        const data = await fetchCountries();
        setCountries(data);
      } catch (err) {
        console.error(err);
      }
    };
    loadCountries();
  }, []);

  // ------------------- HANDLE SUBMIT -------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // create initial payload
      const payload: any = { ...formData, is_customer: customerType === "existing", domainSource: formData.domainSource || null };

      if (customerType === "existing") delete payload.newCustomer;
      else delete payload.client;
      if (payload.newCustomer) {
        if (payload.newCustomer.c_mobilePhone && !payload.newCustomer.c_phone) {
          payload.newCustomer.c_phone = payload.newCustomer.c_mobilePhone;
        }
        // delete payload.newCustomer.c_mobilePhone;
      }
      // if (payload.domainSource === "") {
      //   payload.domainSource = null;
      // }

      // combine all plans
      const combinedPlans: any[] = [];

      // EMAIL PLANS
      if (emailChecked && emailPlans.length > 0) {
        emailPlans.forEach((plan) => {
          combinedPlans.push({
            planId: plan.selected_plan,
            emailTypeId: plan.email_service_id,
            emailType: plan.email_service,
            planName: plan.planName,
            registrationDate: plan.registrationDate,
            expiryDate: plan.expiryDate,
            noOfUsers: plan.users,
            type: plan.type || "email",
            google_email: plan.google_email,
            microsoft_email: plan.microsoft_email,
            businessEmail: plan.businessEmail,
            email_flag: true, // individual plan flag

          });
        });
      }

      // STORAGE PLANS
      if (storageChecked && storagePlans.length > 0) {
        storagePlans.forEach((plan) => {
          combinedPlans.push({
            planId: plan.selected_plan,
            emailTypeId: plan.email_service_id,
            emailType: plan.email_service,
            planName: plan.planName,
            registrationDate: plan.registrationDate,
            expiryDate: plan.expiryDate,
            noOfUsers: plan.users,
            type: plan.type || "storage",
            google_email: plan.google_email,
            microsoft_email: plan.microsoft_email,
            businessEmail: plan.businessEmail,
            storage_services_flag: true,
          });
        });
      }

      // MS OFFICE PLANS
      if (msofficeChecked && msofficePlans.length > 0) {
        msofficePlans.forEach((plan) => {
          combinedPlans.push({
            planId: plan.selected_plan,
            emailTypeId: plan.email_service_id,
            emailType: plan.email_service,
            planName: plan.planName,
            registrationDate: plan.registrationDate,
            expiryDate: plan.expiryDate,
            noOfUsers: plan.users,
            type: plan.type || "msoffice",
            msoffice_services_flag: true,
          });
        });
      }
      // HOSTING PLAN
      // HOSTING PLANS
if (hostingChecked && hostingPlans.length > 0) {
  hostingPlans.forEach((plan) => {
    combinedPlans.push({
      type: "hosting",

      hostingType: plan.hosting_plan || "",

      hostingSubType: plan.hosting_subplan || "",

      storage: plan.storage || "",

      registrationDate:
        plan.registrationDate || "",

      expiryDate:
        plan.expiryDate || "",

      noOfUsers:
        plan.users || 1,
    });
  });
}

      // WEBSITE SERVICE
      if (websiteChecked) {
        combinedPlans.push({
          planId: null,
          emailTypeId: null,
          emailType: "",
          planName: "",
          registrationDate: formData.registrationDate,
          expiryDate: formData.expiryDate,
          noOfUsers: 1,
          type: "website",
        });
      }


      // SSL SERVICE
      if (sslChecked) {
        combinedPlans.push({
          planId: null,
          emailTypeId: null,
          emailType: "",
          planName: "",
          registrationDate: formData.registrationDate,
          expiryDate: formData.expiryDate,
          noOfUsers: 1,
          type: "ssl",
        });
      }

      // assign combined plans
      payload.plans = combinedPlans;

      // ✅ update top-level flags based on current plans
      payload.email_flag = combinedPlans.some(p => p.type === "email");
      payload.storage_services_flag = combinedPlans.some(p => p.type === "storage");
      payload.msoffice_services_flag = combinedPlans.some(p => p.type === "msoffice");
      const selectedDomainSource = domainSources.find(
        (source) => source._id === formData.domainSource
      );

      //      if (!payload.domainSource) {
      //   delete payload.domainSource;
      // }

      // send update request
      const res = await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/orders/${orderId}`, payload);

     if (res.data?.success === true) {
  const from = location.state?.from;

  if (from === "renewal") {
    navigate("/admin/renew-list");
  } else if (from === "dns") {
    navigate("/admin/dns-order");
  } else if (from === "customer") {
    navigate(`/admin/orders/customer/${location.state?.customerId}`);
  } else {
    navigate("/admin/orders");
  }

  notify("Order Updated Successfully...", "success");
}


       else {
        alert("❌ Failed to update order");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to update order");
    } finally {
      setLoading(false);
    }
  };

  const confirmRemovePlan = () => {
    if (!confirmRemove) return;

    const { index, type } = confirmRemove;

    if (type === "email") {
      setEmailPlans(prev => {
        const updated = prev.filter((_, i) => i !== index);
        setEmailChecked(updated.length > 0); // uncheck if no email plans left
        return updated;
      });
    }

    if (type === "storage") {
      setStoragePlans(prev => {
        const updated = prev.filter((_, i) => i !== index);
        setStorageChecked(updated.length > 0); // uncheck if no storage plans left
        return updated;
      });
    }

    if (type === "msoffice") {
      setMsofficePlans(prev => {
        const updated = prev.filter((_, i) => i !== index);
        setMsofficeChecked(updated.length > 0); // uncheck if no MS Office plans left
        return updated;
      });
    }

    setConfirmRemove(null);
  };

  // useEffect(() => {
  //   if (formData.domainSource === "Hostinger") {
  //     setFormData((prev) => ({
  //       ...prev,
  //       dns_flag: true,
  //     }));
  //   }
  // }, [formData.domainSource]);


  if (loadingOrder) return <p>Loading order data...</p>;
  return (
    <div className="min-h-screen bg-gray-100 p-1">
      <div className="max-w-6xl mx-auto bg-white shadow-md rounded-lg p-6">
        <h1 className="text-3xl font-bold mb-6 text-gray-700">Update Order</h1>

        {error && (
          <p className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4">{error}</p>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Customer Type */}
          <div>
            <label className="mr-4 text-black">
              <input
                type="radio"
                value="existing"
                checked={customerType === "existing"}
                onChange={() => setCustomerType("existing")}
              />{" "}
              Existing Customer
            </label>
            <label className="ml-4 text-black">
              <input
                type="radio"
                value="new"
                checked={customerType === "new"}
                onChange={() => setCustomerType("new")}
              />{" "}
              New Customer
            </label>
          </div>

          {/* Existing Customer */}
          {customerType === "existing" && (
            <div className="mb-4">
              <label className="block mb-2 text-black">Select Customer</label>
              <Select
                options={clients.map((c: any) => ({
                  value: c._id,
                  label: `${c.c_company} (${c.c_email.join(", ")})`, // support multiple emails
                }))}
                value={clients
                  .filter((c: any) => c._id === formData.client)
                  .map((c: any) => ({
                    value: c._id,
                    label: `${c.c_company} (${c.c_email.join(", ")})`,
                  }))}
                onChange={(selectedOption: any) => {
                  // create a fake event compatible with your existing handler
                  handleInputChange({
                    target: {
                      name: "client",
                      value: selectedOption ? selectedOption.value : "",
                    },
                  } as React.ChangeEvent<HTMLInputElement | HTMLSelectElement>);
                }}
                isClearable
                placeholder="-- Select Customer --"
              />
            </div>
          )}
          {/* New Customer */}
          {/* New Customer */}
          {customerType === "new" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              {/* Salutation */}
              <input
                placeholder="Salutation"
                name="newCustomer.c_salutation"
                value={formData.newCustomer.c_salutation || ""}
                onChange={handleInputChange}
                className={inputClass}
              />

              {/* Name */}
              <input
                placeholder="Name"
                name="newCustomer.c_name"
                value={formData.newCustomer.c_name || ""}
                onChange={handleInputChange}
                className={inputClass}
              />

              {/* Email (FULL ROW) */}
              <div className="md:col-span-3">
                <div className="flex flex-wrap items-center gap-2 p-2 h-11 border border-gray-300 rounded-md bg-gray-50 focus-within:ring-2 focus-within:ring-blue-500">
                  {(formData.newCustomer.c_email ?? [])
                    .map((em) => em.trim())
                    .filter(Boolean)
                    .map((em) => (
                      <div
                        key={em}
                        className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                      >
                        <span className="mr-2">{em}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              newCustomer: {
                                ...prev.newCustomer,
                                c_email: prev.newCustomer.c_email?.filter(
                                  (e) => e !== em
                                ),
                              },
                            }))
                          }
                          className="font-bold"
                        >
                          ×
                        </button>
                      </div>
                    ))}

                  <input
                    type="text"
                    placeholder="Add email"
                    className="flex-1 min-w-[120px] bg-transparent outline-none text-sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        const value = e.currentTarget.value.trim();
                        if (!value) return;
                        const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
                        if (!ok) return alert("Invalid email");
                        setFormData((prev) => ({
                          ...prev,
                          newCustomer: {
                            ...prev.newCustomer,
                            c_email: [
                              ...(prev.newCustomer.c_email ?? []),
                              value,
                            ],
                          },
                        }));
                        e.currentTarget.value = "";
                      }
                    }}
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="md:col-span-3 flex gap-2">
                <select
                  value={phoneCode}
                  onChange={(e) => {
                    setPhoneCode(e.target.value);
                    setFormData((prev) => ({
                      ...prev,
                      newCustomer: {
                        ...prev.newCustomer,
                        c_country_code: e.target.value,
                      },
                    }));
                  }}
                  className="h-11 w-24 border border-gray-300 rounded-md px-2 text-sm focus:ring-2 focus:ring-blue-500"
                >
                  {phoneCodes.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>

                <input
                  placeholder="Phone Number"
                  name="newCustomer.c_mobilePhone"
                  value={formData.newCustomer.c_mobilePhone || ""}
                  onChange={handleInputChange}
                  maxLength={10}
                  className={`${inputClass} flex-1`}
                />
              </div>

              {/* Company */}
              <input
                placeholder="Company"
                name="newCustomer.c_company"
                value={formData.newCustomer.c_company || ""}
                onChange={handleInputChange}
                className={inputClass}
              />

              {/* Address */}
              <input
                placeholder="Address"
                name="newCustomer.c_address"
                value={formData.newCustomer.c_address || ""}
                onChange={handleInputChange}
                className={inputClass}
              />

              {/* Address 2 */}
              <input
                placeholder="Address 2"
                name="newCustomer.c_address2"
                value={formData.newCustomer.c_address2 || ""}
                onChange={handleInputChange}
                className={inputClass}
              />

              {/* City */}
              <input
                placeholder="City"
                name="newCustomer.c_city"
                value={formData.newCustomer.c_city || ""}
                onChange={handleInputChange}
                className={inputClass}
              />

              {/* Country */}
              <select
                name="newCustomer.c_country"
                value={formData.newCustomer.c_country}
                onChange={handleCountryChange}
                className={inputClass}
              >
                <option value="">-- Select Country --</option>
                {countries.map((c) => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>

              {/* State */}
              <select
                name="newCustomer.c_state"
                value={formData.newCustomer.c_state || ""}
                onChange={handleInputChange}
                className={inputClass}
              >
                <option value="">-- Select State --</option>
                {states.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.name}
                  </option>
                ))}
              </select>



              {/* Zip */}
              <input
                placeholder="Zipcode"
                name="newCustomer.c_zipCode"
                value={formData.newCustomer.c_zipCode || ""}
                onChange={handleInputChange}
                className={inputClass}
              />

              {/* GST */}
              <input
                placeholder="GST"
                name="newCustomer.c_gst"
                value={formData.newCustomer.c_gst || ""}
                onChange={handleInputChange}
                className={inputClass}
              />

              {/* Bank */}
              <input
                placeholder="Bank Account Payment"
                name="newCustomer.c_bankAccountPayment"
                value={formData.newCustomer.c_bankAccountPayment || ""}
                onChange={handleInputChange}
                className={inputClass}
              />

              {/* Place of Contact */}
              <input
                placeholder="Place of Contact"
                name="newCustomer.c_placeOfContact"
                value={formData.newCustomer.c_placeOfContact || ""}
                onChange={handleInputChange}
                className={inputClass}
              />

              {/* Place of Contact State */}
              <input
                placeholder="Place of Contact (State Code)"
                name="newCustomer.c_placeOfContactWithStateCode"
                value={formData.newCustomer.c_placeOfContactWithStateCode || ""}
                onChange={handleInputChange}
                className={inputClass}
              />
            </div>
          )}

          {/* Domain Details */}
          <h2 className="text-xl font-semibold underline text-indigo-600 mb-3">
            Domain Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-gray-700 font-medium mb-2">Domain Name</label>
              <input
                type="text"
                name="domainName"
                value={formData.domainName}
                onChange={handleInputChange}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">Managed By</label>
              <select
                name="managedBy"
                value={formData.managedBy}
                onChange={handleInputChange}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">-- Select Managed By --</option>
                <option value="Signroots">Signroots</option>
                <option value="Customer">Customer</option>
              </select>
            </div>
            {/* Registrar / Domain Source */}
            {(formData.managedBy === "Signroots" ||
              formData.managedBy === "Customer") && (
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Registrar
                  </label>

                  <select
                    name="domainSource"
                    value={formData.domainSource || ""}
                    onChange={handleInputChange}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="">-- Select Registrar --</option>

                    {domainSources.map((source) => (
                      <option key={source._id} value={source._id}>
                        {source.name}
                      </option>
                    ))}
                  </select>


                  {/* DNS Flag */}
                  {domainSources.some(
                    (source) =>
                      source._id === formData.domainSource &&
                      source.name.toLowerCase() === "cloudflare"
                  ) && (
                      <div className="mt-4 flex items-center gap-2">
                        <input
                          type="checkbox"
                          name="dns_flag"
                          checked={formData.dns_flag || false}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              dns_flag: e.target.checked,
                            }))
                          }
                          className="w-4 h-4"
                        />

                        <label className="text-gray-700 font-medium">
                          DNS Flag
                        </label>
                      </div>
                    )}

                </div>
              )}

            <div>
              <label className="block text-gray-700 font-medium mb-2">Registration Date</label>
              <input
                type="date"
                name="registrationDate"
                value={formData.registrationDate || ""}
                onChange={handleInputChange}
                className="w-full border rounded px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">Expiry Date</label>
              <input
                type="date"
                name="expiryDate"
                value={formData.expiryDate || ""}
                onChange={handleInputChange}
                // readOnly
                className="w-full border rounded px-3 py-2 bg-gray-100 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Services */}
          <h2 className="text-xl font-semibold underline text-indigo-600 mb-3">Services</h2>

          {/* -------------------------------------- */}
          {/* EMAIL SERVICES */}
          {/* -------------------------------------- */}
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="email_services"
              checked={emailChecked}
              onChange={handleCheckboxChange}
              className="h-4 w-4"
            />
            Email Services
          </label>

          {emailChecked && (
            <div className="mt-4 space-y-4">
              {emailPlans.map((plan, idx) => (
                <div key={idx} className="border rounded p-4">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end">

                    {/* Email Type */}
                    <div>
                      <label>Email Type</label>
                      <select
                        value={plan.email_service_id || ""}
                        onChange={(e) =>
                          handleEmailPlanChange(idx, "email_service_id", e.target.value)
                        }
                        className="w-full border rounded px-2 py-1"
                      >
                        <option value="">-- Select Type --</option>
                        {emailTypes.map((type) => (
                          <option key={type._id} value={type._id}>
                            {type.name}
                          </option>
                        ))}
                      </select>

                    </div>

                    {/* Plan */}
                    {plan.plans && plan.plans.length > 0 && (

                      <div>
                        <label className="block mb-1 text-gray-700">Select Plan</label>
                        <select
                          value={plan.selected_plan || ""}
                          onChange={(e) =>
                            handleEmailPlanChange(idx, "selected_plan", e.target.value)
                          }
                          className="w-full border rounded px-2 py-1"
                        >
                          <option value="">-- Select Plan --</option>
                          {plan.plans?.map((p) => (
                            <option key={p._id} value={p._id}>
                              {p.plan}   {/* plan name shown in dropdown */}
                            </option>
                          ))}
                        </select>

                      </div>
                    )}


                    {/* Users */}
                    <div>
                      <label>Users</label>
                      <input
                        type="number"
                        min={0}
                        value={plan.users || 0}
                        onChange={(e) =>
                          handleEmailPlanChange(idx, "users", e.target.value)
                        }
                        className="w-full border rounded px-2 py-1"
                      />
                    </div>

                    {/* Registration Date */}
                    <div>
                      <label>Registration Date</label>
                      <input
                        type="date"
                        value={plan.registrationDate || ""}
                        onChange={(e) =>
                          handleEmailPlanChange(idx, "registrationDate", e.target.value)
                        }
                        className="w-full border rounded px-2 py-1"
                      />
                    </div>

                    {/* Expiry Date */}
                    <div>
                      <label>Expiry Date</label>
                      <input
                        type="date"
                        value={plan.expiryDate || ""}
                        onChange={(e) =>
                          handleEmailPlanChange(idx, "expiryDate", e.target.value)
                        }
                        className="w-full border rounded px-2 py-1"
                      />
                    </div>

                  </div>

                  <button
                    type="button"
                    onClick={() => setConfirmRemove({ index: idx, type: "email" })}
                    className="text-red-500 mt-2 hover:text-red-700"
                  >
                    Remove
                  </button>

                </div>
              ))}

              <button
                type="button"
                onClick={addEmailPlan}
                className="text-blue-500 mt-2"
              >
                Add Another Email Plan
              </button>
            </div>
          )}



          {/* STORAGE SERVICES */}
          {/* -------------------------------------- */}
          <label className="flex items-center gap-2 mt-6">
            <input
              type="checkbox"
              name="storage_services"
              checked={storageChecked}
              onChange={handleCheckboxChange}
            />
            Storage Services
          </label>

          {storageChecked && (
            <div className="mt-4 space-y-4">
              {storagePlans.map((plan, idx) => (
                <div key={idx} className="border rounded p-4">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end">

                    {/* Storage Type */}
                    <div>
                      <label>Storage Type</label>
                      <select
                        value={plan.email_service_id || ""}
                        onChange={(e) =>
                          handleStoragePlanChange(idx, "email_service_id", e.target.value)
                        }
                        className="w-full border rounded px-2 py-1"
                      >
                        <option value="">-- Select Type --</option>
                        {emailTypes.map((type) => (
                          <option key={type._id} value={type._id}>
                            {type.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Storage Plan */}
                    {/* {plan.plans && plan.plans.length > 0 && ( */}
                    <div>
                      <label className="block mb-1 text-gray-700">Select Plan</label>
                      <select
                        value={plan.selected_plan || ""}
                        onChange={(e) => handleStoragePlanChange(idx, "selected_plan", e.target.value)}
                        className="w-full border rounded px-2 py-1"
                      >
                        <option value="">-- Select Plan --</option>
                        {plan.plans?.map((p) => (
                          <option key={p._id} value={p._id}>
                            {p.plan}   {/* plan name shown in dropdown */}
                          </option>
                        ))}
                      </select>
                    </div>
                    {/* )} */}

                    {/* Users */}
                    <div>
                      <label>Users</label>
                      <input
                        type="number"
                        min={1}
                        value={plan.users || 1}
                        onChange={(e) =>
                          handleStoragePlanChange(idx, "users", e.target.value)
                        }
                        className="w-full border rounded px-2 py-1"
                      />
                    </div>

                    {/* Registration Date */}
                    <div>
                      <label>Registration Date</label>
                      <input
                        type="date"
                        value={plan.registrationDate || ""}
                        onChange={(e) =>
                          handleStoragePlanChange(idx, "registrationDate", e.target.value)
                        }
                        className="w-full border rounded px-2 py-1"
                      />
                    </div>

                    {/* Expiry Date */}
                    <div>
                      <label>Expiry Date</label>
                      <input
                        type="date"
                        value={plan.expiryDate || ""}
                        onChange={(e) =>
                          handleStoragePlanChange(idx, "expiryDate", e.target.value)
                        }
                        className="w-full border rounded px-2 py-1"
                      />
                    </div>

                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setConfirmRemove({
                        index: idx,
                        type: "storage"
                      })
                    }
                    className="text-red-500 mt-2 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}



          {/* MS OFFICE SERVICES */}
          {/* -------------------------------------- */}
          <label className="flex items-center gap-2 mt-4">
            <input
              type="checkbox"
              name="msoffice_services"
              checked={msofficeChecked}
              onChange={handleCheckboxChange}
              className="h-4 w-4"
            />
            MS Office Services
          </label>

          {msofficeChecked && (
            <div className="mt-4 space-y-4">
              {msofficePlans.map((plan, idx) => (
                <div key={idx} className="border rounded p-4">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end">

                    <div>
                      <label>MS Office Type</label>
                      <select
                        value={plan.email_service_id || ""}
                        onChange={(e) => {
                          const selectedId = e.target.value;
                          const typeObj = emailTypes.find((t) => t._id === selectedId);
                          if (typeObj) {
                            handleMsofficePlanChange(
                              idx,
                              "email_service_id",
                              typeObj._id
                            );

                            fetchPlansByEmailType(
                              typeObj._id,
                              idx
                            );
                          }
                          // if (typeObj) {
                          //   // update state properly
                          //   handleMsofficePlanChange(idx, "email_service_id", typeObj._id);
                          //   handleMsofficePlanChange(idx, "email_service", typeObj.name);

                          //   // fetch plans for this type
                          //   fetchPlansByEmailType(typeObj._id, idx);
                          // }
                        }}
                        className="w-full border rounded px-2 py-1"
                      >
                        <option value="">-- Select Type --</option>
                        {emailTypes.map((type) => (
                          <option key={type._id} value={type._id}>
                            {type.name}
                          </option>
                        ))}
                      </select>
                    </div>


                    {/* Plan */}
                    {/* Plan */} {plan.plans && plan.plans.length > 0 && (
                      <div>
                        <label className="block mb-1 text-gray-700">Select Plan</label>
                        <select
                          value={plan.selected_plan || ""}
                          onChange={(e) =>
                            handleMsofficePlanChange(idx, "selected_plan", e.target.value)
                          }
                          className="w-full border rounded px-2 py-1"
                        >
                          <option value="">-- Select Plan --</option>
                          {plan.plans.map((p: any) => (
                            <option key={p._id} value={p._id}>
                              {p.planName || p.plan} {/* show plan name */}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Users */}
                    <div>
                      <label>Users</label>
                      <input
                        type="number"
                        value={plan.users || ""}
                        onChange={(e) =>
                          handleMsofficePlanChange(idx, "users", e.target.value)
                        }
                        className="w-full border rounded px-2 py-1"
                      />
                    </div>

                    {/* Registration Date */}
                    <div>
                      <label>Registration Date</label>
                      <input
                        type="date"
                        value={plan.registrationDate || ""}
                        onChange={(e) =>
                          handleMsofficePlanChange(idx, "registrationDate", e.target.value)
                        }
                        className="w-full border rounded px-2 py-1"
                      />
                    </div>

                    {/* Expiry Date */}
                    <div>
                      <label>Expiry Date</label>
                      <input
                        type="date"
                        value={plan.expiryDate || ""}
                        onChange={(e) =>
                          handleMsofficePlanChange(idx, "expiryDate", e.target.value)
                        }
                        className="w-full border rounded px-2 py-1"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setConfirmRemove({
                        index: idx,
                        type: "msoffice"
                      })
                    }
                    className="text-red-500 mt-2 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              ))}

            </div>
          )}




          {/* Hosting Checkbox */}
          <label className="flex items-center gap-2 mt-3">
            <input
              type="checkbox"
              checked={hostingChecked}
             onChange={(e) => {
  const checked = e.target.checked;

  setHostingChecked(checked);

  if (checked && hostingPlans.length === 0) {
    setHostingPlans([
      {
        hosting_plan: "",
        hosting_subplan: "",
        storage: "",
        registrationDate: "",
        expiryDate: "",
      },
    ]);
  }

  if (!checked) {
    setHostingPlans([]);
  }
}}

              className="h-4 w-4"
            />
            Hosting
          </label>

         {hostingPlans.map((plan, idx) => (
  <div
    key={idx}
    className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-2 p-3 border rounded bg-gray-50"
  >

    {/* Hosting Type */}
    <div>
      <label className="block text-gray-700 font-medium mb-2">
        Hosting Type
      </label>

      <select
  value={plan.hosting_plan || ""}
  onChange={(e) =>
    handleHostTypeChange(idx, e.target.value)
  }
  className="w-full border rounded px-3 py-2"
>
  <option value="">-- Select Hosting Type --</option>

  {hostTypes.map((ht: any) => (
    <option key={ht._id} value={ht._id}>
      {ht.type}
    </option>
  ))}
</select>

    </div>


    {/* Hosting Sub Type */}
    <div>
      <label className="block text-gray-700 font-medium mb-2">
        Hosting Sub Type
      </label>

      <select
        value={plan.hosting_subplan || ""}
        onChange={(e) =>
          setHostingPlans((prev) =>
            prev.map((item, i) =>
              i === idx
                ? {
                    ...item,
                    hosting_subplan: e.target.value,
                  }
                : item
            )
          )
        }
        className="w-full border rounded px-3 py-2"
      >
        <option value="">-- Select Sub Type --</option>

        {hostSubTypes.map((st) => (
          <option key={st._id} value={st._id}>
            {st.name}
          </option>
        ))}
      </select>
    </div>


    {/* Storage */}
    <div>
      <label className="block text-gray-700 font-medium mb-2">
        Storage
      </label>

      <select
        value={plan.storage || ""}
        onChange={(e) =>
          setHostingPlans((prev) =>
            prev.map((item, i) =>
              i === idx
                ? {
                    ...item,
                    storage: e.target.value,
                  }
                : item
            )
          )
        }
        className="w-full border rounded px-3 py-2"
      >
        <option value="">-- Select Storage --</option>

        {storages.map((s) => (
          <option key={s._id} value={s._id}>
            {s.storage}
          </option>
        ))}
      </select>
    </div>


    {/* Registration Date */}
    <div>
      <label className="block text-gray-700 font-medium mb-2">
        Registration Date
      </label>

      <input
        type="date"
        value={plan.registrationDate || ""}
        onChange={(e) =>
          setHostingPlans((prev) =>
            prev.map((item, i) =>
              i === idx
                ? {
                    ...item,
                    registrationDate: e.target.value,
                  }
                : item
            )
          )
        }
        className="w-full border rounded px-3 py-2"
      />
    </div>


    {/* Expiry Date */}
    <div>
      <label className="block text-gray-700 font-medium mb-2">
        Expiry Date
      </label>

      <input
        type="date"
        value={plan.expiryDate || ""}
        onChange={(e) =>
          setHostingPlans((prev) =>
            prev.map((item, i) =>
              i === idx
                ? {
                    ...item,
                    expiryDate: e.target.value,
                  }
                : item
            )
          )
        }
        className="w-full border rounded px-3 py-2"
      />
    </div>

  </div>
))}


          {/* Website & SSL */}
          <div className="mt-3">

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={websiteChecked}
                onChange={(e) => setWebsiteChecked(e.target.checked)}
                className="h-4 w-4"
              />
              Website
            </label>


            <label className="flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                checked={sslChecked}
                onChange={(e) => setSslChecked(e.target.checked)}
                className="h-4 w-4"
              />
              SSL
              SSL
            </label>
          </div>
          {/* Buttons */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={() => navigate("/admin/orders")}
              className="bg-gray-500 text-white font-medium py-2 px-4 rounded hover:bg-gray-600"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white font-medium py-2 px-4 rounded hover:bg-blue-700"
            >
              {loading ? "Updating..." : "Update Order"}
            </button>
          </div>
        </form>
      </div>
      {confirmRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg p-6 w-80 shadow-lg">
            <h3 className="text-lg font-semibold mb-2 text-gray-800">
              Confirm Removal
            </h3>

            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to remove this plan?
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmRemove(null)}
                className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
              >
                Cancel
              </button>

              <button
                onClick={confirmRemovePlan}
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
              >
                Yes, Remove
              </button>
            </div>
          </div>
        </div>
      )}



    </div>

  );
};

export default UpdateOrder;
