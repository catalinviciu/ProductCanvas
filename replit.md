# Impact Tree Canvas

## Overview

This is a full-stack React application for creating and managing impact trees - visual canvases for product strategy and business planning. The application allows users to create nodes representing outcomes, opportunities, solutions, assumptions, and KPIs, and connect them to visualize relationships and dependencies.

## System Architecture

The application follows a monorepo structure with a clear separation between client and server:

- **Frontend**: React SPA with TypeScript, Vite, and Tailwind CSS
- **Backend**: Express.js REST API with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Development**: Hot module replacement with Vite in development
- **Deployment**: Built for Replit with autoscale deployment

## Key Components

### Frontend Architecture
- **React 18** with TypeScript for type safety
- **Vite** for fast development and optimized builds
- **Tailwind CSS** with custom design system variables
- **shadcn/ui** component library for consistent UI
- **TanStack Query** for server state management
- **Wouter** for lightweight client-side routing
- **Canvas-based** interactive node editor

### Backend Architecture
- **Express.js** REST API server
- **TypeScript** throughout the backend
- **Drizzle ORM** for database operations
- **Zod** for request validation
- **In-memory storage** fallback with interface for easy database swapping

### Database Schema
- **impact_trees** table storing tree metadata and serialized node/connection data
- **JSONB columns** for flexible node and connection storage
- **Timestamps** for created/updated tracking
- **Canvas state** persistence for zoom/pan positions

## Data Flow

1. **Client Interaction**: User interacts with canvas nodes or creates new ones
2. **State Management**: React state updated immediately for responsive UI
3. **API Calls**: Changes persisted to backend via REST API
4. **Database Updates**: Drizzle ORM handles PostgreSQL operations
5. **Cache Invalidation**: TanStack Query refetches data to stay synchronized

Node data flows from the database through the API to React state, then renders on the HTML5 canvas. User interactions trigger state updates that are debounced and sent to the API for persistence.

## External Dependencies

### Frontend Dependencies
- **@radix-ui/react-***: Unstyled, accessible UI primitives
- **@tanstack/react-query**: Server state management
- **class-variance-authority**: Type-safe CSS class variants
- **clsx + tailwind-merge**: Conditional CSS class utilities
- **wouter**: Lightweight routing

### Backend Dependencies
- **@neondatabase/serverless**: PostgreSQL connection driver
- **drizzle-orm + drizzle-kit**: Type-safe ORM and migrations
- **express**: Web server framework
- **zod**: Runtime type validation

### Development Dependencies
- **vite**: Build tool and dev server
- **typescript**: Type checking
- **tailwindcss**: Utility-first CSS framework
- **esbuild**: Fast bundling for production

## Deployment Strategy

The application is configured for Replit deployment with:

- **Development**: `npm run dev` starts both client and server with HMR
- **Build**: `npm run build` creates optimized production bundles
- **Production**: `npm run start` serves the built application
- **Database**: Drizzle migrations with `npm run db:push`

The `.replit` configuration handles:
- **Autoscale deployment** for production
- **Port 5000** for the development server
- **PostgreSQL module** for database connectivity
- **Node.js 20** runtime environment

Environment variables required:
- `DATABASE_URL`: PostgreSQL connection string
- `NODE_ENV`: development/production mode

## Changelog
- June 27, 2025. Initial setup
- June 27, 2025. Added "Objective" node type as first option in creation menus
- June 27, 2025. Renamed "KPI" to "Metric" throughout application
- June 27, 2025. Added "Research" node type for research and discovery activities

## User Preferences

Preferred communication style: Simple, everyday language.