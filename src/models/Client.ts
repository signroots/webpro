import mongoose, { Schema, Document } from "mongoose";
import { IUserType } from "./UserType";

export interface IClient extends Document {
  _id: mongoose.Types.ObjectId;
  c_salutation?: string;  // New Field: Salutation
  c_firstName?: string;  // New Field: First Name
  c_lastName?: string;  // New Field: Last Name
  c_name: string;  // Full Name, can be derived from first and last name
  c_email: string[];  // Array of emails
  c_phone: string;
  c_mobilePhone?: string;  // New Field: Mobile Phone
  c_company: string;
  c_address: string;
  c_address2?: string;  // New Field: Address 2 (e.g., Billing Street2)
  c_city: string;
  c_state: string;
  c_country: string;
  c_zipCode: string;
  c_gst?: string;  // New Field: GST Identification Number (GSTIN)
  c_status?: string;  // New Field: Status
  c_bankAccountPayment?: string;  // New Field: Bank Account Payment
  c_portalEnabled?: boolean;  // New Field: Portal Enabled
  c_placeOfContact?: string;  // New Field: Place of Contact
  c_placeOfContactWithStateCode?: string;  // New Field: Place of Contact (With State Code)
  encryptedPassword?: string;
  password?: string;  // Hidden by default
  is_active?: boolean;
  addedBy?: mongoose.Types.ObjectId | IUserType;
  userType?: mongoose.Types.ObjectId | IUserType;
  createdAt?: Date;
  updatedAt?: Date;
}

const ClientSchema: Schema<IClient> = new Schema(
  {
    c_salutation: { type: String, trim: true },
    c_firstName: { type: String, trim: true },
    c_lastName: { type: String, trim: true },
    c_name: { type: String, required: true, trim: true },
    c_email: { type: [String], required: true, lowercase: true, trim: true },
    c_phone: { type: String, required: true, trim: true },
    c_mobilePhone: { type: String, trim: true },
    c_company: { type: String, required: true, trim: true },
    c_address: { type: String, required: true, trim: true },
    c_address2: { type: String, trim: true },
    c_city: { type: String, required: true, trim: true },
    c_state: { type: String, required: true, trim: true },
    c_country: { type: String, required: true, trim: true },
    c_zipCode: { type: String, trim: true },
    c_gst: { type: String, trim: true },
    c_status: { type: String, trim: true },
    c_bankAccountPayment: { type: String, trim: true },
    c_portalEnabled: { type: Boolean, default: false },
    c_placeOfContact: { type: String, trim: true },
    c_placeOfContactWithStateCode: { type: String, trim: true },
    encryptedPassword: { type: String },
    password: { type: String, select: false },  // Hidden by default
    is_active: { type: Boolean, default: true },
    addedBy: { type: Schema.Types.ObjectId, ref: "UserType" },
    userType: { type: Schema.Types.ObjectId, ref: "UserType" },
  },
  { timestamps: true }
);

// Optional index for faster lookup
ClientSchema.index({ c_email: 1, c_phone: 1 });

export default mongoose.model<IClient>("Client", ClientSchema);
