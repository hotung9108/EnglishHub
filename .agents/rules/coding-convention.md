---
name: coding-convention
description: Standard coding conventions and styling rules for the EnglishHub project.
---

# EnglishHub Coding Conventions

## General Rules
1. **Language**: Use English for all code (variables, functions, classes, comments) to maintain consistency.
2. **Readability**: Code should be self-documenting. Use descriptive names rather than relying heavily on comments.
3. **Linting & Formatting**: Follow the project's standard linter configurations (e.g., ESLint for JS/TS, Prettier for formatting).

## Frontend (React/Vue/Angular etc.)
- Use functional components and hooks.
- Organize components logically (e.g., `components/common/`, `components/features/`).
- Handle API errors gracefully and display user-friendly error messages.

## Backend (Node.js/Python/Go etc.)
- Follow RESTful API design principles.
- Use environment variables for all secrets and configuration.
- Write unit tests for core business logic, especially the AI grading algorithms.
