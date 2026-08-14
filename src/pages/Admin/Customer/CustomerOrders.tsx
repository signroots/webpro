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
import OrdersTable from "../Order/OrdersTable";
const CustomerOrders: React.FC = () => {

  console.log("🔥 CustomerOrders COMPONENT LOADED");


  const { customerId } = useParams();
  const navigate = useNavigate();
const [modalType, setModalType] =
  useState<"view" | "edit" | "addCustomer" | null>(null);

  const [customer, setCustomer] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const closeModal = () => {
    setSelectedOrder(null);
    setModalType(null);
  };

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

const handleEdit = (order: any) => {
  navigate(`/admin/orders/update/${order._id}`, {
    state: {
      highlightOrderId: order._id,
    },
  });
};

const getStatusClass = (status?: string) => {
  const value = status?.trim().toLowerCase();

  // Empty / N/A
  if (!value) {
    return "bg-blue-100 text-blue-800";
  }

  // Expired
  if (value === "expired") {
    return "bg-red-600 text-white";
  }

  // Active
  if (value === "active") {
    return "bg-gray-100 text-green-700";
  }

  // Other status
  return "bg-gray-200 text-gray-800";
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
{/* ORDERS TABLE */}
<OrdersTable 
  paginatedOrders={orders}
  setSelectedOrder={setSelectedOrder} 
  setModalType={setModalType} 
  handleEdit={handleEdit} 
  getStatusClass={getStatusClass} 
  navigate={navigate} 
/>

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