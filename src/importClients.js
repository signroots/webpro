"use strict";
/**
 * IMPORT CLIENT DATA FROM CSV / XLSX
 * ---------------------------------
 * Run:
 * npx ts-node src/importClients.ts
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
var mongoose_1 = require("mongoose");
var xlsx = require("xlsx");
var Client_1 = require("./models/Client");
var Country_1 = require("./models/Country");
var State_1 = require("./models/State");
var filePath = 'clients.csv';
/* ===============================
   CACHES
================================ */
var countryCache = new Map();
var stateCache = new Map();
/* ===============================
   COUNTRY HELPER
================================ */
var getCountryId = function (nameRaw) { return __awaiter(void 0, void 0, void 0, function () {
    var name, country, created, id;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                name = nameRaw.trim() || 'Unknown Country';
                if (countryCache.has(name))
                    return [2 /*return*/, countryCache.get(name)];
                return [4 /*yield*/, Country_1.default.findOne({ name: name }).lean()];
            case 1:
                country = _a.sent();
                if (country) {
                    countryCache.set(name, country._id);
                    return [2 /*return*/, country._id];
                }
                return [4 /*yield*/, Country_1.default.create({
                        name: name,
                        code: name.substring(0, 3).toUpperCase(),
                    })];
            case 2:
                created = _a.sent();
                id = created._id;
                countryCache.set(name, id);
                return [2 /*return*/, id];
        }
    });
}); };
/* ===============================
   STATE HELPER
================================ */
var getStateId = function (nameRaw, countryId) { return __awaiter(void 0, void 0, void 0, function () {
    var name, key, state, created, id;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                name = nameRaw.trim() || 'Unknown State';
                key = "".concat(name, "_").concat(countryId.toString());
                if (stateCache.has(key))
                    return [2 /*return*/, stateCache.get(key)];
                return [4 /*yield*/, State_1.default.findOne({ name: name, country: countryId }).lean()];
            case 1:
                state = _a.sent();
                if (state) {
                    stateCache.set(key, state._id);
                    return [2 /*return*/, state._id];
                }
                return [4 /*yield*/, State_1.default.create({ name: name, country: countryId })];
            case 2:
                created = _a.sent();
                id = created._id;
                stateCache.set(key, id);
                return [2 /*return*/, id];
        }
    });
}); };
/* ===============================
   MAIN IMPORT FUNCTION
================================ */
function importClientData() {
    return __awaiter(this, void 0, void 0, function () {
        var workbook, sheet, rows, clients, i, row, countryId, stateId, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 8, , 9]);
                    if (!process.env.MONGO_URI)
                        throw new Error('❌ MONGO_URI not found');
                    return [4 /*yield*/, mongoose_1.default.connect(process.env.MONGO_URI)];
                case 1:
                    _a.sent();
                    console.log('✅ MongoDB connected');
                    workbook = xlsx.readFile(filePath);
                    sheet = workbook.Sheets[workbook.SheetNames[0]];
                    rows = xlsx.utils.sheet_to_json(sheet, {
                        defval: '',
                        raw: false,
                    });
                    console.log("\uD83D\uDCC4 Total rows found: ".concat(rows.length));
                    clients = [];
                    i = 0;
                    _a.label = 2;
                case 2:
                    if (!(i < rows.length)) return [3 /*break*/, 6];
                    row = rows[i];
                    return [4 /*yield*/, getCountryId(row['Billing Country'] || '')];
                case 3:
                    countryId = _a.sent();
                    return [4 /*yield*/, getStateId(row['Billing State'] || '', countryId)];
                case 4:
                    stateId = _a.sent();
                    clients.push({
                        _id: new mongoose_1.default.Types.ObjectId(),
                        c_salutation: row['Salutation'] || '',
                        c_firstName: row['First Name'] || '',
                        c_lastName: row['Last Name'] || '',
                        c_name: "".concat(row['First Name'] || '', " ").concat(row['Last Name'] || '').trim() || "Unknown_".concat(i + 1),
                        c_email: row['EmailID'] ? [row['EmailID']] : ["noemail_".concat(i + 1, "@example.com")],
                        c_phone: row['Phone'] || row['MobilePhone'] || "no-phone-".concat(i + 1),
                        c_mobilePhone: row['MobilePhone'] || '',
                        c_company: row['Company Name'] || "Unknown Company_".concat(i + 1),
                        c_address: row['Billing Address'] || 'Unknown Address',
                        c_address2: row['Billing Street2'] || '',
                        c_city: row['Billing City'] || 'Unknown City',
                        c_state: stateId,
                        c_country: countryId,
                        c_zipCode: row['Billing Code'] || '',
                        c_gst: row['GST Identification Number (GSTIN)'] || '',
                        c_status: row['Status'] || '',
                        c_bankAccountPayment: row['Bank Account Payment'] || '',
                        c_portalEnabled: row['Portal Enabled'] === true || row['Portal Enabled'] === 'true',
                        c_placeOfContact: row['Place Of Contact'] || '',
                        c_placeOfContactWithStateCode: row['Place of Contact(With State Code)'] || '',
                        is_active: true,
                    });
                    _a.label = 5;
                case 5:
                    i++;
                    return [3 /*break*/, 2];
                case 6: 
                // INSERT ALL CLIENTS
                return [4 /*yield*/, Client_1.default.insertMany(clients, { ordered: true })];
                case 7:
                    // INSERT ALL CLIENTS
                    _a.sent();
                    console.log("\u2705 Successfully inserted ALL ".concat(clients.length, " clients"));
                    process.exit(0);
                    return [3 /*break*/, 9];
                case 8:
                    error_1 = _a.sent();
                    console.error('❌ Import failed:', error_1);
                    process.exit(1);
                    return [3 /*break*/, 9];
                case 9: return [2 /*return*/];
            }
        });
    });
}
/* ===============================
   RUN
================================ */
importClientData();
