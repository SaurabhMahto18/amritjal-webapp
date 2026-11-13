# Module integration status and implementation sequence

The reference screenshots establish the desired navigation and monthly delivery workflow. Existing React feature folders cover customers, deliveries, products, invoices, payments, expenses, jars, employees, imports, reports, settings and WhatsApp. The initial database migration now provides a common tenant-scoped schema for these areas.

## Database foundation delivered
- Tenant and role tables with helper functions and RLS policies.
- Customer/product/group master data and customer rates.
- Delivery records and normalized delivery line items.
- Jar movements separate from money.
- Invoices and invoice lines; payments and invoice allocations.
- Customer ledger entries, expenses, employee wallets and leave records.
- Monthly import batches/rows, message queue/status events, events, audit log.
- Foreign keys, constraints and query indexes.
- `create_business` RPC to bootstrap a business and owner membership.

## Must be integrated and verified in the app before production
1. Change business resolution to membership-based selection; legacy services that query `owner_id` must not assume one business per user.
2. Standardize all customer fields and archive semantics (`archived` and `status`).
3. Standardize delivery writes so summary compatibility fields, `delivery_items`, `jar_transactions` and ledger entries are committed together.
4. Implement invoice issue/payment allocation as database transactions/RPCs, not independent browser writes.
5. Make monthly import idempotent and atomic; reject duplicate rows and provide row-level error reports.
6. Build and test screens for groups, routes, load/unload, events, SMS/WhatsApp, monthly card and bulk report where not yet implemented.
7. Add integration tests against a disposable Supabase project and RLS tests with at least two users.

A feature should be marked “working” only after create/read/update/archive and cross-module consistency have been tested against the database. The migration is a foundation; it is not evidence that every screen is already end-to-end complete.
