import {
 FaEnvelope,
 FaServer,
 FaLock,
 FaLaptopCode,
 FaGlobe
} from "react-icons/fa";

import {
 SiCloudflare,
 SiHostinger
} from "react-icons/si";


export default function ServiceIcons({order}:any){

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
return (
<td className="px-6 py-4 flex items-center gap-2">


{/* Domain */}

{
order.domainSource?.image ?

<img
src={`${API_BASE_URL}/${order.domainSource.image}`}
alt={order.domainSource.name}
className="w-5 h-5 object-contain"
/>

:

order.domainSource?.name?.toLowerCase().includes("cloudflare") ?

<SiCloudflare
className="w-5 h-5 text-orange-500"
/>

:

order.domainSource?.name?.toLowerCase().includes("hostinger") ?

<SiHostinger
className="w-5 h-5 text-blue-500"
/>

:

<FaGlobe
className="w-5 h-5 text-gray-400"
/>

}



{/* Email */}

<FaEnvelope
className={
order.Plans?.some(
(p:any)=>p.type==="email" || p.type==="msoffice"
)

?
"w-5 h-5 text-green-500"
:
"w-5 h-5 text-gray-300"
}
/>



{/* Hosting */}

<FaServer
className={
order.Plans?.some(
(p:any)=>p.type==="hosting"
)

?
"w-5 h-5 text-purple-500"
:
"w-5 h-5 text-gray-300"
}
/>



{/* Website */}

<FaLaptopCode
className={
order.Plans?.some(
(p:any)=>p.type==="website"
)

?
"w-5 h-5 text-pink-500"
:
"w-5 h-5 text-gray-300"
}
/>



{/* SSL */}

<FaLock
className={
order.Plans?.some(
(p:any)=>p.type==="ssl"
)

?
"w-5 h-5 text-yellow-500"
:
"w-5 h-5 text-gray-300"
}
/>


</td>
)

}