import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hspdlalmtjsinmxidjra.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_t4NcceHHEctfIi7s0kxixQ_gfidR9Ak';

const supabase = createClient(supabaseUrl, supabaseKey);

async function addRoomColumn() {
  console.log("Please run this SQL in your Supabase SQL Editor:");
  console.log(`
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS room TEXT DEFAULT '';
  `);
}

addRoomColumn();
