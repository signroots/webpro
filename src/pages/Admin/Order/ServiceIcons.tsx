import {
  FaEnvelope,
  FaServer,
  FaLock,
  FaLaptopCode,
  FaGlobe,
  FaMicrosoft
} from "react-icons/fa";

import { useState } from "react";


export default function ServiceIcons({
  order,
  fetchOrderById
}: any) {

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [msofficeCache, setMsofficeCache] = useState<any>({});
const formatDate = (date:any) => {
  if(!date) return "-";

  return new Date(date).toLocaleDateString();
};

  const handleMsofficeHover = async () => {

    setSelectedOrderId(order._id);
    setIsHovering(true);

    if (msofficeCache[order._id]) return;


    try {

      const fullOrder = await fetchOrderById(order._id);

      const plans = fullOrder?.data?.plans || [];


      const msofficePlans = plans.filter(
        (p:any)=>
          p?.serviceType?.toLowerCase() === "msoffice" ||
          p?.type?.toLowerCase() === "msoffice"
      );


      setMsofficeCache((prev:any)=>({
        ...prev,
        [order._id]:msofficePlans
      }));


    } catch(err){

      console.error(
        "MS Office fetch error",
        err
      );

    }

  };


  return (
<div className="flex items-center justify-center gap-2 whitespace-nowrap">


{/* ================= DOMAIN SOURCE ================= */}

{
order.domainSource?.image ?

<img
src={
order.domainSource.image.startsWith("/")
?
`${API_BASE_URL}${order.domainSource.image}`
:
`${API_BASE_URL}/uploads/domainsources/${order.domainSource.image}`
}
className="w-7 h-7 object-contain"
title={order.domainSource.name}
/>

:

<FaGlobe
className="w-6 h-6 text-gray-400"
title="No Domain Source"
/>

}


{/* ================= EMAIL ================= */}

{
  order.Plans?.some(
    (plan: any) => plan.type?.toLowerCase() === "email"
  )

  ?

  order.Plans
    .filter(
      (plan: any) => plan.type?.toLowerCase() === "email"
    )
    .map(
      (plan: any, index: number) => (

        <div
          key={index}
          className="relative group"
        >

          {/* Email Image + User Badge */}
          <div className="relative inline-block">

            <img
              src={
                plan.emailTypeImage
                  ? `${API_BASE_URL}${plan.emailTypeImage}`
                  : "/email.png"
              }
              className="w-6 h-6 cursor-pointer"
              title={plan.emailType}
            />

            {/* No. of Users Badge */}
            <span
              className="
                absolute
                -top-2
                -right-2
                min-w-[16px]
                h-4
                px-1
                flex
                items-center
                justify-center
                rounded-full
                bg-red-500
                text-white
                text-[9px]
                font-bold
                border
                border-white
              "
            >
              {plan.noOfUsers ?? 0}
            </span>

          </div>

          {/* Hover Details */}
          <div
            className="
              hidden group-hover:block
              absolute left-0 top-full mt-2
              bg-gray-900 text-white
              text-xs p-3
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
              <b>No. of Users:</b>{" "}
              {plan.noOfUsers ?? "-"}
            </p>

            <p>
              <b>Expiry:</b>{" "}
              {
                plan.expiryDate
                  ? new Date(plan.expiryDate).toLocaleDateString()
                  : "-"
              }
            </p>

          </div>

        </div>

      )
    )

  :

  <FaEnvelope
    className="w-6 h-6 text-gray-300"
    title="No Email"
  />
}

{/* ================= HOSTING ================= */}


<FaServer

className={
order.Plans?.some(
(plan:any)=>plan.type==="hosting"
)

?

"w-5 h-5 text-purple-500"

:

"w-5 h-5 text-gray-300"

}

title="Hosting"

/>



{/* ================= WEBSITE ================= */}


<FaLaptopCode

className={
order.Plans?.some(
(plan:any)=>plan.type==="website"
)

?

"w-5 h-5 text-blue-500"

:

"w-5 h-5 text-gray-300"

}

title="Website"

/>


{/* ================= MS OFFICE ================= */}

{
  order.Plans?.some(
    (plan: any) => plan.type?.toLowerCase() === "msoffice"
  ) &&
    order.Plans
      .filter(
        (plan: any) => plan.type?.toLowerCase() === "msoffice"
      )
      .map((plan: any, index: number) => (
        <img
          key={index}
          src={
            plan.emailTypeImage
              ? `${API_BASE_URL}${plan.emailTypeImage}`
              : "/MSOffice.png"
          }
          className="w-5 h-5 object-contain"
          title={plan.emailType}
        />
      ))
}

{/* ================= SSL ================= */}


{
  order.Plans?.some(
    (plan: any) => plan.type?.toLowerCase() === "ssl"
  ) && (
    <FaLock
      className="w-5 h-5 text-yellow-500"
      title="SSL"
    />
  )
}



</div>

  );

}