import mongoose, { Schema, Document } from "mongoose";

export interface IDomainSource extends Document {
  name:string;
  code:string;
  image?:string;
  is_active:boolean;
}


const DomainSourceSchema = new Schema<IDomainSource>(
{
  name:{
    type:String,
    required:true,
    unique:true,
    trim:true
  },

  code:{
    type:String,
    required:true,
    unique:true,
    uppercase:true
  },

  image:{
    type:String
  },

  is_active:{
    type:Boolean,
    default:true
  }

},
{
 timestamps:true
}
);


export default mongoose.model<IDomainSource>(
  "DomainSource",
  DomainSourceSchema
);