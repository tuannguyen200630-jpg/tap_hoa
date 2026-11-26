# Quản lý cửa hàng tạp hóa

Phần mềm giúp cửa hàng tạp hóa quản lý việc bán hàng, nhập hàng, hàng hóa, hóa đơn, sổ nợ và báo cáo trên điện thoại hoặc máy tính. Giao diện được thiết kế ưu tiên cho người lớn tuổi: chữ rõ, nút lớn, menu ở cạnh dưới màn hình điện thoại và có cảnh báo khi mất kết nối internet.

## Những lựa chọn đã thống nhất

- Dùng Next.js 16, TypeScript, pnpm và Supabase (cơ sở dữ liệu PostgreSQL và đăng nhập).
- Mã nguồn không lưu mật khẩu hay khóa bí mật. Khóa bí mật chỉ được khai báo riêng trên máy đang chạy và trong phần cài đặt của Vercel.
- Giá tiền lưu bằng số nguyên theo đồng; số lượng hàng có thể là số lẻ, ví dụ 1,250 kg.
- Các thao tác bán hàng, nhập hàng, hủy hóa đơn, thu nợ và kiểm đếm được thực hiện an toàn trong cơ sở dữ liệu. Quyền truy cập dữ liệu được kiểm tra thêm ở cơ sở dữ liệu.
- Máy chủ Vercel đặt ở Singapore, gần cơ sở dữ liệu Supabase ở Singapore.
- Biểu đồ chỉ được tải khi mở trang Báo cáo. Ứng dụng báo mất mạng nhưng không hỗ trợ bán hàng khi đang ngoại tuyến.
- Dữ liệu nhập vào cửa hàng được giữ ở cơ sở dữ liệu; không cần cài phần mềm bán hàng lên điện thoại.

## Dùng nhanh trên điện thoại

### Thêm ứng dụng vào màn hình chính

**iPhone hoặc iPad**

1. Mở đường dẫn cửa hàng bằng trình duyệt Safari.
2. Chạm nút **Chia sẻ** (hình vuông có mũi tên hướng lên).
3. Kéo danh sách lựa chọn lên nếu cần, rồi chạm **Thêm vào MH chính**.
4. Chạm **Thêm**. Từ nay, chạm biểu tượng Tạp hóa trên màn hình chính để mở ứng dụng.

**Điện thoại Android**

1. Mở đường dẫn cửa hàng bằng trình duyệt Chrome.
2. Chạm nút ba chấm ở góc trên.
3. Chọn **Cài đặt ứng dụng** hoặc **Thêm vào màn hình chính**, rồi xác nhận.
4. Chạm biểu tượng Tạp hóa trên màn hình chính để mở ứng dụng.

Tên lựa chọn có thể hơi khác nhau tùy điện thoại. Cần có internet khi cài và khi sử dụng ứng dụng.

### Chỉnh cỡ chữ

1. Mở mục **Thêm** ở thanh menu dưới cùng, rồi chọn **Cài đặt**.
2. Tìm phần **Cỡ chữ giao diện**.
3. Chọn **Vừa**, **Lớn** hoặc **Rất lớn**, rồi chạm **Lưu cài đặt**.

## Cài đặt lần đầu

### 1. Tạo cơ sở dữ liệu Supabase miễn phí

1. Vào [supabase.com](https://supabase.com), tạo tài khoản và chọn tạo dự án mới.
2. Đặt tên dự án, tạo mật khẩu cơ sở dữ liệu mạnh và cất mật khẩu ở nơi an toàn.
3. Ở phần khu vực máy chủ, chọn **Southeast Asia (Singapore)**. Khu vực này cần trùng với nơi đặt máy chủ ứng dụng.
4. Chờ Supabase tạo xong dự án.
5. Mở **SQL Editor**. Chạy lần lượt từng tệp trong thư mục `supabase/migrations`, theo đúng thứ tự tên:
   - `00001_initial_schema.sql`
   - `00002_purchase_price_confirmation.sql`
   - `00003_product_catalog.sql`
   - `00004_sales_features.sql`
   - `00005_debt_management.sql`
   - `00006_reporting_stocktake.sql`
6. Với mỗi tệp, mở tệp trong máy tính, sao chép toàn bộ nội dung vào một truy vấn mới trong **SQL Editor**, rồi bấm **Run**. Chờ chạy thành công rồi mới chuyển sang tệp tiếp theo.
7. Sau khi chạy xong các tệp trên, mở `supabase/seed.sql`, sao chép nội dung và chạy một lần để thêm dữ liệu mẫu. Không chạy lại tệp dữ liệu mẫu trên cửa hàng đang hoạt động.
8. Tắt đăng ký công khai: vào phần cài đặt xác thực, tìm mục đăng ký bằng thư điện tử và tắt **Enable sign ups**. Như vậy người lạ không thể tự tạo tài khoản.
9. Tạo tài khoản cho người dùng trong trang **Authentication → Users → Add user**. Nhập thư điện tử và mật khẩu, sau đó gửi thông tin đăng nhập riêng cho người đó. Không đăng mật khẩu lên mạng hoặc gửi vào nhóm đông người.
10. Mở **Project Settings → API** và chép lại:
    - Địa chỉ dự án (Project URL).
    - Khóa công khai dùng cho ứng dụng (anon hoặc publishable key).
    - Khóa bí mật máy chủ (service role hoặc secret key). Khóa này có toàn quyền; tuyệt đối không gửi cho người dùng và không đặt vào mã chạy trên trình duyệt.

Tên mục cài đặt Supabase có thể thay đổi theo phiên bản trang quản lý. Chỉ tạo một dự án cho một cửa hàng.

### 2. Đưa mã nguồn lên GitHub

1. Tạo tài khoản tại [github.com](https://github.com), nếu chưa có.
2. Chọn **New repository**, đặt tên cho dự án và tạo kho mã riêng tư.
3. Đưa thư mục dự án lên kho GitHub bằng GitHub Desktop (cách dùng cửa sổ, phù hợp nếu chưa quen dòng lệnh) hoặc mở Terminal tại thư mục dự án và chạy:

   ```text
   git init
   git add .
   git commit -m "Tạo ứng dụng quản lý tạp hóa"
   git branch -M main
   git remote add origin https://github.com/TEN_TAI_KHOAN/TEN_KHO.git
   git push -u origin main
   ```

   Thay `TEN_TAI_KHOAN` và `TEN_KHO` bằng thông tin kho vừa tạo. Nếu thư mục đã là một kho Git, không chạy lại `git init`; chỉ kết nối kho GitHub và đẩy nhánh `main`.
4. Không thêm tệp `.env.local`, mật khẩu cơ sở dữ liệu hay khóa bí mật vào GitHub. Tệp `.env.example` chỉ là mẫu tên biến và không chứa khóa thật.

### 3. Đưa ứng dụng lên Vercel

1. Vào [vercel.com](https://vercel.com), đăng nhập bằng GitHub.
2. Chọn **Add New → Project**, tìm kho mã vừa đưa lên và chọn **Import**.
3. Trước khi bấm **Deploy**, mở **Environment Variables** và thêm các biến sau cho môi trường Production:

   | Tên biến | Giá trị lấy ở đâu |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | Địa chỉ dự án Supabase |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Khóa công khai (anon hoặc publishable key) |
   | `SUPABASE_SERVICE_ROLE_KEY` | Khóa bí mật máy chủ ở Supabase; chỉ dùng phía máy chủ |
   | `CRON_SECRET` | Một chuỗi bí mật ngẫu nhiên dài, tự tạo và giữ kín |

   Đặt cùng các biến cho **Preview** nếu muốn bản xem thử hoạt động. Không dùng chung mật khẩu cơ sở dữ liệu làm `CRON_SECRET`. Lưu giá trị `CRON_SECRET` ở nơi an toàn; Vercel dùng nó để xác thực tác vụ kiểm tra kết nối hằng ngày.
4. Chọn **Deploy** và chờ Vercel báo hoàn tất. Mở đường dẫn Vercel, đăng nhập bằng tài khoản đã tạo thủ công ở Supabase.
5. Trong phần cài đặt miền của Vercel, có thể gắn tên miền riêng. Việc cài ứng dụng lên điện thoại yêu cầu trang web chạy bằng HTTPS; đường dẫn Vercel đã có HTTPS.

Mỗi lần đẩy thay đổi lên nhánh `main`, Vercel tự tạo bản cập nhật chính thức. Các nhánh khác và yêu cầu ghép mã có thể tạo bản xem thử riêng.

## Chạy thử trên máy và điện thoại cùng Wi-Fi

1. Cài Node.js 22 trở lên và pnpm. Mở Terminal tại thư mục dự án, chạy `pnpm install` một lần.
2. Sao chép `.env.example` thành `.env.local`, rồi điền địa chỉ và khóa Supabase của dự án. Trên Windows có thể chạy `Copy-Item .env.example .env.local` trong PowerShell. Không gửi tệp `.env.local` cho người khác.
3. Khởi động ứng dụng để điện thoại trong cùng mạng Wi-Fi có thể truy cập:

   ```text
   pnpm dev -H 0.0.0.0
   ```

4. Trên máy tính, chạy `ipconfig` và tìm địa chỉ IPv4 của kết nối Wi-Fi, thường có dạng `192.168.x.x`.
5. Trên điện thoại cùng mạng Wi-Fi, mở `http://ĐỊA_CHỈ_IPv4_CỦA_MÁY_TÍNH:3000`, ví dụ `http://192.168.1.25:3000`.

Nếu không mở được, cho phép Node.js truy cập mạng riêng khi Windows hỏi về tường lửa, và kiểm tra hai thiết bị đang dùng cùng mạng. Đây chỉ là cách thử trong mạng nội bộ; địa chỉ này không có HTTPS nên không dùng để cài PWA trên iPhone. Muốn cài ứng dụng, hãy dùng đường dẫn HTTPS trên Vercel.

## Cập nhật và vận hành

- **Cập nhật ứng dụng:** đưa thay đổi lên nhánh `main` của GitHub. Vercel tự chạy kiểm tra và triển khai bản mới. Mở lại ứng dụng trên điện thoại khi có thông báo bản cập nhật.
- **Tải bản sao lưu nhanh:** đăng nhập, mở **Thêm → Cài đặt → Tải toàn bộ dữ liệu**. Cất tệp CSV ở nơi riêng tư, có mật khẩu bảo vệ; tệp có thông tin cửa hàng và giao dịch.
- **Sao lưu cơ sở dữ liệu:** dùng chức năng sao lưu hoặc khôi phục của Supabase trong trang quản lý dự án, nếu gói đang dùng có hỗ trợ. Kiểm tra thường xuyên ngày của bản sao lưu gần nhất. Với dữ liệu quan trọng, nên lưu thêm một bản ở nơi khác với máy tính đang dùng.
- **Khôi phục:** nếu Supabase có bản sao lưu, vào mục sao lưu của dự án, chọn bản phù hợp và làm theo hướng dẫn khôi phục của Supabase. Khôi phục có thể thay thế dữ liệu hiện tại, nên kiểm tra kỹ dự án và thời điểm trước khi xác nhận. Tệp CSV tải từ ứng dụng là bản lưu để xem và đối chiếu, **không có chức năng tự nhập ngược vào ứng dụng**. Nếu chỉ còn CSV hoặc dùng gói không có bản sao lưu cơ sở dữ liệu, cần nhờ người am hiểu cơ sở dữ liệu trợ giúp; không chạy `seed.sql` để thay thế vì tệp đó chỉ tạo dữ liệu mẫu.
- **Giữ riêng thông tin đăng nhập:** chỉ chủ cửa hàng nên quản lý khóa bí mật, mật khẩu dự án và quyền khôi phục. Không lưu chúng trong GitHub, ảnh chụp màn hình công khai hay tin nhắn nhóm.

## Xử lý sự cố thường gặp

| Hiện tượng | Cách xử lý |
| --- | --- |
| Ứng dụng báo mất mạng | Kiểm tra Wi-Fi hoặc dữ liệu di động, thử mở một trang web khác. Khi có mạng, tải lại ứng dụng. Các thao tác bán hàng cần kết nối internet. |
| Không đăng nhập được hoặc quên mật khẩu | Kiểm tra địa chỉ thư điện tử, chữ hoa và bàn phím. Dùng **Quên mật khẩu** nếu đã cấu hình thư gửi khôi phục; nếu không, nhờ quản trị viên đặt lại mật khẩu trong **Authentication → Users** của Supabase. |
| Tệp CSV mở sai dấu tiếng Việt trong Excel | Trong Excel, chọn **Data → From Text/CSV**, chọn tệp và bảng mã **65001: Unicode (UTF-8)** trước khi tải dữ liệu. |
| Hàng hóa hoặc hóa đơn không hiện | Kiểm tra đã chạy đủ sáu tệp chuyển đổi dữ liệu theo thứ tự và đã đăng nhập đúng dự án Supabase. Không chạy lại tệp dữ liệu mẫu trên cửa hàng thật. |
| Tác vụ kiểm tra kết nối báo lỗi | Trong Vercel, kiểm tra nhật ký tác vụ định kỳ và xác nhận `CRON_SECRET`, địa chỉ Supabase và khóa bí mật máy chủ được đặt đúng. Sau khi sửa biến, triển khai lại ứng dụng. |
| Supabase miễn phí tạm ngừng dự án ít dùng | Một số dự án miễn phí có thể tự tạm ngừng sau thời gian không hoạt động (thường được thông báo là 7 ngày). Tác vụ của Vercel gọi đường dẫn kiểm tra kết nối mỗi ngày để giảm nguy cơ này, nhưng không thay thế sao lưu và không bảo đảm thời gian hoạt động. Nếu dự án đã tạm ngừng, mở Supabase và khởi động lại dự án, rồi thử lại sau khi cơ sở dữ liệu sẵn sàng. |
| Không thấy ứng dụng mới trên điện thoại | Đóng rồi mở lại ứng dụng, hoặc tải lại trang khi có mạng. Nếu vẫn lỗi, nhờ người quản lý kiểm tra lần triển khai gần nhất trên Vercel. |

## Kiểm tra mã nguồn

Chạy các lệnh sau trong thư mục dự án:

```text
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Tất cả lệnh cần hoàn tất thành công trước khi phát hành. Khi cần xem ứng dụng trên máy tính, chạy `pnpm dev` rồi mở `http://localhost:3000`.
