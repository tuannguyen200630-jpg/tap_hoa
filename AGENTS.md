<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
# BẢN ĐỒ CẤU TRÚC DỰ ÁN `tap_hoa` (Next.js App Router + TypeScript + Tailwind CSS + Supabase)

## Quy tắc đọc & sửa file để tiết kiệm token
- **KHÔNG đọc toàn bộ repo** hay các file khóa/test/migration cũ trừ khi được yêu cầu đích danh.
- **Cảnh báo file dung lượng lớn (tuyệt đối không in lại toàn bộ file khi sửa, chỉ xuất đoạn code thay đổi):**
  - `src/app/(app)/hang-hoa/mobile/product-mobile-view.tsx` (~65 KB)
  - `src/app/(app)/hang-hoa/desktop/product-desktop-view.tsx` (~65 KB)
  - `src/app/(app)/nhap-hang/mobile/purchase-mobile-view.tsx` (~48 KB)
  - `src/app/(app)/nhap-hang/desktop/purchase-desktop-view.tsx` (~48 KB)
  - `src/app/(app)/nhap-hang/lich-su/mobile/purchase-history-mobile-view.tsx` (~14 KB)
  - `src/app/(app)/nhap-hang/lich-su/desktop/purchase-history-desktop-view.tsx` (~14 KB)
  - `src/app/(app)/hoa-don/mobile/invoice-mobile-view.tsx` (~17 KB)
  - `src/app/(app)/hoa-don/desktop/invoice-desktop-view.tsx` (~17 KB)
  - `src/app/(app)/so-no/mobile/debt-mobile-view.tsx` (~22 KB)
  - `src/app/(app)/so-no/desktop/debt-desktop-view.tsx` (~22 KB)
  - `src/app/(app)/bao-cao/mobile/report-mobile-view.tsx` (~11 KB)
  - `src/app/(app)/bao-cao/desktop/report-desktop-view.tsx` (~11 KB)
- **Tối ưu giao diện Mobile-First:** Người dùng chính là người lớn tuổi dùng điện thoại. Mọi chỉnh sửa UI phải ưu tiên màn hình dọc `360px–414px`.

## Quy ước mobile/desktop
- Các màn hình đã tách chọn view theo mốc `1024px`; logic và state nghiệp vụ nằm trong hook `use-*.ts`.
- Sửa giao diện điện thoại chỉ trong `mobile/`, giao diện máy tính chỉ trong `desktop/`.
- Mọi thay đổi cấu trúc file về sau phải cập nhật lại `AGENTS.md`.

---

## Cây thư mục & chức năng chi tiết

tap_hoa/
├── AGENTS.md                        # Guide & project map file for AI Agents
├── README.md                        # Project overview and installation guide
├── package.json                     # List of libraries and run scripts (dev, build, test)
├── next.config.ts                   # Next.js configuration
├── tsconfig.json                    # TypeScript configuration and path alias (@/*)
├── eslint.config.mjs                # ESLint code linting rules
├── vitest.config.mts                # Vitest unit test runner configuration
├── vercel.json                      # Vercel deployment and Cron Job configuration
├── .env.example                     # Environment variables template (NEXT_PUBLIC_SUPABASE_URL, ANON_KEY...)
├── .gitignore                       # List of files/folders ignored on Git commit
├── pnpm-workspace.yaml              # pnpm workspace configuration
├── pnpm-lock.yaml                   # [IGNORE] Library version lockfile (~182 KB)
│
├── .github/
│   └── workflows/
│       └── ci.yml                   # GitHub Actions automatically running lint/test/build on code push
│
├── public/                          # Static assets & PWA home screen installation configuration
│   ├── manifest.json                # PWA manifest (app name, icons, standalone full-screen mode)
│   └── icons/                       # App icon set for iOS/Android (apple-touch-icon, 192, 512)
│
├── src/
│   ├── proxy.ts                     # Middleware/Proxy checking login sessions & protecting routes
│   │
│   ├── app/
│   │   ├── layout.tsx               # Global Root Layout (fonts, metadata, PWA)
│   │   ├── globals.css              # Global CSS & Tailwind CSS configuration
│   │   ├── page.tsx                 # Root page (/), redirects to /ban-hang or /dang-nhap
│   │   ├── not-found.tsx            # Global 404 error page
│   │   │
│   │   ├── (auth)/                  # Authentication route group (hides main navigation menu)
│   │   │   ├── layout.tsx           # Dedicated layout wrapper for login screens
│   │   │   ├── dang-nhap/
│   │   │   │   ├── page.tsx         # Server page passing the initial device type
│   │   │   │   ├── login-form.tsx   # Client container selecting the login view
│   │   │   │   ├── use-login-form.ts # Login state and authentication logic
│   │   │   │   ├── mobile/
│   │   │   │   │   └── login-mobile-view.tsx # Mobile login interface (~6 KB)
│   │   │   │   ├── desktop/
│   │   │   │   │   └── login-desktop-view.tsx # Desktop login interface (~6 KB)
│   │   │   │   └── actions.ts       # Server Action handling Supabase Auth login
│   │   │   └── quen-mat-khau/
│   │   │       ├── page.tsx         # Server page passing the initial device type
│   │   │       ├── forgot-password-form.tsx # Client container selecting the view
│   │   │       ├── use-forgot-password-form.ts # Shared link model
│   │   │       ├── mobile/
│   │   │       │   └── forgot-password-mobile-view.tsx # Mobile help screen (~1.5 KB)
│   │   │       └── desktop/
│   │   │           └── forgot-password-desktop-view.tsx # Desktop help screen (~1.5 KB)
│   │   │
│   │   ├── (app)/                   # Main business screens route group (authenticated)
│   │   │   ├── layout.tsx           # Shared layout wrapper (attaches sidebar, offline-notice, font-size-sync)
│   │   │   ├── loading.tsx          # Shared loading UI during page transitions
│   │   │   ├── error.tsx            # Runtime error boundary UI inside the app
│   │   │   ├── not-found.tsx        # 404 UI inside the app area
│   │   │   │
│   │   │   ├── ban-hang/            # [POS] Sales & quick checkout screen
│   │   │   │   ├── page.tsx         # Fetches products and initial device type
│   │   │   │   ├── sales-terminal.tsx # Client container selecting the active sales view
│   │   │   │   ├── use-sales-terminal.ts # Sales cart, payment state, calculations, and actions
│   │   │   │   ├── mobile/
│   │   │   │   │   └── sales-mobile-view.tsx # Mobile sales interface (~26 KB)
│   │   │   │   ├── desktop/
│   │   │   │   │   └── sales-desktop-view.tsx # Desktop sales interface (~26 KB)
│   │   │   │   ├── shared/
│   │   │   │   │   ├── receipt-print.tsx # Shared printable sales receipt
│   │   │   │   │   └── sales-format.ts # Shared sales display formatting
│   │   │   │   └── actions.ts       # Server Actions creating sales invoices, deducting stock, recording debt
│   │   │   │
│   │   │   ├── hang-hoa/            # Product catalog & retail price management
│   │   │   │   ├── page.tsx         # Fetches products and initial device type
│   │   │   │   ├── product-list.tsx # Client container selecting the product view
│   │   │   │   ├── use-product-list.ts # Product state, filtering, and CRUD logic
│   │   │   │   ├── mobile/
│   │   │   │   │   └── product-mobile-view.tsx # Mobile catalog interface (~65 KB)
│   │   │   │   ├── desktop/
│   │   │   │   │   └── product-desktop-view.tsx # Desktop catalog interface (~65 KB)
│   │   │   │   ├── actions.ts       # Server Actions for product CRUD and retail price updates
│   │   │   │   └── kiem-kho/        # Inventory stocktake & stock reconciliation feature
│   │   │   │       ├── page.tsx     # Fetches list of items needing stocktake
│   │   │   │       ├── loading.tsx  # Stocktake page loading UI
│   │   │   │       ├── stocktake-form.tsx # Client container selecting the stocktake view
│   │   │   │       ├── use-stocktake-form.ts # Search, paging, stock counts, and save logic (~4.6 KB)
│   │   │   │       ├── mobile/
│   │   │   │       │   └── stocktake-mobile-view.tsx # Mobile stocktake interface (~5.8 KB)
│   │   │   │       ├── desktop/
│   │   │   │       │   └── stocktake-desktop-view.tsx # Desktop stocktake interface (~5.8 KB)
│   │   │   │       └── actions.ts   # Server Action saving stocktake results
│   │   │   │
│   │   │   ├── nhap-hang/           # Supplier purchasing & cost price updates
│   │   │   │   ├── page.tsx         # Fetches purchase data and initial device type
│   │   │   │   ├── purchase-form.tsx # Client container selecting the active purchase view
│   │   │   │   ├── use-purchase-form.ts # Purchase cart, pricing, supplier state, and actions
│   │   │   │   ├── mobile/
│   │   │   │   │   └── purchase-mobile-view.tsx # Mobile purchase interface (~48 KB)
│   │   │   │   ├── desktop/
│   │   │   │   │   └── purchase-desktop-view.tsx # Desktop purchase interface (~48 KB)
│   │   │   │   ├── shared/
│   │   │   │   │   └── purchase-modals.tsx # Shared price confirmation and quick-add modals
│   │   │   │   ├── actions.ts       # Server Actions saving purchase receipts, adding stock, confirming new retail prices
│   │   │   │   └── lich-su/         # View past purchase history
│   │   │   │       ├── page.tsx     # Fetches history and initial device type
│   │   │   │       ├── loading.tsx  # Purchase history loading UI
│   │   │   │       ├── purchase-history.tsx # Client container selecting the history view
│   │   │   │       ├── use-purchase-history.ts # Purchase history filters, details, and progressive list
│   │   │   │       ├── mobile/
│   │   │   │       │   └── purchase-history-mobile-view.tsx # Mobile history interface (~14 KB)
│   │   │   │       ├── desktop/
│   │   │   │       │   └── purchase-history-desktop-view.tsx # Desktop history interface (~14 KB)
│   │   │   │       └── actions.ts   # Server Actions querying purchase history
│   │   │   │
│   │   │   ├── hoa-don/             # Issued sales invoice management
│   │   │   │   ├── page.tsx         # Fetches invoices and initial device type
│   │   │   │   ├── invoice-list.tsx # Client container selecting the invoice view
│   │   │   │   ├── use-invoice-list.ts # Invoice filters, details, and cancellation logic
│   │   │   │   ├── mobile/
│   │   │   │   │   └── invoice-mobile-view.tsx # Mobile invoice interface (~17 KB)
│   │   │   │   ├── desktop/
│   │   │   │   │   └── invoice-desktop-view.tsx # Desktop invoice interface (~17 KB)
│   │   │   │   ├── shared/
│   │   │   │   │   └── receipt-print.tsx # Shared printable invoice receipt
│   │   │   │   └── actions.ts       # Server Actions fetching invoices & handling order cancellation/stock restoration
│   │   │   │
│   │   │   ├── so-no/               # Customer debt ledger & debt collection
│   │   │   │   ├── page.tsx         # Fetches debt records and initial device type
│   │   │   │   ├── loading.tsx      # Debt ledger loading UI
│   │   │   │   ├── debt-ledger.tsx  # Client container selecting the debt view
│   │   │   │   ├── use-debt-ledger.ts # Debt contacts, payment, and history logic
│   │   │   │   ├── mobile/
│   │   │   │   │   └── debt-mobile-view.tsx # Mobile debt interface (~22 KB)
│   │   │   │   ├── desktop/
│   │   │   │   │   └── debt-desktop-view.tsx # Desktop debt interface (~22 KB)
│   │   │   │   └── actions.ts       # Server Actions updating debt payments
│   │   │   │
│   │   │   ├── bao-cao/             # Revenue & profit reports
│   │   │   │   ├── page.tsx         # Fetches report data and initial device type
│   │   │   │   ├── loading.tsx      # Report page loading UI
│   │   │   │   ├── report-dashboard.tsx # Client container selecting the report view
│   │   │   │   ├── use-report-dashboard.ts # Report filters, data, and expanded-list state (~2.6 KB)
│   │   │   │   ├── mobile/
│   │   │   │   │   └── report-mobile-view.tsx # Mobile report interface (~11 KB)
│   │   │   │   ├── desktop/
│   │   │   │   │   └── report-desktop-view.tsx # Desktop report interface (~11 KB)
│   │   │   │   └── actions.ts       # Server Actions querying report metrics
│   │   │   │
│   │   │   └── cai-dat/             # Store settings, font size & backup
│   │   │       ├── page.tsx         # Fetches settings and initial device type
│   │   │       ├── loading.tsx      # Settings page loading UI
│   │   │       ├── settings-form.tsx # Client container selecting the settings view
│   │   │       ├── use-settings-form.ts # Settings state, save, and password logic (~2.7 KB)
│   │   │       ├── mobile/
│   │   │       │   └── settings-mobile-view.tsx # Mobile settings interface (~7 KB)
│   │   │       ├── desktop/
│   │   │       │   └── settings-desktop-view.tsx # Desktop settings interface (~7 KB)
│   │   │       └── actions.ts       # Server Actions saving settings
│   │   │
│   │   └── api/                     # API Route Handlers
│   │       ├── bao-cao/csv/route.ts # Exports revenue report CSV file
│   │       ├── cai-dat/sao-luu/route.ts # Exports full store backup data file
│   │       └── cron/keepalive/route.ts  # Periodic ping endpoint to keep Supabase Free tier from pausing
│   │
│   ├── components/                  # App-wide reusable UI components
│   │   ├── nav/
│   │   │   ├── sidebar.tsx          # Client container selecting the navigation view
│   │   │   ├── use-sidebar.ts       # Navigation state, active routes, and logout action
│   │   │   ├── mobile/
│   │   │   │   └── sidebar-mobile-view.tsx # Mobile header, bottom navigation, and menu
│   │   │   └── desktop/
│   │   │       └── sidebar-desktop-view.tsx # Desktop side navigation
│   │   └── ui/
│   │       ├── button.tsx           # Standardized button component
│   │       ├── input.tsx            # Standardized input field component
│   │       ├── badge.tsx            # Status badge component (in stock, low stock, in debt...)
│   │       ├── font-size-sync.tsx   # Syncs app-wide font size based on user settings
│   │       └── offline-notice.tsx   # Warning banner when the phone loses internet connection
│   │
│   └── lib/                         # Core business logic, utilities & Supabase connection
│       ├── device.ts                # Server-side initial desktop detection
│       ├── use-is-desktop.ts        # Client-side 1024px responsive view selection
│       ├── supabase/
│       │   ├── client.ts            # Initializes browser-side Supabase client
│       │   └── server.ts            # Initializes server-side Supabase client (Actions / RSC)
│       ├── types/
│       │   └── database.ts          # TypeScript type definitions for all Supabase tables
│       ├── pricing.ts               # Logic for auto-calculating retail prices based on purchase price fluctuations
│       ├── sales.ts                 # Logic for calculating cart totals, change due, and debt amounts
│       ├── money.ts                 # VND currency formatting & number rounding
│       ├── codes.ts                 # Auto-generates codes (product codes, invoice codes, purchase receipt codes)
│       ├── reporting.ts             # Logic for aggregating revenue and profit metrics
│       ├── csv.ts                   # Utility to convert data arrays to CSV
│       ├── search.ts                # Accent-insensitive Vietnamese search / fast product filtering
│       ├── cache.ts                 # Manages localStorage data caching for fast page loads
│       ├── use-progressive-list.ts  # Hook for progressively loading long lists to prevent lag on mobile phones
│       ├── validation.ts            # Input data validation
│       └── utils.ts                 # Utility function for merging Tailwind classes (cn)
│
├── supabase/                        # PostgreSQL database structure
│   ├── migrations/                  # SQL files creating tables, RLS, and triggers by phase (00001 -> 00006)
│   └── seed.sql                     # Initial seed data
│
└── tests/                           # [IGNORE WHEN EDITING UI] Unit tests run with Vitest (pricing, sales, money, search...)