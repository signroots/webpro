// ===============================
// RenewList.tsx PART 1A
// ===============================

import React, { useEffect, useState } from "react";

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


      try {


        const response =
          await fetchRenewListOrders();



        const ordersArray =
          response.data.data;



        console.log(
          "Renew Orders",
          ordersArray
        );



        setOrders(
          ordersArray
        );



      }
      catch (error) {


        console.error(
          "Renew list loading failed",
          error
        );


        setOrders([]);


      }
      finally {


        setLoading(false);


      }


    };



    loadOrders();


  }, []);




  // ===============================
  // MONTH FILTER
  // ===============================


  const today =
    new Date();


  const currentMonth =
    today.getMonth();


  const currentYear =
    today.getFullYear();



  const filteredOrders =
    orders.filter((order) => {


      if (!order.expiryDate)
        return false;



      const expiry =
        new Date(
          order.expiryDate
        );



      let month =
        currentMonth;


      let year =
        currentYear;



      if (selectedTab === "previous") {


        month--;



        if (month < 0) {

          month = 11;

          year--;

        }


      }



      if (selectedTab === "next") {


        month++;



        if (month > 11) {


          month = 0;

          year++;


        }


      }



      const monthMatch =
        expiry.getMonth()
        ===
        month;



      const yearMatch =
        expiry.getFullYear()
        ===
        year;



      const searchMatch =
        order.domainName
          .toLowerCase()
          .includes(
            search.toLowerCase()
          );



      return (
        monthMatch &&
        yearMatch &&
        searchMatch
      );



    });




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



        <table className="
min-w-full
text-sm
">



          <thead className="bg-gray-50">


            <tr>


              {

                [

                  "SL No",

                  "Domain Name",

                  "Customer",

                  "Services",

                  "Expiry Date",

                  "Status",

                  "Actions"

                ]

                  .map((col) => (


                    <th

                      key={col}

                      className="
px-6
py-4
text-left
text-xs
font-semibold
text-gray-500
uppercase
tracking-wide
"

                    >

                      {col}

                    </th>


                  ))

              }



            </tr>


          </thead>





          <tbody>


            {

              paginatedOrders.map((order, index) => (


                <tr

                  key={order._id}

                  className="
hover:bg-gray-50
transition
border-b
last:border-b-0
"

                >


                  <td className="
px-6
py-4
text-gray-600
">

                    {
                      (currentPage - 1)
                      *
                      itemsPerPage
                      +
                      index
                      +
                      1
                    }

                  </td>





                  <td className="
px-6
py-4
font-medium
text-gray-900
">


                    <div className="flex items-center gap-2">


                      {

                        order.lockStatus === "Locked"

                          ?

                          <FaLock className="text-red-500" />

                          :

                          <FaLock className="text-green-500" />

                      }



                      <span>

                        {order.domainName}

                      </span>



                    </div>


                  </td>






                 <td className="px-6 py-4">
  {
    order.client?.c_company
      ?
      <span className="text-gray-800">
        {order.client.c_company}
      </span>
      :
      order.client?.c_name
        ?
        <span className="text-gray-800">
          {order.client.c_name}
        </span>
        :
        <span className="text-gray-400">
          N/A
        </span>
  }
</td>




{/* ================= SERVICES ================= */}

<td className="px-6 py-4">

  <div className="flex items-center gap-3">


    {/* ================= DOMAIN SOURCE ================= */}

    {
      order.domainSource?.image
      ?

      <img
        src={
          order.domainSource.image.startsWith("/uploads")
          ?
          `${import.meta.env.VITE_API_BASE_URL}${order.domainSource.image}`
          :
          `/images/${order.domainSource.image}`
        }
        className="w-7 h-7 object-contain"
        title={order.domainSource.name}

        onError={(e)=>{

          e.currentTarget.src =
          "/images/default-domain.png";

        }}
      />

      :

      <FaGlobe
        className="
        w-6
        h-6
        text-gray-300
        "
        title="No Registrar"
      />

    }




    {/* ================= EMAIL ================= */}


    {
      order.Plans
      ?.filter(
        plan=>plan.type==="email"
      )
      .map(
        (plan,index)=>(


        <div
          key={index}
          className="relative group"
        >


          <img

            src={
              plan.emailTypeImage
              ?
              `${import.meta.env.VITE_API_BASE_URL}${plan.emailTypeImage}`
              :
              "/images/default-email.png"
            }

            className="
            w-5
            h-5
            cursor-pointer
            "

            title={
              plan.emailType
            }

          />



          {/* EMAIL TOOLTIP */}

          <div
          className="
          hidden
          group-hover:block
          absolute
          top-full
          left-0
          mt-2
          bg-gray-900
          text-white
          text-xs
          p-2
          rounded
          w-48
          z-50
          "
          >

          <p>
          {plan.emailType}
          </p>

          {
            plan.expiryDate &&
            <p>
            Exp:
            {" "}
            {
            new Date(
              plan.expiryDate
            )
            .toLocaleDateString()
            }
            </p>
          }


          </div>


        </div>


      ))
    }



{/* ================= HOSTING ================= */}

<FaServer
  className={
    order.hosting
      ? "w-5 h-5 text-purple-500"
      : "w-5 h-5 text-gray-300 opacity-40"
  }
  title="Hosting"
/>

   {/* ================= WEBSITE ================= */}

<FaLaptopCode
  className={
    order.website_flag
      ? "w-5 h-5 text-pink-500"
      : "w-5 h-5 text-gray-300 opacity-40"
  }
  title="Website"
/>


{/* ================= SSL ================= */}

<img
  src="/ssl.jpg"
  className={
    order.ssl_flag
      ? "w-5 h-5"
      : "w-5 h-5 opacity-30 grayscale"
  }
  title="SSL"
  onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.style.display = "none";
  }}
/>

  </div>

</td>








                  <td className="
px-6
py-4
">


                    {

                      order.expiryDate


                        ?

                        <span className="
font-medium
text-gray-700
">


                          {

                            new Date(order.expiryDate)

                              .toLocaleDateString("en-GB")

                              .replace(/\//g, "-")

                          }


                        </span>


                        :

                        "N/A"


                    }


                  </td>









                  <td className="
px-6
py-4
">


                    {

                    getExpiryStatus(order)
                        === "expired"


                        ?


                        <span className="
px-3
py-1
rounded-full
text-xs
font-semibold
bg-red-100
text-red-700
">

                          Expired

                        </span>



                        :


                getExpiryStatus(order)
                          === "warning"


                          ?


                          <span className="
px-3
py-1
rounded-full
text-xs
font-semibold
bg-orange-100
text-orange-700
">

                            15 Days Left

                          </span>



                          :


                          <span className="
px-3
py-1
rounded-full
text-xs
font-semibold
bg-green-100
text-green-700
">

                            Active

                          </span>


                    }



                  </td>









                  <td className="
px-6
py-4
">


                    <div className="
flex
items-center
gap-3
">


                      <button

                        title="View"

                        className="
text-blue-500
hover:text-blue-700
"

                      >

                        <FaEye />

                      </button>





                      <Link

                        to={`/admin/orders/update/${order._id}`}

                        title="Edit"

                        className="
text-yellow-500
hover:text-yellow-700
"

                      >

                        <FaEdit />

                      </Link>






                      <Link

                        to={`/admin/orders/renew/${order._id}`}

                        title="Renew"

                        className="
flex
items-center
gap-1
bg-green-600
hover:bg-green-700
text-white
px-3
py-1.5
rounded-lg
text-xs
"

                      >


                        <FaSyncAlt />

                        Renew


                      </Link>




                    </div>


                  </td>





                </tr>


              ))


            }



          </tbody>


        </table>


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