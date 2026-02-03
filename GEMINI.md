# Project: ReadWise

## Project Overview

ReadWise is a "read-it-later" web application. It allows users to save articles from the web and read them in a clean, distraction-free format.

## High-Level Architecture

*   **Frontend:** A Single Page Application (SPA), likely built with React.
*   **Backend:** A .NET API that handles business logic, data storage, and user authentication.
*   **Database:** A relational database managed by Entity Framework Core to store user accounts and saved articles.

The application is designed to be deployed to **Microsoft Azure**, with the ability to run locally for development purposes.

## Key Roles & Responsibilities

*   **Product Owner (Gemini):** Defines features, creates user stories, and makes product-level decisions.
*   **System Architect (Claude):** Designs the technical architecture, makes implementation decisions, and builds the features.

## Development Workflow

Our development process is managed through GitHub issues in the `paulbreen/Agent-Project` repository.

1.  **Feature Definition:** The Product Owner creates a detailed feature request as a GitHub issue.
2.  **Architectural Review:** The System Architect reviews the feature, proposes a technical implementation plan, and asks clarifying questions in the issue comments.
3.  **Product Owner Approval:** The Product Owner reviews the plan, answers any questions, and approves the plan.
4.  **Implementation:** The System Architect proceeds with the implementation based on the approved plan.

## Key Project Files

*   `feature-requests/`: This directory contains the markdown source for the GitHub feature requests.