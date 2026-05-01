import { defineConfig } from 'vite';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ command }) => {
    if (command === 'build') {
        return {
            build: {
                outDir: 'dist',
                emptyOutDir: true,
                sourcemap: true,
                cssCodeSplit: false,
                lib: {
                    entry: resolve(__dirname, 'src/index.js'),
                    name: 'PGrid',
                    fileName: () => 'pgrid.js',
                    formats: ['umd']
                },
                rollupOptions: {
                    output: {
                        assetFileNames: (asset) =>
                            asset.name && asset.name.endsWith('.css')
                                ? 'pgrid.css'
                                : 'assets/[name]-[hash][extname]'
                    }
                }
            }
        };
    }

    return {
        server: {
            port: 8888,
            open: '/samples/index.html'
        }
    };
});
