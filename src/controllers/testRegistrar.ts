import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

async function test() {

  const res = await axios.get(
    "https://api.cloudflare.com/client/v4/accounts/789c2ef055087ad01505a42c225fbfaa/registrar/domains?page=0&per_page=20",
    {
      headers: {
        "X-Auth-Email": process.env.CLOUDFLARE_EMAIL,
        "X-Auth-Key": process.env.CLOUDFLARE_API_KEY,
        "Content-Type": "application/json"
      }
    }
  );

  const domains = res.data.result.map((domain:any) => domain.name);

  console.log(domains);
}

test();