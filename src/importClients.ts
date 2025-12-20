/**
 * IMPORT CLIENT DATA FROM CSV / XLSX
 * ---------------------------------
 * Run:
 * npx ts-node src/importClients.ts
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import * as xlsx from 'xlsx';

import Client from './models/Client';
import Country from './models/Country';
import State from './models/State';

/* ===============================
   TYPES
================================ */
type ClientExcelRow = {
  'Company Name'?: string;
  'Salutation'?: string;
  'First Name'?: string;
  'Last Name'?: string;
  'Phone'?: string;
  'Status'?: string;
  'Bank Account Payment'?: string;
  'Portal Enabled'?: string | boolean;
  'Billing Address'?: string;
  'Billing Street2'?: string;
  'Billing City'?: string;
  'Billing State'?: string;
  'Billing Country'?: string;
  'Billing Code'?: string;
  'GST Identification Number (GSTIN)'?: string;
  'EmailID'?: string;
  'MobilePhone'?: string;
  'Place Of Contact'?: string;
  'Place of Contact(With State Code)'?: string;
};

const filePath = 'clients.csv';

/* ===============================
   CACHES
================================ */
const countryCache = new Map<string, mongoose.Types.ObjectId>();
const stateCache = new Map<string, mongoose.Types.ObjectId>();

/* ===============================
   COUNTRY HELPER
================================ */
const getCountryId = async (nameRaw: string): Promise<mongoose.Types.ObjectId> => {
  const name = nameRaw.trim() || 'Unknown Country';

  if (countryCache.has(name)) return countryCache.get(name)!;

  const country = await Country.findOne({ name }).lean<{ _id: mongoose.Types.ObjectId }>();

  if (country) {
    countryCache.set(name, country._id);
    return country._id;
  }

  const created = await Country.create({
    name,
    code: name.substring(0, 3).toUpperCase(),
  });

  const id = created._id as mongoose.Types.ObjectId;
  countryCache.set(name, id);
  return id;
};

/* ===============================
   STATE HELPER
================================ */
const getStateId = async (
  nameRaw: string,
  countryId: mongoose.Types.ObjectId
): Promise<mongoose.Types.ObjectId> => {
  const name = nameRaw.trim() || 'Unknown State';
  const key = `${name}_${countryId.toString()}`;

  if (stateCache.has(key)) return stateCache.get(key)!;

  const state = await State.findOne({ name, country: countryId }).lean<{ _id: mongoose.Types.ObjectId }>();

  if (state) {
    stateCache.set(key, state._id);
    return state._id;
  }

  const created = await State.create({ name, country: countryId });
  const id = created._id as mongoose.Types.ObjectId;
  stateCache.set(key, id);
  return id;
};

/* ===============================
   MAIN IMPORT FUNCTION
================================ */
async function importClientData() {
  try {
    if (!process.env.MONGO_URI) throw new Error('❌ MONGO_URI not found');

    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');

    // READ EXCEL / CSV
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json<ClientExcelRow>(sheet, {
      defval: '',
      raw: false,
    });

    console.log(`📄 Total rows found: ${rows.length}`);

    const clients: any[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const countryId = await getCountryId(row['Billing Country'] || '');
      const stateId = await getStateId(row['Billing State'] || '', countryId);

      clients.push({
        _id: new mongoose.Types.ObjectId(),
        c_salutation: row['Salutation'] || '',
        c_firstName: row['First Name'] || '',
        c_lastName: row['Last Name'] || '',
        c_name: `${row['First Name'] || ''} ${row['Last Name'] || ''}`.trim() || `Unknown_${i + 1}`,
        c_email: row['EmailID'] ? [row['EmailID']] : [`noemail_${i + 1}@example.com`],
        c_phone: row['Phone'] || row['MobilePhone'] || `no-phone-${i + 1}`,
        c_mobilePhone: row['MobilePhone'] || '',
        c_company: row['Company Name'] || `Unknown Company_${i + 1}`,
        c_address: row['Billing Address'] || 'Unknown Address',
        c_address2: row['Billing Street2'] || '',
        c_city: row['Billing City'] || 'Unknown City',
        c_state: stateId,
        c_country: countryId,
        c_zipCode: row['Billing Code'] || '',
        c_gst: row['GST Identification Number (GSTIN)'] || '',
        c_status: row['Status'] || '',
        c_bankAccountPayment: row['Bank Account Payment'] || '',
        c_portalEnabled: row['Portal Enabled'] === true || row['Portal Enabled'] === 'true',
        c_placeOfContact: row['Place Of Contact'] || '',
        c_placeOfContactWithStateCode: row['Place of Contact(With State Code)'] || '',
        is_active: true,
      });
    }

    // INSERT ALL CLIENTS
    await Client.insertMany(clients, { ordered: true });
    console.log(`✅ Successfully inserted ALL ${clients.length} clients`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  }
}

/* ===============================
   RUN
================================ */
importClientData();
