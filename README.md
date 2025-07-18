# Cloud

### Escape Google Workspace and iCloud. Run your own cloud privately.

---

## File Structure

```
.
├── apps/
│   ├── api/         # Express API (OAuth2, Prisma, Postgres)
│   └── dashboard/   # Next.js dashboard app
├── packages/
│   ├── ui/              # Shared React UI components
│   ├── typescript-config/ # Shared TypeScript configs
│   └── eslint-config/     # Shared ESLint configs
├── docker-compose.yml         # Local dev Docker Compose
├── docker-compose.prod.yml    # Production Docker Compose
├── package.json               # Root package/workspaces
└── README.md                  # This file
```

A modern monorepo with Next.js (dashboard), Express API (OAuth2), and shared Postgres. Powered by Turborepo.

---

## Local Development (Recommended)

1. Start Postgres in Docker:
   ```sh
   docker-compose up postgres
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Generate Prisma client:
   ```sh
   cd apps/api && npx prisma generate
   ```
4. Seed the database:
   ```sh
   cd apps/api && npm run seed
   ```
5. Run everything else locally:
   ```sh
   npm run dev
   ```

---

## Production

1. Build images:
   ```sh
   docker build -t myapp-api:latest ./apps/api
   docker build -t myapp-dashboard:latest ./apps/dashboard
   ```
2. Start all services:
   ```sh
   docker-compose -f docker-compose.prod.yml up -d
   ```

---

## More Info

- API: `apps/api/README.md`
- Dashboard: `apps/dashboard/README.md`
- Prisma/DB: `apps/api/prisma/`

---

## License

MIT
