import { build } from 'esbuild'
import { polyfillNode } from '@substrate-system/esbuild-plugin-polyfill-node'

// esm
build({
    entryPoints: ['test/index.ts'],
    bundle: true,
    format: 'esm',
    keepNames: true,
    tsconfig: './tsconfig.build.json',
    outfile: './test/test-bundle.js',
    sourcemap: true,
    plugins: [
        polyfillNode({
            polyfills: {
                crypto: true
            }
        }),
    ],
})
