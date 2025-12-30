"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypeEmail = void 0;
// backend/models/TypeEmail.ts
var mongoose_1 = require("mongoose");
var TypeEmailSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
    image: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });
exports.TypeEmail = mongoose_1.default.model("TypeEmail", TypeEmailSchema);
