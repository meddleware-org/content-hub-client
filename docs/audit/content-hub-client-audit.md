# Security Audit — `content-hub-client`

**Classification:** Internal security review
**Project:** repos/content-hub-client (the content hub client contract: routes, enumerations, state machines, golden vectors)
**Project type:** TS SDK
**Template:**

- AUDIT_TEMPLATE.md (2026-10-08)
- AUDIT_TEMPLATE_TS.md (2026-10-08)

**Package manager / lockfile:** npm 11, package-lock.json committed
**Module format:** ESM
**Publish model:** ships TS source + declarations (npm)
**Runtime targets:** browser, Node ≥ 24
**Peer dependencies:** none
**Deployment status:** published on npm (0.0.1, with provenance, 2026-10-30); used by the console and the service's contract job
**Review date:** 2026-10-25
**Reviewer:** Internal review
**Severity ceiling:** Low — pure data and functions, no runtime dependencies, no credentials; the server enforces everything this package describes
**Status:** scaffold — first pass of the C4 scaffold; 9 vitest tests, `check:vectors` ok, `npm audit` 0 vulnerabilities

---

## Executive summary

A scaffold: the build, test, lint and release pipeline and the structure the next steps fill. The positive findings
record the properties fixed now; the deferred ones name the step that delivers the rest. Nothing is published.

## Threat model / trust boundaries

| Actor | Holds / proves | Can do | Bounded by |
| --- | --- | --- | --- |
| Dependency authors | code in the lockfile | run at build and in the bundle | lockfile, audit gate, licence check |
| CI and the registries | the published artefact | serve it | OIDC publishing, provenance, digest pins |
| The content hub service | the API responses | data shown or used | server-side enforcement; the client mirrors only |

## Severity scale

Critical / High / Medium / Low / Info / Positive (unchanged across the corpus).

## Scope

The repository at 0.0.1 (sources, tests, workflows). Environment: Node 24, npm 11.

## Findings

### F1 — Positive: the enumerations and state machines equal the shared vectors
**Severity:** Positive
**Where:** `src/model.ts`, `src/state.ts`, `vectors.json`
**Issue:** —
**Impact:** previews cannot drift from the server
**Remediation / evidence:** `tests/vectors.test.ts`; the service checks the same file (core `vectors_tests`, contract job)

### F2 — Positive: only the worker enters `sending`; `unknown` is left only by an operator
**Severity:** Positive
**Where:** `src/state.ts`
**Issue:** —
**Impact:** the UI never offers an automatic retry of an uncertain send
**Remediation / evidence:** `tests/vectors.test.ts` state-machine cases

### F3 — Positive: the route contract separates the admin and public prefixes
**Severity:** Positive
**Where:** `src/routes.ts`
**Issue:** —
**Impact:** a public route can never be a write or an admin path
**Remediation / evidence:** `tests/routes.test.ts`; service contract job

### F4 — Counters, renderers and segmentation reproduce the server's vectors
**Severity:** Positive (was Info, DEFERRED)   **Disposition:** RESOLVED (2026-10-29)
**Where:** `src/text/{markup,render,count,segment,intent}.ts`
**Issue:** —
**Impact:** Previews equal what the server will validate: the same markup subset, renderers (Telegram HTML escapes
`< > & "`; link text and URLs are escaped per markup), counters and segmentation, with code-point offsets. The
generated `vectors.json` comes from the Rust implementation; this port must reproduce every case.
**Remediation / evidence:** `tests/text.test.ts`, `tests/vectors.test.ts` (every counting, rendering, segmentation and
intent case of the file); renderers return text, never HTML for a DOM sink except `telegram_html`, which is escaped.

## Section A — Invariant verification matrix

| # | Invariant (plain statement) | Enforced / asserted at (`file:fn`) | Proven by (test / code-assert / cross-project) | Status |
| --- | --- | --- | --- | --- |
| I1 | the enumerations and state machines equal the shared vectors | `src/model.ts`, `src/state.ts`, `vectors.json` | `tests/vectors.test.ts` | HOLDS |
| I2 | only the worker enters `sending`; `unknown` is left only by an operator | `src/state.ts` | `tests/vectors.test.ts` state-machine cases | HOLDS |
| I3 | the route contract separates the admin and public prefixes | `src/routes.ts` | `tests/routes.test.ts` | HOLDS |

## Section B — Supply-chain, publish-authority & capability matrix

### B.1 Dependency & CVE risk

| Dependency | Pinned version / rev / object ID | Liveness dependency? | CVE / audit status | Notes |
| --- | --- | --- | --- | --- |
| npm dev and runtime dependencies | `package-lock.json` | build only (no runtime dependencies) | 0 high/critical (2026-10-25) | |

### B.2 Publish authority, capabilities & secret custody

| Authority / capability / secret | Where minted / held | Custody | Gates | Immutability / rotation plan |
| --- | --- | --- | --- | --- |
| npm publish | CI on `v*` tags | GitHub OIDC (trusted publishing / keyless cosign) | releases | trusted publisher configured at R2 |

Actions pinned by SHA, `permissions: contents: read` by default, release gate = CI (`verify`), Dependabot present —
all hold (copied from the fleet workflows).

## Section C — Test-coverage & hermetic/live split

### C.1 Coverage grade

| Dimension | Assessment |
| --- | --- |
| Happy-path coverage | covered for what exists |
| Error-path / abort-code / failure-mode coverage | malformed markup falls back to text; bad intent templates and non-https bases are refused |
| Boundary / edge-case coverage | emoji sequences, combining marks, astral characters, URLs at segment boundaries, NFC |
| Security-relevant coverage | see Section A |

118 vitest tests (2026-10-29), `check:vectors` ok, lint and build ok, `npm audit` 0 vulnerabilities.

### C.2 Hermetic vs. live paths

| Path | Hermetic unit test? | Deferred to (localnet / testnet / running committee / live relay)? | Tracking |
| --- | --- | --- | --- |
| Against the live service | no | C5–C9 | deferred findings |

## Section D — Deployment-readiness gates

### pre-localnet
- [x] builds; lint, type-check and tests green — 2026-10-25
- [x] no secrets in source

### pre-testnet
- [x] `SECURITY.md` present
- [x] published with provenance (trusted publishing from the tag workflow) — 2026-10-30, R2
- [x] the route tables match the built service (contract job, 6/6 with the snapshot route) and drive the deployment's
  route-exposure check — 2026-10-29, C9

### pre-mainnet
- [ ] external review

## Cross-project themes

- **Supply chain & release integrity** — lockfile committed; actions pinned; audit gate in CI.
- **Wire-format coupling & conformance vectors** — `@meddleware/content-hub-client/vectors.json` (the client is its home;
  the service checks its copy).
- **On-chain-truth boundary** — the server decides; this project previews or displays.
- **Deployment readiness** — Section D.
- **Chain-access layering** — no Move package consumed.

## Normative requirements

- MUST keep the invariants of Section A (each HOLDS with its test).
- MUST NOT hold credentials, render untrusted text as markup, or contact a third-party origin.

## Implementation suggestions

- None beyond the deferred steps.

## Open questions

- None at the scaffold.

## Risks

- npm supply chain (mitigated by the lockfile and audit gate).

## Re-verification log

- 2026-10-29 — C6: route table gains `GET`/`PUT /api/v1/publishing` (the stop switch); the service's contract job passes
  3/3 against this package; 118 tests pass.

- 2026-10-29 — C5: the text engine port (F4 RESOLVED); vectors regenerated from the service's Rust implementation;
  118 tests pass.

- 2026-10-25 — first pass of the C4 scaffold.
- 2026-10-29 — C9: no change to the package; its route tables are the reference the deployment's route-exposure check reads from the service.
- 2026-10-30 — R2: `0.0.1` published to npm from CI with a Sigstore provenance statement; the service's contract job runs against it.
