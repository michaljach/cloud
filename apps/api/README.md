# API Service (Express + TypeScript + OAuth2 + Prisma)

A scalable, enterprise-ready RESTful API built with Express, TypeScript, Prisma ORM, and a self-hosted OAuth2 server. Designed for use in a Turborepo monorepo.

---

## Project Structure

```
apps/api/
├── src/
│   ├── controllers/         # Route handler logic (business logic entrypoints)
│   │   ├── auth.controller.ts
│   │   ├── users.controller.ts
│   │   ├── files.controller.ts
│   │   ├── notes.controller.ts
│   │   ├── workspace.controller.ts
│   │   ├── workspaceInvite.controller.ts
│   │   ├── admin.controller.ts
│   │   └── photos.controller.ts
│   ├── middleware/          # Custom Express middleware
│   │   ├── authenticate.ts
│   │   ├── validate.ts
│   │   └── webdav.ts
│   ├── services/            # Business/data logic, OAuth2 model
│   │   ├── oauth.model.ts
│   │   ├── users.service.ts
│   │   ├── files.service.ts
│   │   ├── notes.service.ts
│   │   └── workspace.service.ts
│   ├── decorators/          # Custom decorators
│   │   └── currentUser.ts
│   ├── utils/               # Utility functions
│   │   ├── fileSystemUtils.ts
│   │   ├── handleError.ts
│   │   └── index.ts
│   ├── lib/                 # Library configurations
│   │   └── prisma.ts
│   └── index.ts             # Express app entry point
├── prisma/
│   ├── schema.prisma        # Database schema
│   ├── migrations/          # Database migrations
│   └── seed.ts             # Database seeding
├── uploads/                 # File upload directory
├── package.json
├── tsconfig.json
└── README.md
```

---

## Features

- **RESTful API** with modular structure
- **Self-hosted OAuth2 server** (password grant, client credentials)
- **Prisma ORM** with PostgreSQL database
- **File Management** with upload/download, WebDAV support
- **Notes System** with markdown support
- **Workspace Management** with user collaboration
- **Admin Panel** for user and workspace management
- **WebDAV Protocol** for native iOS integration
- **File System Operations** with quota management
- **User Authentication** with secure password handling
- **Invitation System** for workspace collaboration

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

### Database Operations

```sh
npm run prisma:generate     # Generate Prisma client
npm run prisma:migrate:dev  # Run migrations in development
npm run prisma:migrate      # Run migrations in production
npm run seed               # Seed database with initial data
```

### Testing

```sh
npm run test               # Run all tests
npm run test:webdav       # Test WebDAV functionality
```

### Lint & Format

```sh
npm run lint              # Run ESLint
```

---

## API Endpoints

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/token` - OAuth2 token endpoint

### Users

- `GET /api/users` - Get current user
- `PUT /api/users` - Update user profile
- `DELETE /api/users` - Delete user account

### Files

- `GET /api/files` - List files
- `POST /api/files` - Upload file
- `GET /api/files/:id` - Get file details
- `PUT /api/files/:id` - Update file
- `DELETE /api/files/:id` - Delete file
- `GET /api/files/:id/download` - Download file
- `POST /api/files/search` - Search files

### Notes

- `GET /api/notes` - List notes
- `POST /api/notes` - Create note
- `GET /api/notes/:id` - Get note
- `PUT /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Delete note

### Workspaces

- `GET /api/workspaces` - List workspaces
- `POST /api/workspaces` - Create workspace
- `GET /api/workspaces/:id` - Get workspace
- `PUT /api/workspaces/:id` - Update workspace
- `DELETE /api/workspaces/:id` - Delete workspace
- `POST /api/workspaces/:id/members` - Add member
- `DELETE /api/workspaces/:id/members/:userId` - Remove member

### Admin

- `GET /api/admin/users` - List all users
- `POST /api/admin/users` - Create user
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/workspaces` - List all workspaces

### WebDAV

- `PROPFIND /webdav/*` - WebDAV directory listing
- `GET /webdav/*` - WebDAV file download
- `PUT /webdav/*` - WebDAV file upload
- `DELETE /webdav/*` - WebDAV file deletion
- `MKCOL /webdav/*` - WebDAV directory creation

---

## OAuth2 Demo

### Get an access token (password grant)

```sh
curl -X POST http://localhost:4000/api/token \
  -d "grant_type=password&username=user&password=pass&client_id=client1&client_secret=secret"
```

### Access a protected route

```sh
curl http://localhost:4000/api/users \
  -H "Authorization: Bearer <accessToken>"
```

---

## WebDAV Integration

The API supports WebDAV protocol for native iOS integration:

- **Authentication**: OAuth2 Bearer tokens
- **File Operations**: Upload, download, delete, create directories
- **Workspace Support**: Files are organized by workspace
- **Quota Management**: Storage limits per user/workspace

### Testing WebDAV

```sh
npm run test:webdav
```

---

## Database Schema

The API uses Prisma with PostgreSQL for data persistence:

- **Users**: User accounts and authentication
- **Workspaces**: Collaborative workspaces
- **WorkspaceInvites**: Invitation system
- **Files**: File metadata and storage
- **Notes**: Markdown notes with attachments
- **PlatformSettings**: System configuration

---

## Environment Variables

```env
DATABASE_URL=postgresql://user:password@localhost:5432/cloud
NODE_ENV=development
PORT=4000
OAUTH_CLIENT_ID=your-client-id
OAUTH_CLIENT_SECRET=your-client-secret
```

---

## Adding More Resources

- Add a new controller in `src/controllers/`
- Add a new service in `src/services/`
- Update Prisma schema in `prisma/schema.prisma`
- Run migrations: `npm run prisma:migrate:dev`

---

## License

MIT
