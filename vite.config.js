import {fileURLToPath, URL} from 'node:url'

import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import {resolve} from 'path'
import {version} from './package.json'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        vue(),
    ],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
    },
    define: {
        __APP_VERSION__: JSON.stringify(version),
    },
    build: {
        lib: {
            entry: resolve(__dirname, 'src/main.js'),
            name: 'GlycerineViewer',
            fileName: (format) => `glycerine-viewer.${format}.js`,
        },
        rollupOptions: {
            external: [
                'vue',
                '@recogito/annotorious-openseadragon',
                'axios',
                'moment',
                'openseadragon',
                'primeflex',
                'primeicons',
                'primevue',
                /primevue\/.*/,
                /primeflex\/.*/,
                /primeicons\/.*/,
            ],
            output: {
                // Provide global variables to use in the UMD build
                // for externalized deps
                globals: {
                    vue: 'Vue',
                    axios: 'axios',
                    moment: 'moment',
                    openseadragon: 'OpenSeadragon',
                    '@recogito/annotorious-openseadragon': 'Annotorious',
                },
            },
        },
    }
});
