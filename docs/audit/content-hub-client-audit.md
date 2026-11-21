# Security Audit — `content-hub-client`

**Classification:** Internal security review
**Project:** repos/content-hub-client (the content hub client contract: routes, enumerations, state machines, golden vectors)
**Project type:** TS SDK
**Template:**

- AUDIT_TEMPLATE.md (2026-11-01)
- AUDIT_TEMPLATE_TS.md (2026-11-01)
- **Added 2026-11-21 (Part B documentation pass):** AUDIT_TEMPLATE_DOCS.md (2026-11-20); AUDIT_TEMPLATE_RFC.md (2026-11-19), partial: URLs, percent-encoding and the markups the renderers
  produce; AUDIT_TEMPLATE_IOP.md (2026-11-19), partial: the shared vectors and public API; AUDIT_TEMPLATE_PRIV.md (2026-11-20), partial: nothing is stored or requested.

**Package manager / lockfile:** npm 11, package-lock.json committed
**Module format:** ESM
**Publish model:** ships the TypeScript source, the compiled JavaScript, declarations and source maps (`dist/`, built by `prepublishOnly`), and `vectors.json` (npm; corrected 2026-11-21, F5)
**Runtime targets:** browser, Node ≥ 24
**Peer dependencies:** none
**Deployment status:** *(Current, 2026-11-21: npm **`0.0.1` is `latest`** (tag `v0.0.1` = `fd2403a`); three documentation or CI commits since the tag, nothing under `src/`. The tarball is 49 files, 176.2 kB
unpacked, 41.0 kB packed (`npm pack --dry-run`). One package depends on it, `content-hub-ui`, at exactly `0.0.1`. One Dependabot pull request is open (#4, the minor and patch group, 2 updates).)* Published on npm (0.0.1, with provenance, 2026-10-30); used by the console and the service's contract job
**Review date:** 2026-10-25 · delta review 2026-11-05 (0.0.1 as published; no finding changed)
**Reviewer:** Internal review
**Severity ceiling:** Low — pure data and functions, no runtime dependencies, no credentials; the server enforces everything this package describes
**Status:** published 0.0.1; 129 vitest tests, `check:vectors` ok, `npm audit --audit-level=high` passes (2026-11-05; nine moderate advisories remain in the dev-tool chain, see the log)


**Front matter (DOCS, RFC, IOP and PRIV lenses, added 2026-11-21):**

| Field | Value |
| --- | --- |
| Documentation status | ledger (workspace `docs/audit/DOCS_LEDGER.tsv`): done (32 rows at 7e16982; 35 files, 3 excluded, comment ratio 0.34) (2026-11-21 pass) |
| Required documents | README, CHANGELOG, SECURITY, CONTRIBUTING (added 2026-11-21), LICENSE (0BSD), CLAUDE.md, AGENTS.md: all present |
| Doc lints | `check-docs.mjs` (workspace) is the gate. The shared `eslint-plugin-jsdoc` fragment is switched on here after the Phase 5 release of `@meddleware/eslint-config` |
| Standards spoken | URL syntax and percent-encoding (RFC 3986) — `fillIntent` encodes every value and requires an https result; Unicode text segmentation (UAX #29, through `Intl.Segmenter`) and NFC (UAX #15) — graphemes and X's weighting; CommonMark (a small subset, ported from the Rust parser) — the canonical post format; HTML escaping (Telegram), Markdown (Discord and generic) and BBCode — the renderers' targets; JSON (RFC 8259) — `vectors.json`; SPDX `0BSD`, Sigstore / SLSA — as the other packages |
| Deviations | the CommonMark subset is deliberately small (bold, italic, code, links, bare URLs, bullets, breaks), and the Telegram, Discord and BBCode renderers follow each platform's own dialect, not a standard |
| Drafts relied on | none |
| Data a person can take away | none held: the package computes on text it is given |
| Personal data | none held; a post's text is processed in memory only |

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

### Part B documentation pass (2026-11-21)

Scope: every tracked file read against the workspace's `docs/operations/DOCUMENTATION_STANDARD.md` and annotated (Part B Phase 1, the thirteenth repository, the sixth of the clients); the DOCS, RFC, IOP
and PRIV lenses applied for the first time. Before and after editing: `npm ci`, type-check, lint, the 129 tests, `npm run check:vectors`, the build and `npm audit --audit-level=high` (exit 0) passed; the audit lists nine *moderate* advisories, all one `minimatch` denial-of-service advisory
(GHSA-g3hv-75wg-m249) reached through the dev-only eslint toolchain (nothing ships it, and the package has no runtime dependencies), below the CI gate. The
diff is comment-only: the TypeScript compiles to identical output with comments removed, the YAML parses to identical values (the shell comments inside `run:` blocks aside), and `.gitignore` and the JSON
configurations parse alike. No defect was found in the code.

### F5 — Documentation drift found by the documentation pass
**Severity:** Low   **Disposition:** RESOLVED (2026-11-21, unreleased)
**Where:** this audit, `README.md`, `CLAUDE.md`, `src/model.ts`.
**Issue:** (1) the audit's executive summary still read "A scaffold … Nothing is published" and its publish model "ships TS source + declarations", although 0.0.1 is published with compiled JavaScript;
(2) the README's Development section was one command line, and CLAUDE.md had no Commands, Gotchas or Related section (the hand-copied `vectors.json`, the compiled output and the code-point offsets were
unsaid); (3) there was no `CONTRIBUTING.md`; (4) `src/model.ts` (32 exported declarations), the route and state modules and every file of the text engine had no doc comments.
**Impact:** none on the shipped code. A reader could not tell what is published or what the enumerations mean.
**Remediation / evidence:** the facts above are checked against npm and the consumers' manifests; the documents are completed; every declaration is documented.

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

### B.DOCS-1 Ledger state

Ledger: 32 files `done` at the pass commit, 3 excluded (the lockfile and generated or binary files), 0 pending. Gate: `node scripts/check-docs.mjs --report content-hub-client` gives 35 files, 30 measured, 30 meeting the standard, header 100 %, declaration docs 100 %, comment ratio 0.34, no TODOs, no broken links.

### B.DOCS-2 Commands run

Every command in the README's Development section, CLAUDE.md's Commands section and CONTRIBUTING.md was run on 2026-11-21 and gave what the documents say: `npm ci`, `npm run type-check`,
`npm run lint`, `npm test` (129 tests), `npm run check:vectors`, `npm run build`, `npm audit --audit-level=high` (exit 0) and `npm pack --dry-run` (49 files).

### B.DOCS-3 Generated documentation

`docs/INTEROP.md` is generated by the workspace's `scripts/interop/gen-interop.py` from `config/interop.yaml`. `vectors.json` is generated by the Rust service's tests and copied here (CLAUDE.md,
Gotchas); `dist/` is built by `npm run build` and not tracked.

### B.RFC-1 Standards inventory

| Interface | Standard (and version) | Role | Where | Conformance evidence | Deviation |
| --- | --- | --- | --- | --- | --- |
| Intent links | URL syntax and percent-encoding (RFC 3986), https | implements | `src/text/intent.ts` | `tests/text.test.ts` | an https result is required (a `javascript:` base is refused) |
| Text counting | Unicode text segmentation (UAX #29, `Intl.Segmenter`), NFC (UAX #15) | consumes | `src/text/count.ts` | the counting vectors | X's weighting is X's own rule, ported |
| Post format | CommonMark (a small subset) | implements the parser | `src/text/markup.ts` | the rendering vectors (the Rust parser is the reference) | deliberately a subset |
| Renderers | Markdown, Discord Markdown, Telegram HTML, BBCode | implements | `src/text/render.ts` | the rendering vectors | each follows its platform's dialect, not a standard |
| Fixture | JSON (RFC 8259) | consumes | `vectors.json` | `scripts/check-vectors.mjs`, `tests/vectors.test.ts` | — |
| Provenance | Sigstore / SLSA (npm provenance) | consumes | `npm-publish.yml` | `dist.attestations` on npm | — |

### B.IOP-1 Export and exit drill

Not applicable: the package holds no data. The contract it describes (routes, enumerations, state machines, vectors) is published and any other client can implement it and test against `vectors.json`.

### B.IOP-2 Exit register entries

npm (publication) and GitHub Actions (CI). No run-time dependency on a third party: the package has no runtime dependencies.

### B.IOP-3 API stability

The public API is everything exported from `src/index.ts` and `./vectors.json`. Versioning is patch-only until mainnet (workspace policy), so a consumer's pin is exact; changing an enumeration, a state machine
or a route is a coordinated change with the service, announced in `CHANGELOG.md`.

### B.PRIV-1 / B.PRIV-2 / B.PRIV-3 Privacy inventories

Personal data: none held. Nothing is stored in a browser or on disk, no request is made, there is no cookie, analytics or logging. Recorded 2026-11-21.

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
- [ ] external review (ADR-0009 gate G4: not a launch gate; covered by redeploy and the audit pass)

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

**Lens baselines (DOCS, RFC, IOP, PRIV), first recorded 2026-11-21:**

| ID | Holds? | Evidence |
| --- | --- | --- |
| DOCS-M1 | yes (all seven documents; 0BSD; CHANGELOG with an Unreleased section) | B.DOCS-1 |
| DOCS-M2 | yes (every file's header and every declaration documented; ledger rows done) | `check-docs.mjs --report content-hub-client` |
| DOCS-M3 | yes (the vectors' home, the compiled output and the offsets rule are in CLAUDE.md) | CLAUDE.md |
| DOCS-M4 | yes (commands run, links resolve, ids exist) | B.DOCS-2 |
| DOCS-M5 | yes (no TODO, FIXME, XXX or HACK) | `check-docs.mjs` |
| DOCS-M6 | yes (CLAUDE.md verified against the code, F5; AGENTS.md points to it) | this pass |
| DOCS-M7 | yes (no secrets or private data) | inspection |
| RFC-M1 to RFC-M7 | yes where they apply (B.RFC-1); M5 is the hosts', not a package's | B.RFC-1 |
| IOP-M3, IOP-M5 | yes (B.IOP-3; no data, no ads, no tracking); IOP-M1, M2, M4, M6, M7: not applicable (no data, no service) | B.IOP-1 to 3 |
| PRIV-M1 to PRIV-M8 | yes: nothing stored, nothing requested | B.PRIV |

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
- 2026-11-05 — delta review of 0.0.1 as published (the first pass was the C4 scaffold of 2026-10-25, 9 tests; the status line still said so). Read the whole `src/` (338 lines outside `src/text`; `src/text/limits.ts` — `limitsFromDefinition`, `limitsForTarget`, `check`, which no entry had covered — and the rest of the text engine), the route table and `scripts/check-vectors.mjs`. `limits.ts` is pure arithmetic over a definition's limit columns and a target's configuration (`instance_limits`, Discord `embed`), clamped to the u32 range the server uses, and every branch is pinned by the `limits` section of `vectors.json` (generated by the Rust implementation); the package makes no network call, uses no `eval`, DOM sink or dynamic import, and has no runtime dependency. Ran: `npm run type-check`, `lint`, `test` (3 files, 129 tests), `check:vectors` (ok), `npm run build`, `npm audit --audit-level=high` (exit 0; nine **moderate** advisories remain, all in the dev-tool chain `eslint` → `@eslint/config-array` → `minimatch` (GHSA-g3hv-75wg-m249) and `@typescript-eslint/*`; none is shipped), `npm pack --dry-run` (49 files: `dist`, `src`, `vectors.json`, README, CHANGELOG, LICENSE, package.json — no test, config or secret file); `vectors.json` is byte-identical to the service's copy (`cmp`). npm registry: `latest` is 0.0.1 with the `placeholder` tag at `0.0.0-rename.0` (the maintainer's deprecation task). No finding changed and none was added. Lens check: A11Y not triggered (no UI); the TS lens' first-party shared-tooling row (2026-11-01) does not apply (this package consumes none); base and TS dates re-cited to the 2026-11-01 registry. Not re-verified: the provenance attestation of 0.0.1 (read at release, 2026-10-30).
- 2026-11-21 — Part B documentation pass and first application of the DOCS, RFC, IOP and PRIV lenses (above, "Part B documentation pass"). Baseline before editing: `npm ci`, type-check, lint, 129 tests,
  `check:vectors`, the build, `npm audit --audit-level=high`. Every tracked file annotated to the documentation standard (headers, doc comments on every declaration, a reason beside each statement group,
  the text parser documented pass by pass); `CONTRIBUTING.md` added; README Development section; CLAUDE.md Commands, Gotchas and Related. Found and fixed **F5** (documentation drift: the audit still called
  the package an unpublished scaffold). No defect found in the code. Verified live: npm `0.0.1` latest; one consumer read from its manifest; Dependabot #4 open. Re-run after editing: the same commands, all
  passing; the diff proven comment-only. Counts: F1 to F5.
- [x] 2026-11-21: Template line cites DOCS, RFC, IOP and PRIV with their registry dates; their front-matter fields, Section B subsections and MUST rows added; F5 recorded in the findings and the log;
  the deployment status, packaging, test counts and consumers current.
