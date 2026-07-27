import axios from "axios";
import dotenv from "dotenv";

import Order from "../models/Order";
import Customer from "../models/Customer";

dotenv.config();

export async function syncCloudflareDomains() {

  const CLOUDFLARE_TOKEN =
    process.env.CLOUDFLARE_TOKEN?.trim();

  const CLOUDFLARE_ACCOUNT_ID =
    process.env.CLOUDFLARE_ACCOUNT_ID?.trim();

  const CLOUDFLARE_GLOBAL_KEY =
    process.env.CLOUDFLARE_API_KEY?.trim();

  const CLOUDFLARE_EMAIL_ID =
    process.env.CLOUDFLARE_EMAIL?.trim();


  if (!CLOUDFLARE_TOKEN || !CLOUDFLARE_ACCOUNT_ID) {
    throw new Error("Missing Cloudflare credentials");
  }


  console.log("☁️ Cloudflare Sync Started");


  // =====================================
  // FETCH REGISTRAR DOMAINS
  // =====================================

  let registrarPage = 1;

  const registrarPerPage = 50;

  const registrarDomainMap: Record<string, any> = {};

  let registrarTotal = 0;

  let registrarFetched = 0;


  do {

    const registrarResponse = await axios.get(

      `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/registrar/domains`,

      {
        headers:{
          "X-Auth-Email": CLOUDFLARE_EMAIL_ID,
          "X-Auth-Key": CLOUDFLARE_GLOBAL_KEY,
          "Content-Type":"application/json"
        },

        params:{
          page: registrarPage,
          per_page: registrarPerPage
        }
      }
    );


    const {
      result,
      result_info
    } = registrarResponse.data;


    registrarTotal =
      result_info.total_count || 0;


    registrarFetched += result.length;


    result.forEach((domain:any)=>{

      registrarDomainMap[domain.name] = domain;

    });


    registrarPage++;


  }while(registrarFetched < registrarTotal);



  console.log(
    `✅ Registrar Domains: ${Object.keys(registrarDomainMap).length}`
  );



  // =====================================
  // DEFAULT CUSTOMER
  // =====================================


  const defaultCustomer =
    await Customer.findOneAndUpdate(

      {
        email:"cloudflare@signroots.com"
      },

      {
        name:"Cloudflare Client",
        phone:"0000000000"
      },

      {
        upsert:true,
        new:true
      }

    );



  // =====================================
  // FETCH CLOUDFLARE ZONES
  // =====================================


  let page = 1;

  let totalPages = 1;



  do{


    const response = await axios.get(

      "https://api.cloudflare.com/client/v4/zones",

      {
        headers:{
          Authorization:`Bearer ${CLOUDFLARE_TOKEN}`,
          "Content-Type":"application/json"
        },

        params:{
          page,
          per_page:50
        }
      }

    );



    const {
      result,
      result_info
    } = response.data;



    totalPages =
      result_info.total_pages || 1;



    console.log(
      `🌐 Zones Page ${page}/${totalPages}`
    );



    const bulkOps:any[] = [];



    for(const zone of result){


      const registrarInfo =
        registrarDomainMap[zone.name];



      const existingOrder =
        await Order.findOne({
          domainName:zone.name
        });



      // =====================================
      // CHECK EXPIRY DATE
      // =====================================


      const expiryDate =
        registrarInfo?.expires_at
          ? new Date(registrarInfo.expires_at)
          : existingOrder?.expiryDate
          ? new Date(existingOrder.expiryDate)
          : null;



      if(!registrarInfo){

        console.log(
          `🗑 ${zone.name} removed - Not in registrar`
        );


        await Order.deleteOne({
          domainName:zone.name
        });


        continue;

      }



      if(expiryDate){


        const diffDays =
          (Date.now() - expiryDate.getTime())
          /
          (1000*60*60*24);



        if(diffDays > 65){


          console.log(
            `🗑 ${zone.name} removed - expired ${Math.floor(diffDays)} days`
          );


          await Order.deleteOne({
            domainName:zone.name
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
            domainName:zone.name
          },


          update:{

            $set:{

              domainName:zone.name,

              status:zone.status,


              nameServers:
                zone.name_servers,


              registrationDate:
                new Date(zone.created_on),


              originalRegistrar:
                zone.original_registrar,


              expiryDate,


              managedBy:"Signroots",


              customer:
                defaultCustomer._id,


              domainSource:
                "Cloudflare",


              cloudflareRegistered:true,



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
                existingOrder?.email_flag || false,


              email_customer:
                existingOrder?.email_customer || "",


              users:
                existingOrder?.users || 0,


            }

          },


          upsert:true

        }

      });


    }



    if(bulkOps.length){

      await Order.bulkWrite(bulkOps);

    }



    page++;


  }while(page <= totalPages);




  // =====================================
  // FINAL CLEANUP
  // =====================================


  const registrarDomains =
    Object.keys(registrarDomainMap);



  const orphanCleanup =
    await Order.deleteMany({

      domainSource:"Cloudflare",

      domainName:{
        $nin:registrarDomains
      }

    });



  console.log(
    `🗑 Orphan cleanup removed ${orphanCleanup.deletedCount}`
  );



  // =====================================
  // EXPIRED DB CLEANUP
  // =====================================


  const expiredCleanup =
    await Order.deleteMany({

      domainSource:"Cloudflare",

      expiryDate:{
        $lt:
          new Date(
            Date.now() -
            (65*24*60*60*1000)
          )
      }

    });



  console.log(
    `🗑 Expired cleanup removed ${expiredCleanup.deletedCount}`
  );



  console.log(
    "✅ Cloudflare Sync Completed"
  );

}