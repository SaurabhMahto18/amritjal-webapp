# Amrit Jal project audit and handover notes

Audit scope: uploaded ZIP archive, source tree, package manifest, routing, service modules, environment configuration, and available Supabase files. This is a static review; live Supabase credentials/database and a WhatsApp provider account were not available, so remote operations could not be verified.

## 1. Existing visual style

The app already has a consistent utility-first style:
- Navy fixed sidebar with cyan active state and water-drop branding.
- Slate/white page surfaces, cyan primary actions, rounded cards, subtle borders and shadows.
- Responsive content areas and a mobile slide-in navigation.
- Lucide icons and Tailwind CSS 4.
- Customer, delivery, invoice and payment pages generally follow the same design vocabulary.

The changes in this handover preserve the existing React/Tailwind architecture rather than replacing the interface with a new design system.

## 2. Changes made in this updated archive

1. **Reports route implemented:** replaced the placeholder route with a date-filtered reports screen. It requests business-scoped customer, delivery, payment, expense and invoice data, calculates operational KPIs, and provides CSV exports for deliveries, payments, expenses and invoices.
2. **Password recovery UI implemented:** added a request-reset screen and new-password form using Supabase Auth methods; linked the login page's “Forgot password?” action to it.
3. **Environment template corrected:** `.env.example` now documents the two required public Supabase settings and warns against putting privileged keys/provider secrets in frontend variables.
4. **Setup documentation corrected:** README no longer describes the project as having an incomplete package manifest; it explains setup, module map and important deployment limitations.
5. **Secret hygiene:** `.env.local`, `.git`, `node_modules`, `dist`, and Supabase CLI temporary state are intentionally excluded from the delivery ZIP. The original `.env.local` is not copied because local environment files can contain credentials.

## 3. Feature inventory and real status

“Frontend present” means a screen or service exists. It does not mean the complete feature has been verified end-to-end.

| Module | Current source status | Remaining verification / work |
|---|---|---|
| Authentication | Sign-in, sign-up, session provider, protected route; password recovery UI added | Configure Supabase Auth redirect URLs and email templates; create business/membership bootstrap flow; test recovery on deployed URL |
| Customers | List, create/edit, detail and history components/services exist | Verify schema, CRUD, archived/inactive behavior, row-level security and all customer detail joins |
| Deliveries | List, create form, bulk entry, service/hooks exist | Verify schema, unique/idempotency policy, date/timezone rules, returned jar accounting and customer-specific rate snapshot |
| Payments | Create/list/receipt/service exist | Verify tenant RLS, payment edits/reversals, receipt output, ledger reconciliation and payment-to-invoice allocation rules |
| Ledger | Delivery and payment related UI/service exists | Audit all transaction types, opening balance sign convention, running balances and filtered-period opening balance |
| Invoices | Create/detail/list/print layouts and PDF helper files exist | Add transactional invoice creation/number allocation, prevent re-invoicing deliveries, test partial payments, tax/charge rules and PDF output |
| Monthly import | CSV/XLSX parser, mapping, validation and preview components exist | Current delivery insert path is not an atomic import RPC; add import batch/idempotency records, duplicate preview, rollback and monthly-total reconciliation before live use |
| Jars | Jar management screen/service exists | Verify jar issue/return/loss transactions and reconcile customer-held jars with physical inventory |
| Products | Product form/list/service exist | Verify stock movement rules and product-to-delivery/invoice relationships |
| Expenses | Form/list/service exist | Verify categories, edits/reversals, reports and expense permissions |
| Employees | Employee and wallet screens/services exist; one Edge Function is present | Verify employee auth provisioning, role/permission enforcement, wallet transaction audit and Edge Function authorization |
| Routes | Components/services exist | Router/sidebar integration and full route/customer assignment behavior need verification |
| Reports | Date-filtered summary and CSV exports added | Live test against the actual schema; pagination for large datasets and accounting-grade reconciliation are not included |
| WhatsApp | UI/service files are TODO scaffolds | Not working yet: secure provider Edge Function, template management, consent/opt-out, delivery webhook, retry queue and message status persistence are required |
| Settings | Business/billing/profile forms exist | Verify each setting persists and is used consistently by invoices, receipts, PDF and messaging |
| Hindi/English | Locale JSON files exist | Translation provider/toggle is not wired; current screens are not fully bilingual |
| Audit log / storage | Placeholder services exist | Not implemented end-to-end |
| Offline mode / customer portal | Placeholder folders only | Not implemented |

## 4. Blocking backend gap

The archive has `supabase/config.toml`, a seed placeholder and function scaffolding, but **does not contain application database migrations**. The source references tables such as `businesses`, `customers`, `deliveries`, `payments`, `expenses`, `invoices`, `products`, `customer_security_deposits` and others. The database schema, foreign keys, triggers, unique constraints, indexes and RLS policies therefore cannot be reviewed or recreated from this ZIP alone.

Do not solve this by blindly creating a guessed schema: several modules depend on specific column names and business rules. The safe next step is to agree on the canonical schema and create ordered SQL migrations that match every service query and mutation.

### Minimum required backend work
1. Create business onboarding after signup and define owner/member relationships.
2. Create all required tables and foreign keys from the service layer, including invoice items and jar ledger records.
3. Enable RLS and test cross-business access isolation with two separate test users.
4. Use database functions/transactions for invoice numbering, invoice creation, monthly import posting and ledger-affecting operations.
5. Add uniqueness/idempotency constraints for import rows and invoice-delivery links.
6. Add server-side WhatsApp send function and delivery webhook; keep tokens in Supabase secrets.
7. Add database-backed tests for payment totals, invoice outstanding balances, jar balances and import reconciliation.

## 5. Reports definitions

- **Delivery value:** sum of recorded delivery amounts within the selected delivery-date range.
- **Collections:** sum of payment records within the selected payment-date range.
- **Expenses:** sum of expense records within the selected expense-date range.
- **Invoice value:** sum of invoices whose invoice date is within the selected range.
- **Invoice balance:** sum of `max(total_amount - paid_amount, 0)` for invoices dated within the selected range.
- **Cash movement:** collections minus recorded expenses. This is not statutory profit and excludes other accounting adjustments.
- Active customer count is the current count of active, non-archived customers, not a historical as-of count.

## 6. Verification performed / not performed

- Static source and route inspection completed.
- The archive's `node_modules` did not contain the Vite/Rolldown native optional binding required by this environment. A local build attempt failed before source compilation with “Cannot find native binding”; `npm ci` did not complete in the execution time available. Therefore **a successful production build is not claimed**.
- No Supabase project credentials/database or WhatsApp provider credentials were available; no live CRUD, RLS, PDF, import, payment or message-delivery test is claimed.
- After installing dependencies on your machine, run `npm ci` and `npm run build`. If the build fails, share the complete terminal output and the relevant source file so it can be fixed against the actual dependency/runtime environment.

## 7. Suggested next implementation order

1. Create and verify database migrations + RLS (foundation for all features).
2. Verify signup → business profile → customer creation.
3. Verify delivery → customer ledger → payment → outstanding balance.
4. Verify monthly import preview → reconciliation → atomic post → invoice generation.
5. Verify invoice PDF and print layouts.
6. Add WhatsApp provider integration after the core records are consistent.
7. Add end-to-end tests and complete Hindi/English localization.
