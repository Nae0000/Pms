import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hspdlalmtjsinmxidjra.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_t4NcceHHEctfIi7s0kxixQ_gfidR9Ak';

export const supabase = createClient(supabaseUrl, supabaseKey);
