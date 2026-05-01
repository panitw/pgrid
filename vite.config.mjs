import { defineConfig } from 'vite';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { readdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Collect every .html under a folder for Vite multi-page input.
function htmlInputs(dir, prefix) {
    return readdirSync(resolve(__dirname, dir))
        .filter(f => f.endsWith('.html'))
        .reduce((acc, f) => {
            const name = f.replace('.html', '');
            const key = prefix ? `${prefix}/${name}` : name;
            acc[key] = resolve(__dirname, dir, f);
            return acc;
        }, {});
}

export default defineConfig(({ command, mode }) => {
    // ----- Static-site build for GitHub Pages -----
    // npm run build:site
    if (command === 'build' && mode === 'site') {
        const base = process.env.PGRID_SITE_BASE || './';
        return {
            base,
            build: {
                outDir: 'site',
                emptyOutDir: true,
                rollupOptions: {
                    input: {
                        // Site root → docs landing
                        index: resolve(__dirname, 'docs/index.html'),
                        ...htmlInputs('docs', 'docs'),
                        ...htmlInputs('samples', 'samples')
                    }
                }
            }
        };
    }

    // ----- Library build (default) -----
    // npm run build
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

    // ----- Dev server -----
    return {
        server: {
            port: 8888,
            open: '/samples/index.html'
        }
    };
});
