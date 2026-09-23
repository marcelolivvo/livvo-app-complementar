import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: Search Artist Photos & Posters via Deezer, iTunes, Wikimedia Commons & Wikipedia (Free & Open APIs)
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

      // 4. Search on Wikipedia / Wikimedia Commons (Free public domain encyclopedia photos)
      const wikiPromise = fetch(`https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrlimit=3&prop=pageimages&format=json&pithumbsize=1000`)
        .then((r) => (r.ok ? r.json() : {}))
        .catch(() => ({}));

      // 5. Search on pt.wikipedia.org for Brazilian artists
      const ptWikiPromise = fetch(`https://pt.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrlimit=3&prop=pageimages&format=json&pithumbsize=1000`)
        .then((r) => (r.ok ? r.json() : {}))
        .catch(() => ({}));

      const [artistData, albumData, itunesData, wikiData, ptWikiData] = await Promise.all([
        artistPromise,
        albumPromise,
        itunesPromise,
        wikiPromise,
        ptWikiPromise,
      ]);

      const normQuery = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
      const alphanumericQuery = normQuery.replace(/[^a-z0-9]/g, '');

      // Strict match helper: validates if candidate name legitimately matches query
      const isLegitMatch = (cand: string): boolean => {
        if (!cand) return false;
        const normCand = cand.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
        const alphaCand = normCand.replace(/[^a-z0-9]/g, '');
        if (!alphaCand || !alphanumericQuery) return false;
        if (alphaCand === alphanumericQuery) return true;
        // Prefix "the" handling
        if (alphaCand === `the${alphanumericQuery}` || alphanumericQuery === `the${alphaCand}`) return true;
        // Junior / Jr handling
        const expCand = alphaCand.replace(/junior/g, 'jr');
        const expQuery = alphanumericQuery.replace(/junior/g, 'jr');
        if (expCand === expQuery) return true;
        // Close word boundary match
        if (normCand === normQuery) return true;
        return false;
      };

      const artists: any[] = [];
      const posters: any[] = [];

      // Process Deezer artists - check name similarity strictly to prevent mismatched artist photos
      (artistData.data || []).forEach((a: any) => {
        const photoUrl = a.picture_xl || a.picture_big || a.picture_medium;
        if (!photoUrl || photoUrl.includes('/artist//')) return; // skip placeholder/empty images

        const isExactMatch = isLegitMatch(a.name);
        const normArtistName = (a.name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
        const isSubstringMatch = normArtistName.startsWith(normQuery) || (normQuery.length >= 6 && normArtistName.includes(normQuery));

        const item = {
          id: `dz-${a.id}`,
          name: a.name,
          photoUrl,
          thumbnailUrl: a.picture_medium || a.picture_small,
          source: 'deezer',
          isExactMatch,
        };

        if (isExactMatch) {
          artists.unshift(item);
        } else if (isSubstringMatch) {
          artists.push(item);
        }
      });

      // Process Wikipedia & Wikimedia Commons images (Free licenses)
      const wikiPages = {
        ...((wikiData as any)?.query?.pages || {}),
        ...((ptWikiData as any)?.query?.pages || {}),
      };

      Object.values(wikiPages).forEach((page: any) => {
        if (page?.thumbnail?.source) {
          const title = page.title || query;
          const isExactMatch = isLegitMatch(title);
          const normTitle = title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
          const isSubstringMatch = normTitle.startsWith(normQuery) || (normQuery.length >= 6 && normTitle.includes(normQuery));

          const wikiItem = {
            id: `wiki-${page.pageid || Math.random()}`,
            name: title,
            photoUrl: page.thumbnail.source,
            thumbnailUrl: page.thumbnail.source,
            source: 'wikimedia',
            isExactMatch,
          };

          if (isExactMatch) {
            artists.splice(1, 0, wikiItem);
          } else if (isSubstringMatch) {
            artists.push(wikiItem);
          }
        }
      });

      // Process Deezer album / tour posters (strictly check album artist if available)
      (albumData.data || []).forEach((alb: any) => {
        const posterUrl = alb.cover_xl || alb.cover_big || alb.cover_medium;
        if (posterUrl && !posterUrl.includes('/cover//')) {
          const artistMatches = !alb.artist?.name || isLegitMatch(alb.artist.name);
          if (artistMatches) {
            posters.push({
              id: `dz-alb-${alb.id}`,
              title: alb.title,
              artistName: alb.artist?.name || query,
              posterUrl,
              thumbnailUrl: alb.cover_medium,
              source: 'deezer',
            });
          }
        }
      });

      // Merge itunes high-res posters (strictly verify artist name)
      if (itunesData.results && itunesData.results.length > 0) {
        for (const item of itunesData.results) {
          if (item.artworkUrl100) {
            const artistMatches = !item.artistName || isLegitMatch(item.artistName);
            if (artistMatches) {
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
      }

      // Best photo calculation: ONLY accept verified exact matches
      const exactArtist = artists.find((a) => a.isExactMatch);
      const bestPhoto = exactArtist ? exactArtist.photoUrl : (artists[0]?.isExactMatch ? artists[0].photoUrl : null);
      const bestPoster = posters[0]?.posterUrl || null;

      return res.json({
        query,
        bestPhotoUrl: bestPhoto,
        bestPosterUrl: bestPoster,
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
