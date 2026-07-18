import mongoose from "mongoose";
import XLSX from "xlsx";
import path from "path";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

import Order from "../models/Order";
import { OrderPlan } from "../models/OrderPlan";
import { PlanEmail } from "../models/PlanEmail";
import { TypeEmail } from "../models/TypeEmail";


dayjs.extend(customParseFormat);



const MONGO_URI =
"mongodb://127.0.0.1:27017/domain_management_system";



// =====================
// DATE PARSER
// =====================

function parseDate(value:any){

    if(!value)
        return null;


    if(value instanceof Date)
        return value;


    // Excel serial date
    if(typeof value === "number"){

        return new Date(
            Math.round(
                (value - 25569) * 86400 * 1000
            )
        );

    }


    const str = String(value).trim();


    const formats = [
        "D/M/YYYY",
        "DD/MM/YYYY",
        "D-M-YYYY",
        "DD-MM-YYYY",
        "YYYY-MM-DD"
    ];


    const d = dayjs(
        str,
        formats,
        true
    );


    if(d.isValid()){
        return d.toDate();
    }


    console.log("DATE FAILED:", value);

    return null;
}



async function importOrders(){


try{


await mongoose.connect(MONGO_URI);

console.log("MongoDB Connected");



const excelPath =
path.join(
process.cwd(),
"OrdersProPanel.xlsx"
);



const workbook =
XLSX.readFile(excelPath);



const sheet =
workbook.Sheets[
workbook.SheetNames[0]
];



const rows:any[] =
XLSX.utils.sheet_to_json(
sheet,
{
defval:""
}
);




// ============================
// CHECK DUPLICATE DOMAINS WITH ROW NUMBER
// ============================

const domainMap:any = {};

rows.forEach((row:any, index:number)=>{

    const domain = String(row["Domain"] || "")
        .trim()
        .toLowerCase();

    if(!domain)
        return;


    if(!domainMap[domain]){
        domainMap[domain] = [];
    }

    domainMap[domain].push(index + 2); // Excel row number (+ header)
});


console.log("============================");
console.log("DUPLICATE DOMAINS FOUND");


let duplicateFound = false;


Object.keys(domainMap).forEach((domain)=>{

    if(domainMap[domain].length > 1){

        duplicateFound = true;

        console.log(
            `Domain : ${domain}`
        );

        console.log(
            `Excel Rows : ${domainMap[domain].join(", ")}`
        );

        console.log("----------------------------");

    }

});


if(!duplicateFound){
    console.log("No duplicate domains found");
}


console.log("============================");
const domains = rows
.map((row) =>
    String(row["Domain"] || "").trim()
)
.filter(Boolean);




const domainCount: any = {};

rows.forEach((row) => {
    const domain = String(row["Domain"] || "").trim();

    if (domain) {
        domainCount[domain] = (domainCount[domain] || 0) + 1;
    }
});


console.log("============================");
console.log("Duplicate Domain Details");


Object.keys(domainCount).forEach((domain) => {

    if (domainCount[domain] > 1) {

        console.log(
            `Domain: ${domain} - Count: ${domainCount[domain]}`
        );

    }

});


console.log("============================");

let updated=0;
let inserted=0;
let plans=0;




for(const row of rows){



const domain =
String(row["Domain"] || "")
.trim();



if(!domain)
continue;




// ======================
// ORDER FIND
// ======================


let order =
await Order.findOne({
domainName:domain
});



const orderData:any={


managedBy:
row["Managed By"] || "Signroots",


registrationDate:
parseDate(row["Registration Date"]),


expiryDate:
parseDate(row["Expiry Date"]),


subscription:
row["Subscription"],
email_flag:
String(row["Subscription"] || "").trim() !== "",


email_status:
row["Email Status"],


username:
row["Username"],


password:
row["Password"],


users:
Number(row["Users"]) || 0,


email_customer:
row["Email Customer"],


provider:
row["Provider"],


businessEmail:
row["Business Email"],


hosting:
row["Hosting"],


google_email:
row["Google Email"],


microsoft_email:
row["Microsoft Email"],



website_flag:
String(row["Website Flag"]).toUpperCase()=="TRUE",


domain_flag:
String(row["Domain Flag"]).toUpperCase()=="TRUE",


ssl_flag:
String(row["SSL Flag"]).toUpperCase()=="TRUE",


host_flag:
String(row["Host Flag"]).toUpperCase()=="TRUE",


storage_services_flag:
String(row["Storage Flag"]).toUpperCase()=="TRUE",


msoffice_services_flag:
String(row["MS Office Flag"]).toUpperCase()=="TRUE",


dns_flag:
String(row["DNS Flag"]).toUpperCase()=="TRUE",



nameServers:
row["Name Servers"]
?
row["Name Servers"].split(",")
:
[],


dnsDetails:
row["DNS Details"]
?
row["DNS Details"].split(",")
:
[],


originalRegistrar:
row["Original Registrar"],


cloudflareRegistered:
String(row["Cloudflare"]).toUpperCase()=="TRUE",



created_on:
parseDate(row["Created On"]),


modified_on:
parseDate(row["Modified On"]),


activated_on:
parseDate(row["Activated On"]),


order_id:
row["Order ID"]



};


const registrationDate =
    parseDate(row["Plan Registration"]) ||
    parseDate(row["Registration Date"]);

const expiryDate =
    parseDate(row["Plan Expiry"]) ||
    parseDate(row["Expiry Date"]);

if (!registrationDate || !expiryDate) {

    console.log("====================================");
    console.log("Skipping Plan :", domain);
    console.log("Plan Registration :", row["Plan Registration"]);
    console.log("Registration Date :", row["Registration Date"]);
    console.log("Plan Expiry :", row["Plan Expiry"]);
    console.log("Expiry Date :", row["Expiry Date"]);
    console.log("====================================");

    
}



if(order){


await Order.updateOne(
{
_id:order._id
},
{
$set:orderData
}
);


console.log(
"Updated:",
domain
);


updated++;


}
else{


order =
await Order.create({

domainName:domain,

...orderData

});


console.log(
"Inserted:",
domain
);


inserted++;

}




// =================================
// ORDER PLAN IMPORT
// =================================



const planName = String(row["Subscription"] || "").trim();
const emailTypeName = String(row["Email Type"] || "").trim();

if (planName && order) {

    console.log("====================================");
    console.log("Domain :", domain);
    console.log("Subscription :", planName);
    console.log("Email Type :", emailTypeName);

    // --------------------------
    // Find Plan
    // --------------------------
    const plan = await PlanEmail.findOne({
        plan: planName
    });

    console.log("Plan Found :", plan);

    if (!plan) {

        console.log("❌ Plan not found :", planName);
        continue;

    }

    // --------------------------
    // Find Email Type
    // --------------------------
    let emailType = null;

    if (emailTypeName) {

        emailType = await TypeEmail.findOne({
            name: emailTypeName
        });

    }

    console.log("Email Type Found :", emailType);

    // --------------------------
    // Plan Data
    // --------------------------
    const planData = {

        orderId: order._id,

        planId: plan._id,

        emailTypeId:
            emailType?._id || plan.emailType,

        registrationDate:
    parseDate(row["Plan Registration"]) ||
    parseDate(row["Registration Date"]),

expiryDate:
    parseDate(row["Plan Expiry"]) ||
    parseDate(row["Expiry Date"]),
        noOfUsers:
            Number(row["Plan Users"]) ||
            Number(row["Users"]) ||
            1,

        type:
            row["Plan Type"] || "email",

        adminEmail:
            row["Admin Email"] || "",

        adminPassword:
            row["Admin Password"] || "",

        status:
            row["Plan Status"] ||
            row["Email Status"] ||
            ""

    };

    console.log({
    domain,
    registration: row["Plan Registration"],
    expiry: row["Plan Expiry"],
    parsedRegistration: parseDate(row["Plan Registration"]),
    parsedExpiry: parseDate(row["Plan Expiry"]),
    adminEmail: row["Admin Email"],
    adminPassword: row["Admin Password"]
});

   const savedPlan = await OrderPlan.findOneAndUpdate(
    { orderId: order._id },
    { $set: planData },
    {
        upsert: true,
        new: true,
        runValidators: true
    }
);

console.log(savedPlan);
    console.log("✅ Plan Saved :", domain);

    plans++;

}





}





console.log("================");

console.log(
"Inserted:",
inserted
);

console.log(
"Updated:",
updated
);

console.log(
"Plans:",
plans
);
console.log("Duplicate Domains:");

Object.keys(domainMap).forEach((domain)=>{

    if(domainMap[domain].length > 1){

        console.log(
            domain,
            "Count:",
            domainMap[domain].length,
            "Rows:",
            domainMap[domain]
        );

    }

});
const uniqueDomains = new Set(domains);

const duplicateAvoided =
domains.length - uniqueDomains.size;


console.log("================");
console.log("Total Rows :", domains.length);
console.log("Unique Domains :", uniqueDomains.size);
console.log("Duplicate Rows Avoided :", duplicateAvoided);
console.log("================");
console.log("Excel Headers:");
console.log(Object.keys(rows[0]));
console.log(
"Rows:",
rows.length
);
console.log(
"Import Completed"
);



}
catch(err){

console.error(
err
);

}
finally{


await mongoose.connection.close();


}



}



importOrders();