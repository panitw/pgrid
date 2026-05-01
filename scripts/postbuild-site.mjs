// Post-processing for `vite build --mode site`.
// Writes a top-level redirect to /docs/ and a .nojekyll marker so GitHub
// Pages serves files whose names start with an underscore.

import { writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const siteDir = resolve(__dirname, '..', 'site');

mkdirSync(siteDir, { recursive: true });

writeFileSync(
    resolve(siteDir, 'index.html'),
    `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>PGrid</title>
    <meta http-equiv="refresh" content="0; url=./docs/index.html">
    <link rel="canonical" href="./docs/index.html">
</head>
<body>
    <p>Redirecting to <a href="./docs/index.html">PGrid documentation</a>…</p>
</body>
</html>
`
);

// .nojekyll prevents GitHub Pages from filtering files starting with '_'
// (e.g. our _shared.css and _data.js if they ever land at site root).
writeFileSync(resolve(siteDir, '.nojekyll'), '');

console.log('postbuild-site: wrote index.html redirect and .nojekyll');
