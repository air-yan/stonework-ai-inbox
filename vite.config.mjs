import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            'obsidian': path.resolve(__dirname, './src/mocks/obsidian.ts')
        }
    },
    server: {
        port: 4000
    },
    build: {
        outDir: 'dist-web'
    }
});
