/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import dts from 'vite-plugin-dts'
import {libInjectCss} from 'vite-plugin-lib-inject-css'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), libInjectCss(), dts({tsconfigPath: './tsconfig.build.json', include: ['lib']})],
  test: {
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    clearMocks: true,
    coverage: {
        provider: 'v8',
        reporter: ['cobertura', 'html'],
    },
},
  build: {
    copyPublicDir: false,
    rollupOptions: {
        external: ['react', 'react/jsx-runtime']
    },
    lib: {
        entry: resolve(__dirname, 'lib/main.tsx'),
        formats: ['es'],
    }
  }
})
