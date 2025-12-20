"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// ../models/Country.ts
var mongoose_1 = require("mongoose");
var countrySchema = new mongoose_1.Schema({
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
var Country = mongoose_1.default.model('Country', countrySchema);
exports.default = Country; // Default export
