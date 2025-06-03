import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import {resolve} from 'path'
import {version} from './package.json'

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        vue(),
    ],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        },
    },
    define: {
        __APP_VERSION__: JSON.stringify(version),
        'process.env.NODE_ENV': JSON.stringify('production'), // Fix "process is not defined"
    },
    build: {
        lib: {
            entry: resolve(__dirname, 'src/jslib/main.js'),
            name: 'GlycerineViewer',
            fileName: 'glycerine-viewer',
            formats: ['umd'],
        },
        outDir: 'jslib',
    }
})
