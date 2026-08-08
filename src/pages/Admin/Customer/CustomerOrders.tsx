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
import { Import } from "lucide-react";
import ServiceIcons from "../Order/ServiceIcons";
import ExpiryBadge from "../Order/ExpiryBadge";
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

<table className="w-full table-fixed text-sm">

<thead className="bg-gray-50 border-b">
<tr>

<th className="w-[60px] px-4 py-3 text-center">
#
</th>

<th className="w-[350px] px-4 py-3 text-left">
Domain
</th>

<th className="w-[200px] px-4 py-3 text-left">
Services
</th>

<th className="w-[150px] px-4 py-3 text-center">
Expiry
</th>

<th className="w-[120px] px-4 py-3 text-center">
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


        {/* NUMBER */}
      <td className="w-[60px] px-4 py-4 text-center">
  {index + 1}
</td>


        {/* DOMAIN + CUSTOMER */}
        <td className="px-4 py-4">

          <div className="flex items-center gap-3">


      

              {
                 order.lockStatus === "Locked"
                 ?
                 <FaLock className="text-red-500 shrink-0"/>
                 :
                 <FaLock className="text-green-500 shrink-0"/>
                 }

        



       <div className="min-w-0">

  <p className="font-semibold text-gray-800 truncate">
    {order?.domainName || "-"}
  </p>

  {/* <p className="text-xs text-gray-500">
    {customer?.c_company || "-"}
  </p> */}

</div>


          </div>


        </td>





        {/* SERVICES */}
<td className="px-4 py-4 text-left">
  <div className="flex items-center">
    <ServiceIcons order={order} />
  </div>
</td>




        {/* EXPIRY DATE */}
        <td className="px-1 py-4 font-medium text-center">

          <div className="flex justify-center">

            <ExpiryBadge order={order} />

          </div>

        </td>







        {/* STATUS */}
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