# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Agent App is a full-stack web application built with .NET 10 (Clean Architecture) on the backend and React + TypeScript + Vite on the frontend, deployed to Azure (App Service + Static Web App).

## Workflow

See [AgentWorkflows.md](AgentWorkflows.md) for the shared development workflow. Claude acts as the **System Architect** in this process.

When picking up a new issue: read it fully, comment with questions if anything is unclear, then implement on a feature branch (`feature/<issue-number>-<short-name>`), and open a PR referencing the issue (`Closes #<number>`).

## Common Commands

### Backend (.NET)

```bash
dotnet restore                    # Restore NuGet packages
dotnet build                      # Build all projects
dotnet test                       # Run tests
dotnet run --project src/Api      # Run the API (http://localhost:5001)
dotnet ef migrations add <Name> --project src/Infrastructure --startup-project src/Api
dotnet ef database update --project src/Infrastructure --startup-project src/Api
```

### Frontend (React)

```bash
cd src/web
npm install                       # Install dependencies
npm run dev                       # Start dev server (http://localhost:5173)
npm run build                     # Production build
npm run lint                      # Run ESLint
npx tsc --noEmit                  # Type check
```

### Running Full Stack Locally

1. Start the API: `dotnet run --project src/Api` (runs on http://localhost:5001)
2. Start the frontend: `cd src/web && npm run dev` (runs on http://localhost:5173)
3. The Vite dev server proxies `/api` and `/healthz` requests to the backend automatically.

## Architecture

### Solution Structure

```
AgentApp.slnx
src/
  Core/               Domain layer — entities and interfaces
  Infrastructure/     Data access — EF Core, DbContext, DI registration
  Api/                ASP.NET Core Web API — controllers, middleware, config
  web/                React + TypeScript + Vite frontend
infra/                Azure Bicep templates
.github/workflows/    CI and deployment pipelines
```

### Dependency Direction

```
Api → Infrastructure → Core
Api → Core
```

Core has zero dependencies. Infrastructure depends only on Core. Api depends on both but never bypasses Infrastructure to access data directly.

### Backend Patterns

- **Clean Architecture**: Core (domain), Infrastructure (data access), Api (presentation).
- **EF Core**: SQLite for local development (no connection string needed), SQL Server in production (via `DefaultConnection` connection string).
- **Dependency Injection**: `AddInfrastructure()` extension method in `Infrastructure/DependencyInjection.cs` registers all infrastructure services.
- **Health Check**: GET `/healthz` returns health status.
- **OpenAPI/Swagger**: Available in Development at `/swagger`.

### Authentication

Not yet implemented. JWT secret parameter exists in Bicep for future use.

### Frontend Patterns

- **React Router**: Client-side routing via `react-router` v7.
- **API Service**: `src/services/api.ts` provides a typed fetch wrapper. Uses `VITE_API_URL` env var (empty in dev to use the Vite proxy).
- **Proxy**: Vite dev server proxies `/api` and `/healthz` to `http://localhost:5001`.

### Implemented Pages

- **Home** (`/`): Welcome page.

## Azure Deployment

Infrastructure is defined in `infra/main.bicep`:

- **App Service** (B1 Linux): Hosts the .NET API.
- **Static Web App** (Free tier, West Europe): Hosts the React frontend.
- **SQL Server + Database** (Basic tier, 2 GB): Production database.

Deployment is automated via `.github/workflows/deploy.yml`:

1. Tests run (backend + frontend).
2. API is published and deployed to Azure App Service via OIDC.
3. Frontend is built and deployed to Azure Static Web App.

Required GitHub secrets/variables:
- `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID` (OIDC auth)
- `AZURE_STATIC_WEB_APPS_API_TOKEN` (SWA deployment token)
- `AZURE_APP_SERVICE_NAME` (repository variable)
