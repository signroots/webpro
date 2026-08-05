import React, { useEffect, useState } from "react";

import {
  fetchDomainSources,
  createDomainSource,
  updateDomainSource,
  fetchDomainSourceById,
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
    code: "",
    is_active: true

  });



  const [image, setImage] = useState<File | null>(null);

const [previewImage, setPreviewImage] = useState<string>("");
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


    } catch(error) {

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





  useEffect(()=>{

    loadSources();

  },[]);








  // ================= SAVE =================


  const submit = async()=>{


    if(!form.name || !form.code){

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



      // IMPORTANT
      formData.append(
        "is_active",
        String(form.is_active)
      );





      if(image){

        formData.append(
          "image",
          image
        );

      }





      // DEBUG CHECK

      for(const pair of formData.entries()){

        console.log(
          pair[0],
          pair[1]
        );

      }






      if(editing){


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






      // RESET


      setForm({

        name:"",
        code:"",
        is_active:true

      });



      setImage(null);


      setEditing(null);



      await loadSources();




    }
    catch(error:any){


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
const editSource = async (source: Source) => {

  try {

    const data = await fetchDomainSourceById(source._id);


    if(data){

      setEditing(data._id);


      setForm({

        name:data.name,

        code:data.code,

        is_active:data.is_active ?? true

      });



      if(data.image){

        const imageUrl =
          `${import.meta.env.VITE_API_BASE_URL}${data.image}`;


        setPreviewImage(imageUrl);

      }
      else {

        setPreviewImage("");

      }


    }


    setImage(null);


  }
  catch(error){

    console.error(
      "Edit fetch error",
      error
    );

  }



};

return (

  <div className="p-6">


    <h1 className="text-2xl font-bold mb-5">
      Domain Source Management
    </h1>





    {/* FORM */}

    <div className="bg-white shadow rounded p-5 mb-6">


      <div className="grid grid-cols-5 gap-3">



        <input

          className="border p-2 rounded"

          placeholder="Source Name"

          value={form.name}

          onChange={(e)=>

            setForm({

              ...form,

              name:e.target.value

            })

          }

        />





        <input

          className="border p-2 rounded"

          placeholder="Code"

          value={form.code}

          onChange={(e)=>

            setForm({

              ...form,

              code:e.target.value.toUpperCase()

            })

          }

        />






      <input

  type="file"

  accept="image/*"

  className="border p-2 rounded"

  onChange={(e)=>{


    const file = e.target.files?.[0];


    if(file){

      setImage(file);


      setPreviewImage(
        URL.createObjectURL(file)
      );

    }


  }}

/>{
  previewImage && (

    <img

      src={previewImage}

      className="w-12 h-12 object-contain border rounded"

      alt="preview"

    />

  )
}
        {/* ACTIVE STATUS */}

        <label className="flex items-center gap-2 border rounded px-3">

          <input

            type="checkbox"

            checked={form.is_active}

            onChange={(e)=>

              setForm({

                ...form,

                is_active:e.target.checked

              })

            }

          />


          <span>

            Active

          </span>


        </label>






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


          sources.map((source)=>(


            <tr

              key={source._id}

              className="border-b"

            >



              <td className="p-3">


              {

                source.image ?


                <img

                  src={

                    source.image.startsWith("/")

                    ?

                    `${import.meta.env.VITE_API_BASE_URL}${source.image}`

                    :

                    `${import.meta.env.VITE_API_BASE_URL}/uploads/domainsources/${source.image}`

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






              <td className="p-3 text-center">


                <span

                  className={

                    source.is_active

                    ?

                    "bg-green-100 text-green-700 px-3 py-1 rounded"

                    :

                    "bg-red-100 text-red-700 px-3 py-1 rounded"

                  }

                >

                  {

                    source.is_active

                    ?

                    "Active"

                    :

                    "Inactive"

                  }


                </span>


              </td>







              <td className="p-3 text-center">


                <button

                  onClick={()=>editSource(source)}

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