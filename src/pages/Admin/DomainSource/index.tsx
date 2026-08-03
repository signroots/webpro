import React, { useEffect, useState } from "react";

import {
  fetchDomainSources,
  createDomainSource,
  updateDomainSource,
} from "./api";


interface Source {

  _id: string;
  name: string;
  code: string;
  image?: string;
  is_active?: boolean;

}



export default function DomainSource() {


  const [sources, setSources] = useState<Source[]>([]);


  const [editing, setEditing] = useState<string | null>(null);


  const [form, setForm] = useState({

    name: "",
    code: ""

  });


  const [image, setImage] = useState<File | null>(null);


  const [loading, setLoading] = useState(false);





  // ================= LOAD =================

  const loadSources = async () => {

    try {

      setLoading(true);


      const data = await fetchDomainSources();


      setSources(
        Array.isArray(data)
          ? data
          : []
      );


    } catch (error) {

      console.error(
        "Domain Source Load Error",
        error
      );


      setSources([]);


    }
    finally {

      setLoading(false);

    }

  };





  useEffect(() => {

    loadSources();

  }, []);







  // ================= SAVE =================


  const submit = async () => {


    if (!form.name || !form.code) {

      alert("Name and Code required");

      return;

    }



    try {


      const formData = new FormData();



      formData.append(
        "name",
        form.name
      );



      formData.append(
        "code",
        form.code.toUpperCase()
      );





      if (image) {

        formData.append(
          "image",
          image
        );

      }





      if (editing) {


        await updateDomainSource(

          editing,

          formData

        );



      }
      else {


        await createDomainSource(

          formData

        );


      }






      setForm({

        name: "",
        code: ""

      });


      setImage(null);


      setEditing(null);


      await loadSources();




    } catch (error: any) {


      console.error(
        "Save Error",
        error
      );


      alert(
        error.response?.data?.message ||
        "Failed to save"
      );


    }



  };







  // ================= EDIT =================


  const editSource = (source: Source) => {


    setEditing(
      source._id
    );



    setForm({

      name: source.name,

      code: source.code

    });



    setImage(null);



  };








  return (

    <div className="p-6">


      <h1 className="text-2xl font-bold mb-5">
        Domain Source Management
      </h1>





      {/* FORM */}

      <div className="bg-white shadow rounded p-5 mb-6">


        <div className="grid grid-cols-4 gap-3">



          <input

            className="border p-2 rounded"

            placeholder="Source Name"

            value={form.name}

            onChange={(e) =>

              setForm({

                ...form,

                name: e.target.value

              })

            }

          />





          <input

            className="border p-2 rounded"

            placeholder="Code"

            value={form.code}

            onChange={(e) =>

              setForm({

                ...form,

                code: e.target.value.toUpperCase()

              })

            }

          />





          <input

            type="file"

            accept="image/*"

            className="border p-2 rounded"

            onChange={(e) => {

              setImage(
                e.target.files?.[0] || null
              );

            }}

          />





          <button

            onClick={submit}

            className="bg-blue-600 text-white rounded px-5"

          >

            {

              editing

                ?

                "Update"

                :

                "Add"

            }


          </button>



        </div>


      </div>









      {/* TABLE */}


      <div className="bg-white shadow rounded">


        <table className="w-full">


          <thead>


            <tr className="border-b bg-gray-100">


              <th className="p-3">
                Image
              </th>


              <th className="p-3 text-left">
                Name
              </th>


              <th className="p-3 text-left">
                Code
              </th>


              <th className="p-3">
                Status
              </th>


              <th className="p-3">
                Action
              </th>


            </tr>


          </thead>





          <tbody>



            {
              loading ?

                <tr>

                  <td
                    colSpan={5}
                    className="text-center p-5"
                  >

                    Loading...

                  </td>

                </tr>


                :


                sources.length === 0 ?


                  <tr>

                    <td
                      colSpan={5}
                      className="text-center p-5"
                    >

                      No Domain Source Found

                    </td>

                  </tr>



                  :


                  sources.map((source) => (


                    <tr

                      key={source._id}

                      className="border-b"

                    >


                      <td className="p-3">


                        {

                          source.image ?

<img
  src={
    source.image?.startsWith("/")
      ? `${import.meta.env.VITE_API_BASE_URL}${source.image}`
      : `${import.meta.env.VITE_API_BASE_URL}/uploads/domainsources/${source.image}`
  }
  className="w-10 h-10 object-contain"
  alt={source.name}
/>


                            :

                            "-"


                        }


                      </td>






                      <td className="p-3">

                        {source.name}

                      </td>





                      <td className="p-3">

                        {source.code}

                      </td>





                      <td className="p-3">


                        <span

                          className={

                            source.is_active !== false

                              ?

                              "bg-green-100 text-green-700 px-3 py-1 rounded"

                              :

                              "bg-red-100 text-red-700 px-3 py-1 rounded"

                          }

                        >


                          {

                            source.is_active !== false

                              ?

                              "Active"

                              :

                              "Inactive"

                          }


                        </span>


                      </td>






                      <td className="p-3">


                        <button

                          onClick={() => editSource(source)}

                          className="bg-yellow-500 text-white px-4 py-1 rounded"

                        >

                          Edit

                        </button>


                      </td>



                    </tr>


                  ))


            }



          </tbody>



        </table>


      </div>



    </div>

  );


}