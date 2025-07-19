# API Service (Express + TypeScript + OAuth2)

A scalable, enterprise-ready RESTful API built with Express, TypeScript, and a self-hosted OAuth2 server. Designed for use in a Turborepo monorepo.

---

## Project Structure

```
apps/api/
├── src/
│   ├── controllers/         # Route handler logic (business logic entrypoints)
│   │   ├── auth.controller.ts
│   │   └── users.controller.ts
│   ├── middleware/          # Custom Express middleware
│   │   └── authenticate.ts
│   ├── routes/              # Route definitions (modular per resource)
│   │   ├── index.ts         # Main API router
│   │   └── users.routes.ts
│   │   └── auth.routes.ts
│   ├── services/            # Business/data logic, OAuth2 model
│   │   ├── oauth.model.ts
│   │   └── users.service.ts
│   └── index.ts             # Express app entry point
├── package.json
├── tsconfig.json
└── README.md
```

---

## Features

- RESTful API with modular structure
- Self-hosted OAuth2 server (password grant, client credentials)
- All `/users` endpoints protected by OAuth2 access tokens
- Ready for extension with more resources and grant types

---

## Setup & Commands

### Install dependencies

```sh
npm install
```

### Development (auto-reload)

```sh
npm run dev
```

### Build TypeScript

```sh
npm run build
```

### Start compiled server

```sh
npm run serve
```

### Lint & Format

```sh
npm run lint      # If you have a linter setup
npm run format    # If you have Prettier setup
```

---

## OAuth2 Demo

### Get an access token (password grant)

```sh
curl -X POST http://localhost:8000/api/token \
  -d "grant_type=password&username=user&password=pass&client_id=client1&client_secret=secret"
```

### Access a protected route

```sh
curl http://localhost:8000/api/users \
  -H "Authorization: Bearer <accessToken>"
```

---

## Adding More Resources

- Add a new controller in `src/controllers/`
- Add a new service in `src/services/`
- Add a new route file in `src/routes/` and mount it in `src/routes/index.ts`

---

## License

MIT
