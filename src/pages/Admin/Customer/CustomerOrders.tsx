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

<div className="flex items-center justify-center gap-3">


{/* DOMAIN SOURCE */}
{order.domainSource ? (

  order.domainSource.toLowerCase() === "resellerclub" ? (

    <img
      src="/images/resellerclub.png"
      className="w-6 h-6"
      title="ResellerClub"
    />

  ) : order.domainSource.toLowerCase() === "cloudflare" && order.domain_flag ? (

    <img
      src="/dns_logo.png"
      className="w-6 h-6"
      title="DNS Cloudflare"
    />

  ) : order.domainSource.toLowerCase() === "cloudflare" ? (

    <img
      src="/images/cloudflare.png"
      className="w-7 h-7"
      title="Cloudflare"
    />

  ) : order.domainSource.toLowerCase() === "hostinger" ? (

    <SiHostinger
      className="w-6 h-6 text-blue-500"
      title="Hostinger"
    />

  ) : (

    <FaGlobe
      className="w-6 h-6 text-gray-400"
      title={order.domainSource}
    />

  )

) : (

<FaGlobe
 className="w-6 h-6 text-gray-300"
 title="Domain"
/>

)}



{/* EMAIL */}

{order.google_email ? (

<img
 src="/download.png"
 className="w-5 h-5"
 title="Google Workspace"
/>

) : order.microsoft_email ? (

<img
 src="/microsoft.png"
 className="w-5 h-5"
 title="Microsoft 365"
/>

) : null}




{/* MS OFFICE */}

{order.msoffice_services_flag && (

<img
 src="/MSOffice.png"
 className="w-5 h-5"
 title="MS Office"
/>

)}




{/* HOSTING */}

{order.hosting && (

<FaServer
 className="w-5 h-5 text-purple-500"
 title="Hosting"
/>

)}




{/* WEBSITE */}

{order.website_flag && (

<FaLaptopCode
 className="w-5 h-5 text-purple-500"
 title="Website"
/>

)}



</div>

</td>


                    <td className="px-4 py-4 text-center">

<div className="flex flex-col gap-1">


{/* Domain Expiry */}
{order.domainExpiryDate && (
  <span className="text-sm">
    🌐 {new Date(order.domainExpiryDate).toLocaleDateString()}
  </span>
)}



{/* Email Expiry */}
{order.emailExpiryDate?.map(
  (date:string,index:number)=>(
    <span 
      key={index}
      className="text-sm text-blue-600"
    >
      ✉️ {new Date(date).toLocaleDateString()}
    </span>
  )
)}


{
 !order.domainExpiryDate &&
 !order.emailExpiryDate?.length &&
 (
  <span className="text-gray-400">
    N/A
  </span>
 )
}


</div>

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