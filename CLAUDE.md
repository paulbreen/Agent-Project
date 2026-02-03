# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**ReadWise** is a "read-it-later" web application. Users save articles from URLs and read them in a clean, distraction-free reader mode. The stack is ASP.NET Core (.NET 10) backend + React (TypeScript, Vite) frontend, targeting Azure for production deployment with GitHub for source control and CI/CD.

## Workflow

This project uses an **AI-driven development workflow**:
- **Gemini** acts as Product Owner and creates feature requests as GitHub issues on `paulbreen/Agent-Project`.
- **Claude** acts as System Architect — analyzes each issue, adds clarification comments if requirements are ambiguous, then implements the feature on a branch, opens a PR, and links it to the issue.
- When picking up a new issue: read it fully, comment with questions if anything is unclear, then implement on a feature branch (`feature/<issue-number>-<short-name>`), and open a PR referencing the issue (`Closes #<number>`).
- All four initial features must be completed before Gemini creates new feature requests.

## Common Commands

### Backend (.NET)

```bash
dotnet build                                          # Build entire solution
dotnet test                                           # Run all tests
dotnet test --filter "FullyQualifiedName~ClassName"   # Run single test class
dotnet test --filter "FullyQualifiedName~ClassName.MethodName"  # Single test
dotnet watch --project src/ReadWise.Api               # Run API with hot reload (https://localhost:7073)
dotnet format                                         # Format code
dotnet ef migrations add Name --project src/ReadWise.Infrastructure --startup-project src/ReadWise.Api
dotnet ef database update --startup-project src/ReadWise.Api
```

### Frontend (React)

```bash
cd src/web
npm install                                 # Install dependencies
npm run dev                                 # Dev server at http://localhost:5173 (proxies /api to backend)
npm run build                               # Production build
npm run lint                                # ESLint
npx tsc --noEmit                            # Type check
```

### Running Full Stack Locally

Run the backend and frontend in separate terminals:
- Terminal 1: `dotnet watch --project src/ReadWise.Api`
- Terminal 2: `cd src/web && npm run dev`

The Vite dev server proxies all `/api` requests to the .NET backend (configured in `vite.config.ts`).

## Architecture

### Solution Structure

```
ReadWise.slnx
├── src/ReadWise.Core/           # Domain entities, interfaces — zero dependencies
├── src/ReadWise.Infrastructure/ # EF Core DbContext, repositories, external services
├── src/ReadWise.Api/            # ASP.NET Core Web API (controllers, DI setup, middleware)
├── src/web/                     # React + TypeScript frontend (Vite)
└── tests/
    ├── ReadWise.Api.Tests/      # Integration tests (uses WebApplicationFactory<Program>)
    └── ReadWise.Core.Tests/     # Unit tests for domain logic
```

### Dependency Direction

`Api → Infrastructure → Core` — Core has no dependencies on other projects. Infrastructure implements interfaces defined in Core. Api references both and wires up DI in `Program.cs`.

### Backend Patterns

- **Controllers** are thin — validate input, call repository/service, return result. Business logic belongs in Core services or domain entities.
- **Repository pattern** via `IArticleRepository` (defined in Core, implemented in Infrastructure).
- **Article parser** via `IArticleParser` (defined in Core, implemented in Infrastructure using SmartReader).
- **Database**: SQLite locally (`readwise.db`, auto-created on startup in dev), Azure SQL in production. Provider is selected in `Program.cs` based on environment.
- **EF Core migrations** live in the Infrastructure project but need `--startup-project src/ReadWise.Api` to run.
- API routes follow `/api/[controller]` convention with RESTful verbs.
- `Program.cs` exposes `public partial class Program` for integration test access via `WebApplicationFactory`.

### Authentication

- **ASP.NET Core Identity** with email/password (8+ chars, no email verification).
- **JWT access tokens** (15 min) + **refresh tokens** (7 days) with rotation.
- Endpoints: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout`.
- JWT secret in `appsettings.json` (dev only) — production uses Azure Key Vault.
- All article endpoints require `[Authorize]`. User ID extracted from JWT `sub` claim.

### Article Saving & Content Extraction

- `POST /api/articles` validates URL (HTTP/HTTPS only), checks for duplicates (returns existing), then fetches and parses.
- **SmartReader** (NuGet) extracts title, author, content HTML, excerpt, lead image, word count.
- If parsing fails, a stub article is saved with `IsContentParsed = false`.
- Estimated reading time calculated at ~200 words/minute.
- HttpClient configured with 30s timeout, 10MB response limit.

### Frontend Patterns

- **Vite** build tool with React 18+ and TypeScript.
- **React Router** for client-side routing. Pages in `src/web/src/pages/`, shared components in `src/web/src/components/`.
- **API client** in `src/web/src/services/api.ts` — centralized fetch wrapper with JWT auth headers and automatic token refresh on 401.
- **AuthProvider** context (`src/web/src/hooks/useAuth.tsx`) manages login state. `ProtectedRoute` component guards authenticated pages.
- **Types** mirror backend DTOs in `src/web/src/types/`.
- **Reader preferences** (font size, theme) persisted in localStorage via `useReaderPreferences` hook.

### Implemented Pages

- `/login` — Login form
- `/register` — Registration form
- `/` — Article list with save form, pagination (20/page), and logout
- `/read/:id` — Reader view with font controls, theme toggle (light/dark/system), and reading progress bar

## Azure Deployment

- **Backend**: Azure App Service
- **Frontend**: Azure Static Web Apps or served from the same App Service
- **Database**: Azure SQL Database
- **Secrets**: Azure Key Vault (referenced via App Service configuration, never committed)
- **CI/CD**: GitHub Actions (`.github/workflows/ci.yml`) — builds and tests on every push/PR to main

## Key Conventions

- New backend endpoints need corresponding integration tests using `WebApplicationFactory<Program>`.
- Frontend components that fetch data should use the centralized API client, not direct `fetch` calls.
- Feature branches follow the pattern: `feature/<issue-number>-<short-description>`.
- PRs reference the GitHub issue with `Closes #<number>` in the description.
- Always verify builds (`dotnet build` + `npx tsc --noEmit`) and tests (`dotnet test`) pass before committing.
