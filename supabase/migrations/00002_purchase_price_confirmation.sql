ALTER TABLE price_history
ADD COLUMN IF NOT EXISTS changed_by_name text;

DROP FUNCTION IF EXISTS confirm_price_change(uuid, integer, integer, boolean);

CREATE OR REPLACE FUNCTION confirm_price_change(
    p_product_id uuid,
    p_new_price integer,
    p_new_cost integer,
    p_old_cost integer,
    p_is_accepted_suggested boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_prod record;
    v_rounding_step integer;
    v_suggested_price integer;
    v_old_price integer;
BEGIN
    IF p_new_price < 0 OR p_new_cost < 0 OR p_old_cost < 0 THEN
        RAISE EXCEPTION 'Giá bán và giá nhập phải là số không âm';
    END IF;

    SELECT * INTO v_prod
    FROM products
    WHERE id = p_product_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Không tìm thấy hàng hóa';
    END IF;
    IF v_prod.price_mode <> 'auto' OR v_prod.last_cost <> p_new_cost THEN
        RAISE EXCEPTION 'Giá nhập đã thay đổi hoặc hàng hóa không dùng chế độ tự đề xuất';
    END IF;

    IF p_is_accepted_suggested THEN
        SELECT rounding_step INTO v_rounding_step
        FROM settings
        WHERE id = 'default';
        v_rounding_step := COALESCE(v_rounding_step, 500);

        v_suggested_price := v_prod.base_price + (p_new_cost - v_prod.base_cost);
        IF v_rounding_step > 0 THEN
            v_suggested_price := ceil(v_suggested_price::numeric / v_rounding_step) * v_rounding_step;
        END IF;
        IF p_new_price <> v_suggested_price THEN
            RAISE EXCEPTION 'Giá đề xuất không còn hợp lệ, vui lòng tải lại trang';
        END IF;
    END IF;

    v_old_price := v_prod.sell_price;

    IF p_is_accepted_suggested THEN
        UPDATE products
        SET sell_price = p_new_price, updated_at = now()
        WHERE id = p_product_id;
    ELSE
        UPDATE products
        SET sell_price = p_new_price,
            base_cost = p_new_cost,
            base_price = p_new_price,
            updated_at = now()
        WHERE id = p_product_id;
    END IF;

    INSERT INTO price_history (
        product_id, old_cost, new_cost, old_price, new_price, changed_by, changed_by_name
    ) VALUES (
        p_product_id,
        p_old_cost,
        p_new_cost,
        v_old_price,
        p_new_price,
        auth.uid(),
        COALESCE(
            auth.jwt() -> 'user_metadata' ->> 'full_name',
            auth.jwt() -> 'user_metadata' ->> 'store_name',
            auth.jwt() ->> 'email',
            'Tài khoản'
        )
    );

    RETURN jsonb_build_object('success', true);
END;
$$;

REVOKE ALL PRIVILEGES ON FUNCTION confirm_price_change(uuid, integer, integer, integer, boolean)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION confirm_price_change(uuid, integer, integer, integer, boolean)
TO authenticated;
