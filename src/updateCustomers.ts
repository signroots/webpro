import mongoose from "mongoose";
import Customer from "./models/Customer"; // adjust path if needed
import UserType from "./models/UserType";
// Connect to MongoDB
const MONGO_URI = "mongodb://127.0.0.1:27017/domain_management"; // replace with your DB URI
mongoose.connect(MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));
const idsToRemove = [
  "68d4d73c9109ca4f0d512f16",
  "68d4d2e59109ca4f0d512eae",
  "68d4c4af68c5392beba56e51",
  "68d3da9fa0296d65b11b3a83"
];

Customer.deleteMany({ _id: { $in: idsToRemove } })
  .then((res) => {
    console.log("Deleted documents:", res.deletedCount);
  })
  .catch((err) => {
    console.error("Error deleting documents:", err);
  });
async function updateCustomers() {
  try
  {
      const customerUserType = await UserType.findOne({ name: "Customer", is_active: true });

    if (!customerUserType) {
      console.error("❌ 'Customer' userType not found in UserType collection.");
      return;
    }
    const result = await Customer.updateMany(
      {},
      [
        {
          $set: {
            c_name: "",
            c_email: [""],
            c_phone: "",
            c_company: "",
            c_address: "",
            c_city: "",
            c_state: "",
            c_country: "",
                c_zipCode: "",
            is_customer: false,
             userType: customerUserType._id, 
          },
        },
      ]
    );
    console.log("Update result:", result);
  } catch (err) {
    console.error("Error updating customers:", err);
  } finally {
    mongoose.disconnect();
  }
}

updateCustomers();
