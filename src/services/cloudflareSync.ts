import axios from "axios";
import dotenv from "dotenv";

import Order from "../models/Order";
import Customer from "../models/Customer";
import mongoose from "mongoose";
import DomainSource from "../models/DomainSource";
dotenv.config();

let cloudflareSyncRunning = false;

export async function syncCloudflareDomains() {

  if (cloudflareSyncRunning) {
    console.log("⚠️ Previous sync still running...");
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
      throw new Error("Missing Cloudflare credentials");
    }

    console.log("☁️ Cloudflare Sync Started");
console.log(
  "ACCOUNT ID:",
  CLOUDFLARE_ACCOUNT_ID
);

console.log(
  "EMAIL:",
  CLOUDFLARE_EMAIL_ID
);

console.log(
  "HAS API KEY:",
  !!CLOUDFLARE_GLOBAL_KEY
);
    // =====================================
    // FETCH ALL REGISTRAR DOMAINS
    // =====================================

    const registrarDomainMap: Record<string, any> = {};

   let registrarPage = 1;
let registrarTotalPages = 1;

do {

 const registrarResponse = await axios.get(
  `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/registrar/domains`,
  {
    headers:{
  Authorization: `Bearer ${CLOUDFLARE_TOKEN}`,
  "Content-Type":"application/json"
},
    params:{
      page: registrarPage,
      per_page: 100
    }
  }
 );
console.log(
 "REGISTRAR RESPONSE COUNT:",
 registrarResponse.data.result.length
);

console.log(
 "FIRST REGISTRAR DOMAIN:",
 registrarResponse.data.result[0]
);

 console.log(
   "Registrar page",
   registrarPage,
   registrarResponse.data.result.length
 );
 console.log(
  "REGISTRAR RESULT:",
  registrarResponse.data.result
);

console.log(
  "IS ARRAY:",
  Array.isArray(registrarResponse.data.result)
);

registrarResponse.data.result.forEach((domain:any)=>{

  console.log("REGISTRAR RAW DOMAIN:", domain);

  const key =
    (domain.name || domain.domain)
      ?.toLowerCase()
      .trim();

  if(key){
    registrarDomainMap[key] = domain;
  }

});
console.log(
 "HAS ALFAA:",
 Object.keys(registrarDomainMap)
   .includes("alfaaconnect.org")
);

registrarTotalPages =
 registrarResponse.data.result_info?.total_pages || 1;


 registrarPage++;


} while(
 registrarPage <= registrarTotalPages
);
console.log(
 "TOTAL REGISTRAR DOMAINS:",
 Object.keys(registrarDomainMap).length
);

console.log(
 "VOLTOPAINTS:",
 registrarDomainMap["voltopaints.com"]
);
    // =====================================
    // FETCH DEFAULT CUSTOMER
    // =====================================

    const defaultCustomer =
      await Customer.findOneAndUpdate(
        {
          email: "cloudflare@signroots.com",
        },
        {
          name: "Cloudflare Client",
          phone: "0000000000",
        },
        {
          upsert: true,
          new: true,
        }
      );
      const dnsCloudflareSource =
 await DomainSource.findOne({
   code:"DNS-CLOUDFLARE"
 });


const cloudflareSource =
 await DomainSource.findOne({
   code:"CLOUDFLARE"
 });
 if (!cloudflareSource || !dnsCloudflareSource) {
  throw new Error(
    "Cloudflare domain sources not found in database"
  );
}
    // =====================================
    // FETCH & SYNC CLOUDFLARE ZONES
    // =====================================

    let zonePage = 1;
    let zoneTotalPages = 1;

    do {

      const zoneResponse = await axios.get(
        "https://api.cloudflare.com/client/v4/zones",
        {
          headers: {
            Authorization: `Bearer ${CLOUDFLARE_TOKEN}`,
            "Content-Type": "application/json",
          },
          params: {
            page: zonePage,
            per_page: 100,
          },
        }
      );

      const zones = zoneResponse.data.result;
      const registrarDomains: any[] = Object.values(registrarDomainMap);

const allDomainsMap:any = {};

zones.forEach((zone:any)=>{
  allDomainsMap[zone.name.toLowerCase()] = {
    ...zone,
    fromZone:true
  };
});


registrarDomains.forEach((domain:any)=>{
  if(!allDomainsMap[domain.name.toLowerCase()]){
    allDomainsMap[domain.name.toLowerCase()] = {
      ...domain,
      name: domain.name,
      fromRegistrar:true
    };
  }
});

const allDomains: any[] = Object.values(allDomainsMap);

      zoneTotalPages =
        zoneResponse.data.result_info.total_pages || 1;

      console.log(
        `🌐 Processing Zones Page ${zonePage}/${zoneTotalPages}`
      );

      const bulkOps: any[] = [];

for (const zone of allDomains) {

  const domainKey = zone.name
    .toLowerCase()
    .trim();


  const registrarInfo =
    registrarDomainMap[domainKey];


  console.log(
    "DOMAIN CHECK:",
    domainKey,
    !!registrarInfo
  );


  if (registrarInfo) {

    console.log(
      "✅ Registrar domain:",
      zone.name,
      registrarInfo.expires_at
    );

  } else {

    console.log(
      "ℹ️ DNS only:",
      zone.name
    );

  }


  const existingOrder =
    await Order.findOne({
      domainName: zone.name,
    });


  const expiryDate =
    registrarInfo?.expires_at
      ? new Date(registrarInfo.expires_at)
      : existingOrder?.expiryDate
        ? new Date(existingOrder.expiryDate)
        : null;


  const provider =
    existingOrder?.provider || "";


  const providerLower =
    provider.toLowerCase();



  let isActive = true;

  let domainStatus =
    zone.status || "active";



  if (expiryDate) {

    const diffDays =
      (
        Date.now() -
        expiryDate.getTime()
      )
      /
      (
        1000 *
        60 *
        60 *
        24
      );


    if (diffDays > 65) {

      console.log(
        `⚠️ Expired more than 65 days: ${zone.name}`
      );


      isActive = false;

      domainStatus = "EXPIRED";

    }

  }



  bulkOps.push({

    updateOne: {

      filter: {
        domainName: zone.name
      },


      update: {

        $set: {


          domainName:
            zone.name,


          status:
            domainStatus,


          is_active:
            isActive,


          nameServers:
            zone.name_servers || [],



          registrationDate:
            zone.created_on
              ? new Date(zone.created_on)
              : existingOrder?.registrationDate || null,



          originalRegistrar:
            zone.original_registrar || "",



          expiryDate,


          managedBy:
            "Signroots",



          customer:
            defaultCustomer._id,



          // IMPORTANT PART
          domainSource:
            registrarInfo
              ? cloudflareSource._id
              : dnsCloudflareSource._id,



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

      // =====================================
      // BULK UPDATE DATABASE
      // =====================================

      if (bulkOps.length) {

        await Order.bulkWrite(
          bulkOps
        );

        console.log(
          `✅ Updated ${bulkOps.length} domains`
        );

      }


      zonePage++;


    } while (
      zonePage <= zoneTotalPages
    );
console.log(
  "REGISTRAR MAP CHECK:",
  registrarDomainMap["alfaaconnect.org"]
);

    console.log(
      "✅ Cloudflare Sync Completed"
    );


  }
  catch (error: any) {

    console.error(
      "❌ Cloudflare Sync Failed:",
      error.message || error
    );

  }
  finally {

    cloudflareSyncRunning = false;

  }


}