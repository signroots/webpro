import axios from "axios";

const API_URL = import.meta.env.VITE_API_BASE_URL;

const getToken = () => localStorage.getItem("token");



export const fetchDomainSources = async () => {

  const response = await axios.get(
    `${API_URL}/api/domain-sources`,
    {
      headers:{
        Authorization:`Bearer ${getToken()}`
      }
    }
  );

  return response.data?.data || [];

};





export const createDomainSource = async (
 data:FormData
)=>{

 const response = await axios.post(
  `${API_URL}/api/domain-sources`,
  data,
  {
   headers:{
    Authorization:`Bearer ${getToken()}`,
    "Content-Type":"multipart/form-data"
   }
  }
 );


 return response.data;

};





export const updateDomainSource = async(
 id:string,
 data:FormData
)=>{


 const response = await axios.put(

  `${API_URL}/api/domain-sources/${id}`,

  data,

  {
   headers:{
    Authorization:`Bearer ${getToken()}`,
    "Content-Type":"multipart/form-data"
   }
  }

 );


 return response.data;


};
