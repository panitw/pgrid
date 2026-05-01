// One-off helper: insert the shared docs-style top nav into each sample page,
// and mark "Samples" active on the samples landing page.

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const samplesDir = resolve(__dirname, '..', 'samples');

function navHtml(samplesActive) {
    const samplesAttr = samplesActive ? ' class="active"' : '';
    return `        <header class="docs-top">
            <a class="brand" href="../docs/index.html">PGrid <span class="tag">docs</span></a>
            <nav>
                <a href="../docs/getting-started.html">Getting Started</a>
                <a href="../docs/configuration.html">Configuration</a>
                <a href="../docs/data.html">Data</a>
                <a href="../docs/extensions.html">Extensions</a>
                <a href="../docs/api.html">API</a>
                <a href="./index.html"${samplesAttr}>Samples</a>
                <a href="https://github.com/panitw/pgrid">GitHub ↗</a>
            </nav>
        </header>
`;
}

const NAV_MARKER = '<header class="docs-top">';

for (const file of readdirSync(samplesDir)) {
    if (!file.endsWith('.html')) continue;
    const path = join(samplesDir, file);
    let html = readFileSync(path, 'utf8');

    if (html.includes(NAV_MARKER)) {
        console.log(`skip ${file} (already has nav)`);
        continue;
    }

    if (file === 'index.html') {
        // Landing — insert nav as first child of <body>, before .landing
        html = html.replace(
            /(<body>\s*)(\s*<div class="landing">)/,
            (_m, bodyTag, landing) => `${bodyTag}\n${navHtml(true)}${landing}`
        );
    } else {
        // Inner sample — insert nav as first child of .sample-page
        html = html.replace(
            /(<div class="sample-page">\s*)(\s*<div class="sample-header">)/,
            (_m, page, header) => `${page}\n${navHtml(false)}${header}`
        );
    }

    writeFileSync(path, html);
    console.log(`updated ${file}`);
}
