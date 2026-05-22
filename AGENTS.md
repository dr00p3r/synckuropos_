# AGENTS.md — Project Context

## What is this project?

Point of Sale (PoS) app built with **Tauri + React + Node.js**.

- **Frontend**: React + SQLite native (tauri-plugin-sql) + Drizzle ORM
- **Backend**: Express + PostgreSQL + Drizzle ORM
- **Sync**: Pull/push manual with timestamps (last-write-wins)

---

## Monorepo Structure

synckuropos_/
├── synckuropos_app/      # Tauri desktop app (React + Vite + SQLite)
├── synckuropos_server/   # Express backend (PostgreSQL)
└── synckuropos_schemas/  # LEGACY/UNUSED — ignore this package

**Package boundaries:**
- synckuropos_app/src/db/schema.ts — SQLite schema (frontend)
- synckuropos_server/db/schema.ts — PostgreSQL schema (backend)
- Both schemas must stay in sync (same tables, same columns)

---

## Tech Stack

### Frontend (synckuropos_app)
- **React 18** with React Router v7
- **Vite** for bundling (NOT CRA)
- **PrimeReact** + PrimeFlex for UI components
- **Recharts** for charts
- **tauri-plugin-sql** for native SQLite (NO WASM, NO IndexedDB)
- **Drizzle ORM** with SQLite adapter
- **bcryptjs** for password hashing

### Backend (synckuropos_server)
- **Express 5** for REST API
- **Drizzle ORM** with PostgreSQL adapter
- **tsx** for development (runs TypeScript directly)
- **dotenv** for environment variables

---

## Developer Commands

### Frontend (synckuropos_app)

npm run dev        # Vite dev server (http://localhost:5173)
npm run build      # tsc -b && vite build
npm run preview    # Vite preview server
npm run test       # Jest with coverage
npm run lint       # ESLint
npm run lint:fix   # ESLint with auto-fix
npm run format     # Prettier
npm run tauri dev  # Tauri desktop dev (requires Rust toolchain)
npm run tauri build # Tauri desktop build

### Backend (synckuropos_server)

npm run dev        # tsx server.ts (hot-reload)
npm run build      # tsc -p tsconfig.build.json
npm run start      # node dist/synckuropos_server/server.js
npm run test       # Jest with coverage
npm run lint       # ESLint
npm run lint:fix   # ESLint with auto-fix
npm run format     # Prettier
npm run clean      # rm -rf dist

---

## Environment Setup

### Prerequisites
- Node.js + npm
- Rust toolchain (for Tauri)
- PostgreSQL (for backend)

### Environment Files

**Frontend (synckuropos_app/.env):**
VITE_SYNC_SERVER_URL=http://localhost:3000
VITE_DB_PASSWORD=dev_password

**Backend (synckuropos_server/.env):**
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/synckuropos
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development

### Database Setup (Backend)
createdb synckuropos  # Create PostgreSQL database

---

## Path Aliases (Frontend)

Vite config defines these aliases in vite.config.ts:

@/          -> src/
@/components -> src/components
@/features  -> src/features
@/hooks     -> src/hooks
@/utils     -> src/utils
@/types     -> src/types
@/styles    -> src/styles
@/db        -> src/db
@/assets    -> src/assets

TypeScript paths in tsconfig.app.json mirror these aliases.

---

## Database Schema

### Pattern for ALL tables

Every table must have these sync columns:

id: text('id').primaryKey(),           // UUID v4 generated on client
updatedAt: integer('updatedAt').notNull(), // Unix timestamp in ms
synced: integer('synced').default(0),  // 0 = pending sync, 1 = synced

### Tables

| Table | Primary Key | Notes |
|---|---|---|
| users | userId | |
| products | productId | **No stock column** |
| customers | customerId | |
| sales | saleId | Has SRIStatus field |
| sale_items | id | Was saleDetails, now has own UUID |
| combo_products | comboProductId | |
| supplyings | supplyingId | Purchase/supplier history |
| stock_movements | id | **Delta-based stock system** |
| debts | debtId | |
| debt_payments | debtPaymentId | |
| tax_rates | id | IVA tax rate history |

### Schema Locations
- Frontend: synckuropos_app/src/db/schema.ts (SQLite)
- Backend: synckuropos_server/db/schema.ts (PostgreSQL)

### Type Differences
- Frontend uses integer for timestamps
- Backend uses bigint for timestamps (mode: 'number')
- Frontend uses integer for booleans (0/1)
- Backend uses boolean for booleans

---

## Stock System (CRITICAL RULE)

**Stock is NEVER written as absolute value. Always recorded as delta (movement).**

NEVER: UPDATE products SET stock = 50
ALWAYS: INSERT INTO stock_movements (productId, delta, reason) VALUES (...)

**Current stock = SUM(delta) FROM stock_movements WHERE productId = ?**

Helper functions in synckuropos_app/src/db/stockHelpers.ts:
- getStockByProduct(db, productId) — single product stock
- getStockForProducts(db, productIds) — batch stock query

### Negative Stock Rule

**Selling into negative stock is ALLOWED and INTENTIONAL.**
- Never block sales when stock < quantity
- Agent can restock after the sale
- This is a business requirement, not a bug

---

## Sync Engine

**Location:** synckuropos_app/src/db/syncEngine.ts

### Configuration
- **Pull on startup**: Immediate pull when app starts
- **Push interval**: 30 seconds if local changes exist (synced = 0)
- **Pull interval**: 3 minutes if no changes
- **Max backoff**: 10 minutes if server unreachable
- **Health check**: Real ping to /health (don't trust navigator.onLine)

### Sync Flow
1. **Pull**: GET /api/sync/pull?since={timestamp}&tables=products,customers,...
2. **Push**: POST /api/sync/push with { products: [...], sales: [...], ... }
3. **Mark synced**: Only after server confirms success

### Conflict Resolution
**Last-write-wins** by updatedAt timestamp.

### Adding Tables to Sync
Edit synckuropos_app/src/db/syncTables.ts — add entry to SYNC_TABLES array.

---

## Testing

### Frontend (synckuropos_app)

**Jest config:** jest.config.cjs
- Environment: jsdom
- Tests only in: src/hooks/__tests__/ and src/hooks/**/*.test.tsx
- Coverage limited to: useAuth, useDatabase, useToast, hooks/index.ts
- Uses babel-jest transform
- Mocks: identity-obj-proxy for CSS, custom mocks for uuid/worker

**Run tests:**
npm run test           # All tests with coverage
npx jest --watch       # Watch mode
npx jest useAuth       # Single test file

### Backend (synckuropos_server)

**Jest config:** jest.config.js
- Environment: node
- Preset: ts-jest
- Tests in: __tests__/ and *.test.ts

---

## CI/CD

### GitHub Actions

**build.yml** — Runs on push to main and PRs:
- SonarQube scan (requires SONAR_TOKEN secret)

**security_scan.yml** — Runs on PRs to testing:
- Only when source branch is dev
- Sends changed files to external analysis API
- Can block PRs with critical vulnerabilities

### SonarQube

Config in sonar-project.properties:
- Coverage report: coverage/lcov.info
- Excludes: features, layouts, components, assets, config, db, pages, services, workers, lib, styles, types, utils

---

## Rules & Constraints

1. **Never use absolute values for stock** — always insert into stock_movements
2. **Never block sales for negative stock** — expected behavior
3. **Always generate IDs on client** — use crypto.randomUUID() before insert
4. **Never trust autoincrement for IDs** — multiple clients generate records offline
5. **updatedAt always on client** — Date.now() at create/edit time
6. **Sync must be idempotent** — running pull+push twice must not cause duplicates

---

## What NOT to Do

- No PowerSync or ElectricSQL
- No WASM SQLite — Tauri has native SQLite
- No IndexedDB — we are in Tauri, not browser
- No CRDTs or complex merge logic
- No images/blobs in SQLite — URLs only
- No autoincrement as PK
- Do not modify synckuropos_schemas/ — it is legacy/unused

---

## Key Files

| File | Purpose |
|---|---|
| synckuropos_app/src/db/schema.ts | SQLite table definitions |
| synckuropos_app/src/db/client.ts | Database initialization + migrations |
| synckuropos_app/src/db/syncEngine.ts | Sync logic |
| synckuropos_app/src/db/syncTables.ts | Tables in sync |
| synckuropos_app/src/db/stockHelpers.ts | Stock calculation helpers |
| synckuropos_app/src/db/seed.ts | Initial data (admin user, Consumidor Final, IVA) |
| synckuropos_server/server.ts | Express server entry |
| synckuropos_server/routes/sync.ts | Sync API endpoints |
| synckuropos_server/db/schema.ts | PostgreSQL table definitions |
