import http from 'http';
import https from 'https';
import { promises as fs } from 'fs';

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY || 'be5922e28b9b4f7e8c1000041e936493';

const server = http.createServer(async (req, res) => {
  if (req.url.startsWith('/api')) { // IF PROXY API REQUEST
    return https.get({
      hostname: 'newsapi.org',
      path: req.url.replace('/api', '/v2'),
      headers: { 'X-Api-Key': API_KEY, 'User-Agent': 'nodejs' },
    }, (apiRes) => { apiRes.pipe(res); });
  }
  else { // OTHERWISE, RENDER APP
    const [js, css] = await Promise.all([
      'src/news.js',
      'src/news.css',
    ].map(async function loadAsset(path) {
      const buff = await fs.readFile(path);
      return buff.toString()
    }));

    res.end(`<!DOCTYPE html>
    <html>
      <head>
        <title>News Reader</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="stylesheet" href="https://use.typekit.net/agw6wib.css">
        <style>${css}</style>
      </head>
      <body>
        <script type="module">${js}</script>
      </body>
    </html>`);
  }
});

server.listen(PORT, () => {
  console.log(`serving at http://localhost:${PORT}`);
});
