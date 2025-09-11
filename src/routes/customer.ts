import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import Customer from '../models/Customer';
import Domain from '../models/Domain';

dotenv.config();
const router = express.Router();
router.get('/', async (_req, res) => {
    try {
      const customers = await Customer.find().sort({ createdAt: -1 });
      res.status(200).json(customers);
    } catch (err: any) {
      console.error(' Error fetching customers:', err.message);
      res.status(500).json({ error: 'Failed to fetch customers' });
    }
  });
//  Route to import customer details
router.get('/import/customers', async (_req, res) => {
  try {
    const { RESELLER_USER_ID, RESELLER_API_KEY } = process.env;

    //  Step 1: Get all unique customer IDs from domains
    const domains = await Domain.find({}, 'domainName customer resellerCustomerId');
    const customerIdSet = new Set<string>();

    for (const d of domains) {
      if (d?.resellerCustomerId) {
        customerIdSet.add(d.resellerCustomerId);
      }
    }

    const customerIds = Array.from(customerIdSet);
    const savedCustomers = [];

    //  Step 2: Fetch each customer from ResellerClub and save to DB
    for (const customerId of customerIds) {
      const response = await axios.get('https://httpapi.com/api/customers/details-by-id.json', {
        params: {
          'auth-userid': RESELLER_USER_ID,
          'api-key': RESELLER_API_KEY,
          'customer-id': customerId
        }
      });

      const c = response.data;

      const customer = await Customer.findOneAndUpdate(
        { resellerCustomerId: c.customerid },
        {
          name: c.name,
          email: c.useremail,
          company: c.company,
          address: c.address1,
          city: c.city,
          country: c.country,
          phone: c.mobileno,
          resellerCustomerId: c.customerid
        },
        { upsert: true, new: true }
      );

      savedCustomers.push(customer);
    }

    res.status(200).json({
      message: 'Customers imported successfully',
      count: savedCustomers.length,
      data: savedCustomers
    });

  } catch (err: any) {
    console.error('Customer import failed:', err.message);
    res.status(500).json({ error: 'Customer import failed ' });
  }
});

export default router;
