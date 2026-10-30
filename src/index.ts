// @meddleware/content-hub-client — the content hub's client-side contract.
//
// - model: the enumerations the API uses;
// - state: the server's state machines (for UI previews; the server decides);
// - routes: which routes each process serves, the API prefixes and the CSRF header;
// - vectors: the type of the shared golden vectors (`@meddleware/content-hub-client/vectors.json`).
//
// - text: the canonical post format, renderers, counters, segmentation and intent links (previews; the server decides).

export * from './model.js'
export * from './routes.js'
export * from './state.js'
export type { Vectors } from './vectors.js'
export { parse, scanUrl, type Spanned, type Token } from './text/markup.js'
export { render, renderSource, type Rendered } from './text/render.js'
export { count, graphemes, X_URL_WEIGHT, type CountRules } from './text/count.js'
export { segment, fits, type Band, type Limits, type Segmentation, type SegmentTarget } from './text/segment.js'
export { fillIntent, IntentError } from './text/intent.js'
export { check, limitsForTarget, limitsFromDefinition, type Check, type DefinitionLimits } from './text/limits.js'
