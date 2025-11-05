import mongoose, { Schema, Document } from "mongoose";
import { IUserType } from "./UserType";

// ✅ TypeScript Interface
export interface ICustomer extends Document {
  _id: mongoose.Types.ObjectId;

  // Standard user fields
  resellerCustomerId?: string;
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  addedOn?: Date;
  password?: string;

  // User role / type
  userType?: mongoose.Types.ObjectId | IUserType;

  // Customer-specific fields (prefixed with `c_`)


  // Customer flag
  is_customer?: boolean;
}

// ✅ Mongoose Schema
const customerSchema = new Schema<ICustomer>(
  {
    resellerCustomerId: { type: String },
    name: { type: String },
    email: { type: String, unique: true,sparse: true },  // ✅ Consider making this required
    phone: { type: String },
    company: { type: String },
    address: { type: String },
    city: { type: String },
    state: { type: String },
    country: { type: String },
    zipCode: { type: String },
    addedOn: { type: Date, default: Date.now },

    password: { type: String },  // ✅ Required for login

    userType: { type: Schema.Types.ObjectId, ref: "UserType" },

    // Customer-specific (prefixed) fields
    
    is_customer: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// ✅ Mongoose Model Export
export default mongoose.model<ICustomer>("Customer", customerSchema);
