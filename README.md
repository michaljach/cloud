# Turborepo Monorepo

A modern monorepo powered by [Turborepo](https://turbo.build/), featuring Next.js apps, a modular Express API with OAuth2, shared UI components, and unified linting, formatting, and TypeScript configuration.

---

## Project Structure

```
.
├── apps/
│   ├── api/           # Express + TypeScript + OAuth2 REST API
│   ├── web/           # Next.js web app
│   └── docs/          # Next.js documentation app
├── packages/
│   ├── ui/            # Shared React UI components
│   ├── typescript-config/  # Shared tsconfig base
│   ├── eslint-config/      # Shared ESLint config
│   └── prettier-config/    # Shared Prettier config
├── package.json
├── turbo.json
├── README.md
└── ...
```

---

## Features

- Multiple apps and packages managed in a single repo
- Unified linting, formatting, and TypeScript config
- Modular, enterprise-ready Express API with self-hosted OAuth2
- Shared UI library for React apps
- Fast builds and dev with Turborepo

---

## Setup & Commands

### Install dependencies (from root)

```sh
npm install
```

### Build all apps and packages

```sh
npm run build
```

### Develop all apps (concurrently, with hot reload)

```sh
npm run dev
```

### Lint all code

```sh
npm run lint
```

### Format all code

```sh
npm run format
```

### Check types

```sh
npm run check-types
```

---

## App-specific Commands

### API (Express)

```sh
cd apps/api
npm run dev      # Start API in dev mode
npm run build    # Build API
npm run serve    # Start compiled API
```

### Web (Next.js)

```sh
cd apps/web
npm run dev      # Start Next.js app
npm run build    # Build Next.js app
npm run start    # Start compiled app
```

---

## Database & Prisma Setup

This monorepo uses **Prisma** as the ORM for the API service, with a PostgreSQL database. All OAuth2 data (users, clients, tokens) is stored in the database.

### 1. Configure the Database Connection

Create a `.env` file in `apps/api/` with your database URL:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
```

### 2. Run Migrations

From the root or `apps/api` directory, run:

```sh
cd apps/api
npx prisma migrate dev
```

This will apply all migrations and create the necessary tables for `User`, `OAuthClient`, and `OAuthToken`.

### 3. Generate the Prisma Client

After changing the schema or running migrations, always regenerate the client:

```sh
npx prisma generate
```

### 4. (Optional) Seed Initial Data

You can manually insert an OAuth client and user for testing (e.g., via `psql` or a seed script). Example:

```sql
INSERT INTO "User" (username, password) VALUES ('user', 'pass');
INSERT INTO "OAuthClient" (clientId, clientSecret, grants, redirectUris) VALUES ('client1', 'secret', 'password,client_credentials', '');
```

### 5. Prisma Model Summary

- **User**: Stores API users (id, username, password)
- **OAuthClient**: Stores OAuth2 clients (id, clientId, clientSecret, grants, redirectUris)
- **OAuthToken**: Stores issued tokens (accessToken, refreshToken, expiry, scope, clientId, userId)

### 6. Useful Prisma Commands

- Open Prisma Studio (GUI):
  ```sh
  npx prisma studio
  ```
- Create a new migration:
  ```sh
  npx prisma migrate dev --name <migration_name>
  ```
- Apply migrations in production:
  ```sh
  npx prisma migrate deploy
  ```

---

## Adding More Packages/Apps

- Add a new folder in `apps/` or `packages/`
- Register it in the root `package.json` workspaces if needed
- Use shared configs for consistency

---

## License

MIT
