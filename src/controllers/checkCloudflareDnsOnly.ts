import axios from "axios";

const ACCOUNT_ID = "789c2ef055087ad01505a42c225fbfaa";
const API_TOKEN = "YOUR_TOKEN";

const headers = {
  Authorization: `Bearer ${API_TOKEN}`,
  "Content-Type": "application/json",
};


async function getRegistrarDomains() {

  let allRegistrarDomains:any[] = [];

  let page = 1;
  let totalPages = 1;


  while(page <= totalPages){

    console.log("Fetching Registrar Page:", page);


    const url =
    `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/registrar/domains?page=${page}&per_page=100`;


    const response = await axios.get(url,{
      headers
    });


    const data = response.data;


    if(!data.success){
      console.log(data.errors);
      break;
    }


    const domains = data.result || [];


    console.log(
      "Registrar Result Count:",
      domains.length
    );


    allRegistrarDomains.push(...domains);


    totalPages =
    data.result_info?.total_pages || 1;


    page++;

  }


  console.log("======================");
  console.log(
    "TOTAL REGISTRAR DOMAINS:",
    allRegistrarDomains.length
  );


  const volt =
  allRegistrarDomains.find(
    d=>d.name==="voltopaints.com"
  );


  console.log(
    "VOLTOPAINTS REGISTRAR:",
    volt
  );


  return allRegistrarDomains;

}



async function getDnsOnlyZones(){

 const dnsOnly:string[]=[];


 let page=1;
 let totalPages=1;


 while(page<=totalPages){


 console.log(
 "Fetching Zones Page:",
 page
 );


 const url =
 `https://api.cloudflare.com/client/v4/zones?page=${page}&per_page=100`;


 const response =
 await axios.get(url,{
 headers
 });


 const data=response.data;


 const zones=data.result || [];


 zones.forEach((zone:any)=>{


    /*
       registrar domain അല്ല,
       DNS only zone മാത്രം
    */

    if(
      zone.name &&
      zone.name_servers &&
      zone.name_servers.length>0
    ){

      console.log(
        "DNS ONLY:",
        zone.name
      );

      dnsOnly.push(zone.name);

    }


 });


 totalPages =
 data.result_info?.total_pages || 1;


 page++;

 }


 console.log("======================");
 console.log(
 "FINAL DNS ONLY COUNT:",
 dnsOnly.length
 );
 console.log("======================");

 console.log(
 JSON.stringify(
 dnsOnly,
 null,
 2
 )
 );


}



async function main(){

 await getRegistrarDomains();

 await getDnsOnlyZones();

}


main();