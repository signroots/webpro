import mongoose from "mongoose";
import Order from "./models/Order"; // adjust path if needed

// 1. Connect to MongoDB
const MONGO_URI = "mongodb://127.0.0.1:27017/domain_management"; // replace with your DB URI

async function migrateDomainSource() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    // 2. Fetch all orders
    const orders = await Order.find({});

    for (const order of orders) {
      if (Array.isArray(order.domainSource)) {
        const newDomainSource = order.domainSource[0] || "";
        order.domainSource = newDomainSource;
        await order.save();
        console.log(`Updated order ${order._id}`);
      }
    }

    console.log("Migration completed!");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

migrateDomainSource();
