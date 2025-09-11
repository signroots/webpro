import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  resellerCustomerId: { type: String, required: true, unique: true }, // ✅ Add this
  name: { type: String, required: true },
  email: { type: String },
  phone: { type: String },
  company: { type: String },
  address: { type: String },
  city: { type: String },
  state: { type: String },
  country: { type: String },
  zipCode: { type: String },
  addedOn: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('Customer', customerSchema);
