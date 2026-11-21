// Vitest settings for the offline unit suite: `npm test`. There is no live suite: the package makes no network call, and the service runs the same vectors against itself.
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Node, not jsdom: the package has no DOM code (`Intl.Segmenter` and `TextEncoder` are built in).
    environment: 'node',
    // Offline unit suite.
    include: ['tests/**/*.test.ts'],
    exclude: ['node_modules/**'],
  },
})
