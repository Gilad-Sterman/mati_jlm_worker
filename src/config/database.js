import dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; // For admin operations

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase configuration. Please check SUPABASE_URL and SUPABASE_KEY environment variables.');
}

// Create Supabase client (regular - respects RLS)
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: false // We'll handle sessions with JWT
  },
  db: {
    schema: 'public',
    pool: {
      min: 1,
      max: 3 // Lower connection pool for worker service
    }
  }
});

// Create admin Supabase client (bypasses RLS - for worker operations)
const supabaseAdmin = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public',
    pool: {
      min: 1,
      max: 3 // Lower connection pool for worker service
    }
  }
}) : null;

// Test database connection
const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist yet
      throw error;
    }
    
    console.log('✅ Worker database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Worker database connection failed:', error.message);
    return false;
  }
};

export {
  supabase,
  supabaseAdmin,
  testConnection
};
