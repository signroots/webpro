/**
 * IMPORT CLIENT DATA FROM CSV / XLSX
 * ---------------------------------
 * Run:
 * npx ts-node src/importClients.ts
 */

import 'dotenv/config'; // ✅ MUST be first

import mongoose from 'mongoose';
import xlsx from 'xlsx';
import Client from './models/Client';

/**
 * Inline typing for Excel row
 * (No external interface file needed)
 */
type ClientExcelRow = {
  'Created Time'?: string;
  'Last Modified Time'?: string;
  'Company Name': string;
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

// ✅ Path to your CSV / XLSX file
const filePath = 'clients.csv';

async function importClientData() {
  try {
    // 1️⃣ Validate env
    if (!process.env.MONGO_URI) {
      throw new Error('❌ MONGO_URI not found in .env file');
    }

    // 2️⃣ MongoDB connect
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');

    // 3️⃣ Read Excel / CSV file
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    // 4️⃣ Parse sheet into typed rows
    const rows = xlsx.utils.sheet_to_json<ClientExcelRow>(sheet, {
      defval: '',
      raw: false,
    });

    console.log(`📄 Total rows found: ${rows.length}`);

    // 5️⃣ Transform rows → Client schema
    const clients = rows.map((row) => ({
      c_salutation: row['Salutation'],
      c_firstName: row['First Name'],
      c_lastName: row['Last Name'],
      c_name: `${row['First Name'] || ''} ${row['Last Name'] || ''}`.trim(),
      c_email: row['EmailID'] ? [row['EmailID']] : [],
      c_phone: row['Phone'] || row['MobilePhone'] || '',
      c_mobilePhone: row['MobilePhone'],
      c_company: row['Company Name'],
      c_address: row['Billing Address'],
      c_address2: row['Billing Street2'],
      c_city: row['Billing City'],
      c_state: row['Billing State'],
      c_country: row['Billing Country'],
      c_zipCode: row['Billing Code'],
      c_gst: row['GST Identification Number (GSTIN)'],
      c_status: row['Status'],
      c_bankAccountPayment: row['Bank Account Payment'],
      c_portalEnabled:
        row['Portal Enabled'] === true ||
        row['Portal Enabled'] === 'true',
      c_placeOfContact: row['Place Of Contact'],
      c_placeOfContactWithStateCode:
        row['Place of Contact(With State Code)'],
      is_active: true,
    }));

    // 6️⃣ Filter invalid rows (required fields)
    const validClients = clients.filter(
      (c) => c.c_name && c.c_company && c.c_email.length > 0
    );

    // 7️⃣ Bulk insert (fast & safe)
    await Client.insertMany(validClients, { ordered: false });

    console.log(`✅ Successfully imported ${validClients.length} clients`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  }
}

// 🚀 Run importer
importClientData();
