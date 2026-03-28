# Petcare

Full-stack pet care platform — Angular + ASP.NET Core Web API + PostgreSQL, deployable via Docker Compose.

---

## Features

### Authentication
- Register & login with JWT (stored in `localStorage`)
- Roles: **Seeker** (pet owner) · **Provider** (pet sitter)
- JWT expiry handled by HTTP interceptor

### Ads
- Public browsable list with **OpenStreetMap + Leaflet** map of Bulgaria
- Map markers for every ad with coordinates
- Filter ads by city (real-time)
- Ad detail page with full description, location map, price, and service type
- **Create Ad** (Seeker only) — pick location by clicking the map or selecting a Bulgarian city via autocomplete (auto-fills lat/lng)
- **Delete Ad** — only the owner of an ad can delete it (checked on both frontend and backend)
- Ownership logic: "Delete" button and actions are restricted to the ad creator

### Messaging (Inbox)
- Every authenticated user has an Inbox
- Send messages to registered users **by email**
- When viewing an ad as a Provider, the "Message owner" button opens the Inbox compose form with the owner's email pre-filled
- Inbox / Sent tabs
- Unread badge on the navbar Inbox link
- Reply to received messages

### Performance
- In-memory HTTP caching (`shareReplay`) for ads list and ad details
- 8-second timeout on all API requests to prevent infinite loading
- `AsNoTracking()` on read-only EF Core queries
- DB connection pooling (`AddDbContextPool`)
- Ads list force-refreshes after creating a new ad

### E2E Tests (Playwright)
- Authentication flows (login, register, logout, guard redirects)
- Ad management (list, view, create, delete with ownership)
- Messaging (compose, send, inbox)
- Direct API contract tests

---

## Tech Stack

| Layer      | Technology |
|------------|------------|
| Frontend   | Angular (standalone components) · RxJS · Bootstrap 5 · Leaflet |
| Backend    | ASP.NET Core Web API (.NET 9) · Entity Framework Core · ASP.NET Identity |
| Database   | PostgreSQL 16 |
| Auth       | JWT Bearer tokens |
| Map        | Leaflet + OpenStreetMap tiles |
| Container  | Docker Compose (frontend · backend · db) |
| Tests      | Playwright (E2E) |

---

## Quick Start — Docker Compose

```bash
git clone <repo-url>
cd Petcare
docker compose up --build
```

Then open **http://localhost:4200**.

Services:
| Service  | Port |
|----------|------|
| Frontend (Nginx + Angular SPA) | `4200` |
| Backend (ASP.NET Core) | `5001` |
| Database (PostgreSQL) | `5432` |

---

## Local Development (without Docker)

### Prerequisites
- Node.js 20+ and npm
- .NET 9 SDK
- PostgreSQL running locally

### Backend
```bash
cd backend
# Update appsettings.json with your local DB connection string
dotnet run --project Petcare/Petcare.csproj --urls "https://localhost:5001"
```

### Frontend
```bash
cd frontend/petcare
npm install
npx ng serve --port 4200
```

Open **http://localhost:4200**.

---

## Demo Account (seeded on first run)

| Field    | Value |
|----------|-------|
| Email    | `seed.user@petcare.local` |
| Password | `Seed1234!` |
| Role     | Seeker |

---

## Project Structure

```
Petcare/
├── backend/
│   ├── Petcare/                  # ASP.NET Core entry point
│   │   └── Controllers/          # AdController, AuthController, MessageController
│   ├── PetCare.Core/
│   │   ├── Models/               # DTOs (Ad, Message, Auth request/response)
│   │   └── Services/             # AdService, MessageService, AuthService
│   ├── PetCare.Infrastructure/
│   │   └── Data/                 # PetcareDbContext, entity models
│   └── Dockerfile
│
├── frontend/petcare/
│   ├── src/app/
│   │   ├── ads/                  # AdsListComponent, AdDetailsComponent, CreateAdComponent
│   │   ├── auth/                 # LoginComponent, RegisterComponent
│   │   ├── inbox/                # InboxComponent (messaging)
│   │   ├── shared/navbar/        # NavbarComponent
│   │   ├── core/
│   │   │   ├── auth/             # AuthService
│   │   │   ├── guards/           # authGuard, seekerGuard
│   │   │   ├── interceptors/     # JwtInterceptor
│   │   │   ├── services/         # AdsService, MessageService
│   │   │   ├── data/             # bg-cities.ts (Bulgarian cities with coordinates)
│   │   │   └── map/              # Leaflet icon fix
│   │   ├── models/               # TypeScript DTOs + app interfaces
│   │   └── environments/         # environment.ts (dev) / environment.production.ts (Docker)
│   ├── e2e/                      # Playwright E2E tests
│   ├── nginx.conf                # Nginx config (serves SPA + proxies /api to backend)
│   └── Dockerfile
│
├── docker-compose.yml
└── README.md
```

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/Auth/register` | — | Register new user |
| POST | `/api/Auth/login` | — | Login, returns JWT |
| POST | `/api/Auth/logout` | ✓ | Logout |
| GET | `/api/Ad/getAll` | — | List all ads |
| GET | `/api/Ad/getById?id=` | — | Get ad by ID |
| POST | `/api/Ad/create` | ✓ Seeker | Create ad |
| POST | `/api/Ad/delete?id=` | ✓ Owner | Delete own ad |
| POST | `/api/Message/send` | ✓ | Send a message |
| GET | `/api/Message/inbox` | ✓ | Get inbox |
| GET | `/api/Message/sent` | ✓ | Get sent messages |
| POST | `/api/Message/read/{id}` | ✓ | Mark message as read |
| GET | `/api/Message/unread-count` | ✓ | Unread message count |

---

## Running E2E Tests

Make sure the Docker Compose stack is running, then:

```bash
cd frontend/petcare
npx playwright test --reporter=list
```
