-- Migration: 00001_initial_schema.sql
-- Mô tả: Khởi tạo schema đầy đủ cho phần mềm quản lý cửa hàng tạp hóa
-- Hỗ trợ: Tiếng Việt không dấu (unaccent, pg_trgm), RLS bảo mật, RPC tối ưu cho Vercel

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "unaccent";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 2. BẢNG DÃY SỐ SINH MÃ HÓA ĐƠN AN TOÀN ĐỒNG THỜI
CREATE TABLE IF NOT EXISTS invoice_sequences (
    date_key text PRIMARY KEY,
    current_val integer NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS purchase_sequences (
    date_key text PRIMARY KEY,
    current_val integer NOT NULL DEFAULT 1
);

-- 3. DANH MỤC HÀNG HÓA
CREATE TABLE IF NOT EXISTS categories (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    code text UNIQUE NOT NULL,
    name text NOT NULL,
    description text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. HÀNG HÓA
CREATE TABLE IF NOT EXISTS products (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    code text UNIQUE NOT NULL,
    name text NOT NULL,
    barcode text,
    category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
    unit text NOT NULL DEFAULT 'cái',
    price_mode text NOT NULL DEFAULT 'auto' CHECK (price_mode IN ('auto', 'fixed')),
    base_cost integer NOT NULL DEFAULT 0 CHECK (base_cost >= 0),
    base_price integer NOT NULL DEFAULT 0 CHECK (base_price >= 0),
    last_cost integer NOT NULL DEFAULT 0 CHECK (last_cost >= 0),
    sell_price integer NOT NULL DEFAULT 0 CHECK (sell_price >= 0),
    avg_cost integer NOT NULL DEFAULT 0 CHECK (avg_cost >= 0),
    stock numeric(12,3) NOT NULL DEFAULT 0,
    min_stock numeric(12,3) NOT NULL DEFAULT 5,
    expiry_date date,
    image_url text,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- 5. NHÀ CUNG CẤP
CREATE TABLE IF NOT EXISTS suppliers (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    phone text,
    address text,
    note text,
    debt integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- 6. KHÁCH HÀNG
CREATE TABLE IF NOT EXISTS customers (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    phone text,
    address text,
    note text,
    debt integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- 7. NHẬP HÀNG (PURCHASES)
CREATE TABLE IF NOT EXISTS purchases (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    code text UNIQUE NOT NULL,
    supplier_id uuid REFERENCES suppliers(id) ON DELETE SET NULL,
    total_amount integer NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
    paid_amount integer NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
    debt_amount integer NOT NULL DEFAULT 0 CHECK (debt_amount >= 0),
    status text NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'cancelled')),
    note text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- 8. CHI TIẾT NHẬP HÀNG (PURCHASE_ITEMS)
CREATE TABLE IF NOT EXISTS purchase_items (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_id uuid NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
    product_id uuid REFERENCES products(id) ON DELETE SET NULL,
    product_name text NOT NULL,
    unit text NOT NULL,
    quantity numeric(12,3) NOT NULL CHECK (quantity > 0),
    cost_price integer NOT NULL CHECK (cost_price >= 0),
    subtotal integer NOT NULL CHECK (subtotal >= 0),
    expiry_date date,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 9. HÓA ĐƠN BÁN HÀNG (SALES)
CREATE TABLE IF NOT EXISTS sales (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    code text UNIQUE NOT NULL,
    customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
    total_amount integer NOT NULL CHECK (total_amount >= 0),
    discount_amount integer NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
    final_amount integer NOT NULL CHECK (final_amount >= 0),
    customer_paid integer NOT NULL DEFAULT 0 CHECK (customer_paid >= 0),
    change_amount integer NOT NULL DEFAULT 0,
    debt_amount integer NOT NULL DEFAULT 0 CHECK (debt_amount >= 0),
    payment_method text NOT NULL CHECK (payment_method IN ('cash', 'transfer', 'debt')),
    status text NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'cancelled')),
    cancel_reason text,
    note text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- 10. CHI TIẾT HÓA ĐƠN BÁN HÀNG (SALE_ITEMS)
CREATE TABLE IF NOT EXISTS sale_items (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id uuid NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id uuid REFERENCES products(id) ON DELETE SET NULL,
    product_code text NOT NULL,
    product_name text NOT NULL,
    unit text NOT NULL,
    quantity numeric(12,3) NOT NULL CHECK (quantity > 0),
    sell_price integer NOT NULL CHECK (sell_price >= 0),
    cost_price integer NOT NULL DEFAULT 0 CHECK (cost_price >= 0),
    subtotal integer NOT NULL CHECK (subtotal >= 0),
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 11. BIẾN ĐỘNG KHO (STOCK_MOVEMENTS)
CREATE TABLE IF NOT EXISTS stock_movements (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    type text NOT NULL CHECK (type IN ('sale', 'purchase', 'sale_cancel', 'purchase_cancel', 'adjust')),
    quantity numeric(12,3) NOT NULL,
    balance_before numeric(12,3) NOT NULL,
    balance_after numeric(12,3) NOT NULL,
    ref_type text,
    ref_id uuid,
    note text,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 12. LỊCH SỬ THAY ĐỔI GIÁ (PRICE_HISTORY)
CREATE TABLE IF NOT EXISTS price_history (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    old_cost integer NOT NULL,
    new_cost integer NOT NULL,
    old_price integer NOT NULL,
    new_price integer NOT NULL,
    changed_by uuid,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 13. THU NỢ / TRẢ NỢ (PAYMENTS)
CREATE TABLE IF NOT EXISTS payments (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    target_type text NOT NULL CHECK (target_type IN ('customer', 'supplier')),
    target_id uuid NOT NULL,
    amount integer NOT NULL CHECK (amount > 0),
    payment_type text NOT NULL CHECK (payment_type IN ('pay_debt', 'add_debt')),
    note text,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 14. CÀI ĐẶT CỬA HÀNG (SETTINGS)
CREATE TABLE IF NOT EXISTS settings (
    id text PRIMARY KEY DEFAULT 'default',
    store_name text NOT NULL DEFAULT 'Cửa hàng tạp hóa',
    store_address text DEFAULT '',
    store_phone text DEFAULT '',
    rounding_step integer NOT NULL DEFAULT 500 CHECK (rounding_step IN (100, 500, 1000)),
    font_size text NOT NULL DEFAULT 'medium' CHECK (font_size IN ('medium', 'large', 'xlarge')),
    min_stock_threshold numeric(12,3) NOT NULL DEFAULT 5,
    allow_sell_out_of_stock boolean NOT NULL DEFAULT true,
    receipt_footer text DEFAULT 'Cảm ơn quý khách và hẹn gặp lại!',
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Khởi tạo cài đặt mặc định nếu chưa có
INSERT INTO settings (id, store_name, rounding_step, font_size, min_stock_threshold, allow_sell_out_of_stock, receipt_footer)
VALUES ('default', 'Cửa hàng tạp hóa', 500, 'medium', 5, true, 'Cảm ơn quý khách và hẹn gặp lại!')
ON CONFLICT (id) DO NOTHING;

-- 15. INDEXES TỐI ƯU TRUY VẤN
CREATE INDEX IF NOT EXISTS idx_products_code ON products(code);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_expiry ON products(expiry_date);

CREATE INDEX IF NOT EXISTS idx_sales_code ON sales(code);
CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_created ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status);

CREATE INDEX IF NOT EXISTS idx_purchases_code ON purchases(code);
CREATE INDEX IF NOT EXISTS idx_purchases_supplier ON purchases(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchases_created ON purchases(created_at);

CREATE INDEX IF NOT EXISTS idx_stock_movements_prod_time ON stock_movements(product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_price_history_prod_time ON price_history(product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_target ON payments(target_type, target_id, created_at DESC);

-- Hỗ trợ tìm kiếm tiếng Việt không dấu (GIN pg_trgm + unaccent)
CREATE INDEX IF NOT EXISTS idx_products_search_unaccent ON products USING gin(unaccent(lower(name)) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_categories_search_unaccent ON categories USING gin(unaccent(lower(name)) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_customers_search_unaccent ON customers USING gin(unaccent(lower(name)) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_suppliers_search_unaccent ON suppliers USING gin(unaccent(lower(name)) gin_trgm_ops);

-- 16. ROW LEVEL SECURITY (RLS)
ALTER TABLE invoice_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Chỉ cấp quyền cho role authenticated
DO $$
DECLARE
    tbl text;
BEGIN
    FOR tbl IN
        SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS authenticated_all ON %I;', tbl);
        EXECUTE format('CREATE POLICY authenticated_all ON %I FOR ALL TO authenticated USING (true) WITH CHECK (true);', tbl);
    END LOOP;
END $$;

-- Chặn hoàn toàn role anon
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon;

-- 17. DATABASE RPCs (SECURITY INVOKER)

-- Helper sinh mã hóa đơn: HD-YYYYMMDD-001
CREATE OR REPLACE FUNCTION next_invoice_code()
RETURNS text
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_date_key text;
    v_seq integer;
BEGIN
    v_date_key := to_char(now() AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYYMMDD');
    INSERT INTO invoice_sequences (date_key, current_val)
    VALUES (v_date_key, 1)
    ON CONFLICT (date_key)
    DO UPDATE SET current_val = invoice_sequences.current_val + 1
    RETURNING current_val INTO v_seq;

    RETURN 'HD-' || v_date_key || '-' || lpad(v_seq::text, 3, '0');
END;
$$;

-- Helper sinh mã nhập hàng: PN-YYYYMMDD-001
CREATE OR REPLACE FUNCTION next_purchase_code()
RETURNS text
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_date_key text;
    v_seq integer;
BEGIN
    v_date_key := to_char(now() AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYYMMDD');
    INSERT INTO purchase_sequences (date_key, current_val)
    VALUES (v_date_key, 1)
    ON CONFLICT (date_key)
    DO UPDATE SET current_val = purchase_sequences.current_val + 1
    RETURNING current_val INTO v_seq;

    RETURN 'PN-' || v_date_key || '-' || lpad(v_seq::text, 3, '0');
END;
$$;

-- RPC: create_sale (Tạo hóa đơn bán hàng trong 1 transaction an toàn)
CREATE OR REPLACE FUNCTION create_sale(
    p_customer_id uuid,
    p_discount_amount integer,
    p_customer_paid integer,
    p_payment_method text,
    p_note text,
    p_items jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_sale_id uuid;
    v_code text;
    v_total_amount integer := 0;
    v_final_amount integer := 0;
    v_debt_amount integer := 0;
    v_change_amount integer := 0;
    v_item jsonb;
    v_product record;
    v_qty numeric(12,3);
    v_price integer;
    v_subtotal integer;
    v_cur_stock numeric(12,3);
    v_new_stock numeric(12,3);
    v_allow_sell_out boolean;
BEGIN
    -- Kiểm tra cài đặt cho phép bán khi hết hàng
    SELECT allow_sell_out_of_stock INTO v_allow_sell_out FROM settings WHERE id = 'default';
    IF v_allow_sell_out IS NULL THEN
        v_allow_sell_out := true;
    END IF;

    -- Tính tổng tiền trước
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_qty := (v_item->>'quantity')::numeric(12,3);
        v_price := (v_item->>'sell_price')::integer;
        IF v_qty <= 0 OR v_price < 0 THEN
            RAISE EXCEPTION 'Số lượng hoặc giá bán không hợp lệ';
        END IF;
        v_total_amount := v_total_amount + (v_qty * v_price)::integer;
    END LOOP;

    -- Tính tiền sau giảm giá
    IF p_discount_amount > v_total_amount THEN
        v_final_amount := 0;
    ELSE
        v_final_amount := v_total_amount - p_discount_amount;
    END IF;

    -- Tính công nợ / tiền thối
    IF p_payment_method = 'debt' THEN
        v_debt_amount := v_final_amount;
        v_change_amount := 0;
        IF p_customer_id IS NULL THEN
            RAISE EXCEPTION 'Phải chọn khách hàng khi bán hàng ghi nợ';
        END IF;
    ELSE
        IF p_customer_paid >= v_final_amount THEN
            v_change_amount := p_customer_paid - v_final_amount;
            v_debt_amount := 0;
        ELSE
            v_change_amount := 0;
            v_debt_amount := v_final_amount - p_customer_paid;
        END IF;
    END IF;

    -- Sinh mã và tạo đơn
    v_sale_id := uuid_generate_v4();
    v_code := next_invoice_code();

    INSERT INTO sales (
        id, code, customer_id, total_amount, discount_amount, final_amount,
        customer_paid, change_amount, debt_amount, payment_method, status, note
    ) VALUES (
        v_sale_id, v_code, p_customer_id, v_total_amount, p_discount_amount, v_final_amount,
        p_customer_paid, v_change_amount, v_debt_amount, p_payment_method, 'completed', p_note
    );

    -- Duyệt từng sản phẩm: trừ kho, lưu sale_item, ghi stock_movement
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_qty := (v_item->>'quantity')::numeric(12,3);
        v_price := (v_item->>'sell_price')::integer;
        v_subtotal := (v_qty * v_price)::integer;

        -- Khóa dòng sản phẩm để trừ tồn kho an toàn
        SELECT * INTO v_product FROM products WHERE id = (v_item->>'product_id')::uuid FOR UPDATE;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Không tìm thấy sản phẩm mã %', (v_item->>'product_id');
        END IF;

        v_cur_stock := v_product.stock;
        v_new_stock := v_cur_stock - v_qty;

        IF NOT v_allow_sell_out AND v_new_stock < 0 THEN
            RAISE EXCEPTION 'Sản phẩm % đã hết hàng (còn % trong kho)', v_product.name, v_cur_stock;
        END IF;

        -- Cập nhật tồn kho
        UPDATE products SET stock = v_new_stock, updated_at = now() WHERE id = v_product.id;

        -- Thêm chi tiết bán hàng
        INSERT INTO sale_items (
            sale_id, product_id, product_code, product_name, unit,
            quantity, sell_price, cost_price, subtotal
        ) VALUES (
            v_sale_id, v_product.id, v_product.code, v_product.name, v_product.unit,
            v_qty, v_price, v_product.avg_cost, v_subtotal
        );

        -- Ghi biến động kho
        INSERT INTO stock_movements (
            product_id, type, quantity, balance_before, balance_after,
            ref_type, ref_id, note
        ) VALUES (
            v_product.id, 'sale', -v_qty, v_cur_stock, v_new_stock,
            'sale', v_sale_id, 'Bán hàng hóa đơn ' || v_code
        );
    END LOOP;

    -- Nếu có ghi nợ, cập nhật công nợ của khách hàng
    IF v_debt_amount > 0 AND p_customer_id IS NOT NULL THEN
        UPDATE customers
        SET debt = debt + v_debt_amount, updated_at = now()
        WHERE id = p_customer_id;

        INSERT INTO payments (
            target_type, target_id, amount, payment_type, note
        ) VALUES (
            'customer', p_customer_id, v_debt_amount, 'add_debt',
            'Ghi nợ hóa đơn ' || v_code
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'sale_id', v_sale_id,
        'code', v_code,
        'total_amount', v_total_amount,
        'final_amount', v_final_amount,
        'debt_amount', v_debt_amount,
        'change_amount', v_change_amount
    );
END;
$$;

-- RPC: cancel_sale (Hủy hóa đơn, hoàn kho, hoàn nợ trong 1 transaction)
CREATE OR REPLACE FUNCTION cancel_sale(
    p_sale_id uuid,
    p_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_sale record;
    v_item record;
    v_product record;
    v_new_stock numeric(12,3);
BEGIN
    SELECT * INTO v_sale FROM sales WHERE id = p_sale_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Không tìm thấy hóa đơn cần hủy';
    END IF;

    IF v_sale.status = 'cancelled' THEN
        RAISE EXCEPTION 'Hóa đơn này đã được hủy trước đó';
    END IF;

    -- Hoàn lại tồn kho cho từng sản phẩm trong hóa đơn
    FOR v_item IN SELECT * FROM sale_items WHERE sale_id = p_sale_id
    LOOP
        SELECT * INTO v_product FROM products WHERE id = v_item.product_id FOR UPDATE;
        IF FOUND THEN
            v_new_stock := v_product.stock + v_item.quantity;
            UPDATE products SET stock = v_new_stock, updated_at = now() WHERE id = v_product.id;

            INSERT INTO stock_movements (
                product_id, type, quantity, balance_before, balance_after,
                ref_type, ref_id, note
            ) VALUES (
                v_product.id, 'sale_cancel', v_item.quantity, v_product.stock, v_new_stock,
                'sale_cancel', p_sale_id, 'Hủy hóa đơn ' || v_sale.code || ': ' || COALESCE(p_reason, '')
            );
        END IF;
    END LOOP;

    -- Hoàn lại nợ nếu hóa đơn có ghi nợ khách hàng
    IF v_sale.debt_amount > 0 AND v_sale.customer_id IS NOT NULL THEN
        UPDATE customers
        SET debt = GREATEST(0, debt - v_sale.debt_amount), updated_at = now()
        WHERE id = v_sale.customer_id;

        INSERT INTO payments (
            target_type, target_id, amount, payment_type, note
        ) VALUES (
            'customer', v_sale.customer_id, v_sale.debt_amount, 'pay_debt',
            'Giảm nợ do hủy hóa đơn ' || v_sale.code
        );
    END IF;

    -- Đổi trạng thái hóa đơn sang cancelled
    UPDATE sales
    SET status = 'cancelled', cancel_reason = p_reason, updated_at = now()
    WHERE id = p_sale_id;

    RETURN jsonb_build_object('success', true, 'code', v_sale.code);
END;
$$;

-- RPC: create_purchase (Nhập hàng, tính giá vốn bình quân, cập nhật tồn kho)
CREATE OR REPLACE FUNCTION create_purchase(
    p_supplier_id uuid,
    p_paid_amount integer,
    p_note text,
    p_items jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_purchase_id uuid;
    v_code text;
    v_total_amount integer := 0;
    v_debt_amount integer := 0;
    v_item jsonb;
    v_product record;
    v_qty numeric(12,3);
    v_cost integer;
    v_subtotal integer;
    v_cur_stock numeric(12,3);
    v_new_stock numeric(12,3);
    v_new_avg_cost integer;
    v_exp_date date;
    v_price_changes jsonb := '[]'::jsonb;
    v_suggested_price integer;
    v_rounding_step integer;
BEGIN
    SELECT rounding_step INTO v_rounding_step FROM settings WHERE id = 'default';
    IF v_rounding_step IS NULL THEN
        v_rounding_step := 500;
    END IF;

    -- Tính tổng tiền nhập
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_qty := (v_item->>'quantity')::numeric(12,3);
        v_cost := (v_item->>'cost_price')::integer;
        IF v_qty <= 0 OR v_cost < 0 THEN
            RAISE EXCEPTION 'Số lượng hoặc giá nhập không hợp lệ';
        END IF;
        v_total_amount := v_total_amount + (v_qty * v_cost)::integer;
    END LOOP;

    IF p_paid_amount >= v_total_amount THEN
        v_debt_amount := 0;
    ELSE
        v_debt_amount := v_total_amount - p_paid_amount;
    END IF;

    v_purchase_id := uuid_generate_v4();
    v_code := next_purchase_code();

    INSERT INTO purchases (
        id, code, supplier_id, total_amount, paid_amount, debt_amount, status, note
    ) VALUES (
        v_purchase_id, v_code, p_supplier_id, v_total_amount, p_paid_amount, v_debt_amount, 'completed', p_note
    );

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_qty := (v_item->>'quantity')::numeric(12,3);
        v_cost := (v_item->>'cost_price')::integer;
        v_subtotal := (v_qty * v_cost)::integer;
        IF v_item->>'expiry_date' IS NOT NULL AND (v_item->>'expiry_date') != '' THEN
            v_exp_date := (v_item->>'expiry_date')::date;
        ELSE
            v_exp_date := NULL;
        END IF;

        SELECT * INTO v_product FROM products WHERE id = (v_item->>'product_id')::uuid FOR UPDATE;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Không tìm thấy sản phẩm id %', (v_item->>'product_id');
        END IF;

        v_cur_stock := v_product.stock;
        v_new_stock := v_cur_stock + v_qty;

        -- Tính giá vốn bình quân gia quyền: avg_mới = (sl_tồn*avg_cũ + sl_nhập*giá_nhập) / (sl_tồn + sl_nhập)
        IF v_new_stock <= 0 THEN
            v_new_avg_cost := v_cost;
        ELSE
            v_new_avg_cost := round((GREATEST(0, v_cur_stock) * v_product.avg_cost + v_qty * v_cost) / v_new_stock)::integer;
        END IF;

        -- Cập nhật sản phẩm: tồn kho, last_cost, avg_cost, expiry_date (nếu có mới)
        UPDATE products
        SET stock = v_new_stock,
            last_cost = v_cost,
            avg_cost = v_new_avg_cost,
            expiry_date = COALESCE(v_exp_date, expiry_date),
            updated_at = now()
        WHERE id = v_product.id;

        -- Lưu chi tiết nhập hàng
        INSERT INTO purchase_items (
            purchase_id, product_id, product_name, unit,
            quantity, cost_price, subtotal, expiry_date
        ) VALUES (
            v_purchase_id, v_product.id, v_product.name, v_product.unit,
            v_qty, v_cost, v_subtotal, v_exp_date
        );

        -- Ghi biến động kho
        INSERT INTO stock_movements (
            product_id, type, quantity, balance_before, balance_after,
            ref_type, ref_id, note
        ) VALUES (
            v_product.id, 'purchase', v_qty, v_cur_stock, v_new_stock,
            'purchase', v_purchase_id, 'Nhập hàng phiếu ' || v_code
        );

        -- Nếu hàng ở chế độ 'auto' và giá nhập thay đổi so với last_cost trước đó
        IF v_product.price_mode = 'auto' AND v_cost != v_product.last_cost THEN
            -- Tính giá đề xuất từ mốc: base_price + (new_cost - base_cost)
            v_suggested_price := v_product.base_price + (v_cost - v_product.base_cost);
            -- Làm tròn lên theo bước
            IF v_rounding_step > 0 AND (v_suggested_price % v_rounding_step) != 0 THEN
                v_suggested_price := v_suggested_price + (v_rounding_step - (v_suggested_price % v_rounding_step));
            END IF;

            v_price_changes := v_price_changes || jsonb_build_object(
                'product_id', v_product.id,
                'product_name', v_product.name,
                'old_cost', v_product.last_cost,
                'new_cost', v_cost,
                'old_price', v_product.sell_price,
                'suggested_price', v_suggested_price,
                'base_cost', v_product.base_cost,
                'base_price', v_product.base_price
            );
        END IF;
    END LOOP;

    -- Ghi nhận công nợ nhà cung cấp nếu có
    IF v_debt_amount > 0 AND p_supplier_id IS NOT NULL THEN
        UPDATE suppliers
        SET debt = debt + v_debt_amount, updated_at = now()
        WHERE id = p_supplier_id;

        INSERT INTO payments (
            target_type, target_id, amount, payment_type, note
        ) VALUES (
            'supplier', p_supplier_id, v_debt_amount, 'add_debt',
            'Nợ phiếu nhập ' || v_code
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'purchase_id', v_purchase_id,
        'code', v_code,
        'total_amount', v_total_amount,
        'debt_amount', v_debt_amount,
        'price_changes', v_price_changes
    );
END;
$$;

-- RPC: confirm_price_change (Xác nhận thay đổi giá sau nhập hàng)
CREATE OR REPLACE FUNCTION confirm_price_change(
    p_product_id uuid,
    p_new_price integer,
    p_new_cost integer,
    p_is_accepted_suggested boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_prod record;
    v_old_price integer;
    v_old_cost integer;
BEGIN
    SELECT * INTO v_prod FROM products WHERE id = p_product_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Không tìm thấy hàng hóa';
    END IF;

    v_old_price := v_prod.sell_price;
    v_old_cost := v_prod.last_cost;

    -- Quy tắc mốc:
    -- Nếu chấp nhận đúng giá đề xuất: giữ nguyên base_cost, base_price cũ
    -- Nếu sửa sang giá khác hoặc giữ giá cũ: đặt mốc mới (base_cost = p_new_cost, base_price = p_new_price)
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

    -- Ghi lịch sử giá
    INSERT INTO price_history (
        product_id, old_cost, new_cost, old_price, new_price
    ) VALUES (
        p_product_id, v_old_cost, p_new_cost, v_old_price, p_new_price
    );

    RETURN jsonb_build_object('success', true);
END;
$$;

-- RPC: adjust_stock (Kiểm kho - điều chỉnh số lượng thực tế)
CREATE OR REPLACE FUNCTION adjust_stock(
    p_product_id uuid,
    p_actual_stock numeric(12,3),
    p_note text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_prod record;
    v_diff numeric(12,3);
BEGIN
    SELECT * INTO v_prod FROM products WHERE id = p_product_id FOR UPDATE;
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
        'adjust', NULL, COALESCE(p_note, 'Kiểm kho điều chỉnh')
    );

    RETURN jsonb_build_object('success', true, 'difference', v_diff);
END;
$$;

-- RPC: record_payment (Thu nợ khách hoặc trả nợ nhà cung cấp)
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
AS $$
DECLARE
    v_cur_debt integer;
    v_new_debt integer;
BEGIN
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Số tiền thanh toán phải lớn hơn 0';
    END IF;

    IF p_target_type = 'customer' THEN
        SELECT debt INTO v_cur_debt FROM customers WHERE id = p_target_id FOR UPDATE;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Không tìm thấy khách hàng';
        END IF;

        IF p_payment_type = 'pay_debt' THEN
            v_new_debt := GREATEST(0, v_cur_debt - p_amount);
        ELSE
            v_new_debt := v_cur_debt + p_amount;
        END IF;

        UPDATE customers SET debt = v_new_debt, updated_at = now() WHERE id = p_target_id;

    ELSIF p_target_type = 'supplier' THEN
        SELECT debt INTO v_cur_debt FROM suppliers WHERE id = p_target_id FOR UPDATE;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Không tìm thấy nhà cung cấp';
        END IF;

        IF p_payment_type = 'pay_debt' THEN
            v_new_debt := GREATEST(0, v_cur_debt - p_amount);
        ELSE
            v_new_debt := v_cur_debt + p_amount;
        END IF;

        UPDATE suppliers SET debt = v_new_debt, updated_at = now() WHERE id = p_target_id;

    ELSE
        RAISE EXCEPTION 'Loại đối tượng không hợp lệ (chỉ customer hoặc supplier)';
    END IF;

    INSERT INTO payments (
        target_type, target_id, amount, payment_type, note
    ) VALUES (
        p_target_type, p_target_id, p_amount, p_payment_type, p_note
    );

    RETURN jsonb_build_object('success', true, 'old_debt', v_cur_debt, 'new_debt', v_new_debt);
END;
$$;
