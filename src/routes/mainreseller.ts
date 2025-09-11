import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import Domain from '../models/Domain';
import Customer from '../models/Customer';

dotenv.config();
const router = express.Router();

//  Import domains from ResellerClub (Paginated)
router.get('/import/mainresellerclub', async (_req, res) => {
  try {
    const { MAIN_RESELLER_USER_ID, MAIN_RESELLER_API_KEY } = process.env;
    const perPage = 100;
    let page = 1;
    let allDomains: any[] = [];

    console.log("RESELLER_USER_ID:", MAIN_RESELLER_USER_ID);
    console.log("RESELLER_API_KEY:", MAIN_RESELLER_API_KEY);

    // Fetch paginated domain list
    while (true) {
      const response = await axios.get('https://httpapi.com/api/domains/search.json', {
        params: {
          'auth-userid': MAIN_RESELLER_USER_ID,
          'api-key': MAIN_RESELLER_API_KEY,
          'no-of-records': perPage,
          'page-no': page,
        },
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Accept': 'application/json',
        },
      });

      const rawData = response.data;
      const keys = Object.keys(rawData).filter((key) => /^\d+$/.test(key));
      if (keys.length === 0) break;

      for (const key of keys) {
        allDomains.push(rawData[key]);
      }

      console.log(`✅ Page ${page} fetched ${keys.length} domains`);
      page++;
    }

    const savedDomains = [];

    // ✅ Step 1: Get existing domains
    const apiDomainNames = allDomains.map(d => d['entity.description']);
    const existingDomains = await Domain.find({
      domainName: { $in: apiDomainNames }
    }).select('domainName');

    const existingDomainNames = new Set(existingDomains.map(d => d.domainName));
    const duplicateDomains = Array.from(existingDomainNames);

    console.log(`🔁 Found ${duplicateDomains.length} duplicate domains already in DB:`);
    duplicateDomains.forEach(name => console.log(`- ${name}`));

    // ✅ Step 2: Import non-duplicate domains
    for (const d of allDomains) {
      const domainName = d['entity.description'];

      // ⏩ Skip duplicates
      if (existingDomainNames.has(domainName)) {
        console.log(`⏩ Skipping existing domain: ${domainName}`);
        continue;
      }

      const resellerCustomerId = d['entity.customerid'];

      const customerRes = await axios.get('https://httpapi.com/api/customers/details-by-id.json', {
        params: {
          'auth-userid': MAIN_RESELLER_USER_ID,
          'api-key': MAIN_RESELLER_API_KEY,
          'customer-id': resellerCustomerId,
        },
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Accept': 'application/json',
        },
      });

      const customerData = customerRes.data;

      const resellerType =
        customerData.resellerid === process.env.MAIN_RESELLER_USER_ID
          ? 'MainReseller'
          : customerData.resellerid === process.env.RESELLER_USER_ID
          ? 'SubReseller'
          : 'Unknown';

      // Fetch sub-reseller info
      let resellerInfo = { name: 'N/A', email: 'N/A' };
      try {
        const resellerInfoRes = await axios.get('https://httpapi.com/api/resellers/details.json', {
          params: {
            'auth-userid': MAIN_RESELLER_USER_ID,
            'api-key': MAIN_RESELLER_API_KEY,
            'reseller-id': customerData.resellerid,
          },
          headers: {
            'User-Agent': 'Mozilla/5.0',
            'Accept': 'application/json',
          },
        });

        resellerInfo = resellerInfoRes.data;
      } catch (resellerErr) {
        console.warn('⚠️ Could not fetch reseller info for ID:', customerData.resellerid);
      }

      // Prepare domain data
let expiryDate: Date | null = null;

if (d['orders.endtime']) {
  expiryDate = new Date(Number(d['orders.endtime']) * 1000);
} else {
  // Fallback: fetch domain details
  try {
    const detailsRes = await axios.get('https://httpapi.com/api/domains/details.json', {
      params: {
        'auth-userid': MAIN_RESELLER_USER_ID,
        'api-key': MAIN_RESELLER_API_KEY,
        'order-id': d['orders.orderid'], // 👈 use order-id instead of domain name
        'options': 'All',
      },
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json',
      },
    });

    if (detailsRes.data.endtime) {
      expiryDate = new Date(Number(detailsRes.data.endtime) * 1000);
    }
  } catch (err) {
    console.warn(`⚠️ Could not fetch expiry date for domain ${d['entity.description']}`);
  }
}

      // Upsert customer
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
          resellerCustomerId: customerData.customerid,
        },
        { new: true, upsert: true }
      );

      // Prepare domain data
      const domainData = {
        domainName,
        customer: customer._id,
        status: d['entity.currentstatus'],
        managedBy: 'Signroots',
        registrationDate: new Date(Number(d['orders.creationtime']) * 1000),
        expiryDate,
        originalRegistrar: d['entitytype.entitytypekey'] || 'Unknown',
        lockStatus: d['orders.transferlock'] === 'true' ? 'Locked' : 'Unlocked',
        domainSource: ['resellerclub'],
        nameServers: [],
        dnsDetails: [],
        reseller_outside_inside: resellerType,
        reseller_id: customerData.resellerid,
        resellerCustomerId: customerData.customerid,
        subResellerName: resellerInfo.name || 'N/A',
        subResellerEmail: resellerInfo.email || 'N/A',
      };

      // Save domain
      const saved = await Domain.findOneAndUpdate(
        { domainName: domainData.domainName },
        domainData,
        { upsert: true, new: true }
      );

      savedDomains.push(saved);
    }

    res.status(200).json({
      message: 'ResellerClub domains imported successfully',
      count: savedDomains.length,
      duplicates: duplicateDomains.length,
      data: savedDomains,
    });

  } catch (error: any) {
    console.error(' ResellerClub Import Error:', {
      message: error.message,
      response: error.response?.data,
      stack: error.stack,
    });

    res.status(500).json({ error: 'Failed to import ResellerClub domains' });
  }
});

export default router;
