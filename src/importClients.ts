/**
 * IMPORT CLIENT DATA FROM CSV / XLSX
 * ---------------------------------
 * Run:
 * npx ts-node src/importClients.ts
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import xlsx from 'xlsx';
import Client from './models/Client';

type ClientExcelRow = {
  'Created Time'?: string;
  'Last Modified Time'?: string;
  'Company Name'?: string;
  'Salutation'?: string;
  'First Name'?: string;
  'Last Name'?: string;
  'Phone'?: string;
  'Currency Code'?: string;
  'Status'?: string;
  'Bank Account Payment'?: string;
  'Portal Enabled'?: string | boolean;
  'Billing Address'?: string;
  'Billing Street2'?: string;
  'Billing City'?: string;
  'Billing State'?: string;
  'Billing Country'?: string;
  'Billing Code'?: string;
  'GST Treatment'?: string;
  'GST Identification Number (GSTIN)'?: string;
  'EmailID'?: string;
  'MobilePhone'?: string;
  'Place Of Contact'?: string;
  'Place of Contact(With State Code)'?: string;
};

const filePath = 'clients.csv';

async function importClientData() {
  try {
    // 1️⃣ Validate env
    if (!process.env.MONGO_URI) {
      throw new Error('❌ MONGO_URI not found in .env file');
    }

    // 2️⃣ Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');

    // 3️⃣ Read Excel / CSV
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json<ClientExcelRow>(sheet, {
      defval: '',
      raw: false,
    });
    console.log(`📄 Total rows found: ${rows.length}`);

    // 4️⃣ Transform rows → Client schema with placeholders for required fields
    const clients = rows.map((row, index) => ({
      _id: new mongoose.Types.ObjectId(), // Ensure unique _id
      c_salutation: row['Salutation'] || '',
      c_firstName: row['First Name'] || '',
      c_lastName: row['Last Name'] || '',
      c_name:
        `${row['First Name'] || ''} ${row['Last Name'] || ''}`.trim() ||
        `Unknown_${index + 1}`,
      c_email: row['EmailID']
        ? [row['EmailID']]
        : [`noemail_${index + 1}@example.com`],
      c_phone: row['Phone'] || row['MobilePhone'] || `no-phone-${index + 1}`,
      c_mobilePhone: row['MobilePhone'] || '',
      c_company: row['Company Name'] || `Unknown Company_${index + 1}`,
      c_address: row['Billing Address'] || 'Unknown Address',
      c_address2: row['Billing Street2'] || '',
      c_city: row['Billing City'] || 'Unknown City',
      c_state: row['Billing State'] || 'Unknown State',
      c_country: row['Billing Country'] || 'Unknown Country',
      c_zipCode: row['Billing Code'] || '',
      c_gst: row['GST Identification Number (GSTIN)'] || '',
      c_status: row['Status'] || '',
      c_bankAccountPayment: row['Bank Account Payment'] || '',
      c_portalEnabled:
        row['Portal Enabled'] === true || row['Portal Enabled'] === 'true'
          ? true
          : false,
      c_placeOfContact: row['Place Of Contact'] || '',
      c_placeOfContactWithStateCode:
        row['Place of Contact(With State Code)'] || '',
      is_active: true,
    }));

    // 5️⃣ Debug duplicates in Excel before insert
    const companyCount: Record<string, number> = {};
    const phoneCount: Record<string, number> = {};

    clients.forEach((c) => {
      const company = c.c_company.trim();
      const phone = c.c_phone.trim();
      if (company) companyCount[company] = (companyCount[company] || 0) + 1;
      if (phone) phoneCount[phone] = (phoneCount[phone] || 0) + 1;
    });

    const duplicateCompanies = Object.entries(companyCount)
      .filter(([_, count]) => count > 1)
      .map(([name]) => name);

    const duplicatePhones = Object.entries(phoneCount)
      .filter(([_, count]) => count > 1)
      .map(([phone]) => phone);

    if (duplicateCompanies.length > 0) {
      console.warn('⚠️ Duplicate c_company values in Excel:');
      duplicateCompanies.forEach((d) => console.warn(' -', d));
    } else {
      console.log('✅ No duplicate c_company values in Excel.');
    }

    if (duplicatePhones.length > 0) {
      console.warn('⚠️ Duplicate c_phone values in Excel:');
      duplicatePhones.forEach((d) => console.warn(' -', d));
    } else {
      console.log('✅ No duplicate c_phone values in Excel.');
    }

    // 6️⃣ Insert all clients into DB (insert all 318 rows)
    await Client.insertMany(clients, { ordered: false });
    console.log(`✅ Successfully inserted all ${clients.length} clients`);

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  }
}

// 🚀 Run importer
importClientData();
