# Amrit Jal — Water Delivery Business Manager

React + Vite frontend for managing a 20 L water-jar delivery business. The interface is mobile-friendly and uses a dark navy sidebar, cyan/teal actions, slate surfaces, rounded cards, and responsive tables.

> **Important status note:** this repository contains substantial frontend modules, but it is not yet a fully deployable end-to-end product. The uploaded project has no application SQL migrations, several modules remain TODO-only, and Supabase/WhatsApp credentials are environment-specific. See [`docs/PROJECT_AUDIT.md`](docs/PROJECT_AUDIT.md) before using it with real business records.

## Stack
- React 19, Vite 8, React Router 7
- Tailwind CSS 4 and Lucide icons
- Supabase Auth + PostgreSQL client
- CSV/XLSX parsing and PDF invoice dependencies

## Start locally
1. Install Node.js 22+ (Node 24 is also acceptable for compatible dependencies).
2. Copy `.env.example` to `.env.local`.
3. In `.env.local`, set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` from your Supabase project. Use a publishable/anon key only; never use a service-role key in the browser.
4. Install dependencies: `npm ci`
5. Start: `npm run dev`
6. Production build: `npm run build`
7. Local production preview: `npm run preview`

The UI expects a Supabase database schema, Auth configuration, business bootstrap flow, and RLS policies. The current archive does **not** include those application migrations. Do not enter live customer/payment records until the schema and security policies have been implemented and tested.

## Feature map
- `src/features/auth/` — sign-in, sign-up, session handling, password recovery UI
- `src/features/customers/` — customer list, create/edit, customer detail, ledger/history panels
- `src/features/deliveries/` — delivery entry/list and delivery service
- `src/features/payments/` — payment capture/list and receipt UI
- `src/features/ledger/` — customer transaction ledger
- `src/features/invoices/` — invoice creation, detail, print formats and PDF helpers
- `src/features/imports/` — CSV/XLSX parsing, mapping, validation and monthly import UI
- `src/features/jars/` — jar movement management
- `src/features/products/` — product/stock screens
- `src/features/expenses/` — expense capture/list
- `src/features/employees/` — employee and wallet screens
- `src/features/reports/` — date-filtered operational summary and CSV exports
- `src/features/settings/` — business, billing, bank and profile settings
- `src/features/whatsapp/` — messaging integration scaffold; provider/backend is not yet implemented
- `supabase/functions/` — Edge Function scaffold
- `docs/PROJECT_AUDIT.md` — audit findings, known gaps, security and verification checklist

## Data and security principles
- A frontend publishable key is not a security boundary; tenant isolation must be enforced by PostgreSQL RLS.
- Do not expose WhatsApp tokens or service-role keys in `VITE_` variables.
- Monthly import should be previewed, reconciled and posted atomically; duplicate protection must be enforced server-side.
- A payment must never be inferred from a delivery row.
- Reports show operational totals, not statutory accounting profit.
- Do not mark an integration as working until it has been tested against a configured backend.
