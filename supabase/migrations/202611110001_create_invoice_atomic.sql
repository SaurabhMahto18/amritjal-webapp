
-- ============================================================
-- AMRIT JAL
-- ATOMIC INVOICE CREATION
-- ============================================================
--
-- Creates the RPC expected by invoiceService.js:
--
-- public.create_invoice_atomic(
--   p_business_id,
--   p_customer_id,
--   p_delivery_ids,
--   p_extra_lines,
--   p_invoice_date,
--   p_notes,
--   p_period_end,
--   p_period_start
-- )
--
-- Important:
-- 1. Invoice creation is atomic.
-- 2. Delivery items can be invoiced only once.
-- 3. Previous outstanding is a separate invoice line.
-- 4. Invoice numbering is serialized per business.
-- 5. No duplicate delivery ledger debit is created.
--
-- ============================================================


CREATE OR REPLACE FUNCTION public.create_invoice_atomic(
    p_business_id UUID,
    p_customer_id UUID,
    p_delivery_ids UUID[],
    p_extra_lines JSONB,
    p_invoice_date DATE,
    p_notes TEXT,
    p_period_end DATE,
    p_period_start DATE
)
RETURNS SETOF public.invoices
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$

DECLARE
    v_user_id UUID;

    v_invoice_prefix TEXT;
    v_due_days INTEGER;

    v_next_number BIGINT;
    v_invoice_number TEXT;

    v_customer_opening_balance NUMERIC(12,2);
    v_previous_deliveries NUMERIC(12,2);
    v_previous_payments NUMERIC(12,2);
    v_previous_outstanding NUMERIC(12,2);

    v_delivery_subtotal NUMERIC(12,2);
    v_extra_total NUMERIC(12,2) := 0;
    v_invoice_subtotal NUMERIC(12,2);
    v_invoice_total NUMERIC(12,2);

    v_valid_delivery_count INTEGER;
    v_deliveries_with_items INTEGER;

    v_extra JSONB;
    v_description TEXT;
    v_quantity NUMERIC(12,3);
    v_unit_price NUMERIC(12,2);
    v_line_total NUMERIC(12,2);

    v_invoice public.invoices%ROWTYPE;

BEGIN

    -- ========================================================
    -- 1. AUTHENTICATION
    -- ========================================================

    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION
            'Authentication required to create an invoice.'
            USING ERRCODE = '42501';
    END IF;


    -- ========================================================
    -- 2. INPUT VALIDATION
    -- ========================================================

    IF p_business_id IS NULL THEN
        RAISE EXCEPTION 'Business ID is required.';
    END IF;

    IF p_customer_id IS NULL THEN
        RAISE EXCEPTION 'Customer ID is required.';
    END IF;

    IF p_invoice_date IS NULL THEN
        RAISE EXCEPTION 'Invoice date is required.';
    END IF;

    IF p_period_start IS NULL OR p_period_end IS NULL THEN
        RAISE EXCEPTION 'Billing period is required.';
    END IF;

    IF p_period_start > p_period_end THEN
        RAISE EXCEPTION
            'Billing start date cannot be after end date.';
    END IF;

    IF p_delivery_ids IS NULL
       OR cardinality(p_delivery_ids) = 0 THEN
        RAISE EXCEPTION
            'At least one delivery must be selected.';
    END IF;

    IF array_position(p_delivery_ids, NULL::UUID) IS NOT NULL THEN
        RAISE EXCEPTION
            'Delivery ID list contains an invalid value.';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM unnest(p_delivery_ids) AS selected(id)
        GROUP BY selected.id
        HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION
            'Duplicate delivery records were selected.';
    END IF;

    IF p_extra_lines IS NOT NULL
       AND jsonb_typeof(p_extra_lines) <> 'array' THEN
        RAISE EXCEPTION
            'Extra invoice lines must be a JSON array.';
    END IF;


    -- ========================================================
    -- 3. BUSINESS AUTHORIZATION AND LOCK
    -- ========================================================
    --
    -- Locking the business row serializes invoice number
    -- generation for concurrent invoice creation requests.
    --

    IF NOT public.has_business_role(
        p_business_id,
        ARRAY[
            'owner',
            'admin',
            'manager',
            'staff'
        ]::public.member_role[]
    ) THEN
        RAISE EXCEPTION
            'You do not have permission to create invoices for this business.'
            USING ERRCODE = '42501';
    END IF;

    SELECT
        invoice_prefix,
        default_due_days

    INTO
        v_invoice_prefix,
        v_due_days

    FROM public.businesses

    WHERE id = p_business_id

    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Business not found.';
    END IF;

    v_invoice_prefix :=
        COALESCE(
            NULLIF(
                rtrim(btrim(v_invoice_prefix), '-'),
                ''
            ),
            'AJ'
        );

    v_due_days := GREATEST(
        COALESCE(v_due_days, 0),
        0
    );


    -- ========================================================
    -- 4. CUSTOMER VALIDATION
    -- ========================================================

    SELECT opening_balance

    INTO v_customer_opening_balance

    FROM public.customers

    WHERE id = p_customer_id
      AND business_id = p_business_id
      AND archived = FALSE;

    IF NOT FOUND THEN
        RAISE EXCEPTION
            'Customer not found or archived.';
    END IF;

    v_customer_opening_balance :=
        COALESCE(v_customer_opening_balance, 0);


    -- ========================================================
    -- 5. LOCK SELECTED DELIVERIES
    -- ========================================================

    PERFORM d.id

    FROM public.deliveries d

    WHERE d.business_id = p_business_id
      AND d.id = ANY(p_delivery_ids)

    ORDER BY d.id

    FOR UPDATE;


    -- ========================================================
    -- 6. VALIDATE DELIVERY OWNERSHIP AND BILLING PERIOD
    -- ========================================================

    SELECT COUNT(*)

    INTO v_valid_delivery_count

    FROM public.deliveries d

    WHERE d.business_id = p_business_id
      AND d.customer_id = p_customer_id
      AND d.id = ANY(p_delivery_ids)
      AND d.delivery_date >= p_period_start
      AND d.delivery_date <= p_period_end
      AND d.status = 'active'::public.record_status;

    IF v_valid_delivery_count <> cardinality(p_delivery_ids) THEN
        RAISE EXCEPTION
            'One or more deliveries are invalid, inactive, outside the billing period, or belong to another customer.';
    END IF;


    -- ========================================================
    -- 7. EACH DELIVERY MUST HAVE ITEMS
    -- ========================================================

    SELECT COUNT(DISTINCT d.id)

    INTO v_deliveries_with_items

    FROM public.deliveries d

    INNER JOIN public.delivery_items di
        ON di.delivery_id = d.id
       AND di.business_id = d.business_id

    WHERE d.business_id = p_business_id
      AND d.customer_id = p_customer_id
      AND d.id = ANY(p_delivery_ids);

    IF v_deliveries_with_items <> cardinality(p_delivery_ids) THEN
        RAISE EXCEPTION
            'One or more selected deliveries do not contain invoiceable product items.';
    END IF;


    -- ========================================================
    -- 8. PREVENT DUPLICATE INVOICING
    -- ========================================================
    --
    -- One delivery item must belong to only one invoice.
    --

    IF EXISTS (

        SELECT 1

        FROM public.delivery_items di

        INNER JOIN public.invoice_lines il
            ON il.source_delivery_item_id = di.id
           AND il.business_id = di.business_id

        WHERE di.business_id = p_business_id
          AND di.delivery_id = ANY(p_delivery_ids)

    ) THEN

        RAISE EXCEPTION
            'One or more selected delivery items have already been invoiced. Refresh and select only unbilled deliveries.';

    END IF;


    -- ========================================================
    -- 9. CALCULATE PREVIOUS OUTSTANDING
    -- ========================================================
    --
    -- Balance before billing period:
    --
    -- Opening Balance
    -- + Earlier Delivery Charges
    -- - Earlier Customer Payments
    --
    -- This follows the existing ledger calculation model.
    --
    -- Previous outstanding is displayed as a separate
    -- invoice line; it is not posted as a new ledger debit.
    --

    SELECT COALESCE(SUM(d.amount), 0)

    INTO v_previous_deliveries

    FROM public.deliveries d

    WHERE d.business_id = p_business_id
      AND d.customer_id = p_customer_id
      AND d.delivery_date < p_period_start
      AND d.status = 'active'::public.record_status;


    SELECT COALESCE(SUM(p.amount), 0)

    INTO v_previous_payments

    FROM public.payments p

    WHERE p.business_id = p_business_id
      AND p.customer_id = p_customer_id
      AND p.payment_date < p_period_start
      AND p.purpose = 'customer_payment';


    v_previous_outstanding := GREATEST(
        0,
        ROUND(
            v_customer_opening_balance
            + v_previous_deliveries
            - v_previous_payments,
            2
        )
    );


    -- ========================================================
    -- 10. CALCULATE CURRENT DELIVERY SUBTOTAL
    -- ========================================================

    SELECT ROUND(
        COALESCE(
            SUM(
                COALESCE(
                    di.line_total,
                    di.quantity_delivered * di.unit_price
                )
            ),
            0
        ),
        2
    )

    INTO v_delivery_subtotal

    FROM public.delivery_items di

    INNER JOIN public.deliveries d
        ON d.id = di.delivery_id
       AND d.business_id = di.business_id

    WHERE d.business_id = p_business_id
      AND d.customer_id = p_customer_id
      AND d.id = ANY(p_delivery_ids);


    -- ========================================================
    -- 11. VALIDATE EXTRA INVOICE LINES
    -- ========================================================

    FOR v_extra IN

        SELECT value

        FROM jsonb_array_elements(
            COALESCE(p_extra_lines, '[]'::JSONB)
        )

    LOOP

        v_description := NULLIF(
            btrim(v_extra->>'description'),
            ''
        );

        IF v_description IS NULL THEN
            RAISE EXCEPTION
                'Every additional invoice line requires a description.';
        END IF;

        v_quantity := COALESCE(
            NULLIF(v_extra->>'quantity', '')::NUMERIC,
            1
        );

        v_unit_price := COALESCE(
            NULLIF(v_extra->>'unit_price', '')::NUMERIC,
            0
        );

        v_line_total := COALESCE(
            NULLIF(v_extra->>'line_total', '')::NUMERIC,
            ROUND(v_quantity * v_unit_price, 2)
        );

        IF v_quantity <= 0
           OR v_unit_price < 0
           OR v_line_total < 0 THEN

            RAISE EXCEPTION
                'Invalid quantity, rate or amount in additional invoice lines.';

        END IF;

        v_extra_total :=
            v_extra_total + v_line_total;

    END LOOP;

    v_extra_total := ROUND(v_extra_total, 2);


    -- ========================================================
    -- 12. FINAL INVOICE TOTAL
    -- ========================================================

    v_invoice_subtotal := ROUND(
        v_delivery_subtotal
        + v_extra_total
        + v_previous_outstanding,
        2
    );

    v_invoice_total := v_invoice_subtotal;


    -- ========================================================
    -- 13. GENERATE UNIQUE INVOICE NUMBER
    -- ========================================================
    --
    -- Businesses row is already locked.
    -- This prevents duplicate numbering for concurrent requests.
    --

    SELECT
        COALESCE(
            MAX(
                (
                    regexp_match(
                        i.invoice_number,
                        '([0-9]+)$'
                    )
                )[1]::BIGINT
            ),
            0
        ) + 1

    INTO v_next_number

    FROM public.invoices i

    WHERE i.business_id = p_business_id
      AND i.invoice_number ~ '[0-9]+$';


    v_invoice_number :=
        v_invoice_prefix
        || '-'
        || lpad(v_next_number::TEXT, 4, '0');


    -- ========================================================
    -- 14. INSERT INVOICE HEADER
    -- ========================================================
    --
    -- All financial calculations are performed in the database.
    --

    INSERT INTO public.invoices (
        business_id,
        customer_id,
        invoice_number,
        invoice_date,
        period_start,
        period_end,
        due_date,
        status,
        subtotal,
        discount_amount,
        tax_amount,
        total_amount,
        amount_paid,
        notes,
        created_by,
        issued_at
    )

    VALUES (
        p_business_id,
        p_customer_id,
        v_invoice_number,
        p_invoice_date,
        p_period_start,
        p_period_end,
        p_invoice_date + v_due_days,
        'issued'::public.invoice_status,
        v_invoice_subtotal,
        0,
        0,
        v_invoice_total,
        0,
        NULLIF(btrim(p_notes), ''),
        v_user_id,
        now()
    )

    RETURNING *
    INTO v_invoice;


    -- ========================================================
    -- 15. INSERT DELIVERY INVOICE LINES
    -- ========================================================

    INSERT INTO public.invoice_lines (
        business_id,
        invoice_id,
        product_id,
        description,
        quantity,
        unit_price,
        line_total,
        source_delivery_item_id
    )

    SELECT
        p_business_id,
        v_invoice.id,
        di.product_id,
        COALESCE(
            NULLIF(btrim(pr.name), ''),
            'Delivery item'
        ),
        di.quantity_delivered,
        di.unit_price,
        ROUND(
            di.quantity_delivered * di.unit_price,
            2
        ),
        di.id

    FROM public.delivery_items di

    INNER JOIN public.deliveries d
        ON d.id = di.delivery_id
       AND d.business_id = di.business_id

    LEFT JOIN public.products pr
        ON pr.id = di.product_id
       AND pr.business_id = di.business_id

    WHERE d.business_id = p_business_id
      AND d.customer_id = p_customer_id
      AND d.id = ANY(p_delivery_ids)

    ORDER BY
        d.delivery_date,
        di.created_at;


    -- ========================================================
    -- 16. INSERT PREVIOUS OUTSTANDING LINE
    -- ========================================================

    IF v_previous_outstanding > 0 THEN

        INSERT INTO public.invoice_lines (
            business_id,
            invoice_id,
            product_id,
            description,
            quantity,
            unit_price,
            line_total,
            source_delivery_item_id
        )

        VALUES (
            p_business_id,
            v_invoice.id,
            NULL,
            'Previous Outstanding',
            1,
            v_previous_outstanding,
            v_previous_outstanding,
            NULL
        );

    END IF;


    -- ========================================================
    -- 17. INSERT ADDITIONAL INVOICE LINES
    -- ========================================================

    FOR v_extra IN

        SELECT value

        FROM jsonb_array_elements(
            COALESCE(p_extra_lines, '[]'::JSONB)
        )

    LOOP

        v_description := NULLIF(
            btrim(v_extra->>'description'),
            ''
        );

        v_quantity := COALESCE(
            NULLIF(v_extra->>'quantity', '')::NUMERIC,
            1
        );

        v_unit_price := COALESCE(
            NULLIF(v_extra->>'unit_price', '')::NUMERIC,
            0
        );

        v_line_total := COALESCE(
            NULLIF(v_extra->>'line_total', '')::NUMERIC,
            ROUND(v_quantity * v_unit_price, 2)
        );

        INSERT INTO public.invoice_lines (
            business_id,
            invoice_id,
            product_id,
            description,
            quantity,
            unit_price,
            line_total,
            source_delivery_item_id
        )

        VALUES (
            p_business_id,
            v_invoice.id,
            NULL,
            v_description,
            v_quantity,
            v_unit_price,
            v_line_total,
            NULL
        );

    END LOOP;


    -- ========================================================
    -- 18. RETURN CREATED INVOICE
    -- ========================================================

    RETURN QUERY
    SELECT v_invoice.*;


END;

$function$;


-- ============================================================
-- 19. FUNCTION PERMISSIONS
-- ============================================================

REVOKE ALL ON FUNCTION public.create_invoice_atomic(
    UUID,
    UUID,
    UUID[],
    JSONB,
    DATE,
    TEXT,
    DATE,
    DATE
)
FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.create_invoice_atomic(
    UUID,
    UUID,
    UUID[],
    JSONB,
    DATE,
    TEXT,
    DATE,
    DATE
)
TO authenticated;


-- ============================================================
-- 20. FUNCTION DOCUMENTATION
-- ============================================================

COMMENT ON FUNCTION public.create_invoice_atomic(
    UUID,
    UUID,
    UUID[],
    JSONB,
    DATE,
    TEXT,
    DATE,
    DATE
)
IS
'Creates an invoice atomically, validates business ownership and delivery eligibility, generates a unique invoice number and inserts previous outstanding as a separate invoice line.';


-- ============================================================
-- 21. REFRESH POSTGREST SCHEMA CACHE
-- ============================================================

NOTIFY pgrst, 'reload schema';
