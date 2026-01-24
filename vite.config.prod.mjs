import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    build: {
        lib: {
            entry: path.resolve(__dirname, 'src/main.tsx'),
            name: 'main',
            fileName: () => 'main.js',
            formats: ['cjs']
        },
        rollupOptions: {
            external: [
                'obsidian',
                'electron',
                '@codemirror/view',
                '@codemirror/state',
                'fs',
                'path',
                'url',
                'crypto',
                'stream',
                'http',
                'https',
                'net',
                'tls',
                'zlib',
                'child_process',
                'os'
            ],
            output: {
                // Ensure default exports are handled correctly for CJS
                interop: 'auto',
                globals: {
                    obsidian: 'obsidian',
                },
            },
        },
        outDir: 'obsidian-release',
        emptyOutDir: false,
        target: 'es2020',
        sourcemap: 'inline',
        minify: false
    },
    // Prevent environment variable replacement that might break node modules
    define: {
        'process.env.NODE_ENV': '"production"'
    }
});
