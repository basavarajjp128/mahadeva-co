# Project security

## Secrets and configuration

- Do not commit credentials, tokens, private keys, production data, or local `.env` files.
- `.env*` files are ignored by Git; `.env.example` is allowed only when sanitized and must contain no working credentials.
- No environment variables or private credentials are needed for the initial static site. Treat any `NEXT_PUBLIC_*` value as public because it is embedded in client output.
- Keep credentials for any future provider in the hosting platform's secret manager and grant only the access the deployment needs.

## Input and rendering

- Treat query strings, form values, imported catalogue content, and external responses as untrusted.
- Validate external data at its boundary. Use typed, reviewed local data for the static catalogue; add runtime schema validation (for example, Zod) if remote data or forms are introduced.
- Render text through React's normal escaping. Do not use `dangerouslySetInnerHTML`, `eval`, or arbitrary user-controlled URLs.
- Build WhatsApp links from an approved business number and URL-encoded enquiry text; do not invent contact details.

## Dependencies and lockfile

- Keep `package-lock.json` committed and use `npm ci` for repeatable installs.
- Review `npm audit` findings and `npm outdated` output before dependency changes. Check the package, affected version range, dependency path, and upstream fix; do not blindly apply `npm audit fix --force`.
- Review direct and transitive changes in `package.json` and the lockfile. Update dependencies deliberately, then run lint, formatting, type checking, tests, and a production build.

## Git hygiene

- Check `git status`, `git diff --check`, and the staged diff before committing.
- Stage explicit project files and inspect the staged diff for secrets and generated output.
- Do not rewrite shared history, force-push, delete branches, or push changes without explicit authorization.
- Keep `.env` files, `node_modules`, build output, coverage, and local editor files out of commits.

## Production deployment

- Use HTTPS and configure response headers at the static host because Next.js static export does not run a Next.js response server. Configure a suitable Content Security Policy, `X-Content-Type-Options`, and clickjacking protection; enable HSTS once HTTPS is in place.
- Review header policies against the built site and any required assets before enforcing them.
- Deploy only after reviewing the exact build output and receiving the required deployment approval. Do not put secrets in static assets or client-side code.
- If forms, accounts, administrative operations, or persisted orders are introduced later, review the architecture first. Enforce server-side validation and authorization, least privilege, and safe handling of provider credentials.
