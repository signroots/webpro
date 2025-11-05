import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";
import UserType, { IUserType } from "./UserType";
export interface IUser extends Document {
  email: string;
  password: string;
  name?: string;
   customer?: mongoose.Types.ObjectId;
  userType?: mongoose.Types.ObjectId | IUserType; // ✅ updated here
  comparePassword(candidate: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    name: { type: String, default: "" },
    
    userType: { type: Schema.Types.ObjectId, ref: "UserType" },
    customer: { type: Schema.Types.ObjectId, ref: "Customer" }, // ✅ Add this line
  },
  { timestamps: true }
);


// Password hashing before save
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  // @ts-ignore  (this is a mongoose doc)
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = function (candidate: string) {
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.model<IUser>("User", userSchema);
