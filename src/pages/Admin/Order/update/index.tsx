import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { fetchCountries, fetchStatesByCountry } from "../../Customer/api";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
interface EmailPlan {
  email_service: string;
  workspace_plan?: string;
  microsoft_plan?: string;
  registrationDate?: string;
  expiryDate?: string;
  users: number;
  type:string;
  email_flag?: boolean;
  google_email?: boolean;
  microsoft_email?: boolean;
  businessEmail?: boolean;
  email_service_id:string;
  planName?:string;
  selected_plan?: string;
  email_services?:string;
  emailTypeId?: string;
  plans?: { _id: string; plan: string }[];
}

interface MsofficeOrderPlan {
  email_service_id?:string;
  emailType?: string;
  planId?: string;
  selected_plan?: string;
  planName?: string;
  plans?: { _id: string; plan: string }[];
  registrationDate?: string;
  expiryDate?: string;
  noOfUsers?: number;
  type?: string;
  msoffice_services_flag?:boolean;
  users?:string;
  email_service?:string;
}


interface OrderPlan {
  _id?: string;
  type: string;
  emailType?: string;
  selected_plan?: string;
  planId?: string;
  planName?:string;
  registrationDate?: string;
  expiryDate?: string;
  noOfUsers?: number;
  plans?: { _id: string; plan: string }[];
}

interface storagePlans {
  email_service?: string;
  selected_plan?: string;
  email_service_id?:string;
  plans?: { _id: string; plan: string }[]
  workspace_plan?: string;
  microsoft_plan?: string;
  registrationDate?: string;
  expiryDate?: string;
  planName?:string;
  users?: number;
  google_email?: boolean;
  microsoft_email?: boolean;
  businessEmail?: boolean;
  email_flag?: boolean;
  storage_services_flag?:boolean;
  type:string;
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
  newCustomer: {
    c_name?: string;
    c_email?: string;
    c_phone?: string;
    c_company?: string;
    c_address?: string;
    c_city?: string;
    c_state?: string;
    c_country?: string;
    c_zipCode?: string;
  };
  storage: string;
  // hoststorageId: string | null;
  hosting_subplan: string;
  hosting_plan: string;
  email_service?: "Google Workspace" | "Microsoft 365" | "Business Email" | "Titan Email";
  hosting?: boolean;
  website_flag?: boolean;
  ssl_flag?: boolean;
  host_flag?: boolean;
  domainSource?: string;
  email_expiryDate?: string;
  users?: number;
  hostType?: any;
  hostSubType?: any;
  //  hosttypeid?: string | null;
  // subHostTypeId?: string | null;
  hosttypeid: HostType | null;
  subHostTypeId: SubHostType | null;
  hoststorageId: Storage | null;
}

const UpdateOrder: React.FC = () => {
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();

  const [formData, setFormData] = useState<OrderForm>({
    domainName: "",
    managedBy: "Signroots",
    newCustomer: {
      c_name: "",
      c_email: "",
      c_phone: "",
      c_company: "",
      c_address: "",
      c_city: "",
      c_state: "",
      c_country: "",
      c_zipCode: "",
    },
    storage: "",
    
    hosting_subplan: "",
    hosting_plan: "",
    plans: [],
    domainSource: "",
    hosttypeid: null,
  subHostTypeId: null,
  hoststorageId: null,
  });

  const [loading, setLoading] = useState(false);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [emailChecked, setEmailChecked] = useState(false);
  const [msofficeChecked,setMsofficeChecked]=useState(false)
  const [customerType, setCustomerType] = useState<"existing" | "new">("new");
  const [clients, setClients] = useState<any[]>([]);
  const [countries, setCountries] = useState<{ code: string; name: string }[]>([]);
  const [states, setStates] = useState<{ code: string; name: string }[]>([]);
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
    type:"",
    selected_plan: "",
    planName:"",
    email_service_id:""
  },
]);
   const [storagePlans, setStoragePlans] = useState<storagePlans[]>([
    { email_service: "", workspace_plan: "", microsoft_plan: "", registrationDate: "", expiryDate: "", users: 1,type:"" },
  ]);
  const [emailTypes, setEmailTypes] = useState<{ _id: string; name: string }[]>([]);
  const [storageChecked, setStorageChecked] = useState(false);

  const [hostTypes, setHostTypes] = useState<HostType[]>([]);
const [hostSubTypes, setHostSubTypes] = useState<SubHostType[]>([]);
const [storages, setStorages] = useState<Storage[]>([]);

const [msofficePlans, setMsofficePlans] = useState<any[]>([]);


  // ------------------- FETCH EMAIL TYPES -------------------
const fetchPlansByEmailType = async (typeId: string, index: number) => {
  try {
    const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/plans/planlist/${typeId}`);
    if (res.data.success) {
      setMsofficePlans((prev) => {
        const updated = [...prev];
        // updated[index].plans = res.data.data.filter((p: any) => p.isActive);
        // updated[index].msoffice_plan = "";  // reset plan
        return updated;
      });
    }
  } catch (err) {
    console.error("Failed to fetch plans", err);
  }
};

const addEmailPlan = () => {
  setEmailPlans((prev) => [
    ...prev,
    {
      email_service: "",
      email_service_id:"",
      planName:"",
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
    },
  ]);
};
const addStoragePlan = () => {
  setStoragePlans((prev) => [
    ...prev,
    {
      email_service: "",
      email_service_id:"",
      planName:"",
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
      email_service_id:"",
      planName:"",
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
    setStoragePlans((prevPlans) =>
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
    setStoragePlans((prevPlans) =>
      prevPlans.map((plan, i) =>
        i === index ? { ...plan, [key]: value } : plan
      )
    );
  }
};




  // ------------------- INPUT & CHECKBOX HANDLERS -------------------
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (customerType === "new" && name.startsWith("newCustomer.")) {
      const key = name.split(".")[1];
      setFormData((prev) => ({ ...prev, newCustomer: { ...(prev.newCustomer || {}), [key]: value } }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

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
  console.log("DEBUG emailPlans", emailPlans);
}, [emailPlans]);



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

  // ------------------- FETCH ORDER DATA -------------------
// useEffect to fetch order and initialize formData
useEffect(() => {
  if (!orderId) return setLoadingOrder(false);

  const fetchOrder = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/orders/${orderId}`);
      const order = res.data.data || res.data;

      setEmailChecked(!!order.email_flag);
      setStorageChecked(!!order.storage_services_flag);
      setMsofficeChecked(!!order.msoffice_services_flag);
      setCustomerType(order.client ? "existing" : "new");

      // Extract hosting details safely
      const hostTypeObj = order.hosttypeid || order.hostType || null;
      const subHostObj = order.subHostTypeId || order.storageDetails?.hostSubType || null;
      const storageObj = order.hoststorageId || order.storageDetails || null;
     const emailOnly = order.plans?.filter((p: OrderPlan) => p.type === "email") || [];
const storageOnly = order.plans?.filter((p: OrderPlan) => p.type === "storage") || [];
const msofficeOnly = order.plans?.filter((p: OrderPlan) => p.type === "msoffice") || [];

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
      plans: p.plans || [],
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


      // Set formData
      setFormData((prev) => ({
        ...prev,
        domainName: order.domainName || "",
        managedBy: order.managedBy || "Signroots",
        registrationDate: order.registrationDate?.slice(0, 10) || "",
        expiryDate: order.expiryDate?.slice(0, 10) || "",
        status: order.status || "Active",
        client: order.client?._id || "",
        newCustomer: order.client || prev.newCustomer,
        hosting: !!order.hosting,
        website_flag: !!order.website_flag,
        ssl_flag: !!order.ssl_flag,
        host_flag: !!order.host_flag,
        domainSource: order.domainSource || "",
        email_expiryDate: order.email_expiryDate?.slice(0, 10) || "",
        users: order.users || 1,
        plans: order.plans || [],

        hosttypeid: hostTypeObj,
        hosting_plan: hostTypeObj?._id || "",
        subHostTypeId: subHostObj,
        hosting_subplan: subHostObj?._id || "",
        hoststorageId: storageObj,
        storage: storageObj?._id || "",
      }));

      // Initially populate host types dropdown
      const allHostTypes = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/hosttypes`);
      setHostTypes(allHostTypes.data.data || []);

      // If a host type is selected, fetch its subtypes and storage
      if (hostTypeObj?._id) {
        fetchSubTypesAndStorage(hostTypeObj._id, subHostObj?._id, storageObj?._id);
      }

      // ---------------- Email Plans ----------------
if (order.email_flag && order.plans && order.plans.length > 0 && emailTypes.length > 0) {
  const updatedPlans = await Promise.all(
    order.plans
      .filter((p: any) => p.type === "email")
      .map(async (p: any) => {
        // ✅ Find the email type object by ID or name
        const typeObj = emailTypes.find(
          (t: any) => t._id === p.email_service_id || t.name === p.emailType
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
              plans.unshift({ _id: p.planId, plan: p.planName });
            }
          } catch (err) {
            console.error("Failed to fetch plans for email type", err);
          }
        }

        return {
          email_service: typeObj?.name || p.emailType || "", // ✅ display name
          email_service_id: typeObj?._id || p.email_service_id || "", // ✅ ID for <select>
          selected_plan: p.planId || "",
          registrationDate: p.registrationDate?.slice(0, 10) || "",
          expiryDate: p.expiryDate?.slice(0, 10) || "",
          users: p.noOfUsers || 1,
          google_email: typeObj?.name === "Google Workspace",
          microsoft_email: typeObj?.name === "Microsoft 365",
          businessEmail: typeObj?.name === "Business Email",
          email_flag: true,
          type: p.type || "email",
          plans,
        };
      })
  );

  setEmailPlans(updatedPlans);
}

      // ---------------- Storage Plans ----------------
if (order.storage_services_flag && order.plans && order.plans.length > 0) {
  const updatedStoragePlans = await Promise.all(
    order.plans
      .filter((p: any) => p.type === "storage")
      .map(async (p: any) => {
        const typeObj = emailTypes.find((t: any) => t.name === p.emailType);
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
              plans.unshift({ _id: p.planId, plan: p.planName });
            }
          } catch (err) {
            console.error("Failed to fetch storage plans", err);
          }
        }
        return {
          email_service: typeObj?.name || p.emailType || "", // ✅ display name
          email_service_id: typeObj?._id || p.email_service_id || "", // ✅ ID for <select>
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
if (order.msoffice_services_flag && order.plans && order.plans.length > 0) {
  const updatedMsofficePlans = await Promise.all(
    order.plans
      .filter((p: any) => p.type === "msoffice")
      .map(async (p: any) => {
        // Find the MS Office type object
        const typeObj = emailTypes.find((t: any) => t.name === p.emailType); // or use a msofficeTypes array if needed

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
              plans.unshift({ _id: p.planId, plan: p.planName });
            }
          } catch (err) {
            console.error("Failed to fetch MS Office plans", err);
          }
        }

        return {
          email_service: typeObj?.name || p.emailType || "", // ✅ display name
          email_service_id: typeObj?._id || p.email_service_id || "", // ✅ ID for <select>
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
const handleHostTypeChange = (hostTypeId: string) => {
  const selectedHostType = hostTypes.find(ht => ht._id === hostTypeId) || null;
  setFormData((prev) => ({
    ...prev,
    hosttypeid: selectedHostType,
    hosting_plan: selectedHostType?._id || "",
    subHostTypeId: null,
    hosting_subplan: "",
    hoststorageId: null,
    storage: "",
  }));

  if (hostTypeId) {
    fetchSubTypesAndStorage(hostTypeId);
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
          const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/orders/existing_customers`);
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
    const payload: any = { ...formData, is_customer: customerType === "existing" };

    if (customerType === "existing") delete payload.newCustomer;
    else delete payload.client;

    if (!payload.domainSource) payload.domainSource = formData.domainSource || "";

    // combine plans
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
          email_flag: true,
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
          emailTypeId: plan.email_service_id, // or rename field if backend expects something else
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
    // assign combined plans
    payload.plans = combinedPlans;

    const res = await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/orders/${orderId}`, payload);

    if (res.data?.success === true) {
      alert("✅ Order updated successfully!");
      navigate("/admin/orders");
    } else {
      alert("❌ Failed to update order");
    }
  } catch (err) {
    console.error(err);
    setError("Failed to update order");
  } finally {
    setLoading(false);
  }
};


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
              <select
                name="client"
                value={formData.client || ""}
                onChange={handleInputChange}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">-- Select Customer --</option>
                {clients.map((c: any) => (
                  <option key={c._id} value={c._id}>
                    {c.c_name} ({c.c_email})
                  </option>
                ))}
              </select>
            </div>
          )}

         {/* New Customer */}
{/* New Customer */}
{customerType === "new" && (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    {[
      { key: "c_name", label: "Name" },
      { key: "c_email", label: "Email" },
      { key: "c_phone", label: "Phone" },
      { key: "c_company", label: "Company" },
      { key: "c_address", label: "Address" },
      { key: "c_city", label: "City" },
      // { key: "c_zipCode", label: "ZIP Code" },
    ].map(({ key, label }) => (
      <div key={key}>
        <label className="block text-gray-700 font-medium mb-2">
          {label}
        </label>
        <input
          type="text"
          name={`newCustomer.${key}`}
          value={(formData.newCustomer as any)?.[key] || ""}
          onChange={handleInputChange}
          className="w-full border rounded px-3 py-2"
          placeholder={`Enter ${label.toLowerCase()}`}
        />
      </div>
    ))}
              {/* Country */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">Country</label>
                <select
                  name="newCustomer.c_country"
                  value={formData.newCustomer.c_country || ""}
                  onChange={handleCountryChange}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">-- Select Country --</option>
                  {countries.map((c: any) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* State */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">State</label>
                <select
                  name="newCustomer.c_state"
                  value={formData.newCustomer.c_state || ""}
                  onChange={handleInputChange}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">-- Select State --</option>
                  {states.map((s: any) => (
                    <option key={s.code} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
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
            {formData.managedBy === "Signroots" && (
              <div>
                <label className="block text-gray-700 font-medium mb-2">Registrar</label>
                <select
                  name="domainSource"
                  value={formData.domainSource || ""}
                  onChange={handleInputChange}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">-- Select Registrar --</option>
                  <option value="Reseller">RESELLER CLUB</option>
                  <option value="HOSTINGER">HOSTINGER</option>
                  <option value="SQUARESPACE">SQUARESPACE</option>
                  <option value="SAHARA">SAHARA</option>
                  <option value="Cloudflare">CLOUDFLARE</option>
                  <option value="AE Server">AE SERVER</option>
                </select>
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
                readOnly
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
              min={1}
              value={plan.users || 1}
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
          onClick={() => removeEmailPlan(idx)}
          className="text-red-500 mt-2"
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
          {plan.plans && plan.plans.length > 0 && (
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
          )}

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
        // update state properly
        handleMsofficePlanChange(idx, "email_service_id", typeObj._id);
        handleMsofficePlanChange(idx, "email_service", typeObj.name);

        // fetch plans for this type
        fetchPlansByEmailType(typeObj._id, idx);
      }
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
      </div>
    ))}

  </div>
)}


    

          {/* Hosting Checkbox */}
          <label className="flex items-center gap-2 mt-3">
            <input
              type="checkbox"
              name="host_flag"
              checked={formData.host_flag || false}
              onChange={(e) =>
                setFormData((prev: any) => ({ ...prev, host_flag: e.target.checked }))
              }
              className="h-4 w-4"
            />
            Hosting
          </label>

{/* Hosting Details */}
{formData.host_flag && (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2 p-3 border rounded bg-gray-50">

    {/* Hosting Type */}
    <div className="mb-3">
      <label className="block mb-1 text-gray-700">Hosting Type</label>
      <select
        name="hosting_plan"
        value={formData.hosttypeid?._id || ""}
        onChange={(e) => handleHostTypeChange(e.target.value)}
        className="w-full border rounded px-3 py-2"
      >
        <option value="">Select Hosting Type</option>
        {hostTypes.map((ht: HostType) => (
          <option key={ht._id} value={ht._id}>
            {ht.type}
          </option>
        ))}
      </select>
    </div>

    {/* Hosting Sub Type */}
    <div className="mb-3">
      <label className="block mb-1 text-gray-700">Hosting Sub Plan</label>
      <select
        name="hosting_subplan"
        value={formData.subHostTypeId?._id || ""}
        onChange={(e) => {
          const selectedSub = hostSubTypes.find(sub => sub._id === e.target.value) || null;
          setFormData((prev) => ({
            ...prev,
            subHostTypeId: selectedSub,
            hosting_subplan: selectedSub?._id || "",
          }));
        }}
        className="w-full border rounded px-3 py-2"
      >
        <option value="">Select Sub Plan</option>
        {hostSubTypes.map((sub: SubHostType) => (
          <option key={sub._id} value={sub._id}>
            {sub.name}
          </option>
        ))}
      </select>
    </div>

    {/* Storage */}
    <div className="mb-3">
      <label className="block mb-1 text-gray-700">Storage</label>
      <select
        name="storage"
        value={formData.hoststorageId?._id || ""}
        onChange={(e) => {
          const selectedStorage = storages.find(s => s._id === e.target.value) || null;
          setFormData((prev) => ({
            ...prev,
            hoststorageId: selectedStorage,
            storage: selectedStorage?._id || "",
          }));
        }}
        className="w-full border rounded px-3 py-2"
      >
        <option value="">Select Storage</option>
        {storages.map((s: Storage) => (
          <option key={s._id} value={s._id}>
            {s.storage}
          </option>
        ))}
      </select>
    </div>

  </div>
)}


{/* Website & SSL (outside Hosting Details div) */}
<div className="mt-3">
  <label className="flex items-center gap-2">
    <input
      type="checkbox"
      name="website_flag"
      checked={formData.website_flag || false}
      onChange={handleCheckboxChange}
      className="h-4 w-4"
    />
    Website
  </label>

  <label className="flex items-center gap-2 mt-2">
    <input
      type="checkbox"
      name="ssl_flag"
      checked={formData.ssl_flag || false}
      onChange={handleCheckboxChange}
      className="h-4 w-4"
    />
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
    </div>
  );
};

export default UpdateOrder;
