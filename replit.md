# Overview

BarManager is a multi-tenant SaaS application designed for bar management. The system allows multiple companies to register and manage their bar operations including sales, purchases, inventory, and financial tracking. Built with a React frontend and Node.js/Express backend, it uses PostgreSQL for data persistence with Drizzle ORM for database operations.

## User Preferences

Preferred communication style: Simple, everyday language.
User language: Portuguese (Brazilian)

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Framework**: Shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **Forms**: React Hook Form with Zod validation
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with JWT-based authentication
- **Middleware**: CORS, JSON parsing, authentication middleware
- **Error Handling**: Centralized error handling with status codes
- **Development**: Hot reload with tsx for development server

### Database Layer
- **Database**: PostgreSQL (hosted on Neon)
- **ORM**: Drizzle ORM with connection pooling
- **Migrations**: Drizzle Kit for schema migrations
- **Multi-tenancy**: Row-level security with company_id foreign keys
- **Schema**: Comprehensive schema covering companies, products, sales, purchases, and financial records

### Authentication & Authorization
- **Strategy**: JWT-based authentication with Bearer tokens
- **Password Security**: bcryptjs for password hashing
- **Token Management**: 24-hour token expiration with localStorage persistence
- **Authorization**: Company-based access control ensuring data isolation between tenants

### Key Features
- **Multi-tenant Architecture**: Complete data isolation between companies
- **Inventory Management**: Product catalog with stock tracking and low-stock alerts
- **Sales Processing**: Point-of-sale functionality with automatic stock updates
- **Purchase Management**: Supplier management and purchase order processing
- **Financial Tracking**: Accounts receivable/payable with cash flow monitoring
- **Dashboard Analytics**: Real-time business metrics and reporting

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL connection via Neon cloud database
- **drizzle-orm**: Type-safe ORM for database operations
- **express**: Web application framework for Node.js
- **jsonwebtoken**: JWT token generation and validation
- **bcryptjs**: Password hashing and comparison

### Frontend Dependencies
- **@tanstack/react-query**: Server state management and caching
- **@hookform/resolvers**: Form validation resolver for React Hook Form
- **axios**: HTTP client for API requests
- **wouter**: Lightweight React router
- **zod**: TypeScript-first schema validation

### UI Components
- **@radix-ui/***: Comprehensive set of accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Type-safe CSS class variants
- **clsx**: Conditional CSS class composition

### Development Tools
- **vite**: Fast build tool and development server
- **tsx**: TypeScript execution for Node.js
- **esbuild**: JavaScript bundler for production builds
- **drizzle-kit**: Database migration and schema management tool

### Production Considerations
- **Environment Variables**: DATABASE_URL and JWT_SECRET configuration
- **CORS Configuration**: Proper cross-origin resource sharing setup
- **Build Process**: Separate client and server build outputs
- **Deployment**: Configured for Contabo server deployment with production optimizations