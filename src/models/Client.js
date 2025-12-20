"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose_1 = require("mongoose");
var ClientSchema = new mongoose_1.Schema({
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
    c_state: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'State' }, // Reference to State collection
    c_country: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'Country' }, // Reference to Country collection
    c_zipCode: { type: String, trim: true },
    c_gst: { type: String, trim: true },
    c_status: { type: String, trim: true },
    c_bankAccountPayment: { type: String, trim: true },
    c_portalEnabled: { type: Boolean, default: false },
    c_placeOfContact: { type: String, trim: true },
    c_placeOfContactWithStateCode: { type: String, trim: true },
    encryptedPassword: { type: String },
    password: { type: String, select: false }, // Hidden by default
    is_active: { type: Boolean, default: true },
    addedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "UserType" },
    userType: { type: mongoose_1.Schema.Types.ObjectId, ref: "UserType" },
}, { timestamps: true });
// Optional index for faster lookup
ClientSchema.index({ c_email: 1, c_phone: 1 });
exports.default = mongoose_1.default.model("Client", ClientSchema);
