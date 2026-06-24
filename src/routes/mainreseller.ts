import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import Order from '../models/Order';
import Customer from '../models/Customer';

dotenv.config();
const router = express.Router();

/* ======================================================
   BACKGROUND IMPORT FUNCTION (LONG TASK)
====================================================== */
export async function importMainResellerClubDomains(){
  try {
    const { MAIN_RESELLER_USER_ID, MAIN_RESELLER_API_KEY, RESELLER_USER_ID } = process.env;

    if (!MAIN_RESELLER_USER_ID || !MAIN_RESELLER_API_KEY) {
      throw new Error('ResellerClub credentials missing');
    }

    const perPage = 100;
    let page = 1;
    let allDomains: any[] = [];

    console.log('🚀 ResellerClub import started');

    /* ---------------- FETCH DOMAINS (PAGINATION) ---------------- */
    while (true) {
      console.log(`📄 Fetching page ${page}`);

      const response = await axios.get(
        'https://httpapi.com/api/domains/search.json',
        {
          params: {
            'auth-userid': MAIN_RESELLER_USER_ID,
            'api-key': MAIN_RESELLER_API_KEY,
            'no-of-records': perPage,
            'page-no': page,
          },
        }
      );

      const rawData = response.data;
      const keys = Object.keys(rawData).filter(k => /^\d+$/.test(k));

      if (keys.length === 0) break;

      keys.forEach(k => allDomains.push(rawData[k]));
      console.log(`✅ Page ${page} fetched ${keys.length} domains`);

      page++;
    }

    console.log(`📦 Total domains fetched: ${allDomains.length}`);

    /* ---------------- CHECK EXISTING DOMAINS ---------------- */
    const apiDomainNames = allDomains.map(d => d['entity.description']);
    // const existingDomains = await Order.find({
    //   domainName: { $in: apiDomainNames },
    // }).select('domainName');

    // const existingDomainNames = new Set(existingDomains.map(d => d.domainName));
    // console.log(`🔁 Found ${existingDomainNames.size} duplicate domains`);

    /* ---------------- IMPORT DOMAINS ---------------- */
    for (const d of allDomains) {
      const domainName = d['entity.description'];

      // if (existingDomainNames.has(domainName)) {
      //   console.log(`⏩ Skipping existing domain: ${domainName}`);
      //   continue;
      // }

      console.log(`➕ Importing domain: ${domainName}`);

      /* ---------- CUSTOMER DETAILS ---------- */
      const customerRes = await axios.get(
        'https://httpapi.com/api/customers/details-by-id.json',
        {
          params: {
            'auth-userid': MAIN_RESELLER_USER_ID,
            'api-key': MAIN_RESELLER_API_KEY,
            'customer-id': d['entity.customerid'],
          },
        }
      );

      const customerData = customerRes.data;

      const resellerType =
        customerData.resellerid === MAIN_RESELLER_USER_ID
          ? 'MainReseller'
          : customerData.resellerid === RESELLER_USER_ID
          ? 'SubReseller'
          : 'Unknown';

      /* ---------- RESELLER INFO ---------- */
      let resellerInfo = { name: 'N/A', email: 'N/A' };
      try {
        const resellerInfoRes = await axios.get(
          'https://httpapi.com/api/resellers/details.json',
          {
            params: {
              'auth-userid': MAIN_RESELLER_USER_ID,
              'api-key': MAIN_RESELLER_API_KEY,
              'reseller-id': customerData.resellerid,
            },
          }
        );
        resellerInfo = resellerInfoRes.data;
      } catch {
        console.warn(`⚠️ Reseller info not found for ${customerData.resellerid}`);
      }

      /* ---------- EXPIRY DATE ---------- */
      let expiryDate: Date | null = null;

      if (d['orders.endtime']) {
        expiryDate = new Date(Number(d['orders.endtime']) * 1000);
      } else {
        try {
          const detailsRes = await axios.get(
            'https://httpapi.com/api/domains/details.json',
            {
              params: {
                'auth-userid': MAIN_RESELLER_USER_ID,
                'api-key': MAIN_RESELLER_API_KEY,
                'order-id': d['orders.orderid'],
                options: 'All',
              },
            }
          );

          if (detailsRes.data.endtime) {
            expiryDate = new Date(Number(detailsRes.data.endtime) * 1000);
          }
        } catch {
          console.warn(`⚠️ Expiry date missing for ${domainName}`);
        }
      }

      /* ---------- UPSERT CUSTOMER ---------- */
      const customer = await Customer.findOneAndUpdate(
        { resellerCustomerId: customerData.customerid },
        {
          name: customerData.name,
          email: customerData.useremail,
          company: customerData.company,
          address: customerData.address1,
          city: customerData.city,
          country: customerData.country,
          phone: customerData.mobileno,
          state: customerData.state,
          resellerCustomerId: customerData.customerid,
        },
        { new: true, upsert: true }
      );

      /* ---------- DOMAIN SAVE ---------- */
      await Order.findOneAndUpdate(
        { domainName },
        {
          domainName,
          customer: customer._id,
          status: d['entity.currentstatus'],
          managedBy: 'Signroots',
          registrationDate: new Date(Number(d['orders.creationtime']) * 1000),
          expiryDate,
          originalRegistrar: d['entitytype.entitytypekey'] || 'Unknown',
          lockStatus: d['orders.transferlock'] === 'true' ? 'Locked' : 'Unlocked',
          domainSource: 'resellerclub',
          nameServers: [],
          dnsDetails: [],
          reseller_outside_inside: resellerType,
          reseller_id: customerData.resellerid,
          resellerCustomerId: customerData.customerid,
          subResellerName: resellerInfo.name,
          subResellerEmail: resellerInfo.email,
        },
        { upsert: true }
      );
    }

    console.log('✅ ResellerClub import completed');
  }  catch (error: any) {

  console.log("========== RESELLER ERROR ==========");

  console.log("STATUS:");
  console.log(error.response?.status);

  console.log("HEADERS:");
  console.log(error.response?.headers);

  console.log("DATA:");
  console.log(error.response?.data);

  console.log("MESSAGE:");
  console.log(error.message);

  console.log("====================================");
}
}

/* ======================================================
   API ROUTE (NON-BLOCKING)
====================================================== */
router.get('/import/mainresellerclub', async (_req, res) => {
  console.log('🔥 Import API triggered');

  setImmediate(() => {
    importMainResellerClubDomains();
  });

  res.status(202).json({
    success: true,
    message: 'ResellerClub import started in background',
  });
});

export default router;
