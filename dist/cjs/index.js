'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var vite = require('vite');
var flowRemoveTypes = require('flow-remove-types');
var fs = require('fs/promises');

// import type { ViteReactNativeWebOptions } from '../types'
const development = process.env.NODE_ENV === 'development';
const extensions = [
    '.web.mjs',
    '.mjs',
    '.web.js',
    '.js',
    '.web.mts',
    '.mts',
    '.web.ts',
    '.ts',
    '.web.jsx',
    '.jsx',
    '.web.tsx',
    '.tsx',
    '.json',
];
const loader = {
    '.js': 'jsx',
};
const filter = /\.(js|flow)$/;
const esbuildPlugin = () => ({
    name: 'react-native-web',
    setup: (build) => {
        build.onLoad({ filter }, async ({ path }) => {
            const src = await fs.readFile(path, 'utf-8');
            return {
                contents: flowRemoveTypes(src).toString(),
                loader: loader['.js'],
            };
        });
    },
});
const reactNativeWeb = ( /*options: ViteReactNativeWebOptions = {}*/) => ({
    enforce: 'pre',
    name: 'react-native-web',
    config: () => ({
        define: {
            __DEV__: JSON.stringify(development),
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
        },
        resolve: {
            extensions,
            alias: [{ find: 'react-native', replacement: 'react-native-web' }],
        },
        optimizeDeps: {
            esbuildOptions: {
                plugins: [esbuildPlugin()],
                resolveExtensions: extensions,
            },
        },
    }),
    async transform(code, id) {
        if (!filter.test(id)) {
            return;
        }
        let includeSourceMaps = true;
        // Do not include source maps for files that are using 'use client' pragma since these break the esbuild mappings (https://github.com/vitejs/vite/issues/15012)
        if (code.includes('\'use client\'') || code.includes('"use client"')) {
            includeSourceMaps = false;
        }
        if (code.includes('@flow')) {
            code = flowRemoveTypes(code).toString();
        }
        const result = await vite.transformWithEsbuild(code, id, {
            loader: loader['.js'],
            tsconfigRaw: {
                compilerOptions: {
                    jsx: 'react-jsx',
                },
            },
        });
        return {
            code: result.code,
            map: includeSourceMaps ? result.map : null,
        };
    },
});

exports.default = reactNativeWeb;
module.exports = Object.assign(exports.default, exports);
//# sourceMappingURL=index.js.map
