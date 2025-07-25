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
- January 11, 2025. Implemented Tree Node Data Persistence feature with dedicated tree_nodes table for individual node management
- January 11, 2025. Created comprehensive ImpactTreeService with full CRUD operations for trees and nodes
- January 11, 2025. Added API routes for tree and node management with proper authentication and validation
- January 11, 2025. Enhanced database schema with tree_nodes table using adjacency list model for hierarchical data
- January 11, 2025. Implemented Optimistic Updates System with batched persistence and debouncing for improved autolayout performance
- January 11, 2025. Added useOptimisticUpdates hook with 500ms debouncing and batch processing for position updates
- January 11, 2025. Created bulk update API endpoint for efficient database operations during drag and drop
- January 11, 2025. Added OptimisticUpdatesIndicator component to show real-time save status to users
- January 11, 2025. Fixed autolayout and position snapping issues caused by slow individual database calls
- January 11, 2025. Updated documentation framework templates to accurately reflect React + Node.js + PostgreSQL architecture
- January 11, 2025. Aligned all feature, implementation, and issue templates with actual technology stack (Express.js, Drizzle ORM)
- January 11, 2025. Enhanced workflow guide with Node.js-specific patterns and canvas-aware development practices
- January 11, 2025. Updated implementation guidelines to reflect Replit Auth, optimistic updates, and HTML5 canvas architecture
- January 11, 2025. **RESOLVED**: Converted all documentation framework templates from React + Java to React + Node.js + PostgreSQL
- January 11, 2025. Updated implementation guidelines to use Express.js and Drizzle ORM patterns instead of Spring Boot and JPA/Hibernate
- January 11, 2025. Fixed coding standards to reflect actual Node.js/Express technology stack
- January 11, 2025. **RESOLVED**: Fixed bulk node update 404 errors by correcting API endpoint path from `/nodes/bulk` to `/nodes/bulk-update`
- January 11, 2025. **RESOLVED**: Fixed React infinite render loops in dropdown menus by replacing Link component with useLocation hook and useCallback optimization
- January 11, 2025. **PERFORMANCE**: Enhanced canvas performance with viewport culling for large trees (>100 nodes) and optimized visible node calculations
- January 11, 2025. **CRITICAL FIX**: Fixed bulk update endpoint infinite 404 error loop by reordering Express.js routes - specific `/bulk-update` route now comes before generic `/:nodeId` route to prevent route parameter conflicts
- January 11, 2025. **RESOLVED**: Implemented comprehensive canvas error boundaries with CanvasErrorBoundary component for graceful error recovery
- January 11, 2025. **PERFORMANCE**: Enhanced optimistic updates hook with improved error handling and user-friendly toast notifications
- January 11, 2025. **DOCUMENTATION**: Updated documentation framework from Java to Node.js patterns
- January 11, 2025. **DOCUMENTATION**: Created comprehensive canvas performance guidelines for HTML5 canvas optimization
- January 11, 2025. **DOCUMENTATION**: Established API design guidelines for Express.js and Drizzle ORM patterns
- January 11, 2025. **DOCUMENTATION**: Created database design patterns documentation for PostgreSQL with Drizzle ORM
- January 11, 2025. **DOCUMENTATION**: Aligned all development guidelines with React + Node.js architecture instead of Java/Spring Boot
- January 11, 2025. **RESOLVED**: Successfully implemented Tree Management Features with rename and delete functionality
- January 11, 2025. **RESOLVED**: Fixed database transaction issues by removing activity logging from within transactions
- January 11, 2025. **RESOLVED**: Fixed API request function signatures and TanStack Query mutation patterns
- January 11, 2025. **RESOLVED**: Fixed DOM nesting validation warnings in React components using asChild prop
- January 11, 2025. **ENHANCEMENT**: Added comprehensive Quality Prevention Guidelines to documentation framework
- January 11, 2025. **ENHANCEMENT**: Enhanced workflow_guide.md with specific React + Node.js issue prevention patterns
- January 15, 2025. **FEATURE**: Implemented ICE & RICE Score Badge Display feature for visual prioritization
- January 15, 2025. **ENHANCEMENT**: Added ScoreBadge component with color-coded scoring (green/yellow/red) appearing on node bottom-left
- January 15, 2025. **ENHANCEMENT**: Integrated score calculation service with proper ICE and RICE formulas
- January 15, 2025. **ENHANCEMENT**: Added real-time score updates and conditional badge display (only when all required fields complete)
- January 15, 2025. **ENHANCEMENT**: Refined badge design to subtle color-coded borders with backdrop blur effect
- January 15, 2025. **ENHANCEMENT**: Aligned color thresholds with side drawer (ICE: <15 red, <60 yellow, ≥60 green; RICE: <1 red, <5 yellow, ≥5 green)
- January 23, 2025. **ENHANCEMENT**: Enhanced side drawer design with improved typography, visual hierarchy, and accessibility
- January 23, 2025. **ENHANCEMENT**: Added smooth slide animations without gray background flashing using custom CSS styling
- January 23, 2025. **ENHANCEMENT**: Fixed duplicate placeholder text issue by removing redundant display and adding "Example:" prefix
- January 23, 2025. **ENHANCEMENT**: Improved input/textarea styling with better contrast and enhanced interaction states
- January 23, 2025. **ENHANCEMENT**: Fixed button text visibility on hover with proper color contrast for Save, Cancel, and Delete buttons
- January 23, 2025. **ENHANCEMENT**: Implemented auto-resizing text fields that adjust height based on content length automatically
- January 23, 2025. **ENHANCEMENT**: Added AutoResizeTextarea component for responsive text input across all template fields and rationale sections

## User Preferences

Preferred communication style: Simple, everyday language.
Canvas default view: Vertical tree layout with automatic fit-to-screen when switching orientations.