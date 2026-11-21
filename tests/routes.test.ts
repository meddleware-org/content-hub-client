/**
 * Tests for the route tables (`src/routes.ts`): the admin and public processes are kept apart by prefix, the public process serves only GET, and no route is listed twice. The service's
 * own contract job runs the same tables against its built binary.
 */
import { describe, expect, it } from 'vitest'

import { ADMIN_PREFIX, ADMIN_ROUTES, PROBE_ROUTES, PUBLIC_PREFIX, PUBLIC_ROUTES } from '../src/index.js'

describe('route contract', () => {
  // The two processes are exposed on different hosts; a route under the wrong prefix would be reachable (or unreachable) where it should not be.
  it('keeps the processes apart by prefix', () => {
    for (const r of ADMIN_ROUTES) expect(r.path.startsWith(`${ADMIN_PREFIX}/`), r.path).toBe(true)
    for (const r of PUBLIC_ROUTES) {
      expect(r.path.startsWith(`${PUBLIC_PREFIX}/`) || ['/llms.txt', '/robots.txt'].includes(r.path), r.path).toBe(true)
    }
  })

  // The public process is read-only by design: any other method there is a mistake.
  it('serves only GET publicly', () => {
    expect(PUBLIC_ROUTES.every((r) => r.method === 'GET')).toBe(true)
  })

  it('lists every route once', () => {
    const all = [...PROBE_ROUTES, ...PUBLIC_ROUTES, ...ADMIN_ROUTES].map((r) => `${r.method} ${r.path}`)
    expect(new Set(all).size).toBe(all.length)
  })
})
