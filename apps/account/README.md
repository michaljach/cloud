# Account App

A comprehensive account management application built with Next.js 15, React 19, and Tailwind CSS 4. Features user authentication, workspace management, admin panel, and invitation system.

## Features

- **User Authentication**: Registration, login, and password management
- **Workspace Management**: Create, edit, and manage collaborative workspaces
- **Admin Panel**: User and workspace administration
- **Invitation System**: Invite users to workspaces
- **Profile Management**: Update user profile and settings
- **Password Security**: Secure password change functionality
- **Responsive Design**: Works on desktop and mobile devices
- **Dark Mode**: Automatic theme detection
- **Role-based Access**: Different permissions for users and admins
- **Real-time Updates**: Live updates for workspace changes

## Project Structure

```
apps/account/
├── src/
│   ├── app/
│   │   ├── (home)/           # Home layout group
│   │   │   ├── layout.tsx    # Home layout
│   │   │   ├── page.tsx      # Home page
│   │   │   ├── account/      # Account management
│   │   │   │   ├── page.tsx  # Account page
│   │   │   │   └── password/ # Password management
│   │   │   │       └── page.tsx
│   │   │   ├── admin/        # Admin panel
│   │   │   │   ├── page.tsx  # Admin dashboard
│   │   │   │   ├── users/    # User management
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── workspaces/ # Workspace management
│   │   │   │   │   └── page.tsx
│   │   │   │   └── settings/ # Admin settings
│   │   │   │       └── page.tsx
│   │   │   ├── invitations/  # Invitation management
│   │   │   │   └── page.tsx
│   │   │   └── workspaces/   # Workspace management
│   │   │       ├── page.tsx  # Workspace list
│   │   │       ├── create/   # Create workspace
│   │   │       │   └── page.tsx
│   │   │       └── [id]/     # Workspace details
│   │   │           └── page.tsx
│   │   ├── auth/             # Authentication
│   │   │   ├── signin/       # Sign in
│   │   │   │   ├── layout.tsx
│   │   │   │   └── page.tsx
│   │   │   └── signup/       # Sign up
│   │   │       ├── layout.tsx
│   │   │       └── page.tsx
│   │   ├── layout.tsx        # Root layout
│   │   └── globals.css       # Global styles
│   ├── features/
│   │   ├── account/          # Account features
│   │   │   ├── components/   # Account components
│   │   │   ├── hooks/        # Account hooks
│   │   │   └── types/        # Account types
│   │   ├── admin/            # Admin features
│   │   │   ├── components/   # Admin components
│   │   │   ├── dialogs/      # Admin dialogs
│   │   │   ├── hooks/        # Admin hooks
│   │   │   ├── providers/    # Admin providers
│   │   │   ├── tables/       # Admin tables
│   │   │   └── types/        # Admin types
│   │   ├── auth/             # Authentication features
│   │   │   ├── components/   # Auth components
│   │   │   ├── hooks/        # Auth hooks
│   │   │   └── types/        # Auth types
│   │   ├── invitations/      # Invitation features
│   │   │   ├── components/   # Invitation components
│   │   │   ├── hooks/        # Invitation hooks
│   │   │   └── types/        # Invitation types
│   │   ├── layout/           # Layout components
│   │   │   ├── page-header.tsx
│   │   │   ├── page-sidebar-invitations.tsx
│   │   │   └── page-sidebar-workspaces.tsx
│   │   └── workspaces/       # Workspace features
│   │       ├── components/   # Workspace components
│   │       ├── dialogs/      # Workspace dialogs
│   │       ├── hooks/        # Workspace hooks
│   │       └── types/        # Workspace types
│   └── middleware.ts         # Authentication middleware
├── src/__tests__/            # Test files
├── package.json
├── tsconfig.json
└── README.md
```

## Authentication Features

### User Registration

- **Form Validation**: Client-side and server-side validation
- **Password Requirements**: Secure password policies
- **Email Verification**: Email-based account verification
- **Terms Acceptance**: Terms of service agreement

### User Login

- **OAuth2 Integration**: Token-based authentication
- **Remember Me**: Persistent login sessions
- **Password Reset**: Secure password recovery
- **Session Management**: Secure session handling

### Password Management

- **Change Password**: Secure password updates
- **Password Strength**: Real-time password strength indicator
- **Current Password**: Require current password for changes
- **Security Notifications**: Email notifications for changes

## Workspace Management

### Workspace Creation

- **Custom Names**: Choose workspace names
- **Description**: Add workspace descriptions
- **Privacy Settings**: Public or private workspaces
- **Member Limits**: Configurable member limits

### Workspace Administration

- **Member Management**: Add and remove members
- **Role Assignment**: Assign member roles
- **Permission Control**: Granular permission system
- **Workspace Settings**: Configure workspace options

### Workspace Collaboration

- **Member Invitations**: Invite users via email
- **Invitation Management**: Track and manage invitations
- **Member Directory**: View all workspace members
- **Activity Tracking**: Monitor workspace activity

## Admin Panel

### User Administration

- **User List**: View all registered users
- **User Details**: Detailed user information
- **User Actions**: Create, edit, and delete users
- **Password Reset**: Admin password reset functionality

### Workspace Administration

- **Workspace List**: View all workspaces
- **Workspace Details**: Detailed workspace information
- **Workspace Actions**: Create, edit, and delete workspaces
- **Member Management**: Manage workspace memberships

### System Settings

- **Platform Configuration**: System-wide settings
- **Feature Toggles**: Enable/disable features
- **Security Settings**: Security configuration
- **Monitoring**: System health and metrics

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

# Run tests with coverage
npm run test:coverage

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
npm run dev                    # Start development server on port 3000
npm run build                  # Build for production
npm run start                  # Start production server on port 3000
npm run lint                   # Run ESLint
npm run test                   # Run Jest tests
npm run test:coverage          # Run tests with coverage
npm run test:coverage:report   # Generate coverage report
```

## Testing

The app includes comprehensive tests:

- **Component Tests**: Test individual React components
- **Page Tests**: Test page components and routing
- **Integration Tests**: Test authentication and API integration
- **Provider Tests**: Test context provider functionality
- **Dialog Tests**: Test modal dialogs and forms

### Running Tests

```bash
npm test                       # Run all tests
npm test -- --watch           # Run tests in watch mode
npm test -- --coverage        # Run tests with coverage
npm run test:coverage:report  # Generate HTML coverage report
```

## Styling

Built with Tailwind CSS 4 and custom components:

- **Responsive Design**: Mobile-first approach
- **Dark Mode Support**: Automatic theme detection
- **Custom Components**: Reusable UI components from `@repo/ui`
- **Consistent Design**: Follows design system patterns
- **Accessibility**: WCAG compliant components

## API Integration

The app integrates with the API service for:

- **Authentication**: OAuth2 token-based auth
- **User Management**: CRUD operations on users
- **Workspace Management**: Workspace operations
- **Invitation System**: Invitation management
- **Admin Operations**: Administrative functions

## Performance

- **Lazy Loading**: Components load on demand
- **Optimized Forms**: Efficient form handling
- **Caching**: API response caching
- **Bundle Splitting**: Code splitting for faster loads
- **Image Optimization**: Next.js image optimization

## Browser Support

- **Modern Browsers**: Chrome, Firefox, Safari, Edge
- **Mobile**: iOS Safari, Chrome Mobile
- **Progressive Enhancement**: Works without JavaScript for basic operations

## Security

- **OAuth2 Authentication**: Secure token-based auth
- **CSRF Protection**: Cross-site request forgery protection
- **Input Validation**: Client and server-side validation
- **Password Security**: Secure password handling
- **Session Management**: Secure session handling

## License

MIT
