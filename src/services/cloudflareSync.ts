import axios from "axios";
import dotenv from "dotenv";

import Order from "../models/Order";
import Customer from "../models/Customer";

dotenv.config();

let cloudflareSyncRunning = false;


export async function syncCloudflareDomains() {


  if (cloudflareSyncRunning) {

    console.log(
      "⚠️ Previous sync still running..."
    );

    return;

  }


  cloudflareSyncRunning = true;


  try {


    const CLOUDFLARE_TOKEN =
      process.env.CLOUDFLARE_TOKEN?.trim();


    const CLOUDFLARE_ACCOUNT_ID =
      process.env.CLOUDFLARE_ACCOUNT_ID?.trim();


    const CLOUDFLARE_GLOBAL_KEY =
      process.env.CLOUDFLARE_API_KEY?.trim();


    const CLOUDFLARE_EMAIL_ID =
      process.env.CLOUDFLARE_EMAIL?.trim();



    if (
      !CLOUDFLARE_TOKEN ||
      !CLOUDFLARE_ACCOUNT_ID
    ) {

      throw new Error(
        "Missing Cloudflare credentials"
      );

    }



    console.log(
      "☁️ Cloudflare Sync Started"
    );



    // =====================================
    // FETCH REGISTRAR DOMAINS
    // =====================================


    let registrarPage = 1;

    const registrarDomainMap:
      Record<string,any> = {};


    let registrarTotal = 0;

    let registrarFetched = 0;



    do {


      const registrarResponse =
        await axios.get(

          `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/registrar/domains`,

          {

            headers: {

              "X-Auth-Email":
                CLOUDFLARE_EMAIL_ID,

              "X-Auth-Key":
                CLOUDFLARE_GLOBAL_KEY,

              "Content-Type":
                "application/json"

            },

            params: {

              page: registrarPage,

              per_page:50

            }

          }

        );



      const {
        result,
        result_info
      } =
      registrarResponse.data;



      registrarTotal =
        result_info.total_count || 0;



      registrarFetched +=
        result.length;



      result.forEach(
        (domain:any)=>{

          registrarDomainMap[
            domain.name
          ] = domain;

        }
      );


      registrarPage++;



    }
    while(
      registrarFetched < registrarTotal
    );



    console.log(
      `✅ Registrar Domains: ${
        Object.keys(registrarDomainMap).length
      }`
    );



    // =====================================
    // CUSTOMER
    // =====================================


    const defaultCustomer =
      await Customer.findOneAndUpdate(

        {
          email:
            "cloudflare@signroots.com"
        },

        {

          name:
            "Cloudflare Client",

          phone:
            "0000000000"

        },

        {

          upsert:true,

          new:true

        }

      );



   // =====================================
// FETCH ALL CLOUDFLARE ZONES FOR CLEANUP
// =====================================

let cleanupPage = 1;
let cleanupTotalPages = 1;

const activeZoneNames:string[] = [];


do {

  const zonesResponse = await axios.get(
    "https://api.cloudflare.com/client/v4/zones",
    {
      headers:{
        Authorization:`Bearer ${CLOUDFLARE_TOKEN}`,
        "Content-Type":"application/json"
      },
      params:{
        page: cleanupPage,
        per_page:100
      }
    }
  );


  const zones =
    zonesResponse.data.result;


  const info =
    zonesResponse.data.result_info;


  cleanupTotalPages =
    info.total_pages || 1;


  zones.forEach((zone:any)=>{
    activeZoneNames.push(zone.name);
  });


  cleanupPage++;


} while(cleanupPage <= cleanupTotalPages);



console.log(
 `🌐 Total active Cloudflare zones: ${activeZoneNames.length}`
);



const removed =
 await Order.deleteMany({

   domainSource:"Cloudflare",

   domainName:{
     $nin:activeZoneNames
   }

 });



console.log(
 `🗑 Removed missing Cloudflare zones: ${removed.deletedCount}`
);


    // =====================================
    // REMOVE EXPIRED DOMAINS
    // =====================================


    const expiredCleanup =
      await Order.deleteMany({

        domainSource:
          "Cloudflare",


        email_flag:false,


        hosting:false,


        expiryDate:{

          $lt:

            new Date(

              Date.now()
              -
              (
                65 *
                24 *
                60 *
                60 *
                1000
              )

            )

        }

      });



    console.log(
      `🗑 Expired cleanup removed: ${expiredCleanup.deletedCount}`
    );



    console.log(
      "✅ Cloudflare Sync Completed"
    );



  }
  catch(error:any){


    console.error(
      "❌ Cloudflare Sync Failed:",
      error.message || error
    );


  }
  finally{


    cloudflareSyncRunning = false;


  }


}