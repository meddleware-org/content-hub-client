// The HTTP contract: which routes each process serves. The service's route tables are the same list; the
// service's contract job runs this package against the built binary and fails on any difference.

export type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export interface Route {
  readonly method: Method
  /** A path pattern; `{name}` is a path parameter. */
  readonly path: string
}

/** Same-origin prefix of the admin API (host hub., behind Cloudflare Access). */
export const ADMIN_PREFIX = '/api/v1'
/** Prefix of the public API (hosts roadmap. and feeds.). */
export const PUBLIC_PREFIX = '/public/v1'

/** Served by both processes. */
export const PROBE_ROUTES: readonly Route[] = [
  { method: 'GET', path: '/healthz' },
  { method: 'GET', path: '/readyz' },
]

/** The public process: GET only. */
export const PUBLIC_ROUTES: readonly Route[] = [
  { method: 'GET', path: '/public/v1/roadmap' },
  { method: 'GET', path: '/public/v1/roadmap-bot' },
  { method: 'GET', path: '/public/v1/feed.json' },
  { method: 'GET', path: '/public/v1/feed.xml' },
  { method: 'GET', path: '/public/v1/snapshot' },
  { method: 'GET', path: '/public/v1/openapi.json' },
  { method: 'GET', path: '/llms.txt' },
  { method: 'GET', path: '/robots.txt' },
]

/** The admin process. State-changing methods need the CSRF header ({@link CSRF_HEADER}). */
export const ADMIN_ROUTES: readonly Route[] = [
  { method: 'GET', path: '/api/v1/me' },
  { method: 'GET', path: '/api/v1/openapi.json' },
  { method: 'GET', path: '/api/v1/phases' },
  { method: 'POST', path: '/api/v1/phases' },
  { method: 'GET', path: '/api/v1/phases/{id}' },
  { method: 'PATCH', path: '/api/v1/phases/{id}' },
  { method: 'GET', path: '/api/v1/items' },
  { method: 'POST', path: '/api/v1/items' },
  { method: 'GET', path: '/api/v1/items/{id}' },
  { method: 'PATCH', path: '/api/v1/items/{id}' },
  { method: 'GET', path: '/api/v1/tasks' },
  { method: 'POST', path: '/api/v1/tasks' },
  { method: 'GET', path: '/api/v1/tasks/{id}' },
  { method: 'PATCH', path: '/api/v1/tasks/{id}' },
  { method: 'POST', path: '/api/v1/tasks/{id}/transition' },
  { method: 'POST', path: '/api/v1/tasks/{id}/links' },
  { method: 'DELETE', path: '/api/v1/tasks/{id}/links/{link_id}' },
  { method: 'GET', path: '/api/v1/posts' },
  { method: 'POST', path: '/api/v1/posts' },
  { method: 'GET', path: '/api/v1/posts/{id}' },
  { method: 'PATCH', path: '/api/v1/posts/{id}' },
  { method: 'POST', path: '/api/v1/posts/{id}/enqueue' },
  { method: 'GET', path: '/api/v1/instances' },
  { method: 'GET', path: '/api/v1/instances/{id}' },
  { method: 'POST', path: '/api/v1/instances/{id}/transition' },
  { method: 'GET', path: '/api/v1/platforms' },
  { method: 'PATCH', path: '/api/v1/platforms/{id}' },
  { method: 'GET', path: '/api/v1/targets' },
  { method: 'POST', path: '/api/v1/targets' },
  { method: 'PATCH', path: '/api/v1/targets/{id}' },
  { method: 'GET', path: '/api/v1/budgets' },
  { method: 'PUT', path: '/api/v1/budgets' },
  { method: 'GET', path: '/api/v1/publishing' },
  { method: 'PUT', path: '/api/v1/publishing' },
  { method: 'GET', path: '/api/v1/preview/roadmap' },
  { method: 'GET', path: '/api/v1/schedule' },
  { method: 'GET', path: '/api/v1/stats' },
  { method: 'GET', path: '/api/v1/audit' },
]

/** The custom header every state-changing admin request carries (with a same-origin `Origin`). A
 * cross-site form cannot set it. */
export const CSRF_HEADER = 'X-Content-Hub-Request'
