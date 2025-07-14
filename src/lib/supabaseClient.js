import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://datuewrhrhgqrvrljduw.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRhdHVld3JocmhncXJ2cmxqZHV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1MTc5NjksImV4cCI6MjA2ODA5Mzk2OX0.lGKksVqywxH8Pts6gZMor4M5J9_cjsKInbcOolw53Yg";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
