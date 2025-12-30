"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderPlan = void 0;
var mongoose_1 = require("mongoose");
var OrderPlanSchema = new mongoose_1.Schema({
    orderId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Order", required: true },
    planId: { type: mongoose_1.Schema.Types.ObjectId, ref: "PlanEmail", required: true },
    emailTypeId: { type: mongoose_1.Schema.Types.ObjectId, ref: "TypeEmail", required: true },
    registrationDate: { type: Date, required: true },
    expiryDate: { type: Date, required: true },
    noOfUsers: { type: Number, default: 1 },
    type: {
        type: String,
        enum: ["email", "storage", "msoffice"],
        required: true,
    },
    // NEW FIELDS FROM CSV
    adminEmail: { type: String, default: "" },
    adminPassword: { type: String, default: "" },
    status: { type: String, default: "" },
}, { timestamps: true });
exports.OrderPlan = mongoose_1.default.model("OrderPlan", OrderPlanSchema);
