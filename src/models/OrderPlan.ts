import mongoose, { Schema, Document } from "mongoose";

export interface IOrderPlan extends Document {

  orderId: mongoose.Types.ObjectId;

  type:
  | "email"
  | "storage"
  | "msoffice"
  | "hosting"
  | "website"
  | "ssl";


  // Email / Storage / MS Office common fields
  emailTypeId?: mongoose.Types.ObjectId | null;

  planId?: mongoose.Types.ObjectId | null;

  noOfUsers?: number;

  registrationDate?: Date | null;

  expiryDate?: Date | null;



  // Hosting specific fields
  hostTypeId?: mongoose.Types.ObjectId | null;

  hostSubTypeId?: mongoose.Types.ObjectId | null;

  storageId?: mongoose.Types.ObjectId | null;



  // Future Website / SSL fields
  websiteDetails?: any;

  sslDetails?: any;



  adminEmail?: string;

  adminPassword?: string;

  status?: string;


  createdAt: Date;
  updatedAt: Date;
}
const OrderPlanSchema = new Schema({

orderId:{
 type:Schema.Types.ObjectId,
 ref:"Order",
 required:true
},


type:{
 type:String,
 enum:[
 "email",
 "storage",
 "msoffice",
 "hosting",
 "website",
 "ssl"
 ],
 required:true
},


// email/storage/msoffice

emailTypeId:{
 type:Schema.Types.ObjectId,
 ref:"TypeEmail",
 default:null
},


planId:{
 type:Schema.Types.ObjectId,
 ref:"PlanEmail",
 default:null
},


noOfUsers:{
 type:Number,
 default:1
},


registrationDate:{
 type:Date,
 default:null
},


expiryDate:{
 type:Date,
 default:null
},



// hosting

hostTypeId:{
 type:Schema.Types.ObjectId,
 ref:"HostType",
 default:null
},


hostSubTypeId:{
 type:Schema.Types.ObjectId,
 ref:"HostSubType",
 default:null
},


storageId:{
 type:Schema.Types.ObjectId,
 ref:"Storage",
 default:null
},


// future

websiteDetails:{
 type:Object,
 default:null
},


sslDetails:{
 type:Object,
 default:null
},


adminEmail:{
 type:String,
 default:""
},


adminPassword:{
 type:String,
 default:""
},


status:{
 type:String,
 default:""
}


},{
timestamps:true
});

export const OrderPlan =
  mongoose.models.OrderPlan ||
  mongoose.model<IOrderPlan>("OrderPlan", OrderPlanSchema);
