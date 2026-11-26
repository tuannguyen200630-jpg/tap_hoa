CREATE OR REPLACE FUNCTION get_store_report(
    p_from_date date,
    p_to_date date
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_start_at timestamptz;
    v_end_at timestamptz;
    v_today date := (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date;
    v_stock_threshold numeric(12,3);
    v_result jsonb;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Bạn cần đăng nhập để xem báo cáo';
    END IF;
    IF p_from_date IS NULL OR p_to_date IS NULL OR p_from_date > p_to_date THEN
        RAISE EXCEPTION 'Khoảng ngày báo cáo không hợp lệ';
    END IF;
    IF p_to_date > v_today THEN
        RAISE EXCEPTION 'Ngày kết thúc không được ở tương lai';
    END IF;
    IF p_to_date - p_from_date > 365 THEN
        RAISE EXCEPTION 'Mỗi báo cáo chỉ xem tối đa 366 ngày';
    END IF;

    v_start_at := p_from_date::timestamp AT TIME ZONE 'Asia/Ho_Chi_Minh';
    v_end_at := (p_to_date + 1)::timestamp AT TIME ZONE 'Asia/Ho_Chi_Minh';

    SELECT min_stock_threshold INTO v_stock_threshold
    FROM settings
    WHERE id = 'default';
    v_stock_threshold := COALESCE(v_stock_threshold, 5);

    WITH period_sales AS MATERIALIZED (
        SELECT id, created_at, total_amount, final_amount
        FROM sales
        WHERE status = 'completed'
          AND created_at >= v_start_at
          AND created_at < v_end_at
    ),
    period_items AS MATERIALIZED (
        SELECT
            si.product_id,
            si.product_code,
            si.product_name,
            si.unit,
            si.quantity,
            si.subtotal,
            si.cost_price,
            ps.created_at
        FROM period_sales AS ps
        JOIN sale_items AS si ON si.sale_id = ps.id
    ),
    sales_by_day AS (
        SELECT
            (created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date AS report_date,
            sum(final_amount)::bigint AS revenue,
            count(*)::integer AS invoice_count
        FROM period_sales
        GROUP BY 1
    ),
    costs_by_day AS (
        SELECT
            (created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date AS report_date,
            round(sum(quantity * cost_price))::bigint AS cost
        FROM period_items
        GROUP BY 1
    ),
    product_sales AS (
        SELECT
            product_id,
            product_code AS code,
            product_name AS name,
            unit,
            sum(quantity) AS quantity,
            sum(subtotal)::bigint AS revenue
        FROM period_items
        GROUP BY product_id, product_code, product_name, unit
    ),
    calendar AS (
        SELECT generated_day::date AS report_date
        FROM generate_series(
            p_from_date::timestamp,
            p_to_date::timestamp,
            interval '1 day'
        ) AS days(generated_day)
    ),
    daily_report AS (
        SELECT
            calendar.report_date,
            COALESCE(sales_by_day.revenue, 0)::bigint AS revenue,
            (
                COALESCE(sales_by_day.revenue, 0)
                - COALESCE(costs_by_day.cost, 0)
            )::bigint AS gross_profit,
            COALESCE(sales_by_day.invoice_count, 0)::integer AS invoice_count
        FROM calendar
        LEFT JOIN sales_by_day USING (report_date)
        LEFT JOIN costs_by_day USING (report_date)
    ),
    low_stock AS (
        SELECT
            p.id, p.code, p.name, p.unit, p.stock,
            GREATEST(p.min_stock, v_stock_threshold) AS warning_threshold
        FROM products AS p
        WHERE p.is_active = true
          AND p.stock < GREATEST(p.min_stock, v_stock_threshold)
        ORDER BY p.stock, p.name
    ),
    near_expiry AS (
        SELECT p.id, p.code, p.name, p.unit, p.stock, p.expiry_date
        FROM products AS p
        WHERE p.is_active = true
          AND p.expiry_date >= v_today
          AND p.expiry_date <= v_today + 30
        ORDER BY p.expiry_date, p.name
    )
    SELECT jsonb_build_object(
        'summary', jsonb_build_object(
            'revenue',
                COALESCE((SELECT sum(final_amount) FROM period_sales), 0)::bigint,
            'gross_profit',
                (
                    COALESCE((SELECT sum(final_amount) FROM period_sales), 0)
                    - COALESCE(
                        (SELECT round(sum(quantity * cost_price)) FROM period_items),
                        0
                    )
                )::bigint,
            'invoice_count',
                (SELECT count(*) FROM period_sales)::integer
        ),
        'daily',
            COALESCE(
                (
                    SELECT jsonb_agg(
                        jsonb_build_object(
                            'date', to_char(report_date, 'YYYY-MM-DD'),
                            'revenue', revenue,
                            'gross_profit', gross_profit,
                            'invoice_count', invoice_count
                        )
                        ORDER BY report_date
                    )
                    FROM daily_report
                ),
                '[]'::jsonb
            ),
        'top_products',
            COALESCE(
                (
                    SELECT jsonb_agg(to_jsonb(top_rows) ORDER BY top_rows.quantity DESC, top_rows.revenue DESC)
                    FROM (
                        SELECT code, name, unit, quantity, revenue
                        FROM product_sales
                        ORDER BY quantity DESC, revenue DESC, name
                        LIMIT 10
                    ) AS top_rows
                ),
                '[]'::jsonb
            ),
        'slow_products',
            COALESCE(
                (
                    SELECT jsonb_agg(to_jsonb(slow_rows) ORDER BY slow_rows.quantity, slow_rows.name)
                    FROM (
                        SELECT
                            p.code,
                            p.name,
                            p.unit,
                            COALESCE(ps.quantity, 0) AS quantity,
                            COALESCE(ps.revenue, 0)::bigint AS revenue
                        FROM products AS p
                        LEFT JOIN (
                            SELECT product_id, sum(quantity) AS quantity, sum(revenue)::bigint AS revenue
                            FROM product_sales
                            WHERE product_id IS NOT NULL
                            GROUP BY product_id
                        ) AS ps ON ps.product_id = p.id
                        WHERE p.is_active = true
                        ORDER BY COALESCE(ps.quantity, 0), p.name
                        LIMIT 10
                    ) AS slow_rows
                ),
                '[]'::jsonb
            ),
        'stock_value',
            (
                SELECT COALESCE(round(sum(GREATEST(stock, 0) * avg_cost)), 0)::bigint
                FROM products
                WHERE is_active = true
            ),
        'low_stock',
            COALESCE(
                (
                    SELECT jsonb_agg(
                        jsonb_build_object(
                            'id', id,
                            'code', code,
                            'name', name,
                            'unit', unit,
                            'stock', stock,
                            'warning_threshold', warning_threshold
                        )
                        ORDER BY stock, name
                    )
                    FROM low_stock
                ),
                '[]'::jsonb
            ),
        'near_expiry',
            COALESCE(
                (
                    SELECT jsonb_agg(
                        jsonb_build_object(
                            'id', id,
                            'code', code,
                            'name', name,
                            'unit', unit,
                            'stock', stock,
                            'expiry_date', expiry_date
                        )
                        ORDER BY expiry_date, name
                    )
                    FROM near_expiry
                ),
                '[]'::jsonb
            )
    )
    INTO v_result;

    RETURN v_result;
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
    v_stock_threshold numeric(12,3);
    v_today date := (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date;
    v_result jsonb;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Bạn cần đăng nhập để xem hàng hóa';
    END IF;
    IF p_filter NOT IN ('all', 'low_stock', 'near_expiry', 'inactive') THEN
        RAISE EXCEPTION 'Bộ lọc hàng hóa không hợp lệ';
    END IF;

    SELECT min_stock_threshold INTO v_stock_threshold
    FROM settings
    WHERE id = 'default';
    v_stock_threshold := COALESCE(v_stock_threshold, 5);

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
          AND (p_filter <> 'low_stock' OR stock < GREATEST(min_stock, v_stock_threshold))
          AND (
              p_filter <> 'near_expiry'
              OR (
                  expiry_date >= v_today
                  AND expiry_date <= v_today + 30
              )
          )
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

CREATE OR REPLACE FUNCTION adjust_stock(
    p_product_id uuid,
    p_actual_stock numeric(12,3),
    p_note text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_prod record;
    v_diff numeric(12,3);
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Bạn cần đăng nhập để kiểm kho';
    END IF;
    IF p_product_id IS NULL OR p_actual_stock IS NULL OR p_actual_stock < 0 THEN
        RAISE EXCEPTION 'Số lượng đếm thực tế không hợp lệ';
    END IF;

    SELECT id, stock INTO v_prod
    FROM products
    WHERE id = p_product_id
    FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Không tìm thấy hàng hóa';
    END IF;

    v_diff := p_actual_stock - v_prod.stock;

    UPDATE products
    SET stock = p_actual_stock, updated_at = now()
    WHERE id = p_product_id;

    INSERT INTO stock_movements (
        product_id, type, quantity, balance_before, balance_after,
        ref_type, ref_id, note
    ) VALUES (
        p_product_id, 'adjust', v_diff, v_prod.stock, p_actual_stock,
        'adjust', NULL, COALESCE(NULLIF(btrim(p_note), ''), 'Kiểm kho điều chỉnh')
    );

    RETURN jsonb_build_object('success', true, 'difference', v_diff);
END;
$$;

REVOKE ALL PRIVILEGES ON FUNCTION get_store_report(date, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION get_store_report(date, date) TO authenticated;

REVOKE ALL PRIVILEGES ON FUNCTION adjust_stock(uuid, numeric, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION adjust_stock(uuid, numeric, text) TO authenticated;
