# OET Praxis Frontend

AI-powered speaking practice platform for healthcare professionals preparing for the Occupational English Test (OET).

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **UI Library**: shadcn/ui + Tailwind CSS
- **State Management**: Zustand
- **API Client**: TanStack Query
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod
- **Authentication**: JWT with refresh tokens
- **Real-time**: WebSocket + WebRTC

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Setup environment variables**:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your actual values
   ```

3. **Run development server**:
   ```bash
   npm run dev
   ```

4. **Open [http://localhost:3000](http://localhost:3000)**

## Project Structure

```
src/
├── app/                 # Next.js App Router
├── components/          # React components
├── hooks/              # Custom React hooks
├── lib/                # Utility functions
├── store/              # Zustand stores
├── types/              # TypeScript types
└── styles/             # Additional styles
```

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript checks
- `npm test` - Run tests

## Healthcare Professional Focus

This platform is specifically designed for:
- Doctors
- Nurses  
- Dentists
- Physiotherapists

All content and interactions follow professional healthcare communication standards.