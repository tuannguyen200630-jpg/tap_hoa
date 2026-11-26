CREATE OR REPLACE FUNCTION get_favorite_products(p_limit integer DEFAULT 12)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_products jsonb;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Bạn cần đăng nhập để xem hàng hóa';
    END IF;

    WITH ranked AS (
        SELECT si.product_id, sum(si.quantity) AS sold_quantity
        FROM sale_items AS si
        JOIN sales AS s ON s.id = si.sale_id
        JOIN products AS active_product
          ON active_product.id = si.product_id AND active_product.is_active = true
        WHERE s.status = 'completed'
          AND s.created_at >= now() - interval '30 days'
        GROUP BY si.product_id
    )
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'id', p.id,
                'code', p.code,
                'name', p.name,
                'barcode', p.barcode,
                'category_id', p.category_id,
                'unit', p.unit,
                'sell_price', p.sell_price,
                'stock', p.stock,
                'category_name', c.name,
                'category_code', c.code,
                'sold_quantity', ranked.sold_quantity
            )
            ORDER BY ranked.sold_quantity DESC, p.name
        ),
        '[]'::jsonb
    )
    INTO v_products
    FROM (
        SELECT *
        FROM ranked
        ORDER BY sold_quantity DESC
        LIMIT LEAST(GREATEST(COALESCE(p_limit, 12), 1), 20)
    ) AS ranked
    JOIN products AS p ON p.id = ranked.product_id AND p.is_active = true
    LEFT JOIN categories AS c ON c.id = p.category_id;

    RETURN jsonb_build_object('products', v_products);
END;
$$;

CREATE OR REPLACE FUNCTION list_sales_page(
    p_date date,
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
    v_start timestamptz;
    v_end timestamptz;
    v_result jsonb;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Bạn cần đăng nhập để xem hóa đơn';
    END IF;
    IF p_date IS NULL THEN
        RAISE EXCEPTION 'Vui lòng chọn ngày xem hóa đơn';
    END IF;

    v_start := p_date::timestamp AT TIME ZONE 'Asia/Ho_Chi_Minh';
    v_end := (p_date + 1)::timestamp AT TIME ZONE 'Asia/Ho_Chi_Minh';

    WITH matched AS MATERIALIZED (
        SELECT
            s.id, s.code, c.name AS customer_name,
            s.final_amount, s.payment_method, s.status, s.created_at,
            (SELECT count(*) FROM sale_items AS si WHERE si.sale_id = s.id)::integer AS item_count
        FROM sales AS s
        LEFT JOIN customers AS c ON c.id = s.customer_id
        WHERE s.created_at >= v_start
          AND s.created_at < v_end
          AND (
              v_search IS NULL
              OR s.code ILIKE '%' || v_search || '%'
              OR immutable_unaccent(lower(COALESCE(c.name, ''))) LIKE
                    '%' || immutable_unaccent(lower(v_search)) || '%'
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
        'sales', COALESCE(
            (SELECT jsonb_agg(to_jsonb(page_rows)) FROM page_rows),
            '[]'::jsonb
        )
    )
    INTO v_result;

    RETURN v_result;
END;
$$;

REVOKE ALL PRIVILEGES ON FUNCTION get_favorite_products(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION get_favorite_products(integer) TO authenticated;

REVOKE ALL PRIVILEGES ON FUNCTION list_sales_page(date, text, integer, integer)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION list_sales_page(date, text, integer, integer)
TO authenticated;
