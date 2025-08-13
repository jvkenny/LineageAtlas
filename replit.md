# Family Atlas - Genealogy and History Mapping Application

## Overview

Family Atlas is a web application that helps users visualize and explore their family history through interactive maps and storytelling. The application allows users to import genealogical data (GEDCOM files), track family member locations over time, and automatically generate historical narratives. It combines genealogy research with geographic visualization to create a comprehensive family history experience.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Components**: Shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and CSS variables
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **Interactive Maps**: Leaflet for map visualization and geographic features

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API endpoints for CRUD operations
- **File Processing**: Multer for handling file uploads (GEDCOM, CSV, GeoPackage files)
- **Development**: Vite middleware integration for development with HMR support

### Database Schema
The application uses PostgreSQL with Drizzle ORM for type-safe database operations:

- **Family Members**: Core genealogical data with birth/death dates and places
- **Locations**: Geographic coordinates with address information and location types
- **Events**: Life events linking family members to locations (births, deaths, migrations)
- **Stories**: AI-generated or user-created narratives connecting family history
- **Geopackage Layers**: Custom geographic data layers for enhanced mapping
- **Atlas Projects**: User projects for organizing family research

### Data Import and Processing
- **GEDCOM Parser**: Custom parser for standard genealogy file format
- **CSV Import**: Structured data import for locations and family data
- **Geocoding Integration**: OpenStreetMap Nominatim API for address-to-coordinate conversion
- **File Storage**: Local file system storage for uploaded documents and images

### Map and Visualization Features
- **Interactive Timeline**: Year-based filtering of locations and events
- **Layer Management**: Toggle visibility of different data layers
- **Story Generation**: Automated narrative creation from family data
- **PDF Export**: Generate printable family atlas documents using jsPDF

## External Dependencies

### Database and Storage
- **PostgreSQL**: Primary database (configured via Drizzle with connection pooling)
- **Neon Database**: Serverless PostgreSQL provider for cloud deployment
- **Local File System**: Upload storage for documents and media files

### Third-Party Services
- **OpenStreetMap Nominatim API**: Free geocoding service for address resolution
- **Leaflet CDN**: Map tiles and marker assets from CDN
- **Google Fonts**: Web fonts (Crimson Text, Inter, DM Sans, Geist Mono, Fira Code)

### Development and Deployment
- **Replit Integration**: Development environment support with cartographer plugin
- **Vite Plugins**: Runtime error overlay and development tooling
- **TypeScript**: Full type safety across frontend and backend
- **ESBuild**: Production bundling for server-side code

### UI and Component Libraries
- **Radix UI**: Accessible component primitives for forms, dialogs, and navigation
- **Tailwind CSS**: Utility-first styling framework
- **Lucide React**: Icon library for consistent iconography
- **React Hook Form**: Form handling with validation via Zod schemas

The architecture supports both development and production environments with separate build processes and optimized asset delivery.