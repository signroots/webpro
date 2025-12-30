"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlanEmail = void 0;
// models/PlanEmail.ts
var mongoose_1 = require("mongoose");
var planEmailSchema = new mongoose_1.Schema({
    plan: { type: String, required: true, trim: true },
    emailType: { type: mongoose_1.Schema.Types.ObjectId, ref: "TypeEmail", required: true },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
}, {
    timestamps: true, // automatically creates createdAt and updatedAt
});
exports.PlanEmail = (0, mongoose_1.model)("PlanEmail", planEmailSchema);
