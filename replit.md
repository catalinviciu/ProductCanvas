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
- **TreeContext** for efficient node lookups and performance optimization
- **Enhanced Node Editing** with side drawer interface and rich text support
- **Markdown Editor** integration for formatted descriptions (@uiw/react-md-editor)

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
- January 03, 2025. Enhanced drag and drop visual feedback with improved styling
- January 03, 2025. Centralized node dimensions and constants to eliminate hardcoded values
- January 03, 2025. Added TreeContext for efficient node lookups and improved onReattach error handling
- January 04, 2025. Consolidated menu system into compact canvas toolbar
- January 04, 2025. Changed default orientation to vertical tree layout
- January 04, 2025. Added space key toggle functionality for pan mode
- January 04, 2025. Improved fit-to-screen centering algorithm
- January 04, 2025. Removed hamburger menu and simplified UI
- January 04, 2025. Enhanced default vertical view initialization to ensure canvas always starts in vertical mode
- January 04, 2025. Added automatic fit-to-screen behavior when switching orientations
- January 04, 2025. Added node-specific placeholder text examples for title inputs to guide users
- January 07, 2025. Implemented Enhanced Node Edit Side Drawer feature replacing modal-based editing
- January 07, 2025. Added rich text editing with markdown support using @uiw/react-md-editor
- January 07, 2025. Implemented node-type-specific fields for contextual information entry
- January 07, 2025. Added auto-save functionality with local storage drafts
- January 07, 2025. Implemented keyboard shortcuts (Ctrl+S save, Esc cancel) for editing workflow
- January 07, 2025. Updated node-specific fields per user request: Outcome (metric, timeline), Opportunity (user segment, impact, confidence), Solution (removed resource requirements), Assumption Test (description as hypothesis)
- January 08, 2025. Completed Node Content Templates implementation with structured forms for Objective, Outcome, and Opportunity nodes
- January 08, 2025. Added tooltip guidance system using HelpCircle icons with detailed explanations for each template field
- January 08, 2025. Implemented realistic example placeholders based on financial planning use cases
- January 08, 2025. Created compact ICE scoring widget for opportunity prioritization with inline rationale fields
- January 08, 2025. Enhanced TemplateField component with integrated tooltip support for user guidance
- January 08, 2025. Converged assumption type definitions to use unified system: Value, Viability, Usability, and Feasibility
- January 08, 2025. Removed redundant test category selector from assumption template, now uses assumption type directly
- January 08, 2025. Redesigned Evidence-Impact priority matrix with modern UI including visual matrix, emoji icons, and better user guidance
- January 08, 2025. Updated Metric node template to add "Current Value" field at beginning and remove "Target Value & Timeframe" field
- January 08, 2025. Changed metric node description from "Key performance indicator" to "Quantifiable measure" across all UI components
- January 08, 2025. Implemented Replit authentication system with database integration and user profile management
- January 08, 2025. Added user profile dropdown menu with avatar, navigation, and sign-out functionality
- January 08, 2025. Created subtle canvas header with minimal navigation back to home page
- January 08, 2025. Implemented activity-based auto-hide navigation with magnetic return functionality
- January 08, 2025. Navigation hides when interacting with canvas elements and returns via top strip hover, ESC key, or double-click
- January 08, 2025. Navigation pushes canvas content down when visible to keep toolbar accessible
- January 08, 2025. Implemented Enhanced Tree Data Persistence feature with AI-optimized storage, user progress tracking, and version history
- January 08, 2025. Added comprehensive user activity logging with session tracking and automatic activity type detection
- January 08, 2025. Created enhanced storage service with hierarchical tree representation and connection graph analysis
- January 08, 2025. Added user progress analytics component with completion tracking, time spent metrics, and trend analysis
- January 08, 2025. Implemented version history system with automatic snapshots for significant tree changes
- January 08, 2025. Enhanced database schema with tree_versions and user_activities tables for comprehensive tracking

## User Preferences

Preferred communication style: Simple, everyday language.
Canvas default view: Vertical tree layout with automatic fit-to-screen when switching orientations.