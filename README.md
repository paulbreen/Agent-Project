# Agent App

A full-stack web application template with a .NET 10 Clean Architecture backend and a React + TypeScript + Vite frontend, deployed to Azure.

## Tech Stack

- **Backend**: .NET 10, ASP.NET Core Web API, Entity Framework Core
- **Frontend**: React 19, TypeScript, Vite, React Router
- **Database**: SQLite (local dev), Azure SQL (production)
- **Infrastructure**: Azure App Service, Azure Static Web App, Azure SQL
- **CI/CD**: GitHub Actions with OIDC authentication

## Getting Started

### Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Node.js 22+](https://nodejs.org/)

### 1. Clone the repository

```bash
git clone <repo-url>
cd "Agent App"
```

### 2. Start the backend

```bash
dotnet run --project src/Api
```

The API will be available at `http://localhost:5001`. Swagger UI is at `http://localhost:5001/swagger`.

### 3. Start the frontend

```bash
cd src/web
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173`. API requests are automatically proxied to the backend.

## Architecture

```
src/
  Core/               Domain layer (entities, interfaces) — no dependencies
  Infrastructure/     Data access (EF Core, DbContext) — depends on Core
  Api/                Web API (controllers, config) — depends on Core + Infrastructure
  web/                React SPA (pages, services, routing)
```

The backend follows Clean Architecture: dependencies point inward, with Core at the center having zero external dependencies.

## Azure Deployment

Deployment runs automatically on push to `main` via `.github/workflows/deploy.yml`. It uses OIDC (federated credentials) to authenticate with Azure — no long-lived secrets stored.

### Azure Resources

Provision infrastructure with the Bicep template in `infra/main.bicep`:

```bash
az deployment group create \
  --resource-group <your-rg> \
  --template-file infra/main.bicep \
  --parameters infra/main.bicepparam
```

This creates:

| Resource | SKU | Purpose |
|---|---|---|
| App Service Plan | B1 (Linux) | Hosts the .NET API |
| App Service | — | .NET API runtime |
| Static Web App | Free | Hosts the React frontend |
| SQL Server + Database | Basic (2 GB) | Production database |

### GitHub Secrets

Set these under **Settings > Secrets and variables > Actions > Secrets**:

| Secret | Description |
|---|---|
| `AZURE_CLIENT_ID` | App registration (service principal) client ID for OIDC |
| `AZURE_TENANT_ID` | Azure AD tenant ID |
| `AZURE_SUBSCRIPTION_ID` | Azure subscription ID |
| `AZURE_STATIC_WEB_APPS_API_TOKEN` | Deployment token from the Static Web App resource |

### GitHub Variables

Set these under **Settings > Secrets and variables > Actions > Variables**:

| Variable | Description |
|---|---|
| `AZURE_APP_SERVICE_NAME` | Name of the App Service (e.g. `myapp-app`) |

### GitHub Environment

The deploy job targets the `production` environment. Create it under **Settings > Environments** if you want to add protection rules (e.g. required reviewers).

### OIDC Setup

To use federated credentials instead of a client secret:

1. Create an App Registration in Azure AD.
2. Under **Certificates & secrets > Federated credentials**, add a credential for your GitHub repo (`main` branch, `production` environment).
3. Assign the service principal a role (e.g. `Contributor`) on the resource group.
4. Set the three `AZURE_*` secrets above with the app registration's values.

## License

MIT
