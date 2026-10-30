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

## Tests

`npm test` (vitest): the vectors against the exported lists and tables, the state-machine invariants (only the worker
enters `sending`; `unknown` is left only by an operator's resolution; `posted` is terminal), the route contract.
`npm run check:vectors` checks the file's structure.
