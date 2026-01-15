# Popaty - Property Management System

A fullstack application designed to help DIY landlords and property managers track rental income and property expenses across their portfolio of properties.

## Features

- 🏠 Property & Unit Management
- 👥 Tenant Management
- 💰 Rent Payment Tracking
- 📊 Expense Management
- 🔐 User Access Control
- 🌍 Multi-language Support (i18n)

## Tech Stack

### Backend (API)
- **Framework:** NestJS
- **Database:** PostgreSQL with Drizzle ORM
- **Language:** TypeScript
- **Authentication:** Better Auth

### Frontend (Client)
- **Framework:** SvelteKit
- **Styling:** Tailwind CSS
- **Language:** TypeScript
- **Build Tool:** Vite

## Project Structure

```
popaty/
├── api/          # NestJS backend API
├── client/       # SvelteKit frontend
└── plans/        # Project documentation
```

## Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL
- Docker & Docker Compose (optional)

### Option 1: Local Development (without Docker)

**Backend:**
```bash
cd api
npm install
cp .env.example .env  # Configure your environment variables
npm run start:dev
```

**Frontend:**
```bash
cd client
npm install
npm run dev
```

### Option 2: Docker Development

**Start all services:**
```bash
docker-compose up
```

**Start in background:**
```bash
docker-compose up -d
```

**View logs:**
```bash
docker-compose logs -f
```

**Stop services:**
```bash
docker-compose down
```

**Access containers:**
```bash
# API shell
docker-compose exec api sh

# Client shell
docker-compose exec client sh

# Run migrations
docker-compose exec api npm run migration:run
```

## Deployment

### Client Build Options

The client supports two build modes via the `ADAPTER` environment variable:

| Command | Adapter | Output | Use Case |
|---------|---------|--------|----------|
| `npm run build` | Node | `build/` (server) | Docker self-hosted |
| `npm run build:static` | Static | `build/` (static) | Firebase Hosting |
| `npm run deploy:firebase` | Static | Firebase | Deploy to Firebase |

### Production Deployment with Docker

**Prerequisites:**
- Docker & Docker Compose installed on server
- Traefik reverse proxy configured
- Domain names pointed to server (api.popaty.com, app.popaty.com)

**Deploy:**
```bash
# Build and start production containers
docker-compose -f docker-compose.prod.yml up -d --build

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Check status
docker-compose -f docker-compose.prod.yml ps
```

**Update deployment:**
```bash
# Rebuild and restart
docker-compose -f docker-compose.prod.yml up -d --build

# Or pull latest and restart
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

**Monitoring:**
```bash
# View all logs
docker-compose -f docker-compose.prod.yml logs -f

# View API logs only
docker-compose -f docker-compose.prod.yml logs -f api

# View last 100 lines
docker-compose -f docker-compose.prod.yml logs --tail=100

# Check resource usage
docker stats popaty-api popaty-client
```

**Maintenance:**
```bash
# Run database migrations
docker-compose -f docker-compose.prod.yml exec api npm run migration:run

# Restart services
docker-compose -f docker-compose.prod.yml restart

# Stop and remove containers
docker-compose -f docker-compose.prod.yml down
```

### Firebase Hosting Deployment

**Prerequisites:**
- Firebase CLI installed (`npm install -g firebase-tools`)
- Firebase project created

**Deploy:**
```bash
cd client

# Login to Firebase (first time only)
firebase login

# Build and deploy
npm run deploy:firebase
```

## Environment Variables

Create `.env` file in the root directory:

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/popaty

# Authentication
AUTH_SECRET=your-secret-key

# API URLs
API_URL=http://localhost:3000
CLIENT_URL=http://localhost:5173

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

## License

Private/Proprietary