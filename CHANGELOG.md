# Changelog

All notable changes to WriteSpace are documented in this file.

## [1.0.0] - 2026-09-17

Initial release of WriteSpace, a local-first blogging application.

### Features

- Added a responsive landing page with feature highlights and previews of recent local posts.
- Added local account registration and login flows.
- Included a built-in demo administrator account using `admin / admin`.
- Added role-aware navigation and protected routes for guests, users, and administrators.
- Added post creation, reading, editing, and deletion workflows.
- Restricted post management to post owners and administrators.
- Added a responsive blog listing with excerpts, author details, dates, and edit controls.
- Added an administrator dashboard with post and account statistics, quick actions, and recent-post management.
- Added user management for creating local user or administrator accounts and deleting eligible accounts.
- Protected the built-in administrator and the currently signed-in account from deletion.
- Added responsive desktop and mobile layouts with accessible navigation, forms, status messages, and confirmation flows.
- Added empty, not-found, validation, storage-error, and authorization states.

### Technical Foundation

- Built with React 18, React Router DOM 6, Vite 5, and Tailwind CSS 3.
- Added browser-based persistence for accounts, sessions, and posts using `localStorage`.
- Added safe storage utilities that handle malformed data, unavailable storage, and quota failures.
- Added reusable avatar, blog card, statistic card, protected-route, navigation, and user-row components.
- Added client-side routing for public, authenticated, and administrator-only pages.
- Added SPA fallback handling for direct navigation and browser refreshes.
- Added responsive styling through Tailwind utility classes.
- Added application metadata, theme color, and an inline SVG favicon.

### Tests

- Added Vitest, jsdom, and React Testing Library configuration.
- Added routing and navigation coverage for public, protected, administrator-only, and unknown routes.
- Added authentication tests for registration, login, logout, session validation, role-aware redirects, and storage failures.
- Added post persistence and UI tests for creation, reading, editing, deletion, ownership rules, validation, sorting, excerpts, and empty states.
- Added administrator dashboard tests for statistics, recent posts, deletion confirmation, and access control.
- Added user-management tests for account creation, duplicate usernames, role assignment, deletion safeguards, responsive presentation, and access control.
- Added utility tests for malformed local data, storage failures, authorization checks, and debug-safe user projections.

### Setup and Deployment

- Added npm scripts for development, production builds, previews, and tests.
- Added Vite, PostCSS, Tailwind CSS, and Vitest configuration.
- Added `.env.example` documenting that no runtime environment variables are required.
- Added repository ignore rules for dependencies, generated output, local environment files, logs, caches, and editor metadata.
- Added a Vercel rewrite configuration so client-side routes resolve to `index.html`.
- Added a deployment guide covering local verification, Vercel setup, SPA rewrites, smoke checks, monitoring, rollback, and CI/CD recommendations.

### Security and Data Caveats

- WriteSpace is a local demo application and has no server-side authentication, API, or database.
- Account credentials, including passwords, are stored without encryption in the browser.
- Users must not reuse real or sensitive passwords with this application.
- All accounts, sessions, and posts are scoped to the current browser and deployment origin.
- Clearing browser storage, using private browsing, or changing deployment origins can make local data unavailable.
- Local data is not synchronized, backed up, recoverable, or shared between browsers or devices.

### User Stories

- SCRUM-1910
- SCRUM-1911
- SCRUM-1912