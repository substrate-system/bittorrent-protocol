import { build } from 'esbuild'
import { polyfillNode } from '@substrate-system/esbuild-plugin-polyfill-node'

// "build-cjs": "esbuild src/*.ts --format=cjs --keep-names --tsconfig=tsconfig.build.json --outdir=./dist --out-extension:.js=.cjs --sourcemap",
// "build-cjs:min": "esbuild src/*.ts --format=cjs --minify --keep-names --tsconfig=tsconfig.build.json --outdir=./dist --out-extension:.js=.min.cjs --sourcemap",
// "build-esm": "esbuild src/*.ts --format=esm --metafile=dist/meta.json --keep-names --tsconfig=tsconfig.build.json --outdir=./dist --sourcemap && tsc --emitDeclarationOnly --project tsconfig.build.json --outDir dist",
// "build-esm:min": "esbuild ./src/*.ts --format=esm --keep-names --bundle --tsconfig=tsconfig.build.json --minify --out-extension:.js=.min.js --outdir=./dist --sourcemap",

// esm
build({
    entryPoints: ['src/*.ts'],
    bundle: false,
    format: 'esm',
    keepNames: true,
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

// // bundle
// build({
//     entryPoints: ['src/*.ts'],
//     bundle: true,
//     format: 'esm',
//     keepNames: true,
//     tsconfig: './tsconfig.build.json',
//     outdir: './dist',
//     sourcemap: true,
//     plugins: [
//         polyfillNode({
//             // Options (optional)
//         }),
//     ],
// })
