import React, {
  useEffect,
  useState
} from "react";

import {
  Link,
  useParams
} from "react-router-dom";


import {
  FaEdit,
  FaEye,
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


import {
  fetchCustomerOrders,
  updateCustomer,
  Order,
  Client,
  ICustomer
} from "./api";


import {
  fetchCountryCodes
} from "../../Customer/api";



const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL;



// =================================
// TYPES
// =================================


interface EditClient extends Partial<Client> {

  _id: string;

}



interface Country {

  _id: string;

  name: string;

}



interface State {

  _id: string;

  name: string;

}



// =================================
// COMPONENT
// =================================


const CustomerOrders: React.FC = () => {


  const {
    customerId
  } = useParams<{
    customerId: string
  }>();




  const [
    client,
    setClient
  ] = useState<Client | null>(null);



  const [
    orders,
    setOrders
  ] = useState<Order[]>([]);



  const [
    loading,
    setLoading
  ] = useState(true);



  const [
    countries,
    setCountries
  ] = useState<Country[]>([]);



  const [
    states,
    setStates
  ] = useState<State[]>([]);



  const [
    editClient,
    setEditClient
  ] = useState<EditClient | null>(null);



  const [
    isModalOpen,
    setIsModalOpen
  ] = useState(false);



  const [
    saving,
    setSaving
  ] = useState(false);



  const [
    phoneCodes,
    setPhoneCodes
  ] = useState<string[]>([]);



  const [
    phoneCode,
    setPhoneCode
  ] = useState("+91");



  const [
    search,
    setSearch
  ] = useState("");




  // =================================
  // EXPIRY STATUS
  // =================================


  const getExpiryStatus = (
    date?: string
  ) => {


    if (!date)

      return "normal";



    const today =
      new Date();


    today.setHours(
      0,
      0,
      0,
      0
    );



    const expiry =
      new Date(date);


    expiry.setHours(
      0,
      0,
      0,
      0
    );



    const diff =
      Math.ceil(
        (
          expiry.getTime()
          -
          today.getTime()
        )
        /
        (
          1000 * 60 * 60 * 24
        )
      );



    if (diff < 0)

      return "expired";



    if (diff <= 15)

      return "warning";



    return "active";


  };




  // =================================
  // LOAD CUSTOMER ORDERS
  // =================================


  const loadCustomerOrders =
    async () => {


      if (!customerId)

        return;



      setLoading(true);


      try {


        const data =
          await fetchCustomerOrders(
            customerId
          );



        if (data.status === "SUCCESS") {


          const customer: Client = {


            _id: data.client._id,


            c_name: data.client.c_name,


            c_email:
              data.client.c_email || [],


            c_phone:
              data.client.c_phone || "",


            c_mobilePhone:
              data.client.c_mobilePhone || "",



            c_company:
              data.client.c_company || "",



            c_address:
              data.client.c_address || "",



            c_address2:
              data.client.c_address2 || "",



            c_city:
              data.client.c_city || "",



            c_state:
              data.client.c_state || "",



            c_country:
              data.client.c_country || "",



            c_zipCode:
              data.client.c_zipCode || "",



            c_gst:
              data.client.c_gst || "",



            c_countryCode:
              data.client.c_countryCode || "",



            c_country_name:
              countries.find(
                c => c._id === data.client.c_country
              )?.name || ""



          };



          setClient(customer);



          setOrders(
            data.orders || []
          );



        }



      }
      catch (error) {


        console.error(
          "Customer loading failed",
          error
        );


      }
      finally {


        setLoading(false);


      }



    };





  // =================================
  // LOAD COUNTRIES
  // =================================


  useEffect(() => {


    const loadCountries =
      async () => {


        try {


          const res =
            await fetch(
              `${API_BASE_URL}/api/settings/countries`
            );



          const data =
            await res.json();



          setCountries(data);



        }
        catch (err) {


          console.error(err);


        }



      };



    loadCountries();



  }, []);





  // =================================
  // LOAD CUSTOMER
  // =================================


  useEffect(() => {


    loadCustomerOrders();


  }, [
    customerId,
    countries
  ]);






  // =================================
  // PHONE CODES
  // =================================


  useEffect(() => {


    fetchCountryCodes()

      .then(
        codes =>
          setPhoneCodes(codes)
      )

      .catch(
        console.error
      );



  }, []);






  // =================================
  // COUNTS
  // =================================


  const domainCount =
    orders.length;



  const emailCount =
    orders.filter(
      o =>
        o.google_email ||
        o.microsoft_email
    ).length;



  const expiredCount =
    orders.filter(
      o =>
        getExpiryStatus(
          o.expiryDate
        )
        === "expired"
    ).length;



  const warningCount =
    orders.filter(
      o =>
        getExpiryStatus(
          o.expiryDate
        )
        === "warning"
    ).length;




  const filteredOrders =
    orders.filter(
      order =>
        order.domainName
          .toLowerCase()
          .includes(
            search.toLowerCase()
          )
    );





  if (loading)

    return (

      <div className="
flex
justify-center
items-center
h-screen
text-gray-500
">

        Loading customer...

      </div>

    );



  if (!client)

    return (

      <div className="
text-center
mt-10
text-red-500
">

        Customer not found

      </div>

    );



  return (

    <div className="
min-h-screen
bg-gray-100
p-6
text-gray-900
">
      {/* ================================
    CUSTOMER PROFILE CARD
================================ */}


      <div className="
bg-white
rounded-2xl
shadow-sm
border
border-gray-200
p-6
mb-6
">


        <div className="
flex
justify-between
items-start
">


          <div>


            <div className="
flex
items-center
gap-4
">


              <div className="
w-14
h-14
rounded-full
bg-blue-600
text-white
flex
items-center
justify-center
text-2xl
font-bold
">


                {
                  client.c_name
                    ?.charAt(0)
                    .toUpperCase()
                }


              </div>



              <div>


                <h2 className="
text-2xl
font-semibold
text-gray-800
">

                  {client.c_name}

                </h2>


                <p className="
text-gray-500
">

                  {client.c_company || "No Company"}

                </p>



              </div>



            </div>



          </div>





          <button

            onClick={() => {

              setEditClient({
                ...client
              });

              setPhoneCode(
                client.c_countryCode || "+91"
              );

              setIsModalOpen(true);

            }}

            className="
flex
items-center
gap-2
px-4
py-2
rounded-lg
bg-blue-600
text-white
hover:bg-blue-700
transition
"

          >

            <FaEdit />

            Edit

          </button>



        </div>







        <div className="
grid
grid-cols-1
md:grid-cols-3
gap-5
mt-6
text-sm
">


          <div>

            <p className="
text-gray-400
">

              Email

            </p>

            <p className="
font-medium
">

              {

                Array.isArray(client.c_email)

                  ?

                  client.c_email.join(", ")

                  :

                  "-"

              }

            </p>


          </div>





          <div>

            <p className="
text-gray-400
">

              Phone

            </p>


            <p className="
font-medium
">

              {

                client.c_mobilePhone

                  ?

                  `${client.c_countryCode || ""} ${client.c_mobilePhone}`

                  :

                  "-"

              }


            </p>


          </div>





          <div>

            <p className="
text-gray-400
">

              Country

            </p>


            <p className="
font-medium
">

              {
                client.c_country_name || "-"
              }

            </p>


          </div>




          <div>

            <p className="
text-gray-400
">

              Address

            </p>


            <p className="
font-medium
">

              {
                client.c_address || "-"
              }

            </p>


          </div>




          <div>

            <p className="
text-gray-400
">

              City

            </p>


            <p className="
font-medium
">

              {
                client.c_city || "-"
              }

            </p>


          </div>




          <div>

            <p className="
text-gray-400
">

              GST

            </p>


            <p className="
font-medium
">

              {
                client.c_gst || "-"
              }

            </p>


          </div>



        </div>



      </div>








      {/* ================================
    SUMMARY CARDS
================================ */}



      <div className="
grid
grid-cols-1
md:grid-cols-4
gap-5
mb-6
">



        <div className="
bg-white
rounded-xl
shadow-sm
border
p-5
">

          <p className="
text-gray-500
text-sm
">

            Total Orders

          </p>


          <h3 className="
text-3xl
font-bold
text-blue-600
">

            {domainCount}

          </h3>


        </div>





        <div className="
bg-white
rounded-xl
shadow-sm
border
p-5
">


          <p className="
text-gray-500
text-sm
">

            Email Services

          </p>


          <h3 className="
text-3xl
font-bold
text-purple-600
">

            {emailCount}

          </h3>



        </div>







        <div className="
bg-white
rounded-xl
shadow-sm
border
p-5
">


          <p className="
text-gray-500
text-sm
">

            Renew Soon

          </p>


          <h3 className="
text-3xl
font-bold
text-orange-500
">

            {warningCount}

          </h3>


        </div>







        <div className="
bg-white
rounded-xl
shadow-sm
border
p-5
">


          <p className="
text-gray-500
text-sm
">

            Expired

          </p>


          <h3 className="
text-3xl
font-bold
text-red-600
">

            {expiredCount}

          </h3>


        </div>




      </div>








      {/* ================================
    ORDERS HEADER
================================ */}



      <div className="
bg-white
rounded-2xl
shadow-sm
border
p-6
">



        <div className="
flex
justify-between
items-center
mb-5
">


          <div>


            <h2 className="
text-xl
font-semibold
">

              Orders

            </h2>


            <p className="
text-gray-500
text-sm
">

              Customer domain & service details

            </p>



          </div>





          <input

            type="text"

            placeholder="Search domain..."

            value={search}

            onChange={
              e => setSearch(
                e.target.value
              )
            }


            className="
px-4
py-2
border
rounded-lg
outline-none
focus:ring-2
focus:ring-blue-400
"

          />

          {/* ================================
        ORDERS TABLE
================================ */}


          <div className="
overflow-x-auto
">


            <table className="
min-w-full
text-sm
">


              <thead
                className="
bg-gray-50
border-b
"
              >

                <tr>


                  <th className="
px-5
py-4
text-left
font-semibold
text-gray-600
">

                    #

                  </th>


                  <th className="
px-5
py-4
text-left
font-semibold
text-gray-600
">

                    Domain

                  </th>


                  <th className="
px-5
py-4
text-left
font-semibold
text-gray-600
">

                    Services

                  </th>


                  <th className="
px-5
py-4
text-left
font-semibold
text-gray-600
">

                    Expiry

                  </th>


                  <th className="
px-5
py-4
text-left
font-semibold
text-gray-600
">

                    Status

                  </th>



                </tr>


              </thead>





              <tbody
                className="
divide-y
"
              >



                {
                  filteredOrders.map(
                    (order, index) => {


                      const expiryStatus =
                        getExpiryStatus(
                          order.expiryDate
                        );



                      return (



                        <tr

                          key={order._id}

                          className={`
transition
hover:bg-gray-50

${expiryStatus === "expired"

                              ?

                              "bg-red-50"

                              :

                              expiryStatus === "warning"

                                ?

                                "bg-orange-50"

                                :

                                ""
                            }

`}

                        >




                          <td className="
px-5
py-4
text-gray-500
">

                            {index + 1}

                          </td>







                          <td className="
px-5
py-4
">


                            <div className="
flex
items-center
gap-3
">


                              <div
                                className={`
w-8
h-8
rounded-full
flex
items-center
justify-center

${expiryStatus === "expired"

                                    ?

                                    "bg-red-100 text-red-600"

                                    :

                                    expiryStatus === "warning"

                                      ?

                                      "bg-orange-100 text-orange-600"

                                      :

                                      "bg-green-100 text-green-600"

                                  }

`}
                              >


                                <FaLock />


                              </div>




                              <div>


                                <p className="
font-semibold
text-gray-800
">

                                  {order.domainName}

                                </p>



                                <p className="
text-xs
text-gray-400
">

                                  Domain

                                </p>


                              </div>


                            </div>


                          </td>









                          <td className="
px-5
py-4
">


                            <div className="
flex
items-center
gap-3
">



                              {/* Domain Source */}

                              {

                                order.domainSource?.toLowerCase()
                                  === "resellerclub"

                                  ?

                                  <img
                                    src="/images/resellerclub.png"
                                    className="w-7 h-7"
                                  />

                                  :

                                  order.domainSource?.toLowerCase()
                                    === "cloudflare"

                                    ?

                                    <SiCloudflare
                                      className="
w-6
h-6
text-orange-500
"
                                    />


                                    :

                                    order.domainSource?.toLowerCase()
                                      === "hostinger"

                                      ?

                                      <SiHostinger
                                        className="
w-6
h-6
text-blue-500
"
                                      />


                                      :

                                      <FaGlobe
                                        className="
w-6
h-6
text-gray-400
"
                                      />


                              }





                              {/* Email */}


                              {

                                order.google_email

                                  ?

                                  <img
                                    src="/download.png"
                                    title="Google Workspace"
                                    className="w-5 h-5"
                                  />


                                  :

                                  order.microsoft_email

                                    ?

                                    <img
                                      src="/microsoft.png"
                                      title="Microsoft 365"
                                      className="w-5 h-5"
                                    />


                                    :

                                    <FaEnvelope
                                      className="
w-5
h-5
text-gray-300
"
                                    />


                              }







                              {/* Hosting */}

                              {

                                order.hosting &&

                                <FaServer
                                  className="
w-5
h-5
text-purple-500
"
                                />

                              }







                              {/* Website */}

                              {

                                order.website_flag &&

                                <FaLaptopCode
                                  className="
w-5
h-5
text-pink-500
"
                                />

                              }



                            </div>


                          </td>









                          <td className="
px-5
py-4
">


                            {

                              order.expiryDate

                                ?

                                <div

                                  className={`
inline-flex
px-3
py-1
rounded-full
text-xs
font-semibold


${expiryStatus === "expired"

                                      ?

                                      "bg-red-600 text-white"

                                      :

                                      expiryStatus === "warning"

                                        ?

                                        "bg-orange-500 text-white"

                                        :

                                        "bg-green-100 text-green-700"

                                    }

`}

                                >


                                  {
                                    new Date(
                                      order.expiryDate
                                    )
                                      .toLocaleDateString(
                                        "en-GB"
                                      )
                                      .replace(
                                        "/",
                                        "-"
                                      )
                                  }



                                </div>


                                :

                                <span className="
text-gray-400
">

                                  N/A

                                </span>


                            }


                          </td>









                          <td className="
px-5
py-4
">


                            <span

                              className={`
px-3
py-1
rounded-full
text-xs
font-semibold


${expiryStatus === "expired"

                                  ?

                                  "bg-red-100 text-red-700"

                                  :

                                  expiryStatus === "warning"

                                    ?

                                    "bg-orange-100 text-orange-700"

                                    :

                                    "bg-green-100 text-green-700"

                                }

`}


                            >


                              {


                                expiryStatus === "expired"

                                  ?

                                  "Expired"


                                  :

                                  expiryStatus === "warning"

                                    ?

                                    "Renew Soon"


                                    :

                                    "Active"



                              }



                            </span>


                          </td>





                        </tr>


                      )


                    }

                  )

                }



              </tbody>


            </table>


          </div>





        </div>

        {/* orders card closing */}

      </div>
      {/* ================================
        EDIT CUSTOMER MODAL
================================ */}


      {
        isModalOpen &&
        editClient &&

        <div className="
fixed
inset-0
bg-black/40
flex
items-center
justify-center
z-50
p-4
">


          <div className="
bg-white
rounded-2xl
shadow-xl
w-full
max-w-5xl
max-h-[90vh]
overflow-y-auto
p-6
">



            <div className="
flex
justify-between
items-center
mb-6
">


              <h2 className="
text-xl
font-semibold
">

                Edit Customer

              </h2>


              <button

                onClick={() =>
                  setIsModalOpen(false)
                }

                className="
text-gray-500
hover:text-red-500
text-xl
"

              >

                ✕

              </button>



            </div>







            {/* PERSONAL INFORMATION */}


            <h3 className="
text-sm
font-semibold
text-blue-600
mb-3
">

              Personal Information

            </h3>



            <div className="
grid
grid-cols-1
md:grid-cols-3
gap-4
">


              <input

                className="
border
rounded-lg
p-3
"

                placeholder="Name"

                value={
                  editClient.c_name || ""
                }

                onChange={
                  e =>
                    setEditClient(
                      prev =>
                        prev
                          ?
                          {
                            ...prev,
                            c_name: e.target.value
                          }
                          : null
                    )

                }

              />




              <input

                className="
border
rounded-lg
p-3
"

                placeholder="Company"

                value={
                  editClient.c_company || ""
                }

                onChange={
                  e =>
                    setEditClient(
                      prev =>
                        prev
                          ?
                          {
                            ...prev,
                            c_company: e.target.value
                          }
                          : null
                    )

                }

              />






              <input

                className="
border
rounded-lg
p-3
"

                placeholder="GST"

                value={
                  editClient.c_gst || ""
                }

                onChange={
                  e =>
                    setEditClient(
                      prev =>
                        prev
                          ?
                          {
                            ...prev,
                            c_gst: e.target.value
                          }
                          : null
                    )

                }

              />



            </div>







            {/* EMAIL */}


            <div className="
mt-5
">


              <label className="
text-sm
font-medium
">

                Email

              </label>



              <input

                className="
w-full
border
rounded-lg
p-3
mt-2
"

                value={
                  Array.isArray(editClient.c_email)
                    ?
                    editClient.c_email.join(", ")
                    :
                    ""
                }


                onChange={
                  e =>

                    setEditClient(
                      prev =>
                        prev
                          ?
                          {
                            ...prev,
                            c_email: [
                              e.target.value
                            ]
                          }
                          : null
                    )

                }


              />


            </div>








            {/* PHONE */}


            <div className="
mt-5
">


              <label className="
text-sm
font-medium
">

                Phone

              </label>



              <div className="
flex
gap-3
mt-2
">


                <select

                  className="
border
rounded-lg
p-3
w-28
"

                  value={phoneCode}

                  onChange={
                    e => {

                      setPhoneCode(
                        e.target.value
                      );


                      setEditClient(
                        prev =>
                          prev
                            ?
                            {
                              ...prev,

                              c_countryCode:
                                e.target.value

                            }
                            : null
                      );


                    }

                  }


                >


                  {

                    phoneCodes.map(
                      code =>

                        <option
                          key={code}
                          value={code}
                        >

                          {code}

                        </option>

                    )

                  }


                </select>





                <input

                  className="
flex-1
border
rounded-lg
p-3
"

                  placeholder="Mobile Number"

                  value={
                    editClient.c_mobilePhone || ""
                  }

                  onChange={
                    e =>

                      setEditClient(
                        prev =>
                          prev
                            ?
                            {
                              ...prev,
                              c_mobilePhone: e.target.value
                            }
                            : null
                      )

                  }


                />


              </div>


            </div>









            {/* ADDRESS SECTION */}


            <h3 className="
text-sm
font-semibold
text-blue-600
mt-6
mb-3
">

              Address Information

            </h3>




            <div className="
grid
grid-cols-1
md:grid-cols-3
gap-4
">


              <input

                className="
border
rounded-lg
p-3
"

                placeholder="Address"

                value={
                  editClient.c_address || ""
                }

                onChange={
                  e =>

                    setEditClient(
                      prev =>
                        prev
                          ?
                          {
                            ...prev,
                            c_address: e.target.value
                          }
                          : null
                    )

                }

              />




              <input

                className="
border
rounded-lg
p-3
"

                placeholder="City"

                value={
                  editClient.c_city || ""
                }

                onChange={
                  e =>

                    setEditClient(
                      prev =>
                        prev
                          ?
                          {
                            ...prev,
                            c_city: e.target.value
                          }
                          : null
                    )

                }

              />







              <input

                className="
border
rounded-lg
p-3
"

                placeholder="Zip Code"

                value={
                  editClient.c_zipCode || ""
                }

                onChange={
                  e =>

                    setEditClient(
                      prev =>
                        prev
                          ?
                          {
                            ...prev,
                            c_zipCode: e.target.value
                          }
                          : null
                    )

                }

              />





              <select

                className="
border
rounded-lg
p-3
"

                value={
                  editClient.c_country || ""
                }


                onChange={
                  e => {

                    setEditClient(
                      prev =>
                        prev
                          ?
                          {
                            ...prev,
                            c_country: e.target.value,
                            c_state: ""
                          }
                          : null
                    )

                  }

                }


              >


                <option value="">

                  Select Country

                </option>


                {

                  countries.map(
                    country =>

                      <option
                        key={country._id}
                        value={country._id}
                      >

                        {country.name}

                      </option>

                  )

                }


              </select>







              <select

                className="
border
rounded-lg
p-3
"

                value={
                  editClient.c_state || ""
                }


                onChange={
                  e =>

                    setEditClient(
                      prev =>
                        prev
                          ?
                          {
                            ...prev,
                            c_state: e.target.value
                          }
                          : null
                    )

                }


              >


                <option value="">

                  Select State

                </option>



                {

                  states.map(
                    state =>

                      <option
                        key={state._id}
                        value={state._id}
                      >

                        {state.name}

                      </option>

                  )

                }


              </select>




            </div>









            {/* FOOTER BUTTONS */}


            <div className="
flex
justify-end
gap-3
mt-8
">


              <button

                onClick={() =>
                  setIsModalOpen(false)
                }

                className="
px-5
py-2
rounded-lg
bg-gray-200
hover:bg-gray-300
"

              >

                Cancel

              </button>






              <button

                disabled={saving}


                onClick={async () => {


                  if (!editClient)

                    return;


                  setSaving(true);


                  try {


                    await updateCustomer(
                      editClient._id,
                      editClient as ICustomer
                    );


                    alert(
                      "Customer updated successfully"
                    );


                    setIsModalOpen(false);


                    loadCustomerOrders();



                  }

                  catch (err) {


                    console.error(err);


                    alert(
                      "Update failed"
                    );


                  }

                  finally {


                    setSaving(false);


                  }



                }}


                className="
px-5
py-2
rounded-lg
bg-blue-600
text-white
hover:bg-blue-700
disabled:opacity-50
"

              >


                {
                  saving
                    ?
                    "Saving..."
                    :
                    "Save Changes"
                }


              </button>



            </div>






          </div>


        </div>

      }







      {/* ================================
        BACK BUTTON
================================ */}


      <Link

        to="/admin/orders"

        className="
inline-flex
mt-6
px-5
py-2
rounded-lg
bg-gray-800
text-white
hover:bg-gray-900
"

      >

        ← Back to Orders

      </Link>





    </div>

  );


};


export default CustomerOrders;