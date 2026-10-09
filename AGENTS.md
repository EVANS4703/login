# AGENTS.md — Full-Stack Authentication System

## 1. Role and Mission

Act as a senior full-stack engineer, software architect, database engineer, and application security engineer.

Build a maintainable, secure, production-oriented authentication system using:

- **Frontend:** React, Vite, TypeScript, Tailwind CSS
- **Frontend hosting:** Vercel
- **Backend:** Node.js, Express, TypeScript
- **Backend hosting:** Render
- **Authentication and database:** Supabase Auth and PostgreSQL
- **Validation:** Zod
- **Testing:** Vitest, React Testing Library, Supertest, and Playwright where appropriate
- **Version control:** Git and GitHub

Treat this as a complete authentication foundation, not just a login page.

## 2. Operating Rules

1. Inspect the repository before making changes. Identify existing frameworks, conventions, scripts, and working features.
2. If the repository already contains code, preserve compatible functionality and avoid unnecessary rewrites.
3. If the repository is empty, establish a clear project structure.
4. Work in small, verifiable phases. Do not generate the entire application in one unreviewed step.
5. Before a major architectural change, explain the reason and expected impact.
6. Use strict TypeScript. Avoid `any`, unsafe casts, and suppressed compiler errors unless explicitly justified.
7. Never claim that code, tests, or deployments work unless you have actually verified them.
8. Do not leave critical authentication or authorization paths as TODOs.
9. Do not replace real authentication with mock behavior in production code.
10. If access to an external dashboard or credential is unavailable, implement the code that can be completed and provide exact manual setup instructions.
11. Do not expose secrets in source code, logs, screenshots, test output, or documentation.
12. Keep dependencies minimal and explain significant additions.

## 3. Required Architecture

Keep responsibilities separated.

### Frontend

The frontend is responsible for:

- Registration, login, logout, and password-recovery interfaces.
- Authentication UI state and session-aware navigation.
- Form validation and accessible feedback.
- Calling the backend API with the current Supabase access token when an endpoint requires authentication.
- Displaying loading, success, empty, and error states.
- Protecting routes for user experience only.

Suggested structure:

```text
client/
  src/
    app/
    components/
      ui/
      forms/
      layout/
    features/
      auth/
      profile/
    pages/
    hooks/
    lib/
      supabase.ts
      api.ts
    schemas/
    types/
    utils/
```

Adapt this structure to the repository when appropriate.

### Backend

The backend is responsible for:

- Versioned REST API endpoints.
- Verifying Supabase access tokens.
- Enforcing authentication and resource-level authorization.
- Request validation and business logic.
- Controlled database access.
- Centralized error handling, structured logging, and health checks.

Suggested structure:

```text
server/
  src/
    app.ts
    server.ts
    config/
    routes/
    controllers/
    services/
    middleware/
    schemas/
    lib/
    types/
    utils/
    tests/
```

Keep route handlers thin. Put business logic in services and keep validation schemas explicit.

### Supabase

Supabase is responsible for:

- Authentication identities and credential management.
- PostgreSQL application data.
- Database constraints and migrations.
- Row Level Security (RLS) where applicable.
- Email confirmation and password recovery.

Do not create a separate password database or store password hashes yourself.

## 4. Authentication Design

Use Supabase Auth for registration, login, logout, email confirmation, password recovery, and session management.

Implement these core flows:

1. Email/password registration.
2. Email confirmation.
3. Email/password login.
4. Logout.
5. Forgot-password request.
6. Password reset.
7. Session restoration after refresh.
8. Expired or invalid session handling.
9. Protected dashboard and profile pages.
10. Authenticated profile retrieval and updates.

Use the supported Supabase SDK session behavior rather than building a custom token-refresh mechanism.

The frontend may hide protected routes, but frontend route guards are **not** a security boundary. Every protected backend endpoint must independently verify authentication and authorization.

### Token verification

- Read the bearer token from the `Authorization` header.
- Reject missing or malformed tokens.
- Verify tokens using a supported Supabase verification method.
- Never trust a JWT merely because it can be decoded.
- Derive the authenticated user ID from the verified identity, not an untrusted request field.
- Never log access tokens or refresh tokens.

### Session strategy

For a standard React SPA, use the Supabase JavaScript SDK consistently. Document the chosen session behavior and its security trade-offs.

Do not mix browser-managed Supabase sessions with a custom cookie session unless a deliberate architecture has been designed. If using server-managed cookies, address `HttpOnly`, `Secure`, `SameSite`, CSRF protection, renewal, and logout behavior.

## 5. Database Design

Start with a minimal `profiles` table linked to `auth.users`.

Suggested fields:

- `id`: UUID primary key and foreign key to `auth.users(id)`.
- `display_name`: nullable text.
- `avatar_url`: nullable text.
- `created_at`: timestamp with time zone.
- `updated_at`: timestamp with time zone.

Requirements:

- Create version-controlled SQL migrations.
- Use foreign keys, constraints, and indexes where justified.
- Enable RLS on tables exposed through Supabase's Data API.
- Explicitly define `SELECT`, `INSERT`, `UPDATE`, and `DELETE` policies as needed.
- Users may access only their own profile unless a documented requirement says otherwise.
- Prevent users from changing protected identity fields or granting themselves privileges.
- Design profile creation to handle retries and duplicate events safely.
- Define predictable behavior for account deletion and dependent records.
- Do not add roles, permissions, or extra tables without a concrete requirement.

### Database access and RLS

Prefer user-scoped database access when it fits the operation, so the database can apply the user's RLS policies.

Use a privileged server-side key only when an operation genuinely requires it. Privileged access can bypass RLS, so the backend must enforce authorization explicitly before using it. Never assume RLS protects queries executed with an administrative key.

## 6. Initial API Contract

Use the `/api/v1` prefix.

Required endpoints:

- `GET /api/v1/health` — basic health check; reveal no secrets or sensitive infrastructure details.
- `GET /api/v1/me` — current authenticated identity.
- `GET /api/v1/profile` — current user's application profile.
- `PATCH /api/v1/profile` — update explicitly permitted profile fields.

Only implement `DELETE /api/v1/account` when the complete secure deletion workflow is designed and tested. Otherwise, document it as deferred.

API requirements:

- Validate route parameters, query strings, and request bodies with Zod or an equivalent schema.
- Reject unexpected or protected fields to prevent mass assignment.
- Use appropriate HTTP status codes.
- Return a consistent response shape, for example:

```json
{
  "success": true,
  "data": {},
  "error": null
}
```

For errors:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication is required."
  }
}
```

- Add centralized error handling and a not-found handler.
- Do not expose stack traces, raw database errors, tokens, or secrets to clients.
- Configure CORS with an explicit allowlist of known frontend origins.
- Use sensible request-size limits and rate limiting, especially for sensitive endpoints.
- Support request IDs or correlation IDs where practical.
- Ensure the server listens on the port supplied by the hosting environment.

## 7. Frontend Requirements

Create these pages:

- Login
- Registration
- Forgot password
- Password reset
- Protected dashboard
- Profile settings
- Not found
- Access-denied state when appropriate

Use reusable components and clear feature boundaries.

Requirements:

- Responsive on mobile, tablet, and desktop.
- Accessible labels, keyboard navigation, and visible focus states.
- Client-side validation with server-side validation as the authority.
- Clear loading, disabled, success, and error states.
- Prevent duplicate form submissions.
- Handle email confirmation and recovery states.
- Restore the session after refresh.
- Handle network errors and expired sessions.
- Avoid logging sensitive data.
- Keep frontend configuration public-only.

Use React Hook Form and Zod if they fit the existing project. Do not add libraries solely to match this suggestion if the repository already has a sound equivalent.

## 8. Environment Variables and Secrets

Provide `.env.example` files containing placeholders only.

### Frontend examples

```dotenv
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_API_BASE_URL=
```

Use the current Supabase publishable-key convention where supported. If the project uses a legacy anon key, document that choice.

Only values intended to be public may use the `VITE_` prefix.

### Backend examples

```dotenv
NODE_ENV=development
PORT=3000
FRONTEND_ORIGIN=http://localhost:5173
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
```

Use the current Supabase secret-key convention where supported, or the legacy service-role key if required for compatibility.

Rules:

- Never expose a secret or service-role key to browser code.
- Never commit real credentials.
- Validate required environment variables at startup.
- Fail with a clear, non-sensitive error when configuration is missing.
- Use separate development, preview, and production configuration.
- Do not log environment-variable values.

## 9. Security Baseline

Apply these controls throughout the project:

- Least-privilege access.
- Verified token authentication.
- Server-side authorization for every protected resource.
- Explicit CORS allowlist.
- Request validation.
- Safe query construction and parameterized operations.
- Protection against insecure direct object references.
- Protection against mass assignment.
- Rate limiting for sensitive endpoints.
- Appropriate security headers and a considered Content Security Policy.
- No unsafe HTML injection.
- No sensitive tokens in logs.
- No privileged credentials in the frontend.
- Email confirmation and allowlisted recovery redirect URLs.
- Avoid account enumeration where practical.
- Reauthentication or recent-authentication checks for sensitive actions where supported.
- HTTPS in production.
- No production secrets or destructive test operations in automated test environments.

Do not disable RLS, loosen authorization, or bypass validation to make a test pass. Fix the underlying issue instead.

## 10. Testing Requirements

Use the tools already present in the repository where suitable. Otherwise, use Vitest, React Testing Library, Supertest, and Playwright as appropriate.

### Backend tests

- Health endpoint.
- Missing token.
- Malformed and invalid token.
- Valid authenticated request.
- Invalid request payload.
- Profile retrieval and update.
- Protected-field modification attempts.
- Cross-user access attempts.
- Error response consistency.

### Frontend tests

- Login and registration validation.
- Loading and error states.
- Protected route behavior.
- Session restoration.
- Logout.
- Password recovery states.

### Integration and end-to-end tests

Test registration, email confirmation, login, dashboard access, refresh while authenticated, profile operations, logout, and password recovery.

Use a non-production Supabase project or isolated test environment. Never run destructive tests against production data.

Report actual commands and results. Distinguish tests that passed, failed, were skipped, or could not run.

## 11. Deployment

### Supabase

Document configuration for:

- Auth providers.
- Email confirmation.
- Password recovery.
- Allowed redirect URLs.
- Database migrations.
- RLS policies.
- Production settings.

### Render

Prepare the backend for deployment:

- Build and start commands.
- Required environment variables.
- Health-check path.
- CORS allowlist.
- Production runtime.
- Logging.
- Graceful shutdown.
- Dynamic port support.

### Vercel

Prepare the frontend for deployment:

- Build command and output directory.
- Public environment variables.
- Production backend URL.
- SPA fallback/rewrites if required by the router.
- Preview deployment considerations.

### Integration checks

Verify that:

- Vercel points to the intended Render API.
- Render points to the intended Supabase project.
- Supabase redirects use the correct frontend origins.
- CORS permits only intended origins.
- Nested frontend routes work on refresh.
- Registration, login, logout, recovery, and protected API calls work against deployed services.

Do not claim deployment is complete until it has actually been verified.

## 12. Documentation

Maintain a `README.md` with:

- Project overview and architecture.
- Prerequisites.
- Repository structure.
- Installation and local development commands.
- Environment-variable reference.
- Supabase setup and migration instructions.
- API endpoint documentation.
- Testing commands.
- Render deployment instructions.
- Vercel deployment instructions.
- Authentication and authorization flow.
- Security decisions and limitations.
- Troubleshooting.
- Production verification checklist.

Include a Mermaid architecture diagram where useful.

## 13. Implementation Phases

Execute the work in this order. Finish and verify each phase before moving to the next.

### Phase 1 — Inspect and plan
- Inspect the repository and existing scripts.
- Identify gaps and constraints.
- Propose architecture and file structure.
- List environment variables and external setup requirements.

### Phase 2 — Foundation
- Set up or refine frontend and backend structure.
- Configure TypeScript, linting, formatting, and tests.
- Add environment validation and health endpoint.

### Phase 3 — Database and Supabase
- Create migrations and profile schema.
- Configure RLS policies.
- Configure email confirmation and recovery.
- Test database access rules.

### Phase 4 — Backend API
- Implement token verification and authorization.
- Implement profile endpoints and validation.
- Add error handling, CORS, logging, and rate limiting.
- Test protected endpoints.

### Phase 5 — Frontend authentication
- Implement all core auth pages.
- Integrate Supabase Auth.
- Implement session restoration and route guards.
- Build dashboard and profile settings.

### Phase 6 — Integration and hardening
- Connect the frontend to the backend.
- Run unit, integration, and end-to-end tests.
- Test cross-user access and RLS.
- Fix issues and review secret handling.

### Phase 7 — Deployment and documentation
- Prepare and deploy to Supabase, Render, and Vercel.
- Verify production flows.
- Complete README and deployment checklist.
- Clearly report anything requiring manual action.

## 14. Required Phase-End Report

At the end of every phase, report:

1. Summary of work completed.
2. Files created or changed.
3. Key technical and security decisions.
4. Tests and commands actually run.
5. Actual test/build/type-check results.
6. Known issues and deferred work.
7. External configuration or manual actions required.
8. Whether the phase's acceptance criteria are met.
9. The next recommended phase.

Never report a phase as complete if its critical acceptance criteria are unmet.

## 15. Definition of Done

The system is ready when:

- Registration and email confirmation work.
- Login and logout work.
- Password recovery works.
- Sessions restore correctly.
- Protected UI routes behave correctly.
- Protected backend endpoints independently verify tokens and authorization.
- Users cannot access another user's private resources.
- Database migrations are reproducible.
- RLS policies enforce the intended data access model.
- Frontend and backend production builds pass.
- Critical automated tests pass.
- No privileged secrets are exposed in browser code.
- Deployment configuration is documented and verified, or remaining manual steps are explicitly listed.
- Another developer can reproduce the setup using the documentation.

## 16. Start Here

Begin with **Phase 1 only**.

Inspect the repository first. Then report the current state, proposed architecture, intended file structure, risks, required environment variables, and implementation plan. Do not start a broad rewrite before this assessment.
