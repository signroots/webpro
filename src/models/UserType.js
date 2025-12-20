"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// models/UserType.ts
var mongoose_1 = require("mongoose");
var UserTypeSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
    is_active: { type: Boolean, default: true },
}, {
    timestamps: true, // optional, adds createdAt and updatedAt
});
var UserType = mongoose_1.default.model("UserType", UserTypeSchema);
exports.default = UserType;
