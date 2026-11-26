CREATE OR REPLACE FUNCTION get_next_product_code(p_category_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_category_name text;
    v_prefix text;
    v_sequence integer;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Bạn cần đăng nhập để xem mã hàng';
    END IF;

    SELECT name INTO v_category_name
    FROM categories
    WHERE id = p_category_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Không tìm thấy nhóm hàng';
    END IF;

    SELECT string_agg(upper(left(token, 1)), '' ORDER BY ordinal)
    INTO v_prefix
    FROM regexp_split_to_table(immutable_unaccent(v_category_name), '\s+')
         WITH ORDINALITY AS words(token, ordinal)
    WHERE upper(left(token, 1)) ~ '^[A-Z]$';
    v_prefix := COALESCE(NULLIF(v_prefix, ''), 'SP');

    SELECT COALESCE(MAX(substring(code FROM length(v_prefix) + 1)::integer), 0) + 1
    INTO v_sequence
    FROM products
    WHERE code ~ ('^' || v_prefix || '[0-9]+$');

    RETURN v_prefix ||
        CASE WHEN v_sequence < 1000 THEN lpad(v_sequence::text, 3, '0')
             ELSE v_sequence::text
        END;
END;
$$;

CREATE OR REPLACE FUNCTION create_product(
    p_category_id uuid,
    p_name text,
    p_barcode text,
    p_unit text,
    p_price_mode text,
    p_cost_price integer,
    p_sell_price integer,
    p_initial_stock numeric(12,3),
    p_min_stock numeric(12,3),
    p_expiry_date date,
    p_image_url text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_code text;
    v_product products%ROWTYPE;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Bạn cần đăng nhập để thêm hàng hóa';
    END IF;
    IF p_name IS NULL OR btrim(p_name) = '' OR p_unit IS NULL OR btrim(p_unit) = '' THEN
        RAISE EXCEPTION 'Tên hàng và đơn vị tính không được để trống';
    END IF;
    IF p_price_mode NOT IN ('auto', 'fixed') OR p_cost_price < 0 OR p_sell_price < 0 THEN
        RAISE EXCEPTION 'Giá hoặc cách tính giá không hợp lệ';
    END IF;
    IF p_initial_stock < 0 OR p_min_stock < 0 THEN
        RAISE EXCEPTION 'Số lượng không được âm';
    END IF;

    v_code := get_next_product_code(p_category_id);
    PERFORM pg_advisory_xact_lock(hashtext(regexp_replace(v_code, '[0-9]+$', '')));
    v_code := get_next_product_code(p_category_id);

    INSERT INTO products (
        code, name, barcode, category_id, unit, price_mode,
        base_cost, base_price, last_cost, sell_price, avg_cost,
        stock, min_stock, expiry_date, image_url, is_active
    ) VALUES (
        v_code, btrim(p_name), NULLIF(btrim(p_barcode), ''), p_category_id, btrim(p_unit), p_price_mode,
        p_cost_price, p_sell_price, p_cost_price, p_sell_price, p_cost_price,
        p_initial_stock, p_min_stock, p_expiry_date, p_image_url, true
    )
    RETURNING * INTO v_product;

    IF p_initial_stock > 0 THEN
        INSERT INTO stock_movements (
            product_id, type, quantity, balance_before, balance_after, note
        ) VALUES (
            v_product.id, 'adjust', p_initial_stock, 0, p_initial_stock,
            'Số lượng ban đầu khi tạo món hàng'
        );
    END IF;

    RETURN to_jsonb(v_product);
END;
$$;

CREATE OR REPLACE FUNCTION list_products_page(
    p_search text DEFAULT NULL,
    p_category_id uuid DEFAULT NULL,
    p_filter text DEFAULT 'all',
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
        RAISE EXCEPTION 'Bạn cần đăng nhập để xem hàng hóa';
    END IF;
    IF p_filter NOT IN ('all', 'low_stock', 'near_expiry', 'inactive') THEN
        RAISE EXCEPTION 'Bộ lọc hàng hóa không hợp lệ';
    END IF;

    WITH filtered AS MATERIALIZED (
        SELECT
            p.id, p.code, p.name, p.barcode, p.category_id, p.unit,
            p.price_mode, p.base_cost, p.base_price, p.last_cost, p.sell_price,
            p.avg_cost, p.stock, p.min_stock, p.expiry_date, p.image_url,
            p.is_active, p.created_at,
            c.name AS category_name, c.code AS category_code
        FROM products AS p
        LEFT JOIN categories AS c ON c.id = p.category_id
        WHERE (p_filter = 'inactive' AND p.is_active = false)
           OR (p_filter <> 'inactive' AND p.is_active = true)
    ),
    matched AS MATERIALIZED (
        SELECT *
        FROM filtered
        WHERE (p_category_id IS NULL OR category_id = p_category_id)
          AND (p_filter <> 'low_stock' OR stock < min_stock)
          AND (p_filter <> 'near_expiry' OR expiry_date <= current_date + 30)
          AND (
              v_search IS NULL
              OR immutable_unaccent(lower(name)) LIKE
                    '%' || immutable_unaccent(lower(v_search)) || '%'
              OR code ILIKE '%' || v_search || '%'
              OR COALESCE(barcode, '') ILIKE '%' || v_search || '%'
          )
    ),
    page_rows AS (
        SELECT *
        FROM matched
        ORDER BY created_at DESC, id DESC
        LIMIT v_page_size
        OFFSET (v_page - 1) * v_page_size
    )
    SELECT jsonb_build_object(
        'total_count', (SELECT count(*) FROM matched),
        'products', COALESCE(
            (SELECT jsonb_agg(to_jsonb(page_rows)) FROM page_rows),
            '[]'::jsonb
        )
    )
    INTO v_result;

    RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION update_product(
    p_product_id uuid,
    p_name text,
    p_barcode text,
    p_category_id uuid,
    p_unit text,
    p_price_mode text,
    p_cost_price integer,
    p_sell_price integer,
    p_min_stock numeric(12,3),
    p_expiry_date date,
    p_image_url text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_product products%ROWTYPE;
    v_price_changed boolean;
    v_old_cost integer;
    v_old_price integer;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Bạn cần đăng nhập để sửa hàng hóa';
    END IF;
    IF p_name IS NULL OR btrim(p_name) = '' OR p_unit IS NULL OR btrim(p_unit) = '' THEN
        RAISE EXCEPTION 'Tên hàng và đơn vị tính không được để trống';
    END IF;
    IF p_price_mode NOT IN ('auto', 'fixed') OR p_cost_price < 0 OR p_sell_price < 0 OR p_min_stock < 0 THEN
        RAISE EXCEPTION 'Giá hoặc ngưỡng báo sắp hết không hợp lệ';
    END IF;

    SELECT * INTO v_product
    FROM products
    WHERE id = p_product_id
    FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Không tìm thấy hàng hóa cần sửa';
    END IF;

    v_old_cost := v_product.last_cost;
    v_old_price := v_product.sell_price;
    v_price_changed := v_product.last_cost <> p_cost_price OR v_product.sell_price <> p_sell_price;

    UPDATE products
    SET name = btrim(p_name),
        barcode = NULLIF(btrim(p_barcode), ''),
        category_id = p_category_id,
        unit = btrim(p_unit),
        price_mode = p_price_mode,
        min_stock = p_min_stock,
        expiry_date = p_expiry_date,
        image_url = COALESCE(p_image_url, image_url),
        base_cost = CASE WHEN v_price_changed THEN p_cost_price ELSE base_cost END,
        base_price = CASE WHEN v_price_changed THEN p_sell_price ELSE base_price END,
        last_cost = CASE WHEN v_price_changed THEN p_cost_price ELSE last_cost END,
        sell_price = CASE WHEN v_price_changed THEN p_sell_price ELSE sell_price END,
        updated_at = now()
    WHERE id = p_product_id
    RETURNING * INTO v_product;

    IF v_price_changed THEN
        INSERT INTO price_history (
            product_id, old_cost, new_cost, old_price, new_price, changed_by, changed_by_name
        ) VALUES (
            p_product_id,
            v_old_cost,
            p_cost_price,
            v_old_price,
            p_sell_price,
            auth.uid(),
            COALESCE(
                auth.jwt() -> 'user_metadata' ->> 'full_name',
                auth.jwt() -> 'user_metadata' ->> 'store_name',
                auth.jwt() ->> 'email',
                'Tài khoản'
            )
        );
    END IF;

    RETURN to_jsonb(v_product);
END;
$$;

REVOKE ALL PRIVILEGES ON FUNCTION update_product(
    uuid, text, text, uuid, text, text, integer, integer, numeric, date, text
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION update_product(
    uuid, text, text, uuid, text, text, integer, integer, numeric, date, text
) TO authenticated;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'product-images',
    'product-images',
    true,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS product_images_authenticated_select ON storage.objects;
CREATE POLICY product_images_authenticated_select
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS product_images_authenticated_insert ON storage.objects;
CREATE POLICY product_images_authenticated_insert
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS product_images_authenticated_update ON storage.objects;
CREATE POLICY product_images_authenticated_update
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'product-images')
WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS product_images_authenticated_delete ON storage.objects;
CREATE POLICY product_images_authenticated_delete
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'product-images');

REVOKE ALL PRIVILEGES ON FUNCTION create_product(
    uuid, text, text, text, text, integer, integer, numeric, numeric, date, text
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION create_product(
    uuid, text, text, text, text, integer, integer, numeric, numeric, date, text
) TO authenticated;

REVOKE ALL PRIVILEGES ON FUNCTION get_next_product_code(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION get_next_product_code(uuid) TO authenticated;

REVOKE ALL PRIVILEGES ON FUNCTION list_products_page(text, uuid, text, integer, integer)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION list_products_page(text, uuid, text, integer, integer)
TO authenticated;
