import mongoose from "mongoose";
import Order from "./models/Order";

const MONGO_URI ="mongodb://root:StrongRootPassword123@127.0.0.1:27017/webpro_db?authSource=admin";

async function syncEmailServices() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Fetch all domains
    const domains = await Order.find({});
    console.log(`🔍 Found ${domains.length} domains`);

    for (const domain of domains) {
      // Normalize provider
      const provider = domain.provider?.toLowerCase() || "";

      const hasGoogle = provider.includes("google workspace");
      const hasMicrosoft = provider.includes("microsoft 365");

      // Update flags in the same document
      await Order.updateOne(
        { _id: domain._id },
        {
          $set: {
            google_email: hasGoogle,
            microsoft_email: hasMicrosoft,
            email_flag: !!domain.provider, // true if provider exists
          },
        }
      );

      console.log(
        `✅ Updated "${domain.domainName}" → google_email: ${hasGoogle}, microsoft_email: ${hasMicrosoft}`
      );
    }

    console.log("🎉 All domains updated successfully!");
  } catch (err) {
    console.error("❌ Error syncing email services:", err);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

syncEmailServices();
