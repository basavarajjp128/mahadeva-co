# Project security

## Secrets and configuration

- Do not commit credentials, tokens, private keys, production data, or local `.env` files.
- `.env*` files are ignored by Git; `.env.example` is allowed only when sanitized and must contain no working credentials.
- Treat any `NEXT_PUBLIC_*` value as public because it is embedded in client output. Payment credentials are read only in server modules and use the ignored local `.env` or the hosting provider's secret manager.
- Keep credentials for any future provider in the hosting platform's secret manager and grant only the access the deployment needs.

## Input and rendering

- Treat query strings, form values, imported catalogue content, and external responses as untrusted.
- Validate external data at its boundary. The current client-side enquiry form validates lengths, contact formats, catalogue selections and quantities before preparing a message. This is usability validation only; repeat all checks on a trusted server before any future persistence or business action.
- Render text through React's normal escaping. Do not use `dangerouslySetInnerHTML`, `eval`, or arbitrary user-controlled URLs.
- Build WhatsApp links from the explicitly configured international business number and URL-encoded enquiry text; leave the setting empty until verified details are supplied. The customer must review the draft and press Send in WhatsApp.
- Do not log enquiry contents or personal contact details. The current form keeps values only in browser component state and opens a `wa.me` or `mailto` draft on explicit user action.

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

- Run the site with the Next.js Node.js server runtime; request-dependent payment handlers and webhooks cannot run from a static export. Use HTTPS and review the configured CSP, `X-Content-Type-Options`, and clickjacking protections against the deployed assets and provider flow. HSTS is enabled in production responses.
- Deploy only after reviewing the exact build output and receiving the required deployment approval. Do not put secrets in static assets or client-side code.
- Before adding server-side enquiry submission or persistence, add server-side validation, spam prevention, rate limiting, safe storage and retention rules, and appropriate monitoring that avoids personal message contents. For accounts or administrative operations, enforce authorization and least privilege. Keep provider credentials server-side.
- Payment processing is implemented as a test-mode-only, server-side integration. Read [Payment security and setup](PAYMENT-SECURITY.md) for trust boundaries, required configuration and unresolved production gates. Do not add live keys or enable live payment processing without explicit release approval.
