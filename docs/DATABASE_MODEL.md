# Amrit Jal database model

The implemented initial schema is `supabase/migrations/202611020001_initial_schema.sql`.

## Entity map

- Identity: `auth.users` → `profiles` → `business_members` → `businesses`.
- Catalog: `products`, `customer_groups`, `customers`, `customer_group_members`, `customer_rate_plans`.
- Operations: `delivery_routes`, `route_customers`, `deliveries`, `delivery_items`, `jar_transactions`.
- Billing: `invoices`, `invoice_lines`, `payments`, `payment_allocations`, `customer_ledger_entries`.
- Team/cash: `employees`, `employee_leaves`, `wallet_transactions`, `expenses`.
- Bulk & communications: `import_batches`, `import_rows`, `message_jobs`, `message_delivery_events`, `business_events`.
- Governance: `audit_logs`, profile/business settings and RLS helper functions.

## Important data rules

1. Every business-owned record includes `business_id`; foreign keys use `(id, business_id)` where applicable to prevent cross-business references.
2. Business membership is the source of authorization. RLS uses `is_business_member()` and `has_business_role()`; frontend filtering alone is not security.
3. Customer debt should be derived from posted ledger entries/invoices/payments. Do not independently mutate a `balance` field in several places.
4. Jar movements are separate from money movements. A jar return must not create a cash payment.
5. Monthly import should validate all rows, use stable idempotency keys, and commit through one database transaction/RPC. A browser-side sequence of inserts is not atomic.
6. Invoice issuance, payment allocation, and ledger posting should be transactional. Draft invoice creation must not silently change a customer's balance.
7. Delete/archive business records carefully. Operational and financial records are restricted from unsafe cascade deletion.

## Frontend compatibility note

The current services expect some legacy names (`businesses.owner_id`, `customers.code/area/jar_rate/archived`, delivery summary columns, `customer_group_members`). Compatibility columns/tables are included where feasible in the initial migration. The canonical normalized model is `delivery_items` and `jar_transactions`; the legacy summary columns are compatibility fields and need one chosen write path to avoid drift. Before production, review each service's select/insert/update payloads against this migration and test each workflow against a real Supabase project.
