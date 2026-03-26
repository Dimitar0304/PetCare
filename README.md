# Petcare (Angular + ASP.NET Core + Leaflet)

Angular (standalone components) frontend for the Petcare platform, connected to an ASP.NET Core Web API backend using JWT authentication.

## Features

- **Auth**: login, register, logout (JWT stored in `localStorage`)
- **Roles**:
  - **Seeker** (pet owner): can create and delete ads
  - **Provider** (pet sitter): can browse ads (apply UI is placeholder)
- **Ads**:
  - Ads list (homepage) with **OpenStreetMap + Leaflet** map of Bulgaria
  - Markers for each ad
  - Click marker/card to view ad details
  - Create ad (Seeker-only) with click-to-select coordinates on the map
- **UX / Performance**:
  - Request timeouts to avoid long “loading” hangs
  - In-memory caching of ads list + ad details

## Tech stack

- Angular (standalone) + RxJS
- Bootstrap 5
- Leaflet + OpenStreetMap
- ASP.NET Core Web API + JWT
- PostgreSQL (Npgsql)

## Local setup

### Prerequisites

- Node.js + npm
- .NET SDK
- PostgreSQL running locally

### Backend

From the repo root:

```bash
cd backend
dotnet run --project Petcare/Petcare.csproj --urls "https://localhost:5001"
```

### Frontend

```bash
cd frontend/petcare
npm install
ng serve --port 4200
```

Open `http://localhost:4200/`.

## Demo account (seeded)

If you started the backend at least once, it seeds demo data:

- **Email**: `seed.user@petcare.local`
- **Password**: `Seed1234!`
- **Role**: `Seeker`

## API base URL

Frontend is configured to call:

- `https://localhost:5001/api`

## Project structure (frontend)

```
src/app/
  ads/                # list/create/details pages
  auth/               # login/register pages
  core/
    auth/             # AuthService (JWT)
    guards/           # authGuard, seekerGuard
    interceptors/     # JWT interceptor
    map/              # Leaflet marker icon fix
    services/         # AdsService
  models/             # DTOs + app models
  shared/             # navbar
```

## Notes

- The map is centered on Bulgaria and uses the standard OSM tile layer.
- Markers use a small icon configuration helper to avoid missing icons in bundlers.
