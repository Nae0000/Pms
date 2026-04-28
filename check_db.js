import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hspdlalmtjsinmxidjra.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_t4NcceHHEctfIi7s0kxixQ_gfidR9Ak';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  console.log("Checking Supabase tables...");
  
  const { data: rooms, error: roomsErr } = await supabase.from('rooms').select('*');
  console.log("Rooms count:", rooms ? rooms.length : 0);
  if (roomsErr) console.error("Rooms error:", roomsErr);

  const { data: tenants, error: tenantsErr } = await supabase.from('tenants').select('*');
  console.log("Tenants count:", tenants ? tenants.length : 0);
  if (tenantsErr) console.error("Tenants error:", tenantsErr);
}

checkData();
