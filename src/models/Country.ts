import mongoose, { Schema, Document } from 'mongoose';

export interface ICountry extends Document {
  name: string;
  code: string;
}

const countrySchema = new Schema<ICountry>({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  code: {
    type: String,
    required: true,
    unique: true,
  },
});

const Country = mongoose.model<ICountry>('Country', countrySchema);

export default Country;
