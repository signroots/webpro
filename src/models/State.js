"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/models/State.ts
var mongoose_1 = require("mongoose");
var stateSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    code: String,
    country: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'Country', required: true },
});
var State = mongoose_1.default.model('State', stateSchema);
exports.default = State;
