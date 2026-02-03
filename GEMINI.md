# Project: Agent App

## Project Overview

Agent App is a full-stack web application built with .NET 10 (Clean Architecture) and React + TypeScript + Vite. It is deployed to Microsoft Azure using App Service (API), Static Web App (frontend), and Azure SQL (database). The project uses a template-first approach, providing a clean scaffold that can be extended with domain-specific features.

## High-Level Architecture

The application is designed to be deployed to **Microsoft Azure**, with the ability to run locally for development purposes.

- **Backend**: ASP.NET Core Web API (.NET 10) following Clean Architecture (Core → Infrastructure → Api).
- **Frontend**: React 19 SPA with TypeScript, built with Vite, deployed to Azure Static Web App.
- **Database**: SQLite for local development, Azure SQL Server in production.
- **CI/CD**: GitHub Actions for continuous integration and deployment via OIDC.

## Key Roles & Responsibilities

*   **Product Owner (Gemini):** Defines features, creates user stories, and makes product-level decisions.
*   **System Architect (Claude):** Designs the technical architecture, makes implementation decisions, and builds the features.

## Development Workflow

Our development process is defined in `AgentWorkflows.md`. All agents should adhere to this workflow.

## Key Project Files

- `AgentApp.slnx` — .NET solution file
- `src/Api/Program.cs` — API entry point and middleware pipeline
- `src/Core/` — Domain entities and interfaces
- `src/Infrastructure/DependencyInjection.cs` — Service registration for EF Core
- `src/Infrastructure/Data/AppDbContext.cs` — Entity Framework DbContext
- `src/web/src/App.tsx` — React app with routing
- `src/web/src/services/api.ts` — API fetch wrapper
- `src/web/vite.config.ts` — Vite config with API proxy
- `infra/main.bicep` — Azure infrastructure definition
- `.github/workflows/ci.yml` — CI pipeline
- `.github/workflows/deploy.yml` — Deployment pipeline
