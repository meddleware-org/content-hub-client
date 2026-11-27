# CLAUDE.md — content-hub-client

The content hub's client-side contract. See [README.md](README.md).

## Invariants

- **Home of the golden vectors.** `vectors.json` is published from here. `content-hub-service` keeps a byte-identical
  copy and its contract job fails when they differ. Change the vectors here first, publish, then update the service.
- **Mirrors the server, never decides.** `state.ts` is for previews; the server's state machines decide. `model.ts`,
  `state.ts` and `routes.ts` must equal the service's enumerations, state machines and route tables (checked through
  `vectors.json` and the service's contract job).
- **The text engine is a port.** `src/text/*.ts` mirrors `content-hub-service` `crates/core/src/text/*.rs` line for line
  (same algorithm, code-point offsets). Change Rust first, regenerate the vectors there, copy them here, make these
  tests pass, publish, then update the service's copy.
- **No runtime dependencies**, no network calls, no secrets. Pure data and functions (uses the platform's
  `Intl.Segmenter` and `String.prototype.normalize`).
- **No operator data** (host names, channels, wording).
- Pre-0.2: no compatibility shims; the next publication is the published version + 1 patch.

## Layout and commands

```text
src/model.ts    enumerations (snake_case values as the API sends them)
src/state.ts    task and instance state machines (previews)
src/routes.ts   route tables, prefixes, the CSRF header
src/text/       the text engine (a port of the service's Rust core)
src/vectors.ts  the type of vectors.json
vectors.json    the golden vectors (this package is their home)
scripts/check-vectors.mjs   structural check (also usable by the service: --against)
```

`npm ci && npm run type-check && npm run lint && npm test && npm run check:vectors && npm run build`. Changing a list, a table or a
route is coordinated with content-hub-service.

## Commands

```bash
npm ci && npm run type-check && npm run lint && npm test && npm run build   # the core of what the `check` CI job runs
npm run check:vectors                                                       # the structure of vectors.json (the service runs it with `--against` on its copy)
npm audit --audit-level=high                                                # the dependency check (this repo does not use mw-audit-gate)
```

Release: bump `version`, push, tag `v<version>`; `npm-publish.yml` re-runs the checks on the tagged commit and publishes with npm trusted publishing.

## Gotchas

- **`vectors.json` is hand-copied between two repositories.** This package is its home; `content-hub-service` keeps a copy and checks it byte for byte (`check-vectors.mjs --against`). Change the file here
  first, release, then update the service's copy and its CHECK lists and route tables in the same wave.
- **This package ships compiled JavaScript** (`exports.default` is `dist/index.js`), unlike the other client libraries that ship TypeScript source: `tsconfig.build.json` emits JavaScript and source maps.
- **Offsets in the text engine are code points**, not UTF-16 units; the Rust parser's offsets are the reference. A change to `markup.ts` needs a vector for the case.
- **The text engine is a preview.** The service always decides; never use a count or a cut from this package as authorisation or as the final check.
- **There is no `mw-audit-gate`.** This repository does not depend on `@meddleware/frontend-config`; CI runs `npm audit --audit-level=high`.

## Documentation rules (workspace documentation standard, D144)

Every file has a header and every declaration a TSDoc comment (private declarations included); comments say why. `node scripts/check-docs.mjs --report content-hub-client` (in the workspace repository) is the gate. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Related

- The audit: [`docs/audit/content-hub-client-audit.md`](docs/audit/content-hub-client-audit.md).
- How to propose a change: [`CONTRIBUTING.md`](CONTRIBUTING.md).
- Consumer: `content-hub-ui` (exactly `0.0.1`); release it after this package. The service: `content-hub-service`, which holds the other copy of the vectors.

## Tests

`npm test` (vitest): the vectors against the exported lists and tables, the state-machine invariants (only the worker
enters `sending`; `unknown` is left only by an operator's resolution; `posted` is terminal), the route contract.
`npm run check:vectors` checks the file's structure.

## Interoperability

- [docs/INTEROP.md](docs/INTEROP.md): the standards this project speaks, what is planned, where to extend it, and what proves each claim.
