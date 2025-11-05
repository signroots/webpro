// src/importStates.ts
import mongoose from 'mongoose';
import fs from 'fs';
import csvParser from 'csv-parser';
import dotenv from 'dotenv';
import State from './models/State';
import Country from './models/Country';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/yourdbname';

interface StateCSVRow {
  name: string;
  countryCode: string; // e.g., "AF"
  code?: string;       // e.g., "BDS"
}

async function importStates() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB');

  const states: StateCSVRow[] = [];

  fs.createReadStream('./states.csv')  // adjust path if needed
    .pipe(csvParser())
    .on('data', (row) => {
      states.push({
        name: row.name,
        countryCode: row.countryCode,
        code: row.state_code || row.code, // handle if your CSV uses state_code or code
      });
    })
    .on('end', async () => {
      console.log(`📄 Read ${states.length} states from CSV.`);

      for (const state of states) {
        // Find country by code (string like 'AF', not number)
        const country = await Country.findOne({ code: state.countryCode });

        if (!country) {
          console.log(`⚠️  Country not found for code: ${state.countryCode}, skipping state: ${state.name}`);
          continue;
        }

        // Check if state exists for this country
        const exists = await State.findOne({ code: state.code, country: country._id });
        if (!exists) {
          await State.create({ name: state.name, code: state.code, country: country._id });
          console.log(`✅ Inserted: ${state.name}`);
        } else {
          console.log(`⚠️  Skipped (already exists): ${state.name}`);
        }
      }

      console.log('🎉 State import completed!');
      await mongoose.disconnect();
    })
    .on('error', (error) => {
      console.error('❌ Error reading CSV:', error);
    });
}

importStates().catch(async (err) => {
  console.error('❌ Import failed:', err);
  await mongoose.disconnect();
});
