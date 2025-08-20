# Cloud

### Escape Google Workspace and iCloud. Run your own cloud privately.

---

## File Structure

```
.
├── apps/
│   ├── api/         # Express API (OAuth2, Prisma, Postgres)
│   ├── account/     # Account management app
│   ├── files/       # File management app
│   └── notes/       # Notes app
├── packages/
│   ├── ui/              # Shared React UI components
│   ├── typescript-config/ # Shared TypeScript configs
│   └── eslint-config/     # Shared ESLint configs
├── apps/*/Dockerfile      # Production Dockerfiles for each service
├── package.json           # Root package/workspaces
└── README.md              # This file
```

A modern monorepo with Next.js apps, Express API (OAuth2), and shared Postgres. Powered by Turborepo.

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
3. Run database migrations:
   ```sh
   cd apps/api && npm run prisma:migrate:dev
   ```
4. Generate Prisma client:
   ```sh
   cd apps/api && npm run prisma:generate
   ```
5. Seed the database:
   ```sh
   cd apps/api && npm run seed
   ```
6. Run everything else locally:
   ```sh
   npm run dev
   ```

---

## Production

This project uses standalone Docker containers for production deployment. Each service can be run independently.

### Quick Start

1. Set up environment variables:

   ```sh
   cp env.production.example .env.production
   # Edit .env.production with your values
   ```

2. Build and run all services:
   ```sh
   make build
   DATABASE_URL=your-db-url JWT_SECRET=your-secret make run
   ```

### Individual Services

Build specific services:

```sh
make build-api      # Build API only
make build-account  # Build Account app only
make build-files    # Build Files app only
make build-notes    # Build Notes app only
```

Run specific services:

```sh
make run-api        # Run API only
make run-account    # Run Account app only
make run-files      # Run Files app only
make run-notes      # Run Notes app only
```

### Management Commands

```sh
make status         # Show container status
make logs           # Show all logs
make clean          # Stop and remove all containers
make restart        # Restart all containers
```

For more details, see [README-DOCKER.md](README-DOCKER.md).

---

## CI/CD

This project uses GitHub Actions for continuous integration. The CI pipeline runs on every pull request and when merging to the main branch.

### What the CI does:

- **Tests**: Runs all tests across the monorepo using Turborepo
- **Type Checking**: Validates TypeScript types
- **Linting**: Checks code style and quality
- **Build**: Ensures the project builds successfully
- **Security**: Runs security audits on dependencies
- **Database**: Sets up PostgreSQL for API tests

### Workflow Files:

- `.github/workflows/ci.yml` - Main CI pipeline
- `.github/pull_request_template.md` - PR template

---

## More Info

- API: `apps/api/README.md`
- Dashboard: `apps/dashboard/README.md`
- Prisma/DB: `apps/api/prisma/`

---

## License

MIT
