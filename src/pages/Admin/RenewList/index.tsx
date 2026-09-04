// ===============================
// RenewList.tsx PART 1A
// ===============================

import React, { useEffect, useState } from "react";
import ServiceIcons from "../Order/ServiceIcons";
import {
  FaEye,
  FaEdit,
  FaEnvelope,
  FaServer,
  FaLock,
  FaLaptopCode,
  FaGlobe,
  FaSyncAlt
} from "react-icons/fa";

import {
  SiCloudflare,
  SiHostinger
} from "react-icons/si";

import { Link } from "react-router-dom";
import ExpiryBadge from "../Order/ExpiryBadge";
import {
  fetchRenewListOrders
} from "../Order/api";


// ===============================
// INTERFACES
// ===============================
interface Client {

  _id: string;

  c_name?: string;

  c_company?: string;

  c_email?: string;

  c_phone?: string;

}

interface Customer {

  _id: string;

  name?: string;

  company?: string;

}



interface DomainSource {

  _id:string;

  name:string;

  code:string;

  image:string;

}



interface Plan {

  type:
  | "email"
  | "storage"
  | "msoffice"
  | "hosting"
  | "website"
  | "ssl";


  expiryDate?:string;


  emailType?:string;


  emailTypeImage?:string;


  planId?:string;

}




interface Order {

  _id:string;


  domainName:string;


  lockStatus?:string;


  status?:string;
order_status?: {
  _id: string;
  name: string;
  code: string;
  type: "order" | "plan" |"domain";
  is_active: boolean;
} | null;

  expiryDate?:string;



  domainSource?:DomainSource;



  Plans?:Plan[];



  hosting?:boolean;



  website_flag?:boolean;



  ssl_flag?:boolean;



  google_email?:boolean;



  microsoft_email?:boolean;



  customer?:string | Customer;
  client?: Client; 


}


// ===============================
// COMPONENT
// ===============================


const RenewList = () => {


  const [orders, setOrders] =
    useState<Order[]>([]);


  const [loading, setLoading] =
    useState(true);



  const [currentPage, setCurrentPage] =
    useState(1);



  const itemsPerPage = 50;



  const [
    selectedTab,
    setSelectedTab
  ] = useState<
    "previous" | "current" | "next"
  >("current");



  const [
    search,
    setSearch
  ] = useState("");


const getDaysLeft = (expiryDate?: string) => {
  if (!expiryDate) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);

  const diff = expiry.getTime() - today.getTime();

  return Math.ceil(
    diff / (1000 * 60 * 60 * 24)
  );
};

const getStatusClass = (status: any) => {
  const statusName =
    typeof status === "string"
      ? status
      : status?.name || status?.code || "";
  switch (status?.toUpperCase()) {
    case "EXPIRED":
      return "bg-red-100 text-red-700";

    case "WARNING":
      return "bg-orange-100 text-orange-700";

    case "ACTIVE":
      return "bg-green-100 text-green-700";

    default:
      return "bg-gray-100 text-gray-600";
  
};
};
  // ===============================
  // EXPIRY STATUS
  // ===============================


  const getExpiryStatus = (
  order:Order
) => {


  const expiryDates:string[]=[];



  // Domain expiry

  if(order.expiryDate){

    expiryDates.push(
      order.expiryDate
    );

  }




  // Service expiry

  order.Plans?.forEach(
    plan=>{

      if(plan.expiryDate){

        expiryDates.push(
          plan.expiryDate
        );

      }

    }
  );




  if(expiryDates.length===0)

    return "normal";





  const today=new Date();


  today.setHours(
    0,0,0,0
  );



  let nearestDate =
    new Date(
      expiryDates[0]
    );




  expiryDates.forEach(
    date=>{

      const current =
        new Date(date);


      if(current < nearestDate){

        nearestDate=current;

      }

    }
  );



  nearestDate.setHours(
    0,0,0,0
  );



  const days =
    Math.ceil(
      (
        nearestDate.getTime()
        -
        today.getTime()
      )
      /
      (
        1000*60*60*24
      )
    );



  if(days < 0)

    return "expired";



  if(days <=15)

    return "warning";



  return "active";


};

  // ===============================
  // LOAD ORDERS
  // ===============================


 useEffect(() => {

  const loadOrders = async () => {

    setLoading(true);

    try {

      const response =
        await fetchRenewListOrders(selectedTab);

      setOrders(response.data.data);

      setCurrentPage(1);

    } catch (error) {

      console.error(error);

      setOrders([]);

    } finally {

      setLoading(false);

    }

  };

  loadOrders();

}, [selectedTab]);


  // ===============================
  // MONTH FILTER
  // ===============================


  // const today =
  //   new Date();


  // const currentMonth =
  //   today.getMonth();


  // const currentYear =
  //   today.getFullYear();



  // const filteredOrders =
  //   orders.filter((order) => {


  //     if (!order.expiryDate)
  //       return false;



  //     const expiry =
  //       new Date(
  //         order.expiryDate
  //       );



  //     let month =
  //       currentMonth;


  //     let year =
  //       currentYear;



  //     if (selectedTab === "previous") {


  //       month--;



  //       if (month < 0) {

  //         month = 11;

  //         year--;

  //       }


  //     }



  //     if (selectedTab === "next") {


  //       month++;



  //       if (month > 11) {


  //         month = 0;

  //         year++;


  //       }


  //     }



    //   const monthMatch =
    //     expiry.getMonth()
    //     ===
    //     month;



    //   const yearMatch =
    //     expiry.getFullYear()
    //     ===
    //     year;



    //   const searchMatch =
    //     order.domainName
    //       .toLowerCase()
    //       .includes(
    //         search.toLowerCase()
    //       );



    //   return (
    //     monthMatch &&
    //     yearMatch &&
    //     searchMatch
    //   );



    // });




  // ===============================
  // COUNTS
  // ===============================


  const expiredCount =
    orders.filter(
      (order) =>
       getExpiryStatus(order)
        === "expired"
    ).length;



  const warningCount =
    orders.filter(
      (order) =>
       getExpiryStatus(order)
        === "warning"
    ).length;



  const activeCount =
    orders.length
    -
    expiredCount
    -
    warningCount;




  // ===============================
  // PAGINATION
  // ===============================
const filteredOrders = orders.filter((order) =>
  order.domainName
    .toLowerCase()
    .includes(search.toLowerCase())
);

  const totalPages =
    Math.ceil(
      filteredOrders.length /
      itemsPerPage
    );



  const paginatedOrders =
    filteredOrders.slice(

      (currentPage - 1)
      *
      itemsPerPage,

      currentPage
      *
      itemsPerPage

    );



  if (loading)

    return (

      <p className="text-center mt-10 text-gray-500">

        Loading renewals...

      </p>

    );



  return (

    <div className="min-h-screen bg-gray-100 p-6">

      {/* // ===============================
// HEADER
// =============================== */}


      <div className="mb-6">

        <h1 className="text-3xl font-bold text-gray-900">
          Renewal Management
        </h1>


        <p className="text-gray-500 mt-1">
          Monitor upcoming domain renewals and expired domains
        </p>


      </div>




      {/* 
// ===============================
// SUMMARY CARDS
// =============================== */}


      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">


        <div className="bg-white rounded-xl shadow-sm border p-5">

          <p className="text-sm text-gray-500">
            Expired Domains
          </p>


          <h2 className="text-3xl font-bold text-red-600 mt-2">
            {expiredCount}
          </h2>


        </div>




        <div className="bg-white rounded-xl shadow-sm border p-5">

          <p className="text-sm text-gray-500">
            Expires Within 15 Days
          </p>


          <h2 className="text-3xl font-bold text-orange-500 mt-2">
            {warningCount}
          </h2>


        </div>





        <div className="bg-white rounded-xl shadow-sm border p-5">

          <p className="text-sm text-gray-500">
            Active Domains
          </p>


          <h2 className="text-3xl font-bold text-green-600 mt-2">
            {activeCount}
          </h2>


        </div>



      </div>




      {/* 
// ===============================
// FILTER BAR
// =============================== */}


      <div className="flex flex-col md:flex-row justify-between items-center mb-5 gap-4">



        <div className="inline-flex bg-gray-100 rounded-xl p-1">


          <button

            onClick={() => {

              setSelectedTab("previous");

              setCurrentPage(1);

            }}

            className={`
px-5 py-2 rounded-lg text-sm font-medium transition

${selectedTab === "previous"

                ?

                "bg-white shadow text-blue-600"

                :

                "text-gray-600 hover:text-gray-900"

              }

`}

          >

            Previous Month

          </button>





          <button

            onClick={() => {

              setSelectedTab("current");

              setCurrentPage(1);

            }}

            className={`
px-5 py-2 rounded-lg text-sm font-medium transition

${selectedTab === "current"

                ?

                "bg-white shadow text-blue-600"

                :

                "text-gray-600 hover:text-gray-900"

              }

`}

          >

            Current Month

          </button>






          <button

            onClick={() => {

              setSelectedTab("next");

              setCurrentPage(1);

            }}

            className={`
px-5 py-2 rounded-lg text-sm font-medium transition

${selectedTab === "next"

                ?

                "bg-white shadow text-blue-600"

                :

                "text-gray-600 hover:text-gray-900"

              }

`}

          >

            Next Month

          </button>



        </div>





        <input

          value={search}

          onChange={(e) => {

            setSearch(e.target.value);

            setCurrentPage(1);

          }}

          placeholder="Search domain..."

          className="
w-full md:w-80
border
border-gray-300
rounded-lg
px-4
py-2
bg-white
focus:outline-none
focus:ring-2
focus:ring-blue-500
"

        />



      </div>






      {/* // ===============================
// TABLE
// =============================== */}


      <div className="
bg-white
rounded-xl
shadow-sm
border
overflow-hidden
">



<div className="bg-white shadow rounded-lg overflow-x-auto">

<table className="w-full table-fixed text-sm">

<thead className="bg-gray-50">
<tr>

<th className="w-[60px] px-4 py-4 text-center text-xs font-semibold text-gray-500 uppercase">
  SL No
</th>

<th className="w-[250px] px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
  Domain Name
</th>

<th className="w-[250px] px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
  Customer
</th>

<th className="w-[180px] px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
  Services
</th>

<th className="w-[130px] px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
  Expiry Date
</th>

<th className="w-[120px] px-4 py-4 text-center text-xs font-semibold text-gray-500 uppercase">
  Status
</th>

<th className="w-[180px] px-4 py-4 text-center text-xs font-semibold text-gray-500 uppercase">
  Actions
</th>

</tr>
</thead>


<tbody>

{paginatedOrders.map((order,index)=>(

<tr
key={order._id}
className="hover:bg-gray-50 transition border-b"
>


{/* SL NO */}
<td className="px-4 py-4 text-center text-gray-600">
{(currentPage - 1) * itemsPerPage + index + 1}
</td>


{/* DOMAIN */}
<td className="px-4 py-4">

<div className="flex items-center gap-2">

{
order.lockStatus === "Locked"
?
<FaLock className="text-red-500 shrink-0"/>
:
<FaLock className="text-green-500 shrink-0"/>
}

<span className="truncate">
{order.domainName || "-"}
</span>

</div>

</td>



{/* CUSTOMER */}
<td className="px-4 py-4">

<span className="text-gray-800 truncate block">

{
order.client?.c_company
?
order.client.c_company
:
order.client?.c_name
?
order.client.c_name
:
"N/A"
}

</span>

</td>




{/* SERVICES */}
<td className="px-4 py-4 text-left">

<div className="flex items-center gap-2 whitespace-nowrap">

<ServiceIcons order={order}/>

</div>

</td>




{/* EXPIRY */}
<td className="px-4 py-4 text-center">

<ExpiryBadge order={order}/>

</td>




{/* STATUS */}
<td className="px-4 py-4 text-center">


{/* STATUS */}

<div className="flex flex-col items-center gap-1">

 
<span
  className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${getStatusClass(
    order.order_status?.name
  )}`}
>
  {order.order_status?.name || "-"}
</span>

</div>

</td>




{/* ACTIONS */}
<td className="px-4 py-4">

<div className="flex items-center justify-center gap-3">


<button
title="View"
className="text-blue-500 hover:text-blue-700"
>
<FaEye/>
</button>


<Link
  to={`/admin/orders/update/${order._id}`}
  state={{ from: "renewal" }}
  title="Edit"
  className="text-yellow-500 hover:text-yellow-700"
>
  <FaEdit />
</Link>



<Link
to={`/admin/orders/renew/${order._id}`}
title="Renew"
className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs"
>

<FaSyncAlt/>
Renew

</Link>


</div>

</td>


</tr>

))}

</tbody>

</table>

</div>


      </div>




      {/* 

// ===============================
// PAGINATION
// ===============================
 */}

      <div className="
flex
justify-center
items-center
gap-5
mt-6
">


        <button

          disabled={currentPage === 1}

          onClick={() => {

            setCurrentPage(
              prev => Math.max(1, prev - 1)
            )

          }}

          className="
px-4
py-2
bg-white
border
rounded-lg
disabled:opacity-50
"

        >

          Previous

        </button>





        <span className="
text-gray-600
">

          Page {currentPage} of {totalPages}

        </span>






        <button

          disabled={currentPage === totalPages}

          onClick={() => {

            setCurrentPage(
              prev => Math.min(totalPages, prev + 1)
            )

          }}

          className="
px-4
py-2
bg-white
border
rounded-lg
disabled:opacity-50
"

        >

          Next

        </button>



      </div>




    </div>


  );


};



export default RenewList;