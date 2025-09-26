# OET Praxis Frontend Project Structure

```
oet-praxis-frontend/
├── package.json                    # Dependencies and scripts
├── next.config.js                  # Next.js configuration
├── tailwind.config.js              # Tailwind CSS configuration
├── tsconfig.json                   # TypeScript configuration
├── .env.local                      # Environment variables
├── .env.example                    # Environment variables template
├── .gitignore                      # Git ignore rules
├── README.md                       # Project documentation
├── components.json                 # shadcn/ui configuration
│
├── public/                         # Static assets
│   ├── favicon.ico
│   ├── logo.svg
│   ├── logo-dark.svg
│   ├── images/
│   │   ├── avatars/
│   │   │   ├── doctor-avatar.png
│   │   │   ├── nurse-avatar.png
│   │   │   ├── dentist-avatar.png
│   │   │   └── physiotherapist-avatar.png
│   │   ├── illustrations/
│   │   │   ├── hero-illustration.svg
│   │   │   ├── empty-state.svg
│   │   │   └── success-illustration.svg
│   │   └── icons/
│   │       ├── profession-icons/
│   │       └── feature-icons/
│   └── audio/
│       └── notification-sounds/
│
├── src/                           # Source code
│   ├── app/                       # Next.js 14 App Router
│   │   ├── globals.css            # Global styles with Tailwind
│   │   ├── layout.tsx             # Root layout component
│   │   ├── page.tsx               # Landing page
│   │   ├── loading.tsx            # Global loading UI
│   │   ├── error.tsx              # Global error UI
│   │   ├── not-found.tsx          # 404 page
│   │   │
│   │   ├── (auth)/                # Authentication route group
│   │   │   ├── layout.tsx         # Auth layout
│   │   │   ├── login/
│   │   │   │   └── page.tsx       # Login page
│   │   │   ├── register/
│   │   │   │   └── page.tsx       # Registration page
│   │   │   ├── forgot-password/
│   │   │   │   └── page.tsx       # Password reset
│   │   │   └── verify-email/
│   │   │       └── page.tsx       # Email verification
│   │   │
│   │   ├── (dashboard)/           # Protected dashboard routes
│   │   │   ├── layout.tsx         # Dashboard layout with sidebar
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx       # Main dashboard
│   │   │   ├── scenarios/
│   │   │   │   ├── page.tsx       # Scenarios listing
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx   # Individual scenario details
│   │   │   ├── practice/
│   │   │   │   ├── page.tsx       # Practice session setup
│   │   │   │   └── session/
│   │   │   │       └── [id]/
│   │   │   │           └── page.tsx # Active practice session
│   │   │   ├── progress/
│   │   │   │   └── page.tsx       # Progress analytics
│   │   │   ├── feedback/
│   │   │   │   ├── page.tsx       # Feedback history
│   │   │   │   └── [sessionId]/
│   │   │   │       └── page.tsx   # Individual feedback report
│   │   │   └── settings/
│   │   │       ├── page.tsx       # Account settings
│   │   │       ├── profile/
│   │   │       │   └── page.tsx   # Profile management
│   │   │       ├── subscription/
│   │   │       │   └── page.tsx   # Subscription management
│   │   │       ├── notifications/
│   │   │       │   └── page.tsx   # Notification preferences
│   │   │       └── billing/
│   │   │           └── page.tsx   # Billing history
│   │   │
│   │   ├── (admin)/               # Admin route group
│   │   │   ├── layout.tsx         # Admin layout
│   │   │   ├── admin/
│   │   │   │   ├── page.tsx       # Admin dashboard
│   │   │   │   ├── users/
│   │   │   │   │   ├── page.tsx   # User management
│   │   │   │   │   └── [id]/
│   │   │   │   │       └── page.tsx # User details
│   │   │   │   ├── scenarios/
│   │   │   │   │   ├── page.tsx   # Scenario management
│   │   │   │   │   ├── create/
│   │   │   │   │   │   └── page.tsx # Create scenario
│   │   │   │   │   └── [id]/
│   │   │   │   │       ├── page.tsx # Edit scenario
│   │   │   │   │       └── analytics/
│   │   │   │   │           └── page.tsx # Scenario analytics
│   │   │   │   ├── analytics/
│   │   │   │   │   └── page.tsx   # Platform analytics
│   │   │   │   └── content/
│   │   │   │       └── page.tsx   # Content management
│   │   │   └── middleware.ts      # Admin access control
│   │   │
│   │   ├── (marketing)/           # Marketing pages
│   │   │   ├── about/
│   │   │   │   └── page.tsx       # About page
│   │   │   ├── pricing/
│   │   │   │   └── page.tsx       # Pricing page
│   │   │   ├── features/
│   │   │   │   └── page.tsx       # Features overview
│   │   │   ├── help/
│   │   │   │   ├── page.tsx       # Help center
│   │   │   │   └── [slug]/
│   │   │   │       └── page.tsx   # Help articles
│   │   │   ├── privacy/
│   │   │   │   └── page.tsx       # Privacy policy
│   │   │   ├── terms/
│   │   │   │   └── page.tsx       # Terms of service
│   │   │   └── contact/
│   │   │       └── page.tsx       # Contact page
│   │   │
│   │   └── api/                   # API routes
│   │       ├── auth/
│   │       │   ├── login/
│   │       │   │   └── route.ts   # Login endpoint
│   │       │   ├── register/
│   │       │   │   └── route.ts   # Registration endpoint
│   │       │   ├── logout/
│   │       │   │   └── route.ts   # Logout endpoint
│   │       │   └── refresh/
│   │       │       └── route.ts   # Token refresh
│   │       ├── webhooks/
│   │       │   └── stripe/
│   │       │       └── route.ts   # Stripe webhook handler
│   │       └── health/
│   │           └── route.ts       # Health check endpoint
│   │
│   ├── components/                # Reusable UI components
│   │   ├── ui/                    # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── form.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── select.tsx
│   │   │   ├── sheet.tsx
│   │   │   ├── table.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── toast.tsx
│   │   │   ├── toaster.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── progress.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── alert.tsx
│   │   │   ├── accordion.tsx
│   │   │   └── separator.tsx
│   │   │
│   │   ├── layout/                # Layout components
│   │   │   ├── header.tsx         # Site header
│   │   │   ├── footer.tsx         # Site footer
│   │   │   ├── sidebar.tsx        # Dashboard sidebar
│   │   │   ├── navigation.tsx     # Main navigation
│   │   │   └── breadcrumbs.tsx    # Breadcrumb navigation
│   │   │
│   │   ├── auth/                  # Authentication components
│   │   │   ├── login-form.tsx     # Login form
│   │   │   ├── register-form.tsx  # Registration form
│   │   │   ├── forgot-password-form.tsx
│   │   │   ├── protected-route.tsx # Route protection wrapper
│   │   │   └── auth-provider.tsx  # Authentication context
│   │   │
│   │   ├── dashboard/             # Dashboard-specific components
│   │   │   ├── dashboard-overview.tsx  # Overview widgets
│   │   │   ├── quick-stats.tsx    # Quick statistics cards
│   │   │   ├── recent-sessions.tsx # Recent practice sessions
│   │   │   ├── progress-chart.tsx # Progress visualization
│   │   │   ├── skill-radar.tsx    # Skill assessment radar
│   │   │   └── practice-streak.tsx # Practice streak counter
│   │   │
│   │   ├── scenarios/             # Scenario-related components
│   │   │   ├── scenario-card.tsx  # Scenario preview card
│   │   │   ├── scenario-list.tsx  # Scenarios grid/list
│   │   │   ├── scenario-filter.tsx # Filtering controls
│   │   │   ├── difficulty-badge.tsx # Difficulty indicator
│   │   │   └── profession-badge.tsx # Profession indicator
│   │   │
│   │   ├── practice/              # Practice session components
│   │   │   ├── practice-session.tsx    # Main session interface
│   │   │   ├── audio-recorder.tsx      # Audio recording controls
│   │   │   ├── session-timer.tsx       # Session timing display
│   │   │   ├── patient-persona.tsx     # Patient information display
│   │   │   ├── conversation-display.tsx # Real-time conversation
│   │   │   ├── session-controls.tsx    # Play/pause/submit controls
│   │   │   └── session-feedback.tsx    # Live feedback indicators
│   │   │
│   │   ├── feedback/              # Feedback components
│   │   │   ├── feedback-report.tsx     # Detailed feedback display
│   │   │   ├── score-breakdown.tsx     # Score analysis
│   │   │   ├── transcript-view.tsx     # Session transcript
│   │   │   ├── improvement-suggestions.tsx # AI suggestions
│   │   │   └── feedback-export.tsx     # Export functionality
│   │   │
│   │   ├── progress/              # Progress tracking components
│   │   │   ├── progress-overview.tsx   # Overall progress view
│   │   │   ├── score-trend-chart.tsx   # Score trends over time
│   │   │   ├── skill-progress-chart.tsx # Individual skill progress
│   │   │   ├── practice-calendar.tsx   # Practice frequency calendar
│   │   │   └── achievement-badges.tsx  # Achievement display
│   │   │
│   │   ├── subscription/          # Subscription components
│   │   │   ├── pricing-cards.tsx  # Subscription plan cards
│   │   │   ├── payment-form.tsx   # Stripe payment form
│   │   │   ├── billing-history.tsx # Billing history table
│   │   │   ├── usage-meter.tsx    # Free plan usage indicator
│   │   │   └── upgrade-prompt.tsx # Upgrade call-to-action
│   │   │
│   │   ├── admin/                 # Admin components
│   │   │   ├── user-table.tsx     # User management table
│   │   │   ├── scenario-editor.tsx # Scenario creation/editing
│   │   │   ├── analytics-dashboard.tsx # Admin analytics
│   │   │   ├── content-moderator.tsx # Content moderation tools
│   │   │   └── system-status.tsx  # System health monitoring
│   │   │
│   │   ├── common/                # Common utility components
│   │   │   ├── loading-spinner.tsx # Loading indicators
│   │   │   ├── error-boundary.tsx  # Error handling wrapper
│   │   │   ├── empty-state.tsx     # Empty state displays
│   │   │   ├── confirmation-dialog.tsx # Confirmation modals
│   │   │   ├── file-upload.tsx     # File upload component
│   │   │   ├── search-input.tsx    # Search functionality
│   │   │   ├── pagination.tsx      # Pagination controls
│   │   │   └── data-table.tsx      # Reusable data table
│   │   │
│   │   └── charts/                # Chart components
│   │       ├── line-chart.tsx     # Line chart wrapper
│   │       ├── bar-chart.tsx      # Bar chart wrapper
│   │       ├── pie-chart.tsx      # Pie chart wrapper
│   │       ├── radar-chart.tsx    # Radar chart wrapper
│   │       └── area-chart.tsx     # Area chart wrapper
│   │
│   ├── lib/                       # Utility libraries
│   │   ├── auth.ts                # Authentication utilities
│   │   ├── api.ts                 # API client configuration
│   │   ├── constants.ts           # Application constants
│   │   ├── utils.ts               # General utilities
│   │   ├── validations.ts         # Form validation schemas
│   │   ├── websocket.ts           # WebSocket utilities
│   │   ├── audio.ts               # Audio processing utilities
│   │   ├── storage.ts             # Local storage utilities
│   │   ├── date.ts                # Date formatting utilities
│   │   ├── charts.ts              # Chart configuration utilities
│   │   └── format.ts              # Data formatting utilities
│   │
│   ├── hooks/                     # Custom React hooks
│   │   ├── use-auth.ts            # Authentication hook
│   │   ├── use-api.ts             # API data fetching hook
│   │   ├── use-websocket.ts       # WebSocket connection hook
│   │   ├── use-audio-recorder.ts  # Audio recording hook
│   │   ├── use-session-timer.ts   # Session timing hook
│   │   ├── use-local-storage.ts   # Local storage hook
│   │   ├── use-debounce.ts        # Debouncing hook
│   │   ├── use-media-query.ts     # Responsive design hook
│   │   └── use-toast.ts           # Toast notification hook
│   │
│   ├── store/                     # Zustand state management
│   │   ├── auth-store.ts          # Authentication state
│   │   ├── user-store.ts          # User profile state
│   │   ├── session-store.ts       # Practice session state
│   │   ├── scenarios-store.ts     # Scenarios data state
│   │   ├── progress-store.ts      # Progress tracking state
│   │   ├── subscription-store.ts  # Subscription state
│   │   ├── audio-store.ts         # Audio session state
│   │   └── ui-store.ts            # UI state (modals, sidebars)
│   │
│   ├── types/                     # TypeScript type definitions
│   │   ├── auth.ts                # Authentication types
│   │   ├── user.ts                # User-related types
│   │   ├── scenario.ts            # Scenario types
│   │   ├── session.ts             # Practice session types
│   │   ├── feedback.ts            # Feedback types
│   │   ├── progress.ts            # Progress tracking types
│   │   ├── subscription.ts        # Subscription types
│   │   ├── api.ts                 # API response types
│   │   └── common.ts              # Common utility types
│   │
│   ├── styles/                    # Additional stylesheets
│   │   ├── components.css         # Component-specific styles
│   │   ├── animations.css         # Animation definitions
│   │   └── print.css              # Print-specific styles
│   │
│   └── config/                    # Configuration files
│       ├── database.ts            # Database configuration
│       ├── auth.ts                # Auth configuration
│       ├── stripe.ts              # Stripe configuration
│       ├── websocket.ts           # WebSocket configuration
│       └── api-endpoints.ts       # API endpoint definitions
│
├── docs/                          # Documentation
│   ├── DEPLOYMENT.md              # Deployment instructions
│   ├── DEVELOPMENT.md             # Development setup
│   ├── API.md                     # API documentation
│   └── COMPONENTS.md              # Component documentation
│
├── tests/                         # Test files
│   ├── __mocks__/                 # Mock files
│   ├── components/                # Component tests
│   ├── pages/                     # Page tests
│   ├── hooks/                     # Hook tests
│   ├── utils/                     # Utility tests
│   ├── integration/               # Integration tests
│   └── setup.ts                   # Test setup configuration
│
└── .vscode/                       # VS Code configuration
    ├── settings.json              # Workspace settings
    ├── extensions.json            # Recommended extensions
    └── launch.json                # Debug configuration
```

## Key Dependencies (package.json)

```json
{
  "name": "oet-praxis-frontend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "jest",
    "test:watch": "jest --watch",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "@tanstack/react-query": "^5.0.0",
    "zustand": "^4.4.0",
    "@radix-ui/react-avatar": "^1.0.0",
    "@radix-ui/react-dialog": "^1.0.0",
    "@radix-ui/react-dropdown-menu": "^2.0.0",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-tabs": "^1.0.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "lucide-react": "^0.294.0",
    "tailwind-merge": "^2.0.0",
    "tailwindcss": "^3.3.0",
    "recharts": "^2.8.0",
    "date-fns": "^2.30.0",
    "react-hook-form": "^7.47.0",
    "@hookform/resolvers": "^3.3.0",
    "zod": "^3.22.0",
    "stripe": "^14.0.0",
    "@stripe/stripe-js": "^2.1.0",
    "socket.io-client": "^4.7.0",
    "react-hotkeys-hook": "^4.4.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0",
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "eslint": "^8.0.0",
    "eslint-config-next": "^14.0.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "prettier": "^3.0.0",
    "jest": "^29.0.0",
    "@testing-library/react": "^13.0.0",
    "@testing-library/jest-dom": "^6.0.0"
  }
}
```

## Architecture Highlights

### 1. **Next.js 14 App Router**
- File-based routing with route groups
- Server and client components optimization
- Built-in loading and error states

### 2. **shadcn/ui + Tailwind CSS**
- Professional healthcare-appropriate design system
- Fully customizable component library
- Responsive and accessible by default

### 3. **State Management (Zustand)**
- Lightweight, TypeScript-friendly
- Separate stores for different domains
- Easy debugging and testing

### 4. **Real-time Features**
- WebSocket integration for live feedback
- WebRTC for audio streaming
- Real-time progress updates

### 5. **Professional User Experience**
- Healthcare-specific UI components
- Profession-based routing and content
- Comprehensive progress tracking
- Freemium subscription model

This structure supports all 29 pages identified in the specifications while maintaining clean separation of concerns and scalability for a production healthcare application.