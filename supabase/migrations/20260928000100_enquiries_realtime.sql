-- Live updates in the admin panel (Realtime still enforces the RLS policies above).
alter publication supabase_realtime add table public.enquiries;
