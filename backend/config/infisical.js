import { InfisicalSDK } from '@infisical/sdk'
import dotenv from 'dotenv';
dotenv.config();

const initializeInfisical = async () => {
  console.log("before infisical");
  console.log("Client Secret configured:", !!process.env.machine_identity_client_secret)

  const client = new InfisicalSDK({
    siteUrl: "https://app.infisical.com"
  });

  try{
    // Authenticate with Infisical
    await client.auth().universalAuth.login({
      clientId: process.env.machine_identity_client_id,
      clientSecret: process.env.machine_identity_client_secret
    });
    console.log("after infisical - Successfully authenticated");
    return client;
  }
  catch(err){
    console.error("infisical login failed");
    console.error(err.message);
    process.exit(1);
  }
}

const client = await initializeInfisical();
export default client;