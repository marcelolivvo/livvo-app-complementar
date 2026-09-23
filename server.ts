import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: Search Artist Photos & Posters via Deezer & iTunes (No CORS, No Script Error)
  app.get('/api/artist-search', async (req, res) => {
    const query = String(req.query.q || '').trim();
    if (!query) {
      return res.status(400).json({ error: 'Query param "q" is required' });
    }

    try {
      // 1. Search Artist portrait on Deezer
      const artistPromise = fetch(`https://api.deezer.com/search/artist?q=${encodeURIComponent(query)}&limit=5`)
        .then((r) => (r.ok ? r.json() : { data: [] }))
        .catch(() => ({ data: [] }));

      // 2. Search Tour / Album Posters on Deezer
      const albumPromise = fetch(`https://api.deezer.com/search/album?q=${encodeURIComponent(query)}&limit=6`)
        .then((r) => (r.ok ? r.json() : { data: [] }))
        .catch(() => ({ data: [] }));

      // 3. Search on iTunes as secondary high-res source
      const itunesPromise = fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=album&limit=4`)
        .then((r) => (r.ok ? r.json() : { results: [] }))
        .catch(() => ({ results: [] }));

      const [artistData, albumData, itunesData] = await Promise.all([
        artistPromise,
        albumPromise,
        itunesPromise,
      ]);

      const artists = (artistData.data || []).map((a: any) => ({
        id: a.id,
        name: a.name,
        photoUrl: a.picture_xl || a.picture_big || a.picture_medium,
        thumbnailUrl: a.picture_medium || a.picture_small,
        source: 'deezer',
      }));

      const posters = (albumData.data || []).map((alb: any) => ({
        id: alb.id,
        title: alb.title,
        artistName: alb.artist?.name,
        posterUrl: alb.cover_xl || alb.cover_big || alb.cover_medium,
        thumbnailUrl: alb.cover_medium,
        source: 'deezer',
      }));

      // Merge itunes high-res posters
      if (itunesData.results && itunesData.results.length > 0) {
        for (const item of itunesData.results) {
          if (item.artworkUrl100) {
            posters.push({
              id: `itunes-${item.collectionId || Math.random()}`,
              title: item.collectionName || query,
              artistName: item.artistName || query,
              posterUrl: item.artworkUrl100.replace('100x100bb', '1000x1000bb'),
              thumbnailUrl: item.artworkUrl100,
              source: 'itunes',
            });
          }
        }
      }

      return res.json({
        query,
        bestPhotoUrl: artists[0]?.photoUrl || posters[0]?.posterUrl || null,
        bestPosterUrl: posters[0]?.posterUrl || null,
        artists,
        posters,
      });
    } catch (err: any) {
      console.error('Erro na rota /api/artist-search:', err);
      return res.status(500).json({ error: 'Falha ao buscar mídias do artista' });
    }
  });

  // API Route: Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'show-card-api' });
  });

  // Vite middleware in development or static serve in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Show Card server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
