import mongoose from "mongoose";
import Domain from "./models/Domain";
import { Email } from "./models/email";

const MONGO_URI = "mongodb://127.0.0.1:27017/domain_management";

async function syncEmailServices() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Fetch all domains
    const domains = await Domain.find({});
    console.log(`🔍 Found ${domains.length} domains`);

    for (const domain of domains) {
      // Fetch emails linked to this domain
      const emails = await Email.find({ domain: domain.domainName });
      const emailIds = emails.map(e => e._id);

      // Determine provider flags
      const hasGoogle = emails.some(e => e.provider === "Google Workspace");
      const hasMicrosoft = emails.some(e => e.provider === "Microsoft 365");

      // Update domain document
      await Domain.updateOne(
        { _id: domain._id },
        {
          $set: {
            email_services: emailIds,
            google_email: hasGoogle,
            microsoft_email: hasMicrosoft,
          },
        }
      );

      console.log(
        `✅ Updated domain "${domain.domainName}" with ${emailIds.length} email(s), google_email: ${hasGoogle}, microsoft_email: ${hasMicrosoft}`
      );
    }

    console.log("🎉 All domains updated successfully!");
  } catch (err) {
    console.error("❌ Error syncing email services:", err);
  } finally {
    // Ensure MongoDB disconnects in any case
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

// Run the sync function
syncEmailServices();
