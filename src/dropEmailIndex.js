const mongoose = require("mongoose");

const MONGO_URI = "mongodb://127.0.0.1:27017/domain_management"; // update if needed

async function dropIndex() {
  try {
    await mongoose.connect(MONGO_URI);
    const db = mongoose.connection.db;
    await db.collection("customers").dropIndex("email_1");
    console.log("Index dropped successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Failed to drop index:", err);
    process.exit(1);
  }
}

dropIndex();
