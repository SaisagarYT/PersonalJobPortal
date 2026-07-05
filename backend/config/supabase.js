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

    // Prefer service_role key (bypasses RLS for server-side writes).
    // Falls back to anon key if supabaseServiceKey is not in Infisical yet.
    const serviceKey =
      supabaseSecrets.secrets.find((s) => s.secretKey === 'supabaseServiceKey')?.secretValue ||
      supabaseSecrets.secrets.find((s) => s.secretKey === 'supabaseKey')?.secretValue;

    const supabase = createClient(
      supabaseSecrets.secrets.find((s) => s.secretKey === 'supabaseUrl')?.secretValue,
      serviceKey,
      { auth: { autoRefreshToken: false, persistSession: false } }
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
