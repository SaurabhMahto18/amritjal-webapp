# Supabase migrations

Apply migrations in timestamp order to a **new Supabase project**. The initial schema is `202611020001_initial_schema.sql`.

## Suggested workflow
1. Create a new Supabase project.
2. Review the SQL migration and backup any existing project before applying schema changes.
3. Apply using Supabase SQL Editor, or install Supabase CLI and run `supabase link` followed by `supabase db push`.
4. In Authentication settings, configure site URL and allowed redirect URLs for `/reset-password`.
5. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` to `.env.local` and restart Vite.
6. Sign up, then call `create_business` RPC to create the first business and owner membership.
7. Create smoke-test records and verify RLS with a second user before putting real customer data in the app.

## Important
- This is a fresh-project initial migration, not a safe migration to apply blindly to a database that already contains tables.
- RLS isolates business data through `business_members`. Never expose a service-role key in the browser.
- This migration establishes the database foundation; existing UI services still need to be checked and adapted to these canonical column names and multi-business context. Do not claim every UI module is fully integrated until those CRUD workflows and end-to-end tests pass.
- Some actions should be implemented through database transactions/RPCs (monthly imports, invoice issue/payment allocation, delivery + jar movement + ledger posting) to avoid partial writes.
