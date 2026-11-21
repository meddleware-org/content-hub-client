// @meddleware/content-hub-client — the content hub's client-side contract.
//
// - model: the enumerations the API uses;
// - state: the server's state machines (for UI previews; the server decides);
// - routes: which routes each process serves, the API prefixes and the CSRF header;
// - vectors: the type of the shared golden vectors (`@meddleware/content-hub-client/vectors.json`).
//
// - text: the canonical post format, renderers, counters, segmentation and intent links (previews; the server decides).
//
// Role: the contract between the content hub's service and its UIs, kept in one package so neither side hard-codes the other's rules. Everything here is for PREVIEW and validation in a
// browser: the service always has the final say, and a shared set of golden vectors (`vectors.json`) is what keeps this package and the service from drifting apart.
// This file only re-exports.

// The enumerations, the route tables and the state machines.
export * from './model.js'
export * from './routes.js'
export * from './state.js'
// The type of the shared golden vectors.
export type { Vectors } from './vectors.js'
// The post text pipeline: parse the canonical markup, render it per platform, count and segment it, build intent links and check it against a platform's limits.
export { parse, scanUrl, type Spanned, type Token } from './text/markup.js'
export { render, renderSource, type Rendered } from './text/render.js'
export { count, graphemes, X_URL_WEIGHT, type CountRules } from './text/count.js'
export { segment, fits, type Band, type Limits, type Segmentation, type SegmentTarget } from './text/segment.js'
export { fillIntent, IntentError } from './text/intent.js'
export { check, limitsForTarget, limitsFromDefinition, type Check, type DefinitionLimits } from './text/limits.js'
