import { build } from 'esbuild'
import { polyfillNode } from '@substrate-system/esbuild-plugin-polyfill-node'

// ESM
build({
    entryPoints: ['src/*.ts'],
    bundle: false,
    format: 'esm',
    keepNames: true,
    metafile: true,
    tsconfig: './tsconfig.build.json',
    outdir: './dist',
    sourcemap: true,
    plugins: [
        polyfillNode({
            polyfills: {
                crypto: true
            }
        }),
    ],
})

// ESM + minified
build({
    entryPoints: ['src/*.ts'],
    format: 'esm',
    bundle: true,
    minify: true,
    keepNames: true,
    tsconfig: './tsconfig.build.json',
    outdir: './dist',
    plugins: [
        polyfillNode({
            polyfills: {
                crypto: true
            }
        }),
    ],
    outExtension: {
        '.js': '.min.js'
    }
})

// CJS
build({
    entryPoints: ['src/*.ts'],
    format: 'cjs',
    bundle: false,
    minify: false,
    keepNames: true,
    tsconfig: './tsconfig.build.json',
    outdir: './dist',
    plugins: [
        polyfillNode({
            polyfills: {
                crypto: true
            }
        }),
    ],
    outExtension: {
        '.js': '.cjs'
    }
})

// CJS + minified
build({
    entryPoints: ['src/*.ts'],
    format: 'cjs',
    bundle: true,
    minify: true,
    keepNames: true,
    tsconfig: './tsconfig.build.json',
    outdir: './dist',
    plugins: [
        polyfillNode({
            polyfills: {
                crypto: true
            }
        }),
    ],
    outExtension: {
        '.js': '.min.cjs'
    }
})
