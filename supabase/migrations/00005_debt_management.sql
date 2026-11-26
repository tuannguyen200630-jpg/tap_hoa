CREATE OR REPLACE FUNCTION list_debt_contacts(
    p_target_type text,
    p_search text DEFAULT NULL,
    p_page integer DEFAULT 1,
    p_page_size integer DEFAULT 30
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_search text := NULLIF(btrim(p_search), '');
    v_page integer := GREATEST(COALESCE(p_page, 1), 1);
    v_page_size integer := LEAST(GREATEST(COALESCE(p_page_size, 30), 1), 50);
    v_result jsonb;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Bạn cần đăng nhập để xem sổ nợ';
    END IF;
    IF p_target_type IS NULL OR p_target_type NOT IN ('customer', 'supplier') THEN
        RAISE EXCEPTION 'Loại danh sách không hợp lệ';
    END IF;

    WITH all_contacts AS MATERIALIZED (
        SELECT id, name, phone, address, note, debt, created_at
        FROM customers
        WHERE p_target_type = 'customer'
        UNION ALL
        SELECT id, name, phone, address, note, debt, created_at
        FROM suppliers
        WHERE p_target_type = 'supplier'
    ),
    matched AS MATERIALIZED (
        SELECT *
        FROM all_contacts
        WHERE v_search IS NULL
           OR immutable_unaccent(lower(name)) LIKE
                '%' || immutable_unaccent(lower(v_search)) || '%'
           OR COALESCE(phone, '') ILIKE '%' || v_search || '%'
    ),
    page_rows AS (
        SELECT *
        FROM matched
        ORDER BY name, created_at DESC, id
        LIMIT v_page_size
        OFFSET (v_page - 1) * v_page_size
    )
    SELECT jsonb_build_object(
        'total_debt', (SELECT COALESCE(sum(debt), 0) FROM all_contacts),
        'total_count', (SELECT count(*) FROM matched),
        'contacts', COALESCE(
            (
                SELECT jsonb_agg(
                    to_jsonb(page_rows)
                    ORDER BY page_rows.name, page_rows.created_at DESC, page_rows.id
                )
                FROM page_rows
            ),
            '[]'::jsonb
        )
    )
    INTO v_result;

    RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION record_payment(
    p_target_type text,
    p_target_id uuid,
    p_amount integer,
    p_payment_type text,
    p_note text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_cur_debt integer;
    v_new_debt integer;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Bạn cần đăng nhập để ghi nhận thanh toán';
    END IF;
    IF p_amount IS NULL OR p_amount <= 0 THEN
        RAISE EXCEPTION 'Số tiền thanh toán phải lớn hơn 0';
    END IF;
    IF p_payment_type IS NULL OR p_payment_type NOT IN ('pay_debt', 'add_debt') THEN
        RAISE EXCEPTION 'Loại thanh toán không hợp lệ';
    END IF;

    IF p_target_type = 'customer' THEN
        SELECT debt INTO v_cur_debt
        FROM customers
        WHERE id = p_target_id
        FOR UPDATE;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Không tìm thấy khách hàng';
        END IF;

    ELSIF p_target_type = 'supplier' THEN
        SELECT debt INTO v_cur_debt
        FROM suppliers
        WHERE id = p_target_id
        FOR UPDATE;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Không tìm thấy nhà cung cấp';
        END IF;

    ELSE
        RAISE EXCEPTION 'Loại đối tượng không hợp lệ';
    END IF;

    IF p_payment_type = 'pay_debt' THEN
        IF p_amount > v_cur_debt THEN
            RAISE EXCEPTION 'Số tiền thanh toán vượt quá số nợ hiện tại';
        END IF;
        v_new_debt := v_cur_debt - p_amount;
    ELSE
        IF p_amount > 2147483647 - v_cur_debt THEN
            RAISE EXCEPTION 'Số nợ vượt quá giới hạn cho phép';
        END IF;
        v_new_debt := v_cur_debt + p_amount;
    END IF;

    IF p_target_type = 'customer' THEN
        UPDATE customers SET debt = v_new_debt, updated_at = now() WHERE id = p_target_id;
    ELSE
        UPDATE suppliers SET debt = v_new_debt, updated_at = now() WHERE id = p_target_id;
    END IF;

    INSERT INTO payments (target_type, target_id, amount, payment_type, note)
    VALUES (p_target_type, p_target_id, p_amount, p_payment_type, p_note);

    RETURN jsonb_build_object(
        'success', true,
        'old_debt', v_cur_debt,
        'new_debt', v_new_debt
    );
END;
$$;

REVOKE ALL PRIVILEGES ON FUNCTION list_debt_contacts(text, text, integer, integer)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION list_debt_contacts(text, text, integer, integer)
TO authenticated;

REVOKE ALL PRIVILEGES ON FUNCTION record_payment(text, uuid, integer, text, text)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION record_payment(text, uuid, integer, text, text)
TO authenticated;
