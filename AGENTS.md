# AGENTS.md — content-hub-client

## Layout

```text
src/model.ts    enumerations (snake_case values as the API sends them)
src/state.ts    task and instance state machines (previews)
src/routes.ts   route tables, prefixes, the CSRF header
src/vectors.ts  the type of vectors.json
vectors.json    the golden vectors (this package is their home)
scripts/check-vectors.mjs   structural check (also usable by the service: --against)
```

## Commands

```bash
npm ci && npm run type-check && npm run lint && npm test && npm run check:vectors && npm run build
```

Read [CLAUDE.md](CLAUDE.md) before changing a list, a table or a route: those changes are coordinated with
content-hub-service.
