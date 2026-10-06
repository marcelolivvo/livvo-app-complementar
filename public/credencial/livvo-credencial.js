/* Livvo Credencial Backstage — componente com campos dinâmicos (DRAFT, 05/10/2026)

   Uso no HTML:
     <link rel="stylesheet" href="credencial-backstage/livvo-credencial.css">
     <script src="credencial-backstage/livvo-credencial.js" defer></script>
     <div data-livvo-credencial data-nome="Marcelo Ferreira" data-usuario="toboi" data-shows="112"
          data-numero="16" data-desde="2009" data-foto="/fotos/usuario.jpg"></div>

   Em JS:
     LivvoCredencial.render(elemento, { nome, usuario, shows, numero, desde, foto, nivel?, recortada? })
     LivvoCredencial.exportarPNG(dados)  -> Promise<Blob>  (PNG transparente 2239 x 3605 px: peça + margem do brilho)

   - nivel: calculado pelo nº de shows (Bronze até 10, Prata 11-25, Ouro 26-50, Platina 51-100, Lenda Viva 101+).
     Pode ser forçado com `nivel` ("Fã Platina", "platina"...).
   - acesso (tarja de baixo): sempre derivado do nível — PISTA, PISTA PREMIUM, CAMAROTE, BACKSTAGE, ALL ACCESS —
     em RAYDIS, sem distorção (duas linhas quando o rótulo tem duas palavras e isso deixa a letra maior).
   - foto: com fundo transparente (recortada) a pessoa fica sobre a moldura off-white, saindo pelo topo;
     com fundo comum, a foto entra dentro da moldura off-white, com borda creme em volta.
     A detecção é automática (borda transparente); `recortada: true/false` força o modo.
   Tudo é desenhado num <canvas> com as coordenadas da peça original (2143 x 3509 px, mais 48 px de margem
   em volta para o brilho Teal da tarja), então a tela
   e o PNG exportado saem idênticos. */
(function () {
  'use strict';
  var BASE = (function () {
    var s = document.currentScript && document.currentScript.src;
    return s ? s.replace(/[^\/]*$/, '') : '';
  })();

  // ------------------------------------------------------------------ geometria da peça (px no molde)
  var W = 2143, H = 3509;            // coordenadas da peça
  var PAD = 48;                      // margem transparente do molde (brilho da tarja)
  var WT = W + 2 * PAD, HT = H + 2 * PAD; // 2239 x 3605: tamanho total do canvas/PNG
  var MOLDES = [480, 960, 1440, WT];
  var SELO = { x: 1449, y: 1533, w: 535, h: 535 };
  var BOLINHA = { x: 1794, y: 2736, s: 156 };
  // moldura off-white (polígono) e área interna usada pela foto comum (30 px de borda creme)
  var MOLDURA_FOTO = [[976.3, 608], [1775.4, 608], [1898, 732.3], [1898, 1915], [369.3, 1915], [242, 1789.5], [242, 1419.6]];
  // foto recortada: pode sair por cima da moldura, mas respeita laterais e base
  var RECORTE_CLIP = [[212, 400], [1928, 400], [1928, 1945], [357, 1945], [212, 1802]];
  var RECORTE = { base: 1947, topo: 542, centroCabeca: 1067 };

  var COR = { texto: '#140827', arroba: '#150F2C', rotulo: '#0C112B', numero: '#05122A', pilula: '#7DCBDD', acesso: '#76CFDB' };

  var NIVEIS = [
    { max: 10, nivel: 'Fã Bronze', acesso: 'PISTA', chave: 'bronze' },
    { max: 25, nivel: 'Fã Prata', acesso: 'PISTA PREMIUM', chave: 'prata' },
    { max: 50, nivel: 'Fã Ouro', acesso: 'CAMAROTE', chave: 'ouro' },
    { max: 100, nivel: 'Fã Platina', acesso: 'BACKSTAGE', chave: 'platina' },
    { max: Infinity, nivel: 'Lenda Viva', acesso: 'ALL ACCESS', chave: 'lenda' }
  ];
  function nivelPorShows(n) {
    n = Math.max(0, parseInt(n, 10) || 0);
    for (var i = 0; i < NIVEIS.length; i++) if (n <= NIVEIS[i].max) return NIVEIS[i];
  }
  function nivelPorNome(nome) {
    var k = String(nome || '').toLowerCase();
    for (var i = 0; i < NIVEIS.length; i++) if (k.indexOf(NIVEIS[i].chave) >= 0) return NIVEIS[i];
    return null;
  }

  // ------------------------------------------------------------------ carregamento (fontes e imagens com cache)
  var FONTES = [
    ['LC Alfa Slab', 'alfa-slab-one', '400'],
    ['LC Barlow', 'barlow-500', '500'],
    ['LC Barlow', 'barlow-600', '600'],
    ['LC Barlow Condensed', 'barlow-condensed-500', '500'],
    ['LC Barlow Condensed', 'barlow-condensed-900', '900'],
    ['LC Raydis', 'raydis-num', '700']
  ];
  var fontesProntas = null;
  function carregarFontes() {
    if (fontesProntas) return fontesProntas;
    fontesProntas = Promise.all(FONTES.map(function (f) {
      var ff = new FontFace(f[0], 'url(' + BASE + 'fonts/' + f[1] + '.woff2) format("woff2")', { weight: f[2], style: 'normal' });
      document.fonts.add(ff);
      return ff.load();
    }));
    return fontesProntas;
  }

  var cacheImg = {};
  function carregarImg(src, cors) {
    var k = (cors ? 'c:' : 'n:') + src;
    if (!cacheImg[k]) {
      cacheImg[k] = new Promise(function (ok, erro) {
        var im = new Image();
        if (cors) im.crossOrigin = 'anonymous';
        im.decoding = 'async';
        im.onload = function () { ok(im); };
        im.onerror = function () { erro(new Error('Imagem não carregou: ' + src)); };
        im.src = src;
      });
      cacheImg[k].catch(function () { delete cacheImg[k]; });
    }
    return cacheImg[k];
  }
  var suportaWebp = (function () {
    try { return document.createElement('canvas').toDataURL('image/webp').indexOf('data:image/webp') === 0; } catch (e) { return false; }
  })();
  function urlMolde(larguraPx) {
    var w = MOLDES[MOLDES.length - 1];
    for (var i = 0; i < MOLDES.length; i++) if (MOLDES[i] >= larguraPx) { w = MOLDES[i]; break; }
    if (w === WT && larguraPx >= WT) return BASE + 'img/credencial-molde-' + WT + '.png';
    if (!suportaWebp) return BASE + (w > 960 ? 'img/credencial-molde-' + WT + '.png' : 'img/credencial-molde-960.png');
    return BASE + 'img/credencial-molde-' + w + '.webp';
  }
  function urlCamada(nome) { return BASE + 'img/' + nome + (suportaWebp ? '.webp' : '.png'); }

  // foto: tenta com CORS (permite detectar recorte e exportar); sem CORS, só exibe
  function carregarFoto(src) {
    if (!src) return Promise.resolve(null);
    if (typeof src !== 'string') return Promise.resolve({ img: src, cors: true });
    return carregarImg(src, true).then(function (im) { return { img: im, cors: true }; }, function () {
      return carregarImg(src, false).then(function (im) { return { img: im, cors: false }; });
    });
  }

  // análise da foto: transparência da borda (recorte) e caixa/centro da cabeça
  var cacheAnalise = typeof WeakMap === 'function' ? new WeakMap() : null;
  function analisarFoto(im) {
    if (cacheAnalise && cacheAnalise.has(im)) return cacheAnalise.get(im);
    var n = 96, iw = im.naturalWidth || im.width, ih = im.naturalHeight || im.height;
    var cw = iw >= ih ? n : Math.max(8, Math.round(n * iw / ih)), ch = ih >= iw ? n : Math.max(8, Math.round(n * ih / iw));
    var res = { recortada: false, caixa: [0, 0, iw, ih], centroCabeca: iw / 2 };
    try {
      var c = document.createElement('canvas'); c.width = cw; c.height = ch;
      var g = c.getContext('2d'); g.drawImage(im, 0, 0, cw, ch);
      var d = g.getImageData(0, 0, cw, ch).data, borda = 0, total = 0, x, y;
      var x0 = cw, y0 = ch, x1 = -1, y1 = -1;
      for (y = 0; y < ch; y++) for (x = 0; x < cw; x++) {
        var a = d[(y * cw + x) * 4 + 3];
        if (x < 2 || y < 2 || x >= cw - 2 || y >= ch - 2) { total++; if (a < 20) borda++; }
        if (a > 128) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      }
      res.recortada = total > 0 && borda / total > 0.35;
      if (res.recortada && x1 >= x0) {
        var sx = iw / cw, sy = ih / ch, lim = y0 + (y1 - y0 + 1) * 0.35, soma = 0, cont = 0;
        for (y = y0; y <= lim; y++) for (x = x0; x <= x1; x++) if (d[(y * cw + x) * 4 + 3] > 128) { soma += x + 0.5; cont++; }
        res.caixa = [x0 * sx, y0 * sy, (x1 + 1) * sx, (y1 + 1) * sy];
        res.centroCabeca = cont ? soma / cont * sx : (x0 + x1 + 1) / 2 * sx;
      }
    } catch (e) { /* imagem sem CORS: tratada como foto comum */ }
    if (cacheAnalise) cacheAnalise.set(im, res);
    return res;
  }

  // ------------------------------------------------------------------ texto
  function fonte(peso, px, familia) { return peso + ' ' + px + 'px "' + familia + '"'; }
  // largura com espaçamento entre letras (mantém o kerning da fonte)
  function medir(ctx, txt, esp) {
    return ctx.measureText(txt).width + Math.max(0, txt.length - 1) * esp;
  }
  function escrever(ctx, txt, x, y, esp) {
    if (!esp) { ctx.fillText(txt, x, y); return; }
    for (var i = 0; i < txt.length; i++) {
      var adv = ctx.measureText(txt.slice(0, i)).width + i * esp;
      ctx.fillText(txt[i], x + adv, y);
    }
  }
  function tinta(ctx, txt) {
    var m = ctx.measureText(txt);
    return { esq: m.actualBoundingBoxLeft || 0, sobe: m.actualBoundingBoxAscent || 0 };
  }

  /* desenha um texto; opções:
     x: borda da tinta (alinhamento 'esq'), centro ('centro') ou borda direita ('dir'); y: linha de base
     tam, peso, familia, esp (em), escalaX, max (largura máxima), minEscalaX, minTam (fração), centroY (mantém o meio vertical) */
  function texto(ctx, txt, o) {
    var tam = o.tam, sx = o.escalaX || 1, esp, w;
    ctx.font = fonte(o.peso, tam, o.familia);
    esp = (o.esp || 0) * tam;
    w = medir(ctx, txt, esp) * sx;
    if (o.max && w > o.max && o.minEscalaX && sx > o.minEscalaX) {
      sx = Math.max(o.minEscalaX, sx * o.max / w); w = medir(ctx, txt, esp) * sx;
    }
    var guarda = 0;
    while (o.max && w > o.max && tam > o.tam * (o.minTam || 0.5) && guarda++ < 80) {
      tam *= 0.97; ctx.font = fonte(o.peso, tam, o.familia); esp = (o.esp || 0) * tam; w = medir(ctx, txt, esp) * sx;
    }
    if (o.max && w > o.max) { // último recurso: reticências
      while (txt.length > 1 && medir(ctx, txt + '…', esp) * sx > o.max) txt = txt.slice(0, -1).replace(/\s+$/, '');
      txt += '…'; w = medir(ctx, txt, esp) * sx;
    }
    var t = tinta(ctx, txt), y = o.y;
    if (o.centroY != null) { // escala por tamanho: mantém o centro vertical das maiúsculas
      y = o.centroY + t.sobe / 2;
    }
    var x;
    if (o.alinha === 'dir') x = o.x - w;
    else if (o.alinha === 'centro') x = o.x - w / 2;
    else x = o.x + t.esq * sx;
    ctx.save();
    ctx.fillStyle = o.cor;
    ctx.translate(x, y);
    ctx.scale(sx, 1);
    escrever(ctx, txt, 0, 0, esp);
    ctx.restore();
    return { x: x - t.esq * sx, w: w, tam: tam };
  }

  /* acesso na tarja: RAYDIS em proporção original (sem esticar nem comprimir).
     Cabe numa linha até a largura máxima; rótulos de duas palavras (PISTA PREMIUM, ALL ACCESS)
     vão para duas linhas quando isso deixa a letra maior. Mesma altura máxima para todos os níveis. */
  var ACESSO = { x: 158, larguraMax: 1075, centroY: 3265.5, alturaMax: 290, capMax: 130, entrelinha: 0.32 };
  function desenharAcesso(ctx, txt) {
    var A = ACESSO;
    ctx.font = fonte(700, 100, 'LC Raydis');
    var cap100 = tinta(ctx, 'H').sobe || 70;
    var larg = function (t) { return ctx.measureText(t).width; };
    var linhas = [txt];
    var cap = Math.min(A.capMax, A.alturaMax, A.larguraMax / larg(txt) * cap100);
    var i = txt.indexOf(' ');
    if (i > 0) {
      var duas = [txt.slice(0, i), txt.slice(i + 1)];
      var capDuas = Math.min(A.capMax, A.larguraMax / Math.max(larg(duas[0]), larg(duas[1])) * cap100, A.alturaMax / (2 + A.entrelinha));
      if (capDuas > cap * 1.15) { linhas = duas; cap = capDuas; }
    }
    var tam = 100 * cap / cap100;
    ctx.font = fonte(700, tam, 'LC Raydis');
    ctx.fillStyle = COR.acesso;
    var passo = cap * (1 + A.entrelinha);
    var y = A.centroY - (cap * linhas.length + cap * A.entrelinha * (linhas.length - 1)) / 2 + cap;
    linhas.forEach(function (t, k) { ctx.fillText(t, A.x + tinta(ctx, t).esq, y + k * passo); });
  }

  function caminho(ctx, pts) {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
  }

  function formatarNumero(n) {
    n = Math.max(0, parseInt(String(n).replace(/\D/g, ''), 10) || 0);
    return n.toLocaleString('pt-BR');
  }
  function formatarCadastro(n) {
    var v = parseInt(String(n == null ? '' : n).replace(/\D/g, ''), 10);
    if (!v && v !== 0) return '000';
    return v < 1000 ? ('00' + v).slice(-3) : v.toLocaleString('pt-BR');
  }

  // ------------------------------------------------------------------ desenho
  function normalizar(d) {
    d = d || {};
    var lv = (d.nivel && nivelPorNome(d.nivel)) || nivelPorShows(d.shows);
    return {
      nome: String(d.nome || '').trim(),
      usuario: String(d.usuario || '').trim().replace(/^@+/, ''),
      shows: formatarNumero(d.shows),
      desde: String(d.desde == null ? '' : d.desde).replace(/\D/g, '').slice(0, 4),
      numero: formatarCadastro(d.numero),
      foto: d.foto || null,
      recortada: d.recortada === true || d.recortada === false ? d.recortada : null,
      nivel: lv
    };
  }

  function desenhar(canvas, dados, larguraPx) {
    var d = normalizar(dados);
    return Promise.all([
      carregarFontes(),
      carregarImg(urlMolde(larguraPx), false),
      carregarImg(urlCamada('credencial-selo'), false),
      carregarImg(urlCamada('nivel-' + d.nivel.chave), false),
      carregarFoto(d.foto).catch(function () { return null; })
    ]).then(function (r) {
      var molde = r[1], selo = r[2], bolinha = r[3], foto = r[4];
      var esc = larguraPx / WT;
      canvas.width = Math.round(larguraPx);
      canvas.height = Math.round(HT * esc);
      var ctx = canvas.getContext('2d');
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.setTransform(esc, 0, 0, esc, 0, 0);
      ctx.drawImage(molde, 0, 0, WT, HT);
      ctx.translate(PAD, PAD); // daqui em diante, coordenadas da peça

      // foto
      var modo = null;
      if (foto && foto.img) {
        var im = foto.img, iw = im.naturalWidth || im.width, ih = im.naturalHeight || im.height;
        var an = analisarFoto(im);
        var recortada = d.recortada != null ? d.recortada : an.recortada;
        modo = recortada ? 'recortada' : 'comum';
        ctx.save();
        if (recortada) {
          caminho(ctx, RECORTE_CLIP); ctx.clip();
          var cx = an.caixa, bh = cx[3] - cx[1];
          var s = (RECORTE.base - RECORTE.topo) / bh;
          var dx = RECORTE.centroCabeca - an.centroCabeca * s, dy = RECORTE.base - cx[3] * s;
          ctx.drawImage(im, dx, dy, iw * s, ih * s);
        } else {
          caminho(ctx, MOLDURA_FOTO); ctx.clip();
          var bx0 = 242, by0 = 608, bw = 1898 - 242, bhh = 1915 - 608;
          var sc = Math.max(bw / iw, bhh / ih), dw = iw * sc, dh = ih * sc;
          ctx.drawImage(im, bx0 + (bw - dw) * 0.5, by0 + (bhh - dh) * 0.3, dw, dh);
        }
        ctx.restore();
      }
      ctx.drawImage(selo, SELO.x, SELO.y, SELO.w, SELO.h);

      // Nº de cadastro (alinhado à direita, como na peça)
      texto(ctx, 'Nº ' + d.numero, { x: 1926, y: 244, alinha: 'dir', tam: 95, peso: 500, familia: 'LC Barlow Condensed', esp: 0.08, cor: COR.numero, max: 500 });
      // nome e @
      texto(ctx, d.nome, { x: 238, y: 2463, tam: 194, peso: 400, familia: 'LC Alfa Slab', escalaX: 0.984, cor: COR.texto, max: 1700, minTam: 0.38 });
      if (d.usuario) texto(ctx, '@' + d.usuario, { x: 241, y: 2595, tam: 125, peso: 500, familia: 'LC Barlow', cor: COR.arroba, max: 1667, minTam: 0.6 });

      // números em RAYDIS: mesma escala para shows e desde, cabendo antes da pílula.
      // cada coluna tem a largura do maior entre número e rótulo (SHOWS / DESDE)
      var tamN = 182, gap = 110, limite = 1150 - 238, tamR = 86;
      ctx.font = fonte(500, tamR, 'LC Barlow');
      var r1 = medir(ctx, 'SHOWS', 0.04 * tamR), r2 = medir(ctx, 'DESDE', 0.04 * tamR);
      ctx.font = fonte(700, tamN, 'LC Raydis');
      var w1 = ctx.measureText(d.shows).width, w2 = d.desde ? ctx.measureText(d.desde).width : 0;
      var k = 1, guarda = 0;
      while (Math.max(w1 * k, r1) + gap + (d.desde ? Math.max(w2 * k, r2) : 0) > limite && guarda++ < 60) k *= 0.98;
      tamN *= k;
      var a = texto(ctx, d.shows, { x: 238, y: 2832, tam: tamN, peso: 700, familia: 'LC Raydis', cor: COR.texto });
      var b = texto(ctx, 'SHOWS', { x: 239, y: 2923, tam: tamR, peso: 500, familia: 'LC Barlow', esp: 0.04, cor: COR.rotulo });
      if (d.desde) {
        var xd = Math.max(a.x + a.w, b.x + b.w) + gap;
        texto(ctx, d.desde, { x: xd, y: 2832, tam: tamN, peso: 700, familia: 'LC Raydis', cor: COR.texto });
        texto(ctx, 'DESDE', { x: xd + 2, y: 2923, tam: tamR, peso: 500, familia: 'LC Barlow', esp: 0.04, cor: COR.rotulo });
      }

      // pílula do nível + bolinha metálica
      texto(ctx, d.nivel.nivel, { x: 1521, y: 2850, alinha: 'centro', tam: 109, peso: 600, familia: 'LC Barlow', esp: 0.016, cor: COR.pilula, max: 500, minTam: 0.7 });
      ctx.drawImage(bolinha, BOLINHA.x, BOLINHA.y, BOLINHA.s, BOLINHA.s);

      // acesso na tarja Preto Profundo
      desenharAcesso(ctx, d.nivel.acesso);

      canvas.setAttribute('aria-label', 'Credencial de fã Livvo de ' + (d.nome || 'usuário') + ', Nº ' + d.numero + ', ' + d.shows + ' shows desde ' + d.desde + ', ' + d.nivel.nivel + ', acesso ' + d.nivel.acesso);
      return { nivel: d.nivel.nivel, acesso: d.nivel.acesso, foto: modo, exportavel: !foto || foto.cors };
    });
  }

  // ------------------------------------------------------------------ API pública
  function larguraAlvo(el) {
    var css = el.getBoundingClientRect().width || 360;
    var px = css * Math.min(window.devicePixelRatio || 1, 3);
    return Math.max(240, Math.min(WT, Math.round(px)));
  }

  function render(el, dados) {
    var canvas = el.querySelector('canvas.lc-canvas');
    if (!canvas) {
      el.classList.add('livvo-credencial');
      canvas = document.createElement('canvas');
      canvas.className = 'lc-canvas';
      canvas.setAttribute('role', 'img');
      el.innerHTML = '';
      el.appendChild(canvas);
    }
    el._lcDados = dados;
    var px = larguraAlvo(el);
    el._lcPx = px;
    var p = desenhar(canvas, dados, px).then(function (info) {
      el.dataset.lcNivel = info.nivel;
      el.dataset.lcFoto = info.foto || '';
      el.dispatchEvent(new CustomEvent('livvo-credencial:pronta', { detail: info }));
      return info;
    });
    if (!el._lcObs && window.ResizeObserver) {
      var t;
      el._lcObs = new ResizeObserver(function () {
        clearTimeout(t);
        t = setTimeout(function () { if (Math.abs(larguraAlvo(el) - el._lcPx) > 24) render(el, el._lcDados); }, 120);
      });
      el._lcObs.observe(el);
    }
    return p;
  }

  function exportarPNG(dados, largura) {
    var c = document.createElement('canvas');
    return desenhar(c, dados, largura || WT).then(function (info) {
      if (!info.exportavel) throw new Error('A foto vem de outro domínio sem CORS; não é possível exportar o PNG.');
      return new Promise(function (ok, erro) {
        c.toBlob(function (b) { b ? ok(b) : erro(new Error('Falha ao gerar o PNG.')); }, 'image/png');
      });
    });
  }

  function lerDataset(el) {
    var d = el.dataset;
    return { nome: d.nome, usuario: d.usuario, shows: d.shows, numero: d.numero, desde: d.desde, foto: d.foto, nivel: d.nivel,
      recortada: d.recortada === undefined ? undefined : d.recortada === 'true' };
  }
  function autoInit(raiz) {
    (raiz || document).querySelectorAll('[data-livvo-credencial]').forEach(function (el) { render(el, lerDataset(el)); });
  }

  window.LivvoCredencial = { render: render, exportarPNG: exportarPNG, nivelPorShows: nivelPorShows, niveis: NIVEIS, autoInit: autoInit };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { autoInit(); });
  else autoInit();
})();
