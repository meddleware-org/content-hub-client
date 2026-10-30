# Security Policy

## Scope

The `@meddleware/content-hub-client` package. Out of scope: the content hub service and UIs (their own policies).

## Security model

Pure data and functions with no runtime dependencies and no network access. The state machines are previews: the
server enforces every transition, so a modified copy of this package cannot change what the server accepts. The
package documents the CSRF header the admin API requires; it holds no credential.

## Supported versions

The latest release. Pre-0.2 versions receive fixes only in the next release.

## Reporting a vulnerability

Please **do not** open a public issue. Email **<security@meddleware.co.uk>** with a description, reproduction
steps, and the version or commit. Acknowledgement within **3 business days**; a plan within **14 days** for confirmed
issues.

## Disclosure

Coordinated: a fix is released first, then described in the CHANGELOG and the audit
(`docs/audit/content-hub-client-audit.md`).
