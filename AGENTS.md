<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
# BẢN ĐỒ CẤU TRÚC DỰ ÁN `tap_hoa` (Next.js App Router + TypeScript + Tailwind CSS + Supabase)

## Quy tắc đọc & sửa file để tiết kiệm token
- **KHÔNG đọc toàn bộ repo** hay các file khóa/test/migration cũ trừ khi được yêu cầu đích danh.
- **Cảnh báo file dung lượng lớn (tuyệt đối không in lại toàn bộ file khi sửa, chỉ xuất đoạn code thay đổi):**
  - `src/app/(app)/hang-hoa/product-list.tsx` (~84 KB)
  - `src/app/(app)/nhap-hang/purchase-form.tsx` (~76 KB)
  - `src/app/(app)/ban-hang/sales-terminal.tsx` (~37 KB)
  - `src/app/(app)/so-no/debt-ledger.tsx` (~29 KB)
  - `src/app/(app)/hoa-don/invoice-list.tsx` (~25 KB)
- **Tối ưu giao diện Mobile-First:** Người dùng chính là người lớn tuổi dùng điện thoại. Mọi chỉnh sửa UI phải ưu tiên màn hình dọc `360px–414px`.

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
│   │   │   │   ├── page.tsx         # Login form UI
│   │   │   │   └── actions.ts       # Server Action handling Supabase Auth login
│   │   │   └── quen-mat-khau/
│   │   │       └── page.tsx         # Password reset UI
│   │   │
│   │   ├── (app)/                   # Main business screens route group (authenticated)
│   │   │   ├── layout.tsx           # Shared layout wrapper (attaches sidebar, offline-notice, font-size-sync)
│   │   │   ├── loading.tsx          # Shared loading UI during page transitions
│   │   │   ├── error.tsx            # Runtime error boundary UI inside the app
│   │   │   ├── not-found.tsx        # 404 UI inside the app area
│   │   │   │
│   │   │   ├── ban-hang/            # [POS] Sales & quick checkout screen
│   │   │   │   ├── page.tsx         # Server Component fetching product list for the sales counter
│   │   │   │   ├── sales-terminal.tsx # [LARGE ~37KB] POS checkout UI, item selection, cart, payment/debt recording
│   │   │   │   └── actions.ts       # Server Actions creating sales invoices, deducting stock, recording debt
│   │   │   │
│   │   │   ├── hang-hoa/            # Product catalog & retail price management
│   │   │   │   ├── page.tsx         # Server Component fetching product data
│   │   │   │   ├── product-list.tsx # [VERY LARGE ~84KB] UI for searching, adding/editing/deleting products & adjusting prices
│   │   │   │   ├── actions.ts       # Server Actions for product CRUD and retail price updates
│   │   │   │   └── kiem-kho/        # Inventory stocktake & stock reconciliation feature
│   │   │   │       ├── page.tsx     # Fetches list of items needing stocktake
│   │   │   │       ├── loading.tsx  # Stocktake page loading UI
│   │   │   │       ├── stocktake-form.tsx # UI for entering actual stock counts & calculating discrepancies
│   │   │   │       └── actions.ts   # Server Action saving stocktake results
│   │   │   │
│   │   │   ├── nhap-hang/           # Supplier purchasing & cost price updates
│   │   │   │   ├── page.tsx         # Fetches data for the purchasing screen
│   │   │   │   ├── purchase-form.tsx # [VERY LARGE ~76KB] UI for creating purchase receipts, purchase price increase/decrease alerts
│   │   │   │   ├── actions.ts       # Server Actions saving purchase receipts, adding stock, confirming new retail prices
│   │   │   │   └── lich-su/         # View past purchase history
│   │   │   │       ├── page.tsx     # Fetches list of past purchase receipts
│   │   │   │       ├── loading.tsx  # Purchase history loading UI
│   │   │   │       ├── purchase-history.tsx # UI for purchase receipt list & details
│   │   │   │       └── actions.ts   # Server Actions querying purchase history
│   │   │   │
│   │   │   ├── hoa-don/             # Issued sales invoice management
│   │   │   │   ├── page.tsx         # Fetches list of invoices
│   │   │   │   ├── invoice-list.tsx # [LARGE ~25KB] UI for looking up invoices, viewing details, canceling/refunding orders
│   │   │   │   └── actions.ts       # Server Actions fetching invoices & handling order cancellation/stock restoration
│   │   │   │
│   │   │   ├── so-no/               # Customer debt ledger & debt collection
│   │   │   │   ├── page.tsx         # Fetches debt records
│   │   │   │   ├── loading.tsx      # Debt ledger loading UI
│   │   │   │   ├── debt-ledger.tsx  # [LARGE ~29KB] UI for debtor list, debt history & recording debt repayments
│   │   │   │   └── actions.ts       # Server Actions updating debt payments
│   │   │   │
│   │   │   ├── bao-cao/             # Revenue & profit reports
│   │   │   │   ├── page.tsx         # Fetches statistical data
│   │   │   │   ├── loading.tsx      # Report page loading UI
│   │   │   │   ├── report-dashboard.tsx # UI for charts/stat cards of revenue and gross profit
│   │   │   │   └── actions.ts       # Server Actions querying report metrics
│   │   │   │
│   │   │   └── cai-dat/             # Store settings, font size & backup
│   │   │       ├── page.tsx         # Fetches configuration info
│   │   │       ├── loading.tsx      # Settings page loading UI
│   │   │       ├── settings-form.tsx # UI for editing store name, display font size, backup export button
│   │   │       └── actions.ts       # Server Actions saving settings
│   │   │
│   │   └── api/                     # API Route Handlers
│   │       ├── bao-cao/csv/route.ts # Exports revenue report CSV file
│   │       ├── cai-dat/sao-luu/route.ts # Exports full store backup data file
│   │       └── cron/keepalive/route.ts  # Periodic ping endpoint to keep Supabase Free tier from pausing
│   │
│   ├── components/                  # App-wide reusable UI components
│   │   ├── nav/
│   │   │   └── sidebar.tsx          # Main navigation bar (Desktop sidebar / Mobile menu)
│   │   └── ui/
│   │       ├── button.tsx           # Standardized button component
│   │       ├── input.tsx            # Standardized input field component
│   │       ├── badge.tsx            # Status badge component (in stock, low stock, in debt...)
│   │       ├── font-size-sync.tsx   # Syncs app-wide font size based on user settings
│   │       └── offline-notice.tsx   # Warning banner when the phone loses internet connection
│   │
│   └── lib/                         # Core business logic, utilities & Supabase connection
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