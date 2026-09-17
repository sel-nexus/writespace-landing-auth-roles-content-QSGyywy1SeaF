# WriteSpace

WriteSpace is a local-first blogging application built with React 18, React Router DOM 6, Vite 5, and Tailwind CSS 3. Users can create local accounts, write and manage posts, browse stories, and use role-aware administration tools.

There is no API server or database. Accounts, sessions, and posts are stored in the current browser using `localStorage`.

## Features

- Responsive public landing page
- Local account registration and login
- Built-in administrator account
- Role-aware navigation and protected routes
- Create, read, edit, and delete post workflows
- Post ownership and administrator authorization
- Newest-first blog listing with excerpts and author details
- Administrator dashboard with account and post statistics
- Local user management with user and administrator roles
- Responsive desktop and mobile layouts
- Validation, empty, not-found, authorization, and storage-error states
- Browser-local persistence without a backend

## Security and Data Caveats

WriteSpace is a local demonstration application and must not be treated as a production authentication system.

- Passwords are stored without encryption in browser `localStorage`.
- Do not use a real, sensitive, or reused password.
- Client-side authorization can be inspected or modified by anyone with access to the browser.
- There is no server-side authentication, authorization, API, or database.
- Data is scoped to the current browser profile and deployment origin.
- Data is not synchronized between browsers, devices, preview deployments, or domains.
- Clearing site data or browser storage permanently removes local accounts, sessions, and posts.
- Private browsing sessions may discard data when the private session ends.
- There is no backup, recovery, migration, or password-reset mechanism.
- Browser extensions, local scripts, and users with access to the browser profile may be able to inspect stored data.

Use WriteSpace only with non-sensitive demonstration content and credentials.

## Prerequisites

- Node.js 18 or later
- npm
- A modern browser with JavaScript and `localStorage` enabled

Node.js 20 LTS is recommended for local development and CI.

## Installation

Clone the repository and enter the project directory:

```bash
git clone <repository-url>
cd writespace-local-blog
```

Install dependencies using the committed lockfile when available:

```bash
npm ci
```

If the repository does not include a lockfile, use:

```bash
npm install
```

WriteSpace does not require runtime or build-time environment variables.

## Development

Start the Vite development server:

```bash
npm run dev
```

Open the URL printed by Vite, typically:

```text
http://localhost:5173
```

## Testing

Run the test suite in watch mode:

```bash
npm test
```

Run the complete test suite once:

```bash
npm test -- --run
```

Tests use Vitest, jsdom, React Testing Library, and `@testing-library/jest-dom`.

The test suite covers:

- Public and protected routing
- Role-aware redirects and navigation
- Registration, login, logout, and session validation
- Browser storage failures and malformed stored data
- Post creation, reading, editing, and deletion
- Post ownership and administrator permissions
- Blog sorting, excerpts, cards, and empty states
- Administrator statistics and recent-post management
- Managed account creation and deletion safeguards
- Responsive user presentations
- Debug-safe user projections

## Production Build

Create an optimized production build:

```bash
npm run build
```

Vite writes the generated files to `dist/`.

Preview the production build locally:

```bash
npm run preview
```

Open the URL printed by Vite, typically:

```text
http://localhost:4173
```

Use the preview server when verifying production behavior instead of relying only on the development server.

## Default Administrator

WriteSpace includes a built-in demonstration administrator:

```text
Username: admin
Password: admin
```

The built-in administrator:

- Is always available
- Is not stored in the managed-users array
- Cannot be deleted
- Can manage all posts
- Can access the administrator dashboard
- Can create and delete eligible local accounts

These credentials are public demonstration credentials and provide no production-grade security.

## Routes and Access

| Route | Guest | Standard user | Administrator | Purpose |
| --- | --- | --- | --- | --- |
| `/` | Allowed | Allowed | Allowed | Public landing page |
| `/login` | Allowed | Redirected to `/blogs` | Redirected to `/admin` | Local account login |
| `/register` | Allowed | Redirected to `/blogs` | Redirected to `/admin` | Local account registration |
| `/blogs` | Redirected to `/login` | Allowed | Allowed | Browse all local posts |
| `/blog/:id` | Redirected to `/login` | Allowed | Allowed | Read a post |
| `/write` | Redirected to `/login` | Allowed | Allowed | Create a post |
| `/edit/:id` | Redirected to `/login` | Owner only | Allowed | Edit an existing post |
| `/admin` | Redirected to `/login` | Redirected to `/blogs` | Allowed | Administrator dashboard |
| `/users` | Redirected to `/login` | Redirected to `/blogs` | Allowed | Local account management |
| Any unknown route | Redirected to `/` | Redirected to `/` | Redirected to `/` | Route fallback |

Additional authorization rules:

- A standard user can edit or delete only posts they own.
- An administrator can edit or delete any post.
- The built-in administrator cannot be deleted.
- The currently signed-in managed account cannot delete itself.
- Missing posts display a not-found state when opened for reading.
- Missing or unauthorized edit targets redirect to `/blogs`.

## Browser Storage

All application persistence uses `localStorage`. Storage values are JSON encoded.

### `writespace_session`

Contains the active session:

```json
{
  "userId": "user-identifier",
  "username": "writer",
  "displayName": "Local Writer",
  "role": "user"
}
```

Field definitions:

| Field | Type | Description |
| --- | --- | --- |
| `userId` | string | Identifier of the signed-in account |
| `username` | string | Local login username |
| `displayName` | string | Name shown in the interface |
| `role` | `"user"` or `"admin"` | Authorization role |

Only one session is stored at a time. Logging out removes this key.

### `writespace_users`

Contains an array of registered and administrator-managed accounts:

```json
[
  {
    "id": "user-identifier",
    "displayName": "Local Writer",
    "username": "writer",
    "password": "local-password",
    "role": "user",
    "createdAt": "2026-09-17T10:00:00.000Z"
  }
]
```

Field definitions:

| Field | Type | Description |
| --- | --- | --- |
| `id` | string | Generated account identifier |
| `displayName` | string | Name shown in the interface |
| `username` | string | Case-insensitive local login name |
| `password` | string | Unencrypted demonstration password |
| `role` | `"user"` or `"admin"` | Account role |
| `createdAt` | ISO 8601 string | Account creation date and time |

The built-in `admin` account is defined in application code and is not included in this array.

### `writespace_posts`

Contains an array of local blog posts:

```json
[
  {
    "id": "post-identifier",
    "title": "A local-first post",
    "content": "This content is stored in the browser.",
    "createdAt": "2026-09-17T12:00:00.000Z",
    "authorId": "user-identifier",
    "authorName": "Local Writer"
  }
]
```

Field definitions:

| Field | Type | Description |
| --- | --- | --- |
| `id` | string | Generated post identifier |
| `title` | string | Trimmed post title |
| `content` | string | Complete post content |
| `createdAt` | ISO 8601 string | Original publication date and time |
| `authorId` | string | Identifier of the original author |
| `authorName` | string | Display name captured when created |

Editing a post preserves its identifier, author metadata, and original creation date.

### Storage Behavior

Storage utilities safely handle:

- Missing keys
- Malformed JSON
- JSON values that are not arrays
- Unavailable browser storage
- Storage quota failures
- Invalid session records

Malformed arrays are treated as empty. Failed writes return an error result so the interface can display an appropriate message.

## Project Structure

```text
writespace-local-blog/
├── .env.example
├── .gitignore
├── CHANGELOG.md
├── DEPLOYMENT.md
├── README.md
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── vercel.json
├── vite.config.js
├── vitest.config.js
└── src/
    ├── App.jsx
    ├── App.test.jsx
    ├── index.css
    ├── main.jsx
    ├── components/
    │   ├── Avatar.jsx
    │   ├── BlogCard.jsx
    │   ├── BlogCard.test.jsx
    │   ├── Navbar.jsx
    │   ├── ProtectedRoute.jsx
    │   ├── ProtectedRoute.test.jsx
    │   ├── PublicNavbar.jsx
    │   ├── StatCard.jsx
    │   └── UserRow.jsx
    ├── pages/
    │   ├── AdminDashboard.jsx
    │   ├── AdminDashboard.test.jsx
    │   ├── AuthPages.test.jsx
    │   ├── Home.jsx
    │   ├── Home.test.jsx
    │   ├── LandingPage.jsx
    │   ├── LandingPage.test.jsx
    │   ├── LoginPage.jsx
    │   ├── ReadBlog.jsx
    │   ├── ReadBlog.test.jsx
    │   ├── RegisterPage.jsx
    │   ├── UserManagement.jsx
    │   ├── UserManagement.test.jsx
    │   ├── WriteBlog.jsx
    │   └── WriteBlog.test.jsx
    ├── test/
    │   └── setup.js
    └── utils/
        ├── auth.js
        ├── auth.test.js
        ├── storage.js
        └── storage.test.js
```

## Architecture Notes

- `src/App.jsx` owns the browser router and route definitions.
- `src/main.jsx` renders the application and does not create another router.
- `src/components/ProtectedRoute.jsx` enforces guest and role-level route access.
- `src/utils/auth.js` manages registration, login, logout, sessions, and role redirects.
- `src/utils/storage.js` manages safe local persistence and mutation authorization.
- Page components provide additional authorization checks for direct rendering and mutation flows.
- Tailwind utility classes provide all application styling.
- React Router handles client-side navigation.
- No external network requests are made by the application.

## Environment Variables

No environment variables are currently required.

The included `.env.example` documents this behavior. If a future client-exposed setting is added, it must use Vite's `VITE_` prefix:

```text
VITE_EXAMPLE_SETTING=example_value
```

Never place secrets in Vite environment variables. Values exposed through `import.meta.env.VITE_*` are included in the browser bundle.

## Deploying to Vercel

WriteSpace can be deployed as a static Vite application.

### Vercel Settings

Use the following project settings:

| Setting | Value |
| --- | --- |
| Framework preset | Vite |
| Build command | `npm run build` |
| Output directory | `dist` |
| Install command | `npm install` or detected default |
| Environment variables | None |

The repository includes `vercel.json`:

```json
{"rewrites":[{"source":"/(.*)","destination":"/index.html"}]}
```

This rewrite is required because React Router manages routes in the browser. It ensures direct requests and refreshes for paths such as `/blogs`, `/write`, `/admin`, and `/blog/:id` return `index.html` rather than a platform 404.

After deployment, verify:

1. The landing page loads at `/`.
2. `/login` and `/register` work when opened directly.
3. Protected routes redirect guests to `/login`.
4. Browser refreshes work on client-side routes.
5. Registration, login, post creation, editing, and deletion work.
6. `admin / admin` can access `/admin` and `/users`.
7. Unknown routes return to `/`.
8. The layout works at mobile and desktop sizes.
9. The browser console contains no unexpected errors.

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment, smoke-check, monitoring, rollback, and CI/CD guidance.

## Troubleshooting

### A protected page redirects to login

The active session may be missing or malformed.

- Log in again.
- Confirm that `localStorage` is enabled.
- Inspect `writespace_session` in browser developer tools.
- Clear the invalid session value and retry.

### Administrator pages redirect to the blogs page

The current session does not have the `admin` role.

Log out and use the built-in demonstration account:

```text
admin / admin
```

### Posts or accounts disappeared

WriteSpace stores data only in the current browser and origin. Data may appear missing if you:

- Cleared browser or site data
- Switched browsers or browser profiles
- Opened a private browsing session
- Changed from development to preview
- Changed ports, domains, protocols, or deployment URLs
- Opened a Vercel preview deployment with a different origin

There is no automatic synchronization or recovery.

### Data does not appear on another device

This is expected. `localStorage` is not shared between devices, browsers, profiles, or origins.

### Saving fails with a browser storage error

Possible causes include:

- Browser storage is disabled
- Storage access is blocked by browser privacy settings
- The origin has exceeded its storage quota
- The browser is in a restricted context

Enable storage, remove unnecessary site data, or try a standard browser profile.

### A direct route returns a Vercel 404

Confirm that `vercel.json` exists at the repository root and contains the SPA rewrite. Redeploy after restoring the file.

### The development server does not start

Verify the installed Node.js version:

```bash
node --version
npm --version
```

Then reinstall dependencies:

```bash
rm -rf node_modules
npm install
npm run dev
```

On platforms where `rm -rf` is unavailable, remove `node_modules` using the platform's file manager or equivalent command.

### Tests fail because browser storage contains stale data

Tests are configured to clear jsdom `localStorage` between cases. If failures persist:

```bash
npm test -- --run
```

Then verify that dependencies match `package.json` and reinstall them if necessary.

### Production behavior differs from development

Build and serve the production output locally:

```bash
npm run build
npm run preview
```

Test against the preview URL printed by Vite. Also confirm that the deployment uses the expected commit and that browser storage belongs to the same origin being tested.

## User Stories

This release implements the following user stories:

- SCRUM-1910
- SCRUM-1911
- SCRUM-1912

## License

Private.

This project and its source code are proprietary and are not licensed for public use, copying, modification, distribution, sublicensing, or commercial exploitation without prior written permission from the copyright holder. All rights reserved.