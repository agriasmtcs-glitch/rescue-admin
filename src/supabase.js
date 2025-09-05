import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://opwwrcfsbqlcxnuhxshp.supabase.co'; // Cseréld a sajátodra
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wd3dyY2ZzYnFsY3hudWh4c2hwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2NzMxNTIsImV4cCI6MjA3MTI0OTE1Mn0.wehFwM69ob0rAj0MteWLueKVrq9Rq2bh_HYvKs448lw'; // Cseréld a sajátodra
export const supabase = createClient(supabaseUrl, supabaseKey, {
  db: {
    schema: 'public'
  }
});
