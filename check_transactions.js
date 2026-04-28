import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hspdlalmtjsinmxidjra.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_t4NcceHHEctfIi7s0kxixQ_gfidR9Ak';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTransactionsTable() {
  // Try inserting a test record to see if the table exists
  const { data, error } = await supabase.from('transactions').select('*').limit(1);
  
  if (error) {
    console.log("Table 'transactions' does not exist yet. Error:", error.message);
    console.log("\n========================================");
    console.log("Please run this SQL in Supabase SQL Editor:");
    console.log("========================================\n");
    console.log(`
CREATE TABLE IF NOT EXISTS transactions (
  id BIGSERIAL PRIMARY KEY,
  date TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT DEFAULT 'Other',
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount TEXT NOT NULL,
  status TEXT DEFAULT 'Paid',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access" ON transactions FOR ALL USING (true) WITH CHECK (true);
    `);
  } else {
    console.log("Table 'transactions' already exists! Records:", data.length);
  }
}

createTransactionsTable();
