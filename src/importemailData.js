"use strict";
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
var mongoose_1 = require("mongoose");
var XLSX = require("xlsx");
var dayjs_1 = require("dayjs");
var customParseFormat_1 = require("dayjs/plugin/customParseFormat");
var Order_1 = require("./models/Order");
var OrderPlan_1 = require("./models/OrderPlan");
var PlanEmail_1 = require("./models/PlanEmail");
var TypeEmail_1 = require("./models/TypeEmail");
var dotenv_1 = require("dotenv");
dotenv_1.default.config();
dayjs_1.default.extend(customParseFormat_1.default);
var MONGO_URI = process.env.MONGO_URI;
// ----------------------------------
// CONNECT TO MONGODB
// ----------------------------------
mongoose_1.default
    .connect(MONGO_URI)
    .then(function () { return console.log("✅ Connected to MongoDB"); })
    .catch(function (err) {
    console.error("❌ MongoDB Connection Error:", err);
    process.exit(1);
});
/* ----------------------------------
   HELPERS
---------------------------------- */
function excelSerialToDate(serial) {
    return new Date(Math.round((serial - 25569) * 86400 * 1000));
}
function parseMaybeDate(value) {
    if (!value)
        return null;
    if (value instanceof Date)
        return value;
    if (typeof value === "number")
        return excelSerialToDate(value);
    var parsed = (0, dayjs_1.default)(value, ["DD-MMM-YYYY", "D-MMM-YYYY", "DD/MM/YYYY", "YYYY-MM-DD"], true);
    return parsed.isValid() ? parsed.toDate() : null;
}
/* ----------------------------------
   LOOKUP HELPERS
---------------------------------- */
function getPlanId(planName, typeName) {
    return __awaiter(this, void 0, void 0, function () {
        var emailType, plan;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!planName || !typeName)
                        return [2 /*return*/, null];
                    return [4 /*yield*/, TypeEmail_1.TypeEmail.findOne({ name: typeName })];
                case 1:
                    emailType = _a.sent();
                    if (!emailType)
                        throw new Error("TypeEmail '".concat(typeName, "' not found"));
                    return [4 /*yield*/, PlanEmail_1.PlanEmail.findOne({
                            plan: planName,
                            emailType: emailType._id,
                        })];
                case 2:
                    plan = _a.sent();
                    if (!!plan) return [3 /*break*/, 4];
                    return [4 /*yield*/, PlanEmail_1.PlanEmail.create({
                            plan: planName,
                            emailType: emailType._id,
                        })];
                case 3:
                    plan = _a.sent();
                    _a.label = 4;
                case 4: return [2 /*return*/, plan._id];
            }
        });
    });
}
/* ----------------------------------
   READ CSV FILE
---------------------------------- */
var workbook = XLSX.readFile("./M365 data for App - 4 WEBSITE.csv");
var sheet = workbook.Sheets[workbook.SheetNames[0]];
var rawRows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
var rows = rawRows.map(function (row) {
    var _a, _b, _c, _d, _e, _f, _g;
    return ({
        domain: (_a = row["Domain"]) === null || _a === void 0 ? void 0 : _a.trim(),
        adminEmail: (_b = row["Portal Admin Email"]) === null || _b === void 0 ? void 0 : _b.trim(),
        adminPassword: (_c = row["PWD"]) === null || _c === void 0 ? void 0 : _c.trim(),
        status: (_d = row["STATUS"]) === null || _d === void 0 ? void 0 : _d.trim(),
        email_plan: (_e = row["Email Licence"]) === null || _e === void 0 ? void 0 : _e.trim(),
        email_users: Number(row["Users1"] || 0),
        storage_plan: (_f = row["Storage"]) === null || _f === void 0 ? void 0 : _f.trim(),
        storage_users: Number(row["Users2"] || 0),
        ms_plan: (_g = row["MS OFFICE"]) === null || _g === void 0 ? void 0 : _g.trim(),
        ms_users: Number(row["Users3"] || 0),
        creationDate: parseMaybeDate(row["Creation Date"]),
        renewalDate: parseMaybeDate(row["Renewal Date"]),
    });
});
/* ----------------------------------
   MAIN IMPORT LOGIC
---------------------------------- */
(function () { return __awaiter(void 0, void 0, void 0, function () {
    var _i, rows_1, row, hasEmail, hasStorage, hasMSOffice, order, orderId, regDate, expDate, planId, microsoftType, planId, microsoftType, planId, microsoftType, err_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 20, 21, 23]);
                _i = 0, rows_1 = rows;
                _a.label = 1;
            case 1:
                if (!(_i < rows_1.length)) return [3 /*break*/, 19];
                row = rows_1[_i];
                if (!row.domain)
                    return [3 /*break*/, 18];
                hasEmail = !!(row.email_plan && row.email_users > 0);
                hasStorage = !!(row.storage_plan && row.storage_users > 0);
                hasMSOffice = !!(row.ms_plan && row.ms_users > 0);
                return [4 /*yield*/, Order_1.Order.findOne({ domainName: row.domain })];
            case 2:
                order = _a.sent();
                if (!!order) return [3 /*break*/, 4];
                return [4 /*yield*/, Order_1.Order.create({
                        domainName: row.domain,
                        username: row.adminEmail,
                        password: row.adminPassword,
                        email_status: row.status,
                        email_flag: hasEmail,
                        storage_services_flag: hasStorage,
                        msoffice_services_flag: hasMSOffice,
                        microsoft_email: hasEmail,
                        registrationDate: row.creationDate || new Date(),
                        email_expiryDate: row.renewalDate,
                        provider: "Microsoft 365",
                        managedBy: "Signroots",
                    })];
            case 3:
                order = _a.sent();
                console.log("\u2728 Created Order: ".concat(row.domain));
                return [3 /*break*/, 6];
            case 4: return [4 /*yield*/, order.updateOne({
                    $set: {
                        username: row.adminEmail,
                        password: row.adminPassword,
                        provider: "Microsoft 365",
                        email_status: row.status,
                        email_expiryDate: row.renewalDate,
                        email_flag: hasEmail,
                        storage_services_flag: hasStorage,
                        msoffice_services_flag: hasMSOffice,
                        microsoft_email: hasEmail,
                    },
                })];
            case 5:
                _a.sent();
                console.log("\uD83D\uDD04 Updated Order: ".concat(row.domain));
                _a.label = 6;
            case 6:
                orderId = order._id;
                regDate = row.creationDate || order.registrationDate || new Date();
                expDate = row.renewalDate || order.email_expiryDate || new Date();
                if (!hasEmail) return [3 /*break*/, 10];
                return [4 /*yield*/, getPlanId(row.email_plan, "Microsoft 365")];
            case 7:
                planId = _a.sent();
                return [4 /*yield*/, TypeEmail_1.TypeEmail.findOne({
                        name: "Microsoft 365",
                    })];
            case 8:
                microsoftType = _a.sent();
                if (!microsoftType)
                    throw new Error("TypeEmail 'Microsoft 365' missing");
                return [4 /*yield*/, OrderPlan_1.OrderPlan.create({
                        orderId: orderId,
                        planId: planId,
                        emailTypeId: microsoftType._id,
                        registrationDate: regDate,
                        expiryDate: expDate,
                        noOfUsers: row.email_users,
                        type: "email",
                        adminEmail: row.adminEmail,
                        adminPassword: row.adminPassword,
                        status: row.status,
                    })];
            case 9:
                _a.sent();
                console.log("\uD83D\uDCE8 Email Plan Added: ".concat(row.domain));
                _a.label = 10;
            case 10:
                if (!hasStorage) return [3 /*break*/, 14];
                return [4 /*yield*/, getPlanId(row.storage_plan, "Microsoft 365")];
            case 11:
                planId = _a.sent();
                return [4 /*yield*/, TypeEmail_1.TypeEmail.findOne({
                        name: "Microsoft 365",
                    })];
            case 12:
                microsoftType = _a.sent();
                return [4 /*yield*/, OrderPlan_1.OrderPlan.create({
                        orderId: orderId,
                        planId: planId,
                        emailTypeId: microsoftType._id,
                        registrationDate: regDate,
                        expiryDate: expDate,
                        noOfUsers: row.storage_users,
                        type: "storage",
                        adminEmail: row.adminEmail,
                        adminPassword: row.adminPassword,
                        status: row.status,
                    })];
            case 13:
                _a.sent();
                console.log("\uD83D\uDDC4\uFE0F Storage Plan Added: ".concat(row.domain));
                _a.label = 14;
            case 14:
                if (!hasMSOffice) return [3 /*break*/, 18];
                return [4 /*yield*/, getPlanId(row.ms_plan, "Microsoft 365")];
            case 15:
                planId = _a.sent();
                return [4 /*yield*/, TypeEmail_1.TypeEmail.findOne({
                        name: "Microsoft 365",
                    })];
            case 16:
                microsoftType = _a.sent();
                return [4 /*yield*/, OrderPlan_1.OrderPlan.create({
                        orderId: orderId,
                        planId: planId,
                        emailTypeId: microsoftType._id,
                        registrationDate: regDate,
                        expiryDate: expDate,
                        noOfUsers: row.ms_users,
                        type: "msoffice",
                        adminEmail: row.adminEmail,
                        adminPassword: row.adminPassword,
                        status: row.status,
                    })];
            case 17:
                _a.sent();
                console.log("\uD83D\uDCBB MS Office Plan Added: ".concat(row.domain));
                _a.label = 18;
            case 18:
                _i++;
                return [3 /*break*/, 1];
            case 19:
                console.log("🎉 Import Completed Successfully");
                return [3 /*break*/, 23];
            case 20:
                err_1 = _a.sent();
                console.error("❌ Import Error:", err_1);
                return [3 /*break*/, 23];
            case 21: return [4 /*yield*/, mongoose_1.default.connection.close()];
            case 22:
                _a.sent();
                return [7 /*endfinally*/];
            case 23: return [2 /*return*/];
        }
    });
}); })();
