import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';
import client from './infisical.js';

const initializeSupabase = async () => {
  console.log('before supabase');

  try {
    const supabaseSecrets = await client.secrets().listSecrets({
      environment: 'dev',
      projectId: process.env.PROJECT_ID,
    });

    const supabase = createClient(
      supabaseSecrets.secrets.find((s) => s.secretKey == 'supabaseUrl')?.secretValue,
      supabaseSecrets.secrets.find((s) => s.secretKey == 'supabaseKey')?.secretValue
    );

    console.log('after supabase - Successfully connected');
    return supabase;
  } catch (err) {
    console.error('supabase initialization failed');
    console.error(err.message);
    process.exit(1);
  }
};

const supabase = await initializeSupabase();
export default supabase;
