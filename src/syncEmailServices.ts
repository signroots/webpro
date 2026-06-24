import mongoose from "mongoose";
import dotenv from "dotenv";

import Order from "./models/Order";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI!;

async function syncEmailServices() {

  try {

    if (!MONGO_URI) {
      throw new Error("MONGO_URI missing in .env");
    }

    await mongoose.connect(MONGO_URI);

    console.log("✅ Connected to MongoDB");

    // Fetch all domains
    const domains = await Order.find({});

    console.log(`🔍 Found ${domains.length} domains`);

    for (const domain of domains) {

      // Normalize provider
      const provider =
        domain.provider?.toLowerCase() || "";

      const hasGoogle =
        provider.includes("google workspace");

      const hasMicrosoft =
        provider.includes("microsoft 365");

      // Update flags
      await Order.updateOne(
        { _id: domain._id },
        {
          $set: {

            google_email: hasGoogle,

            microsoft_email: hasMicrosoft,

            email_flag: !!domain.provider,

          },
        }
      );

      console.log(
        `✅ Updated "${domain.domainName}" → google_email: ${hasGoogle}, microsoft_email: ${hasMicrosoft}`
      );

    }

    console.log("🎉 All domains updated successfully!");

  } catch (err) {

    console.error(
      "❌ Error syncing email services:",
      err
    );

  } finally {

    await mongoose.disconnect();

    console.log("🔌 Disconnected from MongoDB");

  }

}

syncEmailServices();