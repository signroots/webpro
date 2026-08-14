import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { createOrder, fetchPlanEmailsByType } from "../api";
import {getExistingCustomers,getEmailTypes,getHostTypes,getPlansByEmailType,getHostSubTypes, getStoragesByHostType} from "./api"
import { fetchStatesByCountry, fetchCountries,fetchCountryCodes} from "../../Customer/api";
// import { useEnterNavigation } from "../../../../hooks/useEnterNavigation";
import { notify } from "../../../../Common/Toastify";

interface Client {
  _id: string;
  c_name: string;
  c_email: string;
  c_phone?: string;
}

interface storagePlans {

  email_service?: string;

  email_service_id?: string;

  selected_plan?: string;

  plans?: {
    _id:string;
    plan:string;
  }[];

  registrationDate?: string;

  expiryDate?: string;

  users?: number | string;

  type:string;

}
interface MsofficeOrderPlan {

  email_service_id?: string;

  email_service?: string;

  selected_plan?: string;

  plans?: {
    _id:string;
    plan:string;
  }[];

  registrationDate?: string;

  expiryDate?: string;

  users?: number | string;

  type?:string;

}
interface EmailPlan {

  email_service?: string;

  email_service_id?: string;

  selected_plan?: string;

  plans?: {
    _id:string;
    plan:string;
  }[];

  registrationDate?: string;

  expiryDate?: string;

  users?: number | string;

}
interface NewOrderForm {
  domainName: string;
  status?: string;
  managedBy: "Signroots" | "Customer" | "";
  registrationDate?: string;
  expiryDate?: string;
  subscription?: string;
  plan?: string;
  email_status?: string;
  username?: string;
  password?: string;
  users?: number;
  customer?: string;
  client?: string;
  provider?: string;
  email_expiryDate?: string;
  email_registrationDate?: string;
  email_service?: "Google Workspace" | "Microsoft 365" | "Business Email" | "TITAN Email";
  hosting?: boolean;
  cloudflareRegistered?: boolean;
  website_flag?: boolean;
  ssl_flag?: boolean;
  host_flag?: boolean;
  domain_flag?:boolean;
  lockStatus?: string;
  domainSource?: string;
  emailType?: string;
  workspace_plan?: string;
  microsoft_plan?: string;
  hosting_subplan?: string;
  hosting_plan?: string;
  storage?: string;
  subResellerName?: string;
  subResellerEmail?: string;
  newCustomer: {
  c_name: string;
  c_company?: string;
  c_address?: string;
  c_city?: string;
  c_gst?: string;
  c_zipCode?: string;
  c_phone?: string;
  c_email: string[];
  c_country: string;
  c_state: string;
  c_salutation:string;
  c_address2:string;
  c_placeOfContactWithStateCode:string;
  c_placeOfContact:string;
  c_bankAccountPayment:string;
  c_country_code:string;
};

}

const NewOrder: React.FC = () => {
  const formRef = React.useRef<HTMLFormElement>(null);
  // useEnterNavigation(formRef);
  const navigate = useNavigate();
  

const [domainSources, setDomainSources] = useState<any[]>([]);
  const [formData, setFormData] = useState<NewOrderForm>({
    domainName: "",
    managedBy: "",
    users: 1,
    client: "",
    email_registrationDate: "",
    email_expiryDate: "",
    email_service: undefined,
    workspace_plan: "",
    microsoft_plan: "",
    storage: "",
    hosting_subplan: "",
    hosting_plan: "",
    hosting: false,
    cloudflareRegistered: false,
    website_flag: false,
    ssl_flag: false,
    host_flag: false,
    domainSource: "",
    domain_flag:false,
    newCustomer: {
      c_name: "",
      c_company: "",
      c_address: "",
      c_city: "",
      c_gst: "",
      c_zipCode: "",
      c_phone: "",
      c_email: [],
      c_country: "",
      c_state: "",
      c_salutation:"",
      c_address2:"",
      c_placeOfContactWithStateCode:"",
      c_placeOfContact:"",
      c_bankAccountPayment:"",
      c_country_code:""
    }
  });

 const [emailPlans, setEmailPlans] = useState<EmailPlan[]>([
  {
    email_service: "",
    email_service_id: "",
    selected_plan: "",
    plans: [],
    registrationDate: "",
    expiryDate: "",
    users: 1
  }
]);
const [storagePlans, setStoragePlans] = useState<storagePlans[]>([
{
 email_service: "",
 email_service_id:"",
 selected_plan:"",
 plans:[],
 registrationDate:"",
 expiryDate:"",
 users:1,
 type:"storage"
}
]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailChecked, setEmailChecked] = useState(false);
  const [customerType, setCustomerType] = useState<"existing" | "new" | undefined>(undefined);
  const [clients, setClient] = useState<Client[]>([]);
  const [countries, setCountries] = useState<{ code: string; name: string }[]>([]);
  const [states, setStates] = useState<{ code: string; name: string }[]>([]);
  const [hosting, setHosting] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [emailTypes, setEmailTypes] = useState<{ _id: string; name: string }[]>([]);
  const [hostTypes, setHostTypes] = useState<{ _id: string; type: string }[]>([]);
  const [hostSubTypes, setHostSubTypes] = useState<{ _id: string; name: string }[]>([]);
  const [storages, setStorages] = useState<{ _id: string; storage: string }[]>([]);
 const [phoneCodes, setPhoneCodes] = useState<string[]>([]);
const [phoneCode, setPhoneCode] = useState<string>("");
const [hostChecked, setHostChecked] = useState(false);
  const [storageChecked, setStorageChecked] = useState(false);
    const [msofficeChecked, setMsofficeChecked] = useState(false)
    const [msofficePlans, setMsofficePlans] = useState<MsofficeOrderPlan[]>([]);
   type RemoveTarget = "email" | "storage" | "msoffice";
   const [confirmRemove, setConfirmRemove] = useState<{
      index: number;
      type: RemoveTarget;
    } | null>(null);
const inputClass =
  "w-full h-11 border border-gray-300 rounded-md px-3 text-sm focus:ring-2 focus:ring-blue-500";


  // Fetch existing customers
useEffect(() => {
  const fetchCustomers = async () => {
    if (customerType === "existing") {
      try {
        const data = await getExistingCustomers();

        const formattedClients = data.map((c) => ({
          _id: c._id,
          c_name: c.c_name || c.name || "",
          c_email: c.c_email || c.email || "",
          c_phone: c.c_phone || c.phone || "",
        }));

        setClient(formattedClients); // ✅ Works safely
      } catch (err) {
        console.error("Failed to fetch customers:", err);
      }
    } else {
      setClient([]);
    }
  };

  fetchCustomers();
}, [customerType]);
useEffect(() => {
//   if (formData.managedBy === "Customer") {
//     setFormData((prev) => ({
//       ...prev,
//       domainSource: "Cloudflare",
      
// domain_flag: true,
//     }));
//   }

  if (formData.managedBy === "Signroots") {
    setFormData((prev) => ({
      ...prev,
      domainSource: "",
      
domain_flag: false,
    }));
  }
}, [formData.managedBy]);
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
useEffect(() => {
  const fetchEmailTypes = async () => {
    if (emailChecked) {
      try {
        const data = await getEmailTypes();
        setEmailTypes(data);
      } catch (err: any) {
        notify(err.message, "error");
      }
    }
  };

  fetchEmailTypes();
}, [emailChecked]);


useEffect(() => {
  const setDefaultCountryAndState = async () => {
    if (customerType === "new") {
      try {
        // Fetch countries list
        const countryList = await fetchCountries();
        setCountries(countryList);

        // Find India from the list
        const india = countryList.find(
          (c) => c.name.toLowerCase() === "india"
        );

        if (india) {
          // Fetch states for India
          const stateList = await fetchStatesByCountry(india.code);
          setStates(stateList);

          // Find Kerala
          const kerala = stateList.find(
            (s) => s.name.toLowerCase() === "kerala"
          );

          // ✅ Safely update formData with non-null assertion
          setFormData((prev) => ({
            ...prev,
            newCustomer: {
              ...prev.newCustomer!, // ✅ ensures all required keys stay
              c_country: india.code,
              c_state: kerala ? kerala.name : "",
            },
          }));
        }
      } catch (err) {
        console.error("Failed to set default country/state", err);
      }
    }
  };

  setDefaultCountryAndState();
}, [customerType]);
useEffect(() => {
  const fetchDomainSources = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/domain-sources`
      );

      setDomainSources(res.data.data || []);

    } catch (error) {
      console.error("Failed to fetch domain sources", error);
    }
  };

  fetchDomainSources();
}, []);

useEffect(() => {
  const fetchHostTypes = async () => {
    if (hosting) {
      try {
        const data = await getHostTypes();
        setHostTypes(data);
      } catch (err: any) {
        console.error("❌ Failed to fetch host types:", err.message);
      }
    }
  };

  fetchHostTypes();
}, [hosting]);






  // Input handler
const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
  const { name, value } = e.target;
   console.log("FIELD:", name, "VALUE:", value);

  if (customerType === "new" && name.startsWith("newCustomer.")) {
    const key = name.split(".")[1] as keyof NewOrderForm["newCustomer"];

    setFormData((prev) => {
      // Use non-null assertion (!) to satisfy TypeScript that required fields exist
      const updatedCustomer: NewOrderForm["newCustomer"] = { ...prev.newCustomer! };

      if (key === "c_email") {
        // Split comma-separated emails into an array
        updatedCustomer.c_email = value
          .split(",")
          .map((email) => email.trim())
          .filter(Boolean);
      } else if (key === "c_phone") {
        // Allow only digits and max 10 characters
        updatedCustomer.c_phone = value.replace(/\D/g, "").slice(0, 10);
      } else {
        updatedCustomer[key] = value;
      }

      return { ...prev, newCustomer: updatedCustomer };
    });
  } else {
    setFormData((prev) => ({ ...prev, [name]: value }));
  }
};


const fetchPlansByEmailType = async (typeId: string, index: number) => {
  try {
    const plans = await getPlansByEmailType(typeId);

    setEmailPlans((prev) => {
      const updated = [...prev];
      updated[index].plans = plans;
      updated[index].selected_plan = ""; // reset selection
      return updated;
    });

    // ✅ Update domainSource as string
    const selectedType = emailTypes.find((t) => t._id === typeId);
    if (selectedType) {
      setFormData((prev) => ({
        ...prev,
        emailType: selectedType.name, // ✅ fixed
      }));
    }
  } catch (err) {
    console.error("❌ Failed to fetch plans:", err);
  }
};


  // Checkbox handler
const handleCheckboxChange = (
  e: React.ChangeEvent<HTMLInputElement>
) => {

  const { name, checked } = e.target;

  switch(name){

    case "email_services":
      setEmailChecked(checked);

      if (checked && emailPlans.length === 0) {
        setEmailPlans([
          {
            email_service_id: "",
            email_service: "",
            selected_plan: "",
            plans: [],
            users: 1,
            registrationDate: "",
            expiryDate: "",
            // google_email: false,
            // microsoft_email: false,
            // businessEmail: false
          }
        ]);
      }

      if (!checked) {
        setEmailPlans([]);
      }

      break;


    case "storage_services":
      setStorageChecked(checked);

      if (checked && storagePlans.length === 0) {
        setStoragePlans([
          {
            email_service_id: "",
            email_service: "",
            selected_plan: "",
            plans: [],
            users: 1,
            registrationDate: "",
            expiryDate: "",
            type: "storage"
          }
        ]);
      }

      if (!checked) {
        setStoragePlans([]);
      }

      break;


    case "msoffice_services":
      setMsofficeChecked(checked);

      if (checked && msofficePlans.length === 0) {
        setMsofficePlans([
          {
            email_service_id: "",
            email_service: "",
            selected_plan: "",
            plans: [],
            users: 1,
            registrationDate: "",
            expiryDate: "",
            type:"msoffice"
          }
        ]);
      }

      if (!checked) {
        setMsofficePlans([]);
      }

      break;


    default:
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));

  }
};
  const validatePhone = (phone: string) => {
  const regex = /^[0-9]{10}$/; // exactly 10 digits, numbers only
  return regex.test(phone);
};


  // Add new email plan row
 const addEmailPlan = () => {
  setEmailPlans((prev) => [
    ...prev,
    {
      email_service: "",      // default empty
      workspace_plan: "",
      microsoft_plan: "",
      registrationDate: "",
      expiryDate: "",
      users: 1,
      // google_email: false,
      // microsoft_email: false,
      plans: [],
      selected_plan: "",
    },
  ]);
};


  // Remove email plan row
  const removeEmailPlan = (index: number) => {
    setEmailPlans((prev) => prev.filter((_, i) => i !== index));
  };

const handleHostTypeChange = async (hostTypeId: string) => {
  // Reset related fields
  setFormData(prev => ({
    ...prev,
    hosting_plan: hostTypeId,
    hosting_subplan: "", // reset subplan
    storage: "",         // reset storage
  }));

  if (!hostTypeId) {
    setHostSubTypes([]);
    setStorages([]);
    return;
  }

  try {
    // ✅ Fetch data using centralized APIs
    const [subTypes, storages] = await Promise.all([
      getHostSubTypes(hostTypeId),
      getStoragesByHostType(hostTypeId),
    ]);

    setHostSubTypes(subTypes);
    setStorages(storages);
  } catch (err: any) {
    console.error("❌ Failed to fetch host subtypes or storages:", err.message || err);
    notify("⚠️ Failed to load host subtype or storage list.", "error");
    setHostSubTypes([]);
    setStorages([]);
  }
};

const handleEmailPlanChange = async (
  index: number,
  key: keyof EmailPlan,
  value: any
) => {

  if (key === "email_service_id") {

    const typeObj = emailTypes.find(
      (t) => t._id === value
    );

    if (!typeObj) return;

    try {

      const plans = await getPlansByEmailType(typeObj._id);

      setEmailPlans((prev) =>
        prev.map((plan, i) =>
          i === index
            ? {
                ...plan,
                email_service_id: typeObj._id,
                email_service: typeObj.name,
                plans: plans,
                selected_plan: "",
              }
            : plan
        )
      );

      // Main formData emailType
      setFormData((prev) => ({
        ...prev,
        emailType: typeObj.name,
      }));

    } catch (err) {

      console.error("Email plan loading error:", err);

      setEmailPlans((prev) =>
        prev.map((plan, i) =>
          i === index
            ? {
                ...plan,
                email_service_id: typeObj._id,
                email_service: typeObj.name,
                plans: [],
                selected_plan: "",
              }
            : plan
        )
      );
    }

  } else {

    setEmailPlans((prev) =>
      prev.map((plan, i) =>
        i === index
          ? {
              ...plan,
              [key]: value,
            }
          : plan
      )
    );

  }
};
const handleStoragePlanChange = async(
 index:number,
 key:keyof storagePlans,
 value:any
)=>{


  if(key==="email_service_id"){


    const typeObj=emailTypes.find(
      t=>t._id===value
    );


    if(!typeObj) return;



    try{


      const plans=await getPlansByEmailType(
        typeObj._id
      );



      setStoragePlans(prev=>

        prev.map((plan,i)=>

          i===index

          ?

          {
            ...plan,

            email_service_id:typeObj._id,

            email_service:typeObj.name,

            plans:plans,

            selected_plan:""

          }

          :

          plan

        )

      );


    }
    catch(err){

      console.log(
        "Storage plan loading error",
        err
      );

    }


  }


  else{


    setStoragePlans(prev=>

      prev.map((plan,i)=>

        i===index

        ?

        {
          ...plan,
          [key]:value
        }

        :

        plan

      )

    );


  }


};
const handleMsofficePlanChange = async(
 index:number,
 key:keyof MsofficeOrderPlan,
 value:any
)=>{


 if(key==="email_service_id"){


   const typeObj=emailTypes.find(
     t=>t._id===value
   );


   if(!typeObj) return;



   try{


    const plans=await getPlansByEmailType(
      typeObj._id
    );



    setMsofficePlans(prev=>

      prev.map((plan,i)=>

        i===index

        ?

        {

          ...plan,

          email_service_id:typeObj._id,

          email_service:typeObj.name,

          plans:plans,

          selected_plan:""

        }

        :

        plan

      )

    );


   }
   catch(err){

    console.log(
      "MS Office plan loading error",
      err
    );

   }


 }

 else{


  setMsofficePlans(prev=>

    prev.map((plan,i)=>

      i===index

      ?

      {
        ...plan,
        [key]:value
      }

      :

      plan

    )

  );


 }


};
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError(null);

  try {

    const payload: any = {
      ...formData,
      is_customer: customerType === "existing",
      email_flag: emailChecked,
      host_flag: hosting,
    };


    // ✅ Existing Customer
    if (customerType === "existing" && formData.client) {
      payload.client = formData.client;
    }


    // ✅ New Customer
    if (
      customerType === "new" &&
      formData.newCustomer?.c_name &&
      formData.newCustomer?.c_email
    ) {

      const phone = formData.newCustomer.c_phone || "";

      if (!validatePhone(phone)) {
        setError("Phone number must be exactly 10 digits and numeric");
        notify("Phone number must be exactly 10 digits and numeric", "error");
        setLoading(false);
        return;
      }


      payload.newCustomer = {
        ...formData.newCustomer,

        country:
          countries.find(
            (c) => c.code === formData.newCustomer.c_country
          )?.code || "",

        state:
          states.find(
            (s) => s.name === formData.newCustomer.c_state
          )?.code || "",
      };
    }



    // ✅ Hosting fields
    if (hosting) {

      payload.hosting_plan = formData.hosting_plan;
      payload.hosting_subplan = formData.hosting_subplan;
      payload.storage = formData.storage;

    } else {

      delete payload.hosting_plan;
      delete payload.hosting_subplan;
      delete payload.storage;

    }



    // ===================================
    // ✅ COMBINED PLANS ARRAY
    // ===================================

    const combinedPlans: any[] = [];


    // ============================
    // EMAIL PLANS
    // ============================
// ============================
// EMAIL PLANS
// ============================

if (emailChecked && emailPlans.length > 0) {

  emailPlans.forEach((plan) => {

    console.log("EMAIL PLAN BEFORE PUSH:", plan);

    // Find email type using ID OR name
    const typeObj =
      emailTypes.find((t) => t._id === plan.email_service_id) ||
      emailTypes.find((t) => t.name === plan.email_service);

    console.log("TYPE OBJ:", typeObj);

    // Find plan only if selected
    const planObj = plan.plans?.find(
      (p) => p._id === plan.selected_plan
    );

    console.log("PLAN OBJ:", planObj);

    if (typeObj) {

      combinedPlans.push({

        // If no plan exists, send empty string
        planId: planObj?._id || "",

        emailTypeId: typeObj._id,

        emailType: typeObj.name,

        planName: planObj?.plan || "",

        noOfUsers: Number(plan.users || 1),

        registrationDate:
          plan.registrationDate || "",

        expiryDate:
          plan.expiryDate || "",

        type: "email"

      });

    }

  });

}
    // ============================
    // STORAGE PLANS
    // ============================

    if(storageChecked && storagePlans.length > 0){


 storagePlans.forEach((plan)=>{


   const typeObj=emailTypes.find(
     (t)=>t._id===plan.email_service_id
   );


   const planObj=plan.plans?.find(
     (p)=>p._id===plan.selected_plan
   );


   if(typeObj && planObj){


    combinedPlans.push({

      planId:planObj._id,

      emailTypeId:typeObj._id,

      emailType:typeObj.name,

      planName:planObj.plan,

      noOfUsers:Number(plan.users || 1),

      registrationDate:
        plan.registrationDate,

      expiryDate:
        plan.expiryDate,

      type:"storage"

    });


   }


 });


}

    // ============================
    // MS OFFICE PLANS
    // ============================

    if(msofficeChecked && msofficePlans.length > 0){


msofficePlans.forEach((plan)=>{


 const typeObj=emailTypes.find(
   (t)=>t._id===plan.email_service_id
 );


 const planObj=plan.plans?.find(
   (p)=>p._id===plan.selected_plan
 );


 if(typeObj && planObj){


  combinedPlans.push({

    planId:planObj._id,

    emailTypeId:typeObj._id,

    emailType:typeObj.name,

    planName:planObj.plan,

    noOfUsers:Number(plan.users || 1),

    registrationDate:
      plan.registrationDate,

    expiryDate:
      plan.expiryDate,

    type:"msoffice"

  });


 }


});


}


// ============================
// HOSTING PLAN
// ============================

if (hosting) {

  combinedPlans.push({

    type: "hosting",

    hostingType:
      formData.hosting_plan,

    hostingSubType:
      formData.hosting_subplan,

    storage:
      formData.storage,

    hosting_flag: true

  });

}


// ============================
// WEBSITE & SSL
// ============================

if (formData.website_flag) {

  combinedPlans.push({

    type: "website",

    website_flag: true

  });

}


if (formData.ssl_flag) {

  combinedPlans.push({

    type: "ssl",

    ssl_flag: true

  });

}

    // assign plans
    if(combinedPlans.length > 0){

      payload.plans = combinedPlans;

    }else{

      delete payload.plans;

    }


    // ===================================
    // DOMAIN EMAIL FLAGS
    // ===================================

    // payload.google_email =
    //   payload.domainSource?.toLowerCase()
    //   .includes("google workspace") || false;


    // payload.microsoft_email =
    //   payload.domainSource?.toLowerCase()
    //   .includes("microsoft 365") || false;

const emailType = (payload.emailType || "").toLowerCase();

payload.google_email =
  emailType.includes("google") ||
  emailType.includes("workspace");

payload.microsoft_email =
  emailType.includes("microsoft") ||
  emailType.includes("365");


if(payload.google_email){
  payload.microsoft_email=false;
}

if(payload.microsoft_email){
  payload.google_email=false;
}

    if(payload.google_email){

      payload.microsoft_email=false;

    }


    if(payload.microsoft_email){

      payload.google_email=false;

    }


if (!payload.domainSource) {
  delete payload.domainSource;
}
    console.log("FINAL PAYLOAD",payload);



    // ===================================
    // API CALL
    // ===================================

    await createOrder(payload);


    notify(
      "Order created successfully ✅",
      "success"
    );


    navigate("/admin/orders");



  } catch(err:any){

  console.error("Order creation failed:", err);


  const errorMsg =
    err?.response?.data?.error?.message ||
    err?.response?.data?.message ||
    err?.message ||
    "Failed to create order";


  setError(errorMsg);

  notify(errorMsg, "error");


} finally {

  setLoading(false);

}

};

  return (
    
    <div className="min-h-screen bg-gray-100 p-1">
      <div className="max-w-6xl mx-auto bg-white shadow-md rounded-lg p-6">
        <h1 className="text-3xl font-bold mb-6 text-gray-700">Create New Order</h1>
        {error && (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        {error}
      </div>
    )}

        <form ref={formRef} className="space-y-6" onSubmit={handleSubmit}>
          {/* Customer Type */}
          <div>
            <label className="mr-4 text-black">
              <input type="radio" value="existing" checked={customerType === "existing"} onChange={() => setCustomerType("existing")} /> Existing Customer
            </label>
            <label className="ml-4 text-black">
              <input type="radio" value="new" checked={customerType === "new"} onChange={() => setCustomerType("new")} /> New Customer
            </label>
          </div>

          {/* Existing Customer Dropdown */}
          {customerType === "existing" && (
            <div className="mb-4">
              <label className="block mb-2 text-black">Select Customer</label>
              <select name="client" value={formData.client || ""} onChange={handleInputChange} className="w-full border rounded px-3 py-2">
                <option value="">-- Select Customer --</option>
                {clients.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.c_name} ({c.c_email})
                  </option>
                ))}
              </select>
            </div>
          )}

   {/* ✅ New Customer Fields */}
 {customerType === "new" && (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

    {/* Salutation */}
    <input
      placeholder="Salutation"
      name="newCustomer.c_salutation"
      value={formData.newCustomer?.c_salutation || ""}
      onChange={handleInputChange}
      className={inputClass}
    />

    {/* Name */}
    <input
      placeholder="Name"
      name="newCustomer.c_name"
      value={formData.newCustomer?.c_name || ""}
      onChange={handleInputChange}
      className={inputClass}
    />

    {/* EMPTY (keeps row balanced) */}
    <div />
{/* ================= EMAIL – FULL ROW ================= */}
<div className="md:col-span-3">
  {/* <label className="block text-gray-700 font-medium mb-2">
    Email Address
  </label> */}

  <div className="flex flex-wrap items-center gap-2 p-2 min-h-[44px] border border-gray-300 rounded-md bg-white focus-within:ring-2 focus-within:ring-blue-500">

    {/* Render added emails */}
    {(formData.newCustomer.c_email ?? []).map((email) => (
      <div
        key={email}
        className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
      >
        {email}
        <button
          type="button"
          className="ml-2 font-bold hover:text-red-600"
          onClick={() =>
            setFormData((prev) => ({
              ...prev,
              newCustomer: {
                ...prev.newCustomer,
                c_email: prev.newCustomer.c_email.filter(
                  (e) => e !== email
                ),
              },
            }))
          }
        >
          ×
        </button>
      </div>
    ))}

    {/* Input */}
    <input
      type="text"
      placeholder="Add email and press Enter"
      className="flex-1 min-w-[150px] outline-none text-sm"
      value={emailInput}
      onChange={(e) => setEmailInput(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === ",") {
          e.preventDefault();

          const value = emailInput.trim().toLowerCase();
          if (!value) return;

          // ✅ Validate email format
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) return;

          // ✅ Prevent duplicates
          if (formData.newCustomer.c_email.includes(value)) {
            setEmailInput("");
            return;
          }

          // ✅ Optional limit (max 3 emails)
          if (formData.newCustomer.c_email.length >= 3) return;

          setFormData((prev) => ({
            ...prev,
            newCustomer: {
              ...prev.newCustomer,
              c_email: [...prev.newCustomer.c_email, value],
            },
          }));

          setEmailInput("");
        }
      }}
    />
  </div>
</div>


    {/* Phone – FULL ROW */}
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
        className="h-11 w-24 border border-gray-300 rounded-md px-2 text-sm"
      >
        {phoneCodes.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      <input
        placeholder="Phone Number"
        name="newCustomer.c_phone"
        value={formData.newCustomer?.c_phone || ""}
        onChange={(e) => {
          const v = e.target.value.replace(/\D/g, "");
          if (v.length <= 10) {
            setFormData((p) => ({
              ...p,
              newCustomer: { ...p.newCustomer!, c_phone: v },
            }));
          }
        }}
        className={`${inputClass} flex-1`}
      />
    </div>

    {/* Company */}
    <input
      placeholder="Company"
      name="newCustomer.c_company"
      value={formData.newCustomer?.c_company || ""}
      onChange={handleInputChange}
      className={inputClass}
    />

    {/* Address */}
    <input
      placeholder="Address"
      name="newCustomer.c_address"
      value={formData.newCustomer?.c_address || ""}
      onChange={handleInputChange}
      className={inputClass}
    />

    {/* Address 2 */}
    <input
      placeholder="Address 2"
      name="newCustomer.c_address2"
      value={formData.newCustomer?.c_address2 || ""}
      onChange={handleInputChange}
      className={inputClass}
    />

    {/* City */}
    <input
      placeholder="City"
      name="newCustomer.c_city"
      value={formData.newCustomer?.c_city || ""}
      onChange={handleInputChange}
      className={inputClass}
    />

    {/* Country */}
    <select
      name="newCustomer.c_country"
      value={formData.newCustomer?.c_country || ""}
      onChange={handleInputChange}
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
      value={formData.newCustomer?.c_state || ""}
      onChange={handleInputChange}
      className={inputClass}
    >
      <option value="">-- Select State --</option>
      {states.map((s) => (
        <option key={s.code} value={s.code}>{s.name}</option>
      ))}
    </select>

    {/* Zip */}
    <input
      placeholder="Zipcode"
      name="newCustomer.c_zipCode"
      value={formData.newCustomer?.c_zipCode || ""}
      onChange={handleInputChange}
      className={inputClass}
    />

    {/* GST */}
    <input
      placeholder="GST"
      name="newCustomer.c_gst"
      value={formData.newCustomer?.c_gst || ""}
      onChange={handleInputChange}
      className={inputClass}
    />

    {/* Bank */}
    <input
      placeholder="Bank Account Payment"
      name="newCustomer.c_bankAccountPayment"
      value={formData.newCustomer?.c_bankAccountPayment || ""}
      onChange={handleInputChange}
      className={inputClass}
    />

    {/* Place of Contact */}
    <input
      placeholder="Place of Contact"
      name="newCustomer.c_placeOfContact"
      value={formData.newCustomer?.c_placeOfContact || ""}
      onChange={handleInputChange}
      className={inputClass}
    />

    {/* Place of Contact State */}
    <input
      placeholder="Place of Contact (State Code)"
      name="newCustomer.c_placeOfContactWithStateCode"
      value={formData.newCustomer?.c_placeOfContactWithStateCode || ""}
      onChange={handleInputChange}
      className={inputClass}
    />
  </div>
)}


          {/* Domain Details */}
          <h2 className="text-xl font-semibold underline text-indigo-600 mb-3">Domain Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-gray-700 font-medium mb-2">Domain Name</label>
              <input type="text" name="domainName" value={formData.domainName} onChange={handleInputChange} className="w-full border rounded px-3 py-2" required />
            </div>
     {/* Registrar / Domain Source */}

<div>
  <label className="block text-gray-700 font-medium mb-2">
    Managed By
  </label>

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

      <option value="">
        -- Select Registrar --
      </option>


      {/* Signroots can see all registrar */}
      {formData.managedBy === "Signroots" &&
        domainSources
          .filter((source) => source.is_active)
          .map((source) => (
            <option
              key={source._id}
              value={source._id}
            >
              {source.name}
            </option>
          ))
      }


      {/* Customer only Cloudflare & Hostinger */}
      {formData.managedBy === "Customer" &&
        domainSources
          .filter(
            (source) =>
              source.is_active &&
              (
                source.name === "Cloudflare" ||
                source.name === "Hostinger"
              )
          )
          .map((source) => (
            <option
              key={source._id}
              value={source._id}
            >
              {source.name}
            </option>
          ))
      }


    </select>


    {/* DNS Flag only for Cloudflare */}

    {domainSources.find(
      (source) =>
        source._id === formData.domainSource &&
        source.name === "Cloudflare"
    ) && (

      <div className="mt-4 flex items-center gap-2">

        <input
          type="checkbox"
          name="dns_flag"
          checked={formData.domain_flag || false}
          disabled={formData.managedBy === "Customer"}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              domain_flag: e.target.checked,
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
              <input type="date" name="registrationDate" value={formData.registrationDate || ""} onChange={(e) => {
                const newDate = e.target.value;
                let expiryDate = "";
                if (newDate) {
                  const reg = new Date(newDate);
                  const exp = new Date(reg);
                  exp.setFullYear(reg.getFullYear() + 1);
                  expiryDate = exp.toISOString().split("T")[0];
                }
                setFormData((prev) => ({ ...prev, registrationDate: newDate, expiryDate }));
              }} className="w-full border rounded px-3 py-2" />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">Expiry Date</label>
              <input type="date" name="expiryDate" value={formData.expiryDate || ""} readOnly className="w-full border rounded px-3 py-2 bg-gray-100 cursor-not-allowed" />
            </div>
          </div>

          {/* Services Section */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">Services</label>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-black">
                <input type="checkbox" name="email_services" checked={emailChecked} onChange={handleCheckboxChange} className="h-4 w-4" /> Email Services
              </label>

              {/* Email Plans */}
              {emailChecked && emailPlans.map((plan, idx) => (
                <div key={idx} className="border rounded p-4 mt-2">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end">
                   <div>
  <label>Email Type</label>

  <select
    value={plan.email_service || ""}
    onChange={(e) => {

      const selectedTypeName = e.target.value;

      handleEmailPlanChange(
        idx,
        "email_service",
        selectedTypeName
      );


      const typeObj = emailTypes.find(
        (t) => t.name === selectedTypeName
      );


      if (typeObj) {

        fetchPlansByEmailType(
          typeObj._id,
          idx
        );

      }

    }}
    className="w-full border rounded px-2 py-1"
  >

    <option value="">
      -- Select Type --
    </option>

    {emailTypes.map((type) => (
      <option 
        key={type._id} 
        value={type.name}
      >
        {type.name}
      </option>
    ))}

  </select>

</div>
                 {plan.plans && plan.plans.length > 0 && (
  <div>
    <label>Select Plan</label>
    <select
      value={plan.selected_plan || ""}
      onChange={(e) => handleEmailPlanChange(idx, "selected_plan", e.target.value)}
      className="w-full border rounded px-2 py-1"
    >
      <option value="">-- Select Plan --</option>
      {plan.plans.map((p) => (
        <option key={p._id} value={p.plan}>
          {p.plan}
        </option>
      ))}
    </select>
  </div>
)}

                    <div>
                      <label>Users</label>
                      <input type="number" value={plan.users} min={1} onChange={(e) => handleEmailPlanChange(idx, "users", e.target.value)} className="w-full border rounded px-2 py-1" />
                    </div>
                    <div>
                      <label>Registration Date</label>
                      <input type="date" value={plan.registrationDate || ""} onChange={(e) => handleEmailPlanChange(idx, "registrationDate", e.target.value)} className="w-full border rounded px-2 py-1" />
                    </div>
                    <div>
                      <label>Expiry Date</label>
                      <input type="date" value={plan.expiryDate || ""} onChange={(e) => handleEmailPlanChange(idx, "expiryDate", e.target.value)} className="w-full border rounded px-2 py-1" />
                    </div>
                  </div>
                  <button type="button" onClick={() => removeEmailPlan(idx)} className="text-red-500 mt-2">Remove</button>
                </div>
              ))}
              {emailChecked && <button type="button" onClick={addEmailPlan} className="text-blue-500 mt-2">Add Another Email Plan</button>}
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
                  <button
                    type="button"
                    onClick={() => setConfirmRemove({ index: idx, type: "storage" })}
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
                       onChange={(e)=>{

 handleMsofficePlanChange(
   idx,
   "email_service_id",
   e.target.value
 );

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
                    onClick={() => setConfirmRemove({ index: idx, type: "storage" })}
                    className="text-red-500 mt-2 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              ))}

            </div>
          )}



              {/* Hosting */}
              <label className="flex items-center gap-2 text-black mt-3">
                <input type="checkbox" name="hosting" checked={hosting} onChange={(e) => setHosting(e.target.checked)} className="h-4 w-4" /> Hosting
              </label>
           {hosting && (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2 p-3 border rounded bg-gray-50">
  <div>
      <label className="block text-gray-700 font-medium mb-2">Hosting Type</label>
      <select
        name="hosting_plan"
        value={formData.hosting_plan || ""}
        onChange={(e) => handleHostTypeChange(e.target.value)}
        className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
      >
        <option value="">-- Select Hosting Type --</option>
        {hostTypes.map(ht => (
          <option key={ht._id} value={ht._id}>{ht.type}</option>
        ))}
      </select>
    </div>

    {/* Sub Type dropdown remains, you can make it dynamic later */}
    <div>
      <label className="block text-gray-700 font-medium mb-2">Hosting Sub Type</label>
      <select
        name="hosting_subplan"
        value={formData.hosting_subplan || ""}
        onChange={(e) =>
          setFormData(prev => ({ ...prev, hosting_subplan: e.target.value }))
        }
        className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
        disabled={!formData.hosting_plan} // disable if no host type selected
      >
        <option value="">-- Select Sub Type --</option>
        {hostSubTypes.map(st => (
          <option key={st._id} value={st._id}>{st.name}</option>
        ))}
      </select>
    </div>

  <div>
  <label className="block text-gray-700 font-medium mb-2">Storage</label>
  <select
    name="storage"
    value={formData.storage || ""}
    onChange={(e) =>
      setFormData((prev) => ({ ...prev, storage: e.target.value }))
    }
    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
  >
    <option value="">-- Select Storage --</option>
    {storages.map((s) => (
      <option key={s._id} value={s._id}>
        {s.storage}
      </option>
    ))}
  </select>
</div>

  </div>
)}

              {/* Other services */}
              {["website_flag", "ssl_flag"].map((field) => (
                <label key={field} className="flex items-center gap-2 text-black">
                  <input type="checkbox" name={field} checked={(formData as any)[field] || false} onChange={handleCheckboxChange} className="h-4 w-4" /> {field.replace("_flag", "").toUpperCase()}
                </label>
              ))}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => navigate("/admin/orders")} className="bg-gray-500 text-white font-medium py-2 px-4 rounded hover:bg-gray-600">Back</button>
            <button type="submit" disabled={loading} className="bg-blue-600 text-white font-medium py-2 px-4 rounded hover:bg-blue-700">{loading ? "Creating..." : "Create Order"}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewOrder;
