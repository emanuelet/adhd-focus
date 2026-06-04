import { injectManifest } from 'workbox-build'
import { resolve } from 'node:path'
import { build } from 'vite'

const root = process.cwd()
const distClient = resolve(root, 'dist/client')
const swSrc = resolve(root, 'src/sw.ts')
const swDest = resolve(distClient, 'sw.js')

await build({
  configFile: false,
  build: {
    lib: {
      entry: swSrc,
      formats: ['es'],
      fileName: 'sw',
    },
    outDir: distClient,
    emptyOutDir: false,
    minify: true,
    rollupOptions: {
      output: { entryFileNames: 'sw-raw.js' },
    },
  },
})

const { count, size } = await injectManifest({
  swSrc: resolve(distClient, 'sw-raw.js'),
  swDest,
  globDirectory: distClient,
  globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
  injectionPoint: 'self.__WB_MANIFEST',
})

console.log(`✓ Service worker generated: ${count} files, ${(size / 1024).toFixed(1)} KB`)
