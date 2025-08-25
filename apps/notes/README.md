# Notes App

A modern markdown notes application built with Next.js 15, React 19, and Tailwind CSS 4. Features a rich text editor, file attachments, and seamless organization.

## Features

- **Markdown Editor**: Rich text editor with live preview
- **File Attachments**: Attach files to notes
- **Note Organization**: Create, edit, and organize notes
- **Auto-save**: Automatic saving of note changes
- **Search**: Search through notes by content
- **Responsive Design**: Works on desktop and mobile devices
- **Dark Mode**: Automatic theme detection
- **Workspace Support**: Notes organized by workspace
- **Status Tracking**: Real-time status updates
- **Keyboard Shortcuts**: Quick navigation and editing

## Project Structure

```
apps/notes/
├── src/
│   ├── app/
│   │   ├── (home)/           # Home layout group
│   │   │   ├── layout.tsx    # Home layout
│   │   │   ├── page.tsx      # Home page
│   │   │   ├── note/         # Note routes
│   │   │   │   └── [filename]/ # Dynamic note routing
│   │   │   └── settings/     # Settings page
│   │   ├── layout.tsx        # Root layout
│   │   └── globals.css       # Global styles
│   ├── features/
│   │   ├── notes/            # Notes features
│   │   │   ├── components/   # Note components
│   │   │   │   ├── editor.tsx
│   │   │   │   ├── note-editor-container.tsx
│   │   │   │   └── page-sidebar-header.tsx
│   │   │   ├── dialogs/      # Note operation dialogs
│   │   │   │   └── delete-note-dialog.tsx
│   │   │   └── providers/    # Context providers
│   │   │       ├── notes-provider.tsx
│   │   │       └── status-provider.tsx
│   │   ├── forms/            # Form components
│   │   │   └── file-upload-form.tsx
│   │   └── layout/           # Layout components
│   │       ├── page-header.tsx
│   │       ├── page-header-status.tsx
│   │       └── page-sidebar.tsx
│   ├── utils/
│   │   └── markdown.tsx      # Markdown utilities
│   └── middleware.ts         # Authentication middleware
├── src/__tests__/            # Test files
├── package.json
├── tsconfig.json
└── README.md
```

## Editor Features

### Markdown Support

- **Live Preview**: Real-time markdown rendering
- **Syntax Highlighting**: Code block highlighting
- **Auto-completion**: Smart suggestions
- **Keyboard Shortcuts**: Quick formatting

### File Attachments

- **Upload Files**: Attach files to notes
- **File Preview**: Preview attached files
- **Download**: Download attached files
- **File Management**: Organize attachments

### Auto-save

- **Automatic Saving**: Save changes automatically
- **Status Indicators**: Show save status
- **Conflict Resolution**: Handle concurrent edits
- **Offline Support**: Work offline with sync

## Development

### Prerequisites

- Node.js >= 22
- Access to the API service (port 4000)
- PostgreSQL database (via Docker or local)

### Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run tests
npm test

# Type check
npx tsc --noEmit

# Lint code
npm run lint
```

### Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NODE_ENV=development
```

### Available Scripts

```bash
npm run dev          # Start development server on port 3002
npm run build        # Build for production
npm run start        # Start production server on port 3002
npm run lint         # Run ESLint
npm run test         # Run Jest tests
```

## Testing

The app includes comprehensive tests:

- **Component Tests**: Test individual React components
- **Editor Tests**: Test markdown editor functionality
- **Integration Tests**: Test note operations and API integration
- **Provider Tests**: Test context provider functionality

### Running Tests

```bash
npm test                    # Run all tests
npm test -- --watch        # Run tests in watch mode
npm test -- --coverage     # Run tests with coverage
```

## Styling

Built with Tailwind CSS 4 and custom components:

- **Responsive Design**: Mobile-first approach
- **Dark Mode Support**: Automatic theme detection
- **Custom Components**: Reusable UI components from `@repo/ui`
- **Consistent Design**: Follows design system patterns

## API Integration

The app integrates with the API service for:

- **Note Operations**: CRUD operations on notes
- **Authentication**: OAuth2 token-based auth
- **Workspace Management**: Multi-tenant note organization
- **File Attachments**: File upload and management
- **Status Updates**: Real-time status tracking

## Performance

- **Lazy Loading**: Components load on demand
- **Optimized Rendering**: Efficient markdown rendering
- **Caching**: API response caching
- **Bundle Splitting**: Code splitting for faster loads

## Browser Support

- **Modern Browsers**: Chrome, Firefox, Safari, Edge
- **Mobile**: iOS Safari, Chrome Mobile
- **Progressive Enhancement**: Works without JavaScript for basic operations

## License

MIT
