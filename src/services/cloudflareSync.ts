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
    // FETCH ALL CLOUDFLARE ZONES
    // =====================================


    let page = 1;

    let totalPages = 1;


    const activeZoneNames:string[] = [];



    do {


      const response =
        await axios.get(

          "https://api.cloudflare.com/client/v4/zones",

          {

            headers: {

              Authorization:
                `Bearer ${CLOUDFLARE_TOKEN}`,

              "Content-Type":
                "application/json"

            },

            params: {

              page,

              per_page:50

            }

          }

        );



      const {
        result,
        result_info
      } =
      response.data;



      totalPages =
        result_info.total_pages || 1;



      console.log(
        `🌐 Zones Page ${page}/${totalPages}`
      );



      result.forEach(
        (zone:any)=>{

          activeZoneNames.push(
            zone.name
          );

        }
      );



      const bulkOps:any[] = [];



      for(
        const zone of result
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



        const expiryDate =
          registrarInfo?.expires_at
          ? new Date(
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
        // NOT IN REGISTRAR
        // KEEP EMAIL/HOSTING DOMAINS
        // =====================================


        if(!registrarInfo){


          console.log(
            `⚠️ ${zone.name} not in registrar`
          );


          continue;

        }



        // =====================================
        // EXPIRED >65 DAYS
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
              `🗑 Removing ${zone.name} expired ${Math.floor(diffDays)} days`
            );


            await Order.deleteOne({

              domainName:
                zone.name

            });


            continue;

          }

        }
                // =====================================
        // PRESERVE EMAIL DATA
        // =====================================


        const provider =
          existingOrder?.provider || "";


        const providerLower =
          provider.toLowerCase();



        bulkOps.push({

          updateOne: {

            filter: {

              domainName:
                zone.name

            },


            update: {

              $set: {


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
                  existingOrder?.google_email === true
                  ||
                  providerLower.includes(
                    "google workspace"
                  ),


                microsoft_email:
                  existingOrder?.microsoft_email === true
                  ||
                  providerLower.includes(
                    "microsoft 365"
                  ),


                email_flag:
                  existingOrder?.email_flag || false,


                email_customer:
                  existingOrder?.email_customer || "",


                email_expiryDate:
                  existingOrder?.email_expiryDate || null,


                username:
                  existingOrder?.username || "",


                password:
                  existingOrder?.password || "",


                subscription:
                  existingOrder?.subscription || "",


                users:
                  existingOrder?.users || 0,


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



      page++;



    }
    while(
      page <= totalPages
    );



    // =====================================
    // REMOVE DOMAINS NOT IN CLOUDFLARE
    // =====================================


    const removed =
      await Order.deleteMany({

        domainSource:
          "Cloudflare",


        domainName:{
          $nin:
            activeZoneNames
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