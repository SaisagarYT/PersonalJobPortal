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

    const supabaseUrl = supabaseSecrets.secrets.find((s) => s.secretKey === 'supabaseUrl')?.secretValue;
    const anonKey = supabaseSecrets.secrets.find((s) => s.secretKey === 'supabaseKey')?.secretValue;
    const serviceKey =
      supabaseSecrets.secrets.find((s) => s.secretKey === 'supabaseServiceKey')?.secretValue || anonKey;

    // DB client — uses service role key to bypass RLS for server-side writes.
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Auth client — uses anon key so supabase.auth.getUser(token) works correctly.
    const supabaseAuth = createClient(supabaseUrl, anonKey);

    console.log('after supabase - Successfully connected');
    return { supabase, supabaseAuth };
  } catch (err) {
    console.error('supabase initialization failed');
    console.error(err.message);
    process.exit(1);
  }
};

const { supabase, supabaseAuth } = await initializeSupabase();
export default supabase;
export { supabaseAuth };
