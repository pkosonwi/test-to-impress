
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || "https://liqvxeogfnwciaqrweqi.supabase.co";
const supabaseKey = process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpcXZ4ZW9nZm53Y2lhcXJ3ZXFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyNTcyMjEsImV4cCI6MjA3MjgzMzIyMX0.DbkyPWgqXf4w9njt1QyfDe79f0_PdqbkY472INl1fB4";

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase