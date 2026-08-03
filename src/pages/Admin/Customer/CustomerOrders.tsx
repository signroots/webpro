import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  FaGlobe, 
  FaEnvelope, 
  FaServer,
  FaLock,
  FaLaptopCode
} from "react-icons/fa";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
import { SiHostinger } from "react-icons/si";

const CustomerOrders: React.FC = () => {

  console.log("🔥 CustomerOrders COMPONENT LOADED");


  const { customerId } = useParams();
  const navigate = useNavigate();


  const [customer, setCustomer] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);



  useEffect(() => {

    if (customerId) {
      fetchCustomerOrders();
    }

  }, [customerId]);




  const fetchCustomerOrders = async () => {

    try {


      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/orders/customer_order_details/${customerId}`
      );


      console.log(
        "Customer Order API Response:",
        response.data
      );



      if (response.data.status === "SUCCESS") {

        setCustomer(response.data.client);
        setOrders(response.data.orders || []);

      }



    } catch (error) {


      console.error(
        "Customer orders fetch error",
        error
      );


    } finally {


      setLoading(false);


    }

  };





  if (loading) {

    return (

      <div className="p-6">

        Loading...

      </div>

    );

  }





  return (

    <div className="p-6 bg-gray-100 min-h-screen">



      {/* CUSTOMER DETAILS */}

      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">


        <h2 className="text-xl font-semibold mb-4">
          Customer Details
        </h2>



        <div className="grid grid-cols-3 gap-6 text-sm">


          <p>
            <b>Name:</b> {customer?.c_name || "-"}
          </p>


          <p>
            <b>Email:</b>{" "}
            {
              Array.isArray(customer?.c_email)
              ? customer.c_email.join(", ")
              : customer?.c_email || "-"
            }
          </p>



          <p>
            <b>Phone:</b>{" "}
            {customer?.c_countryCode || ""}
            {" "}
            {customer?.c_mobilePhone || "-"}
          </p>



          <p>
            <b>Company:</b> {customer?.c_company || "-"}
          </p>



          <p>
            <b>Address:</b> {customer?.c_address || "-"}
          </p>



          <p>
            <b>City:</b> {customer?.c_city || "-"}
          </p>



          <p>
            <b>State:</b> {customer?.c_state_name || "-"}
          </p>



          <p>
            <b>Country:</b> {customer?.c_country_name || "-"}
          </p>


        </div>


      </div>







      {/* ORDERS */}


      <div className="bg-white rounded-xl shadow-sm p-6">



        <div className="mb-5">


          <h2 className="text-xl font-semibold text-gray-800">

            Orders

          </h2>


          <p className="text-sm text-gray-500">

            Customer domain & service details

          </p>


        </div>





        <div className="overflow-x-auto">


          <table className="w-full text-sm">


            <thead className="bg-gray-50 border-b">


              <tr>


                <th className="px-4 py-3 text-left">
                  #
                </th>


                <th className="px-4 py-3 text-left">
                  Domain
                </th>
                <th className="px-4 py-3 text-center">
                Services
                </th>

                <th className="px-4 py-3 text-center">
                  Expiry
                </th>


                <th className="px-4 py-3 text-center">
                  Status
                </th>




              </tr>


            </thead>





            <tbody>


            {

              orders.length === 0 ? (


                <tr>


                  <td
                    colSpan={5}
                    className="text-center py-6 text-gray-500"
                  >

                    No orders found

                  </td>


                </tr>



              ) : (



                orders.map((order,index)=>(


                  <tr
                    key={order._id}
                    className="border-b hover:bg-gray-50 transition"
                  >



                    <td className="px-4 py-4 text-center">

                      {index + 1}

                    </td>





                    <td className="px-4 py-4">

  <div className="flex items-center gap-3">

    <div
      className="
      bg-green-100
      flex
      items-center
      justify-center
      "
    >

      <FaLock className="w-4 h-4 text-green-600" />

    </div>


    <div>

      <p className="font-semibold text-gray-800">
        {order.domainName || "-"}
      </p>


      <p className="text-xs text-gray-500">
        Domain
      </p>

    </div>


  </div>

</td>
{/* SERVICES */}
<td className="px-4 py-4">

  <div className="flex items-center justify-center gap-3 flex-wrap">


    {/* ================= DOMAIN SOURCE ================= */}

    {order.domainSource && order.domainSource.image ? (

      <img
        src={`${API_BASE_URL}${order.domainSource.image}`}
        className="w-6 h-6 object-contain flex-shrink-0"
        title={order.domainSource.name}
        alt={order.domainSource.name}
      />

    ) : (

      <FaGlobe
        className="w-6 h-6 text-gray-300 flex-shrink-0"
        title="Domain"
      />

    )}



    {/* ================= PLANS SERVICES ================= */}

    {order.Plans?.map(
      (plan:any, index:number) => (

        <div
          key={index}
          className="flex items-center justify-center gap-2"
        >


          {/* EMAIL TYPE IMAGE */}

          {plan.type === "email" && plan.emailTypeImage && (

            <img
              src={`${API_BASE_URL}${plan.emailTypeImage}`}
              className="w-5 h-5 object-contain flex-shrink-0"
              title={plan.emailType}
              alt={plan.emailType || "Email"}
            />

          )}



          {/* HOSTING */}

          {plan.type === "hosting" && (

            <FaServer
              className="w-5 h-5 text-purple-500 flex-shrink-0"
              title="Hosting"
            />

          )}



          {/* WEBSITE */}

          {plan.type === "website" && (

            <FaLaptopCode
              className="w-5 h-5 text-pink-500 flex-shrink-0"
              title="Website"
            />

          )}



          {/* SSL */}

          {plan.type === "ssl" && (

            <FaLock
              className="w-5 h-5 text-yellow-500 flex-shrink-0"
              title="SSL"
            />

          )}


        </div>

      )

    )}


  </div>

</td>

<td className="px-1 py-2 font-medium">
  {(() => {

    const formatDate = (date?: string): string | null => {

      if (!date) return null;

      const d = new Date(date);

      const day = d.getUTCDate()
        .toString()
        .padStart(2, "0");

      const month = (d.getUTCMonth() + 1)
        .toString()
        .padStart(2, "0");

      const year = d.getUTCFullYear();

      return `${day}/${month}/${year}`;

    };



    const domainDate: string | null = formatDate(
      order.domainExpiryDate
    );



    const emailDates: string[] = (order.emailExpiryDate || [])

      .map((date: string) => formatDate(date))

      .filter(
        (d: string | null): d is string => Boolean(d)
      );




    const isSameExpiry =
      Boolean(domainDate) &&
      emailDates.length > 0 &&
      emailDates.every(
        (date: string) => date === domainDate
      );




    const badgeBase =
      "inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium w-fit";



    const iconBase =
      "w-4 h-4 flex justify-center items-center rounded-full bg-white text-black text-[9px]";




    return (

      <div className="flex flex-col gap-1">



        {/* 🟢 ED - Email + Domain Same Expiry */}

        {isSameExpiry && domainDate && (

          <div
            className={`${badgeBase} bg-green-100 text-green-800`}
          >

            <span className={iconBase}>
              ED
            </span>

            {domainDate}

          </div>

        )}






        {/* 🔵 EE - Email Expiry */}

        {!isSameExpiry &&

          emailDates.map(
            (date: string, index: number) => (

              <div
                key={index}
                className={`${badgeBase} bg-blue-100 text-blue-800`}
              >

                <span className={iconBase}>
                  EE
                </span>

                {date}

              </div>

            )

          )

        }






        {/* 🟣 DE - Domain Expiry */}

        {!isSameExpiry && domainDate && (

          <div
            className={`${badgeBase} bg-purple-100 text-purple-800`}
          >

            <span className={iconBase}>
              DE
            </span>

            {domainDate}

          </div>

        )}






        {/* ⚪ No Expiry */}

        {
          !domainDate &&
          emailDates.length === 0 &&
          (

            <span className="text-gray-400 text-xs">
              N/A
            </span>

          )
        }




      </div>

    );


  })()}
</td>



                    <td className="px-4 py-4 text-center">


                      <span
                        className="
                        px-3
                        py-1
                        rounded-full
                        bg-green-100
                        text-green-700
                        text-xs
                        font-medium
                        "
                      >

                        {order.status || "ACTIVE"}

                      </span>


                    </td>





                   


                  </tr>


                ))

              )


            }


            </tbody>


          </table>


        </div>






        <button
          onClick={() => navigate(-1)}
          className="
          mt-5
          px-4
          py-2
          bg-gray-700
          text-white
          rounded
          "
        >

          ← Back

        </button>




      </div>




    </div>

  );


};


export default CustomerOrders;