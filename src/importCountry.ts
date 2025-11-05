import mongoose from 'mongoose';
import fs from 'fs';
import csvParser from 'csv-parser';
import dotenv from 'dotenv';
import Country, { ICountry } from './models/Country';

dotenv.config(); // To use values from .env

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/yourdbname';

async function importCountries() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB');

  const countries: { name: string; code: string }[] = [];

  fs.createReadStream('./countries.csv')
    .pipe(csvParser())
    .on('data', (row) => {
      countries.push({ name: row.name, code: row.code });
    })
    .on('end', async () => {
      console.log(`📄 Read ${countries.length} countries from CSV.`);

      for (const country of countries) {
        const exists = await Country.findOne({ code: country.code });
        if (!exists) {
          await Country.create(country);
          console.log(`✅ Inserted: ${country.name}`);
        } else {
          console.log(`⚠️  Skipped (already exists): ${country.name}`);
        }
      }

      console.log('🎉 Country import completed!');
      mongoose.disconnect();
    });
}

importCountries().catch((err) => {
  console.error('❌ Import failed:', err);
  mongoose.disconnect();
});
