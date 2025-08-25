# Files App

A modern file management application built with Next.js 15, React 19, and Tailwind CSS 4. Features comprehensive file operations, search capabilities, and WebDAV integration for native iOS support.

## Features

- **File Management**: Upload, download, delete, and organize files
- **Folder Navigation**: Navigate through folders with breadcrumb navigation
- **Advanced Search**: Real-time search across your entire storage with debouncing
- **Workspace Support**: Support for both personal and workspace storage
- **File Preview**: Preview files in a modal dialog
- **Batch Operations**: Select multiple files for download or deletion
- **Drag & Drop**: Upload files by dragging them into the interface
- **WebDAV Setup**: Built-in WebDAV configuration for iOS integration
- **Trash System**: Recover deleted files from trash
- **Storage Quota**: Display current storage usage and limits
- **Responsive Design**: Works on desktop and mobile devices

## Project Structure

```
apps/files/
├── src/
│   ├── app/
│   │   ├── [[...path]]/     # Dynamic file path routing
│   │   ├── trash/           # Trash page
│   │   ├── webdav-setup/    # WebDAV setup instructions
│   │   ├── layout.tsx       # Root layout
│   │   └── globals.css      # Global styles
│   ├── features/
│   │   ├── files/           # File management features
│   │   │   ├── components/  # File-related components
│   │   │   ├── dialogs/     # File operation dialogs
│   │   │   ├── forms/       # File upload forms
│   │   │   ├── providers/   # File context providers
│   │   │   └── tables/      # File data tables
│   │   └── layout/          # Layout components
│   │       ├── page-header.tsx
│   │       ├── page-search.tsx
│   │       └── page-sidebar.tsx
│   ├── utils/
│   │   └── fileTypeDetection.ts
│   └── middleware.ts        # Authentication middleware
├── src/__tests__/           # Test files
├── package.json
├── tsconfig.json
└── README.md
```

## Search Functionality

The search feature allows you to find files and folders by name across your entire storage:

- **Real-time Search**: Search results update as you type (with 300ms debounce)
- **Recursive Search**: Searches through all subdirectories
- **Case-insensitive**: Search is not case-sensitive
- **Path Display**: Search results show the full path to help you locate files
- **Navigation**: Click on search results to navigate to their location
- **Clear Search**: Use the clear button or clear the search input to return to normal view

### How to Use Search

1. Type in the search box in the header
2. Results will appear in the table below
3. Click on a folder result to navigate to that location
4. Click on a file result to preview it
5. Use the "Clear Search" button to return to normal browsing

## WebDAV Integration

The app includes WebDAV setup instructions for native iOS integration:

- **Setup Guide**: Step-by-step instructions for iOS Files app
- **Configuration**: Server URL and authentication details
- **Troubleshooting**: Common issues and solutions

## File Operations

### Upload

- **Drag & Drop**: Drag files directly into the interface
- **Click to Upload**: Use the upload button to select files
- **Progress Tracking**: Real-time upload progress
- **Multiple Files**: Upload multiple files simultaneously

### Download

- **Single File**: Click download button on individual files
- **Batch Download**: Select multiple files and download as ZIP
- **Direct Links**: Direct download links for sharing

### Organization

- **Create Folders**: Create new directories
- **Move Files**: Drag and drop files between folders
- **Rename**: Rename files and folders
- **Delete**: Move files to trash or permanently delete

### Trash Management

- **View Deleted**: Browse files in trash
- **Restore**: Restore files from trash
- **Permanent Delete**: Permanently delete files
- **Empty Trash**: Clear all deleted files

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
npm run dev          # Start development server on port 3001
npm run build        # Build for production
npm run start        # Start production server on port 3001
npm run lint         # Run ESLint
npm run test         # Run Jest tests
```

## Testing

The app includes comprehensive tests:

- **Component Tests**: Test individual React components
- **Integration Tests**: Test file operations and API integration
- **Context Tests**: Test file context provider functionality
- **Form Tests**: Test file upload forms

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

- **File Operations**: CRUD operations on files
- **Authentication**: OAuth2 token-based auth
- **Workspace Management**: Multi-tenant file organization
- **Search**: Server-side file search
- **Storage Quota**: Usage tracking and limits

## Performance

- **Lazy Loading**: Components load on demand
- **Optimized Images**: Next.js image optimization
- **Caching**: API response caching
- **Bundle Splitting**: Code splitting for faster loads

## Browser Support

- **Modern Browsers**: Chrome, Firefox, Safari, Edge
- **Mobile**: iOS Safari, Chrome Mobile
- **Progressive Enhancement**: Works without JavaScript for basic operations

## License

MIT
