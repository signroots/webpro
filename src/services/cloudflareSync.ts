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



    if(
      !CLOUDFLARE_TOKEN ||
      !CLOUDFLARE_ACCOUNT_ID
    ){

      throw new Error(
        "Missing Cloudflare credentials"
      );

    }



    console.log(
      "☁️ Cloudflare Sync Started"
    );



    // =====================================
    // FETCH ALL REGISTRAR DOMAINS
    // =====================================


    const registrarDomainMap:
      Record<string,any> = {};


    let registrarPage = 1;

    let registrarTotalPages = 1;



    do {


      const registrarResponse =
        await axios.get(

          `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/registrar/domains`,

          {

            headers:{

              "X-Auth-Email":
                CLOUDFLARE_EMAIL_ID,

              "X-Auth-Key":
                CLOUDFLARE_GLOBAL_KEY,

              "Content-Type":
                "application/json"

            },


            params:{

              page:registrarPage,

              per_page:100

            }

          }

        );



      if(!registrarResponse.data.success){

        throw new Error(
          "Cloudflare registrar API failed"
        );

      }



      registrarResponse.data.result.forEach(
        (domain:any)=>{

          registrarDomainMap[
            domain.name
          ] = domain;

        }
      );



      registrarTotalPages =
        registrarResponse.data.result_info.total_pages || 1;



      registrarPage++;



    }
    while(
      registrarPage <= registrarTotalPages
    );



    console.log(
      `✅ Registrar Domains: ${
        Object.keys(registrarDomainMap).length
      }`
    );



    // =====================================
    // FETCH CUSTOMER
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
    // FETCH ALL CLOUDFLARE ZONES
    // =====================================


    const activeZoneNames:string[] = [];


    let zonePage = 1;

    let zoneTotalPages = 1;



    do {


      const zoneResponse =
        await axios.get(

          "https://api.cloudflare.com/client/v4/zones",

          {

            headers:{

              Authorization:
                `Bearer ${CLOUDFLARE_TOKEN}`,

              "Content-Type":
                "application/json"

            },


            params:{

              page:zonePage,

              per_page:100

            }

          }

        );



      const zones =
        zoneResponse.data.result;



      zones.forEach((zone:any)=>{

        activeZoneNames.push(
          zone.name
        );

      });



      zoneTotalPages =
        zoneResponse.data.result_info.total_pages || 1;



      console.log(
        `🌐 Zones Page ${zonePage}/${zoneTotalPages}`
      );



      zonePage++;



    }
    while(
      zonePage <= zoneTotalPages
    );



    console.log(
      `✅ Total Cloudflare Zones: ${activeZoneNames.length}`
    );




    // =====================================
    // SYNC CLOUDLFARE ZONES
    // =====================================


    let syncPage = 1;

    let syncTotalPages = 1;



    do {


      const response =
        await axios.get(

          "https://api.cloudflare.com/client/v4/zones",

          {

            headers:{

              Authorization:
                `Bearer ${CLOUDFLARE_TOKEN}`,

              "Content-Type":
                "application/json"

            },


            params:{

              page:syncPage,

              per_page:100

            }

          }

        );



      const zones =
        response.data.result;



      syncTotalPages =
        response.data.result_info.total_pages || 1;



      console.log(
        `🔄 Sync Zones Page ${syncPage}/${syncTotalPages}`
      );



      const bulkOps:any[] = [];



      for(
        const zone of zones
      ){



        const registrarInfo =
          registrarDomainMap[
            zone.name
          ];



        const existingOrder =
          await Order.findOne({

            domainName:
              zone.name

          });



        // =====================================
        // DELETE IF NOT IN REGISTRAR
        // ONLY WHEN NO ZONE PURPOSE
        // =====================================


        if(!registrarInfo){


          console.log(
            `⚠️ ${zone.name} not found in registrar`
          );


          continue;


        }



        const expiryDate =
          registrarInfo.expires_at
            ?
          new Date(
            registrarInfo.expires_at
          )
            :
          existingOrder?.expiryDate
            ?
          new Date(
            existingOrder.expiryDate
          )
            :
          null;



        // =====================================
        // EXPIRED MORE THAN 65 DAYS
        // =====================================


        if(expiryDate){


          const diffDays =
            (
              Date.now()
              -
              expiryDate.getTime()

            )
            /
            (
              1000 *
              60 *
              60 *
              24
            );



          if(diffDays > 65){


            console.log(
              `🗑 Removing expired ${zone.name}`
            );


            await Order.deleteOne({

              domainName:
                zone.name

            });


            continue;

          }


        }



        const provider =
          existingOrder?.provider || "";



        const providerLower =
          provider.toLowerCase();




        bulkOps.push({

          updateOne:{


            filter:{

              domainName:
                zone.name

            },


            update:{


              $set:{


                domainName:
                  zone.name,


                status:
                  zone.status,


                nameServers:
                  zone.name_servers,



                registrationDate:
                  new Date(
                    zone.created_on
                  ),



                originalRegistrar:
                  zone.original_registrar,



                expiryDate,



                managedBy:
                  "Signroots",



                customer:
                  defaultCustomer._id,



                domainSource:
                  "Cloudflare",



                cloudflareRegistered:
                  true,



                provider,



                google_email:
                  existingOrder?.google_email ||
                  providerLower.includes(
                    "google workspace"
                  ),



                microsoft_email:
                  existingOrder?.microsoft_email ||
                  providerLower.includes(
                    "microsoft 365"
                  ),



                email_flag:
                  existingOrder?.email_flag ||
                  false,



                email_customer:
                  existingOrder?.email_customer ||
                  "",



                users:
                  existingOrder?.users ||
                  0,


              }

            },


            upsert:true

          }

        });


      }



      if(bulkOps.length){


        await Order.bulkWrite(
          bulkOps
        );


      }



      syncPage++;



    }
    while(
      syncPage <= syncTotalPages
    );
    // =====================================
// FINAL CLEANUP
// REMOVE DOMAINS NOT IN CLOUDFLARE
// =====================================


const validCloudflareDomains = new Set<string>();


// Registrar domains add
Object.keys(registrarDomainMap)
.forEach((domain)=>{

  validCloudflareDomains.add(domain);

});


// Zone domains add
activeZoneNames.forEach((domain)=>{

  validCloudflareDomains.add(domain);

});



const orphanRemoved =
  await Order.deleteMany({

    domainSource:
      "Cloudflare",


    cloudflareRegistered:
      true,


    domainName:{

      $nin:
        Array.from(
          validCloudflareDomains
        )

    }

  });



console.log(
  `🗑 Removed missing Cloudflare domains: ${orphanRemoved.deletedCount}`
);




// =====================================
// FINAL EXPIRED CLEANUP
// =====================================


const expiredRemoved =
  await Order.deleteMany({

    domainSource:
      "Cloudflare",


    email_flag:
      false,


    hosting:
      false,


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
  `🗑 Expired cleanup removed: ${expiredRemoved.deletedCount}`
);




// =====================================
// COMPLETE
// =====================================


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