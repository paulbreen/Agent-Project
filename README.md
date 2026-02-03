# ReadWise

A "read-it-later" web application. Save articles from any URL and read them in a clean, distraction-free reader mode.

## Features

- **Save articles** — Paste any URL and ReadWise extracts the article content, title, author, and lead image using Mozilla's Readability algorithm
- **Article list** — Browse saved articles with title, source domain, estimated reading time, and excerpt. Paginated with 20 articles per page
- **Reader mode** — Distraction-free reading with serif typography, adjustable font size (14–24px), and light/dark/system theme toggle
- **Reading progress** — Progress bar and percentage indicator track your scroll position through each article
- **User accounts** — Email/password registration and login with JWT authentication

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | ASP.NET Core (.NET 10), C# |
| Frontend | React 19, TypeScript, Vite 7 |
| Database | SQLite (local dev), Azure SQL (production) |
| Authentication | ASP.NET Core Identity, JWT Bearer tokens |
| Content Extraction | SmartReader (Mozilla Readability port for .NET) |
| ORM | Entity Framework Core 10 |
| CI/CD | GitHub Actions |
| Hosting | Microsoft Azure (App Service) |

## Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0)
- [Node.js 22+](https://nodejs.org/) and npm
- Git

## Getting Started

### 1. Clone the repository

```bash
git clone git@github.com:paulbreen/Agent-Project.git
cd Agent-Project
```

### 2. Start the backend

```bash
dotnet restore
dotnet build
dotnet run --project src/ReadWise.Api
```

The API starts at **https://localhost:7073** (HTTPS) and **http://localhost:5287** (HTTP).

On first run in development mode, the SQLite database (`readwise.db`) is automatically created in the API project directory.

### 3. Start the frontend

In a second terminal:

```bash
cd src/web
npm install
npm run dev
```

The frontend starts at **http://localhost:5173**. All `/api` requests are automatically proxied to the backend.

### 4. Use the application

1. Open **http://localhost:5173** in your browser
2. Click **Sign up** to create an account (email + password, minimum 8 characters)
3. Paste any article URL into the save form on the home page
4. Click on a saved article to open it in reader mode

## Project Structure

```
ReadWise.slnx
├── src/
│   ├── ReadWise.Api/              # ASP.NET Core Web API
│   │   ├── Controllers/           # REST endpoints (Auth, Articles, Health)
│   │   ├── Models/                # Request/response DTOs
│   │   ├── Services/              # JWT token service
│   │   └── Program.cs             # DI configuration and middleware pipeline
│   ├── ReadWise.Core/             # Domain layer (no external dependencies)
│   │   ├── Entities/              # Article, ApplicationUser, RefreshToken
│   │   └── Interfaces/            # IArticleRepository, IArticleParser
│   ├── ReadWise.Infrastructure/   # Data access and external services
│   │   ├── Data/                  # EF Core DbContext and repository implementations
│   │   └── Services/              # SmartReader article parser
│   └── web/                       # React + TypeScript frontend
│       └── src/
│           ├── components/        # ProtectedRoute
│           ├── hooks/             # useAuth, useReaderPreferences, useReadingProgress
│           ├── pages/             # HomePage, ReaderPage, LoginPage, RegisterPage
│           ├── services/          # Centralized API client with JWT handling
│           └── types/             # TypeScript interfaces matching backend DTOs
├── tests/
│   ├── ReadWise.Api.Tests/        # API integration tests
│   └── ReadWise.Core.Tests/       # Domain unit tests
├── .github/workflows/ci.yml      # GitHub Actions CI pipeline
└── feature-requests/              # Feature specifications from Product Owner
```

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create a new account |
| POST | `/api/auth/login` | Log in, receive JWT + refresh token |
| POST | `/api/auth/refresh` | Exchange refresh token for new JWT |
| POST | `/api/auth/logout` | Revoke refresh token |

### Articles (requires authentication)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/articles?page=1&pageSize=20` | List saved articles (paginated) |
| GET | `/api/articles/{id}` | Get a single article with full content |
| POST | `/api/articles` | Save a new article from URL |
| DELETE | `/api/articles/{id}` | Delete an article |
| PATCH | `/api/articles/{id}/read` | Mark as read |
| PATCH | `/api/articles/{id}/archive` | Archive an article |
| PATCH | `/api/articles/{id}/favorite` | Toggle favorite status |

## Development

### Running tests

```bash
# All backend tests
dotnet test

# Single test class
dotnet test --filter "FullyQualifiedName~ClassName"

# Frontend type check
cd src/web && npx tsc --noEmit

# Frontend lint
cd src/web && npm run lint
```

### Database

The application uses SQLite in development (auto-created, no setup needed) and Azure SQL in production.

To add a new EF Core migration:

```bash
dotnet ef migrations add MigrationName \
  --project src/ReadWise.Infrastructure \
  --startup-project src/ReadWise.Api
```

To apply migrations:

```bash
dotnet ef database update --startup-project src/ReadWise.Api
```

### Configuration

Development configuration lives in `src/ReadWise.Api/appsettings.json`. The JWT secret in this file is for **local development only** — production deployments must use Azure Key Vault or App Service configuration with a unique secret.

Key settings:

```json
{
  "Jwt": {
    "Secret": "...",
    "Issuer": "ReadWise",
    "Audience": "ReadWise",
    "AccessTokenExpirationMinutes": 15,
    "RefreshTokenExpirationDays": 7
  }
}
```

## Architecture

The backend follows **Clean Architecture** with three layers:

- **Core** — Domain entities and interfaces. Has zero external dependencies. Changes here are rare and deliberate.
- **Infrastructure** — Implements Core interfaces. Contains EF Core DbContext, repository implementations, and the SmartReader article parser. All external library dependencies live here.
- **Api** — ASP.NET Core Web API. Thin controllers that validate input and delegate to services/repositories. Wires up dependency injection in `Program.cs`.

Dependencies flow inward: `Api → Infrastructure → Core`.

The frontend is a single-page application that communicates with the backend exclusively through the centralized API client in `src/web/src/services/api.ts`. This client handles JWT token storage, automatic Bearer header injection, and transparent token refresh on 401 responses.

## License

This project is private and not currently licensed for public use.
