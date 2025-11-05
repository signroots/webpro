import mongoose from "mongoose";
import Client from "./models/Client";

const run = async () => {
  await mongoose.connect("mongodb://127.0.0.1:27017/domain_management_system");

  const clients = await Client.find({});

  for (const client of clients) {
    if (client.c_email.length === 1 && client.c_email[0].includes(",")) {
      client.c_email = client.c_email[0].split(",").map(e => e.trim());
      await client.save();
      console.log("Updated client:", client.c_name, client.c_email);
    }
  }

  console.log("Done!");
  process.exit(0);
};

run();
