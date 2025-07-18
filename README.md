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

## Adding More Packages/Apps

- Add a new folder in `apps/` or `packages/`
- Register it in the root `package.json` workspaces if needed
- Use shared configs for consistency

---

## License

MIT
