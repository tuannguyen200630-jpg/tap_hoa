-- Seed Data: supabase/seed.sql
-- Dữ liệu mẫu cho cửa hàng tạp hóa (18 mặt hàng, 5 danh mục, 2 nhà cung cấp, 2 khách hàng)

-- 1. CÀI ĐẶT MẶC ĐỊNH
INSERT INTO settings (id, store_name, store_address, store_phone, rounding_step, font_size, min_stock_threshold, allow_sell_out_of_stock, receipt_footer)
VALUES (
    'default',
    'Tạp Hóa Cô Ba',
    '123 Đường Nguyễn Trãi, Phường 2, Quận 5, TP.HCM',
    '0908 123 456',
    500,
    'medium',
    5,
    true,
    'Cảm ơn quý khách và hẹn gặp lại!'
) ON CONFLICT (id) DO UPDATE SET
    store_name = EXCLUDED.store_name,
    store_address = EXCLUDED.store_address,
    store_phone = EXCLUDED.store_phone;

-- 2. DANH MỤC HÀNG HÓA
INSERT INTO categories (id, code, name, description) VALUES
    ('c1111111-1111-1111-1111-111111111111', 'NGK', 'Nước giải khát', 'Bia, nước ngọt, trà, nước suối, sữa'),
    ('c2222222-2222-2222-2222-222222222222', 'TP', 'Thực phẩm khô & Gia vị', 'Mì gói, dầu ăn, gạo, nước mắm, đường, muối'),
    ('c3333333-3333-3333-3333-333333333333', 'BA', 'Bánh kẹo & Đồ ăn vặt', 'Bánh mì, bánh quy, kẹo, snack'),
    ('c4444444-4444-4444-4444-444444444444', 'CF', 'Cà phê & Trà khô', 'Cà phê hòa tan, trà túi lọc, bột ngũ cốc'),
    ('c5555555-5555-5555-5555-555555555555', 'MP', 'Hóa phẩm & Tiêu dùng', 'Xà phòng, nước rửa chén, khăn giấy, nước giặt')
ON CONFLICT (code) DO NOTHING;

-- 3. NHÀ CUNG CẤP MẪU
INSERT INTO suppliers (id, name, phone, address, note, debt) VALUES
    ('s1111111-1111-1111-1111-111111111111', 'Đại lý Bánh kẹo & Bia nước ngọt Minh Tuấn', '0912 345 678', 'Chợ Lớn, Quận 5', 'Giao hàng sáng thứ 2 và thứ 5', 0),
    ('s2222222-2222-2222-2222-222222222222', 'Công ty TNHH Phân phối Hàng tiêu dùng Miền Nam', '0987 654 321', 'KCN Tân Bình, Tân Phú', 'Thanh toán gối đầu 1 tuần', 1500000)
ON CONFLICT DO NOTHING;

-- 4. KHÁCH HÀNG MẪU
INSERT INTO customers (id, name, phone, address, note, debt) VALUES
    ('u1111111-1111-1111-1111-111111111111', 'Chị Lan (nhà số 12)', '0903 111 222', 'Nhà số 12 cùng hẻm', 'Khách quen, hay mua đồ nấu cơm', 120000),
    ('u2222222-2222-2222-2222-222222222222', 'Chú Bảy xe ôm', '0909 333 444', 'Đầu hẻm 123', 'Hay ghé mua nước ngọt và thuốc lá', 0)
ON CONFLICT DO NOTHING;

-- 5. HÀNG HÓA MẪU (18 MẶT HÀNG)
INSERT INTO products (
    id, code, name, barcode, category_id, unit, price_mode,
    base_cost, base_price, last_cost, sell_price, avg_cost,
    stock, min_stock, expiry_date, is_active
) VALUES
    -- Nhóm Nước giải khát (NGK)
    ('p0000001-0000-0000-0000-000000000001', 'NGK001', 'Nước ngọt Coca Cola lon 330ml', '8935411000011', 'c1111111-1111-1111-1111-111111111111', 'lon', 'auto', 8500, 11000, 8500, 11000, 8500, 48, 12, '2027-10-15', true),
    ('p0000002-0000-0000-0000-000000000002', 'NGK002', 'Bia Sài Gòn Special lon 330ml', '8935411000022', 'c1111111-1111-1111-1111-111111111111', 'lon', 'auto', 13500, 16000, 13500, 16000, 13500, 72, 24, '2027-08-20', true),
    ('p0000003-0000-0000-0000-000000000003', 'NGK003', 'Sữa tươi tiệt trùng Vinamilk 1L', '8935411000033', 'c1111111-1111-1111-1111-111111111111', 'hộp', 'auto', 31000, 36000, 31000, 36000, 31000, 15, 6, '2027-06-30', true),
    ('p0000004-0000-0000-0000-000000000004', 'NGK004', 'Trà xanh Không Độ chai 455ml', '8935411000044', 'c1111111-1111-1111-1111-111111111111', 'chai', 'auto', 8000, 10000, 8000, 10000, 8000, 30, 10, '2027-12-01', true),

    -- Nhóm Thực phẩm khô & Gia vị (TP)
    ('p0000005-0000-0000-0000-000000000005', 'TP001', 'Mì Hảo Hảo tôm chua cay 75g', '8935411000055', 'c2222222-2222-2222-2222-222222222222', 'gói', 'auto', 3800, 5000, 3800, 5000, 3800, 120, 30, '2027-05-10', true),
    ('p0000006-0000-0000-0000-000000000006', 'TP002', 'Dầu ăn Tường An Cooking Oil 1L', '8935411000066', 'c2222222-2222-2222-2222-222222222222', 'chai', 'auto', 44000, 50000, 44000, 50000, 44000, 20, 5, '2027-11-20', true),
    ('p0000007-0000-0000-0000-000000000007', 'TP003', 'Gạo thơm ST25 Thượng hạng', '8935411000077', 'c2222222-2222-2222-2222-222222222222', 'kg', 'auto', 28000, 34000, 28000, 34000, 28000, 150.5, 20, '2027-09-15', true),
    ('p0000008-0000-0000-0000-000000000008', 'TP004', 'Nước mắm Nam Ngư Đệ Nhị 500ml', '8935411000088', 'c2222222-2222-2222-2222-222222222222', 'chai', 'auto', 21000, 26000, 21000, 26000, 21000, 25, 6, '2028-01-10', true),
    ('p0000009-0000-0000-0000-000000000009', 'TP005', 'Đường cát trắng Biên Hòa 1kg', '8935411000099', 'c2222222-2222-2222-2222-222222222222', 'gói', 'fixed', 24000, 28000, 24000, 28000, 24000, 35, 10, '2028-06-01', true),
    ('p0000010-0000-0000-0000-000000000010', 'TP006', 'Muối tinh I-ốt Bạc Liêu 1kg', '8935411000100', 'c2222222-2222-2222-2222-222222222222', 'gói', 'fixed', 6000, 8000, 6000, 8000, 6000, 40, 10, '2029-01-01', true),
    ('p0000011-0000-0000-0000-000000000011', 'TP007', 'Bột ngọt Ajinomoto 454g', '8935411000111', 'c2222222-2222-2222-2222-222222222222', 'gói', 'auto', 32000, 37000, 32000, 37000, 32000, 18, 5, '2028-03-25', true),
    ('p0000012-0000-0000-0000-000000000012', 'TP008', 'Trứng gà tươi công nghiệp (vỉ 10 quả)', '8935411000122', 'c2222222-2222-2222-2222-222222222222', 'vỉ', 'auto', 27000, 32000, 27000, 32000, 27000, 3, 5, '2026-12-05', true),

    -- Nhóm Bánh kẹo & Đồ ăn vặt (BA)
    ('p0000013-0000-0000-0000-000000000013', 'BA001', 'Bánh Chocopie Orion hộp 12 cái', '8935411000133', 'c3333333-3333-3333-3333-333333333333', 'hộp', 'auto', 51000, 58000, 51000, 58000, 51000, 16, 5, '2027-07-20', true),
    ('p0000014-0000-0000-0000-000000000014', 'BA002', 'Bánh mì tươi Kinh Đô kem socola', '8935411000144', 'c3333333-3333-3333-3333-333333333333', 'cái', 'auto', 9000, 12000, 9000, 12000, 9000, 8, 4, '2026-11-28', true),

    -- Nhóm Cà phê & Trà (CF)
    ('p0000015-0000-0000-0000-000000000015', 'CF001', 'Cà phê G7 3in1 Trung Nguyên hộp 18 gói', '8935411000155', 'c4444444-4444-4444-4444-444444444444', 'hộp', 'auto', 49000, 56000, 49000, 56000, 49000, 22, 6, '2028-02-15', true),

    -- Nhóm Hóa phẩm & Tiêu dùng (MP)
    ('p0000016-0000-0000-0000-000000000016', 'MP001', 'Khăn giấy lụa Pulppy hộp 180 tờ', '8935411000166', 'c5555555-5555-5555-5555-555555555555', 'hộp', 'auto', 23000, 27000, 23000, 27000, 23000, 20, 5, NULL, true),
    ('p0000017-0000-0000-0000-000000000017', 'MP002', 'Nước rửa chén Sunlight Chanh túi 750g', '8935411000177', 'c5555555-5555-5555-5555-555555555555', 'túi', 'auto', 24000, 28000, 24000, 28000, 24000, 14, 5, NULL, true),
    ('p0000018-0000-0000-0000-000000000018', 'MP003', 'Nước giặt OMO Matic Cửa trên túi 2kg', '8935411000188', 'c5555555-5555-5555-5555-555555555555', 'túi', 'auto', 115000, 130000, 115000, 130000, 115000, 9, 3, NULL, true)
ON CONFLICT (code) DO NOTHING;

-- 6. GHI NHẬN BIẾN ĐỘNG KHO BAN ĐẦU
INSERT INTO stock_movements (product_id, type, quantity, balance_before, balance_after, note)
SELECT id, 'adjust', stock, 0, stock, 'Số dư tồn kho khởi tạo ban đầu'
FROM products
WHERE NOT EXISTS (
    SELECT 1 FROM stock_movements WHERE product_id = products.id
);
