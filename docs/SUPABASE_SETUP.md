# Create the Amrit Jal Supabase database

## Fresh project

1. Create a new project in Supabase.
2. Open **SQL Editor** and run `supabase/migrations/202611020001_initial_schema.sql` in full, or use the Supabase CLI workflow below.
3. In **Project Settings → API**, copy the Project URL and publishable/anon key.
4. Put them in `.env.local` (never put a service-role key in a `VITE_` variable):

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_OR_ANON_KEY
```

5. Restart Vite (`Ctrl+C`, then `npm run dev`).
6. Configure Supabase Auth site URL and allowed redirect URLs for local development and the deployed app. Include `/reset-password`.
7. Sign up. After authentication, create the first business via the authenticated RPC `create_business` with `p_name`, optional `p_phone`, and optional `p_address`. This creates an owner membership.
8. Verify the user can only see their business data. Create a second test user and verify it cannot read the first business.

## CLI option

Install the Supabase CLI, then from the project directory:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

Review CLI output before confirming any migration.

## Verification checklist

- Signup and login work with the correct project URL/key.
- `create_business` returns one UUID and creates a `businesses` row plus owner `business_members` row.
- Owner can create and read a customer/product in the same business.
- A different authenticated user cannot read that business's customers, invoices, deliveries, payments, or employees.
- Create one delivery and verify delivered/returned jar counts are not confused with payment amounts.
- Create an invoice and allocate a payment; verify invoice outstanding is not negative and allocation totals do not exceed the payment/invoice.
- Test bulk import with duplicate rows and an intentionally invalid row before importing live data.

## Caution

This is an initial migration for a new project. Do not apply it blindly to a project that already contains production tables. Back up first. Schema creation is not the same as completing every UI service integration; service payloads and transactions must be tested before using real financial records.
