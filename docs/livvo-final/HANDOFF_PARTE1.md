# Livvo final, prévia parte 1: navegação, Início, Explorar e Detalhe do show

Status: **DRAFT** · 07/10/2026 (revisão 3: notas em ingressos e fotos padronizadas) · ramo `livvo-final` do repositório `marcelolivvo/livvo-app-complementar`
Para: Greg (implementação no livvomusic.com.br) · Decisões de produto: Edmir · Preparado por: Claude

Este documento descreve a "cara" do Livvo final que está sendo montada dentro do ambiente A (app da Vercel), enquanto o site B (livvomusic.com.br) segue no ar com os beta testers. A prévia junta as partes fortes de B (catálogo, Eu fui, Nota do Show e Nota da Organização, quem foi, setlist, navegação com barra inferior) com o que foi criado em A (linguagem de bilheteria, Passaporte, faixas de acesso, pôster halftone, carimbo). Ela segue o "Plano de fusão Livvo" de 06/10/2026.

> **Revisão 2 (07/10/2026, à tarde):** o visual foi refeito nos parâmetros do Estúdio (app A), que valem para tudo. O plano de fusão vale para estrutura e fluxos. Em conflito, vale o documento da identidade oficial. Detalhes na seção 4 e nas decisões 9 a 13 da seção 9.

> **Revisão 3 (07/10/2026, pedido às 13h11 e respostas às 13h32):** as notas passam a usar o **ingresso** (ícone enviado pelo Edmir) no lugar dos discos; botão **Atualizar foto** na memória, com toda foto no padrão Livvo (corte 4:5 + halftone da marca); botão de admin **Atualizar todas as fotos**, com as fontes que o Estúdio já usava (Deezer, Wikimedia Commons, Wikipédia). Decisões 14 a 18 da seção 9 e seção 5.1.

> Importante: pelo plano de fusão, **B continua sendo a base técnica**. Esta prévia é a referência visual e de comportamento. Reaproveitar ou reescrever os componentes no stack de B é decisão do Greg.

---

## 1. Como abrir e testar

| Item | Como |
| --- | --- |
| Prévia na Vercel | `https://livvo-app-complementar-git-livvo-final-livvo1.vercel.app` (padrão de endereço da Vercel; pede login na Vercel, como as outras prévias) |
| Rodar no computador | `npm install` e `npm run dev` (servidor Express + Vite na porta 3000) |
| Conferir tipos e build | `npm run build` (roda `tsc -b` e `vite build`) |
| Conta de demonstração | Abre sozinha na primeira visita: Marcelo Ferreira, @toboi, com as 25 memórias reais dele no site atual |
| Ver como visitante | Menu da conta (avatar) → "Sair e ver como visitante". Qualquer e-mail na tela de entrar volta para a conta de demonstração (login simulado, nada é enviado) |
| Comunidade de exemplo | Menu da conta → "Comunidade de exemplo" liga e desliga pessoas, números, resenhas e atividade fictícios. Desligada, mostra os estados vazios reais |
| Restaurar ou zerar | Menu da conta → "Restaurar as 25 memórias" ou "Começar do zero" |
| Laboratório | `/estudio` abre o Estúdio, a Wallet e a área interna do redesign como estavam (com `?admin=1` para o menu de admin) |

---

## 2. Rotas (endereços públicos)

Os endereços de show precisam ser definidos agora e nunca mais mudar, porque vão circular no WhatsApp e no Google (decisão irreversível nº 5 do plano de fusão).

| Rota | Tela | Pública sem login? |
| --- | --- | --- |
| `/` | Início (logado) ou entrada simples (visitante) | Sim |
| `/explorar` | Shows: busca, Passados e Próximos, filtros | Sim |
| `/explorar?q=&aba=proximos&cidade=&ano=&casa=&fui=1` | Mesma tela com filtros na URL (dá para compartilhar uma busca) | Sim |
| `/show/:id` | Detalhe do show. `:id` = Setlist ID do catálogo (ex.: `/show/435f27c7`) | Sim, para ler |
| `/registrar` e `/registrar?artista=:mbid` | Registrar: artista → data → Eu fui | Sim, mas Eu fui pede login |
| `/minha-historia` | Minha História (provisória nesta parte) | Não |
| `/comunidade`, `/alertas` | Páginas de espera (partes 4) | Sim |
| `/estudio` | Laboratório do redesign | Sim |
| `/admin` | Redireciona para `/estudio` (menu de admin só com `?admin=1`) | Não |

Toda ação que grava (Eu fui, notas, Quero ir, Seguir) sem login abre a tela de entrar e não perde a página em que a pessoa estava.

---

## 3. Navegação

- **Celular (até 899 px):** barra superior só com o ícone oficial, o sino de Alertas e o avatar. Barra inferior fixa com 5 itens: Início · Shows · **+ Registrar** (botão central em Ciano, no formato de ingresso) · Comunidade · Minha História. Item ativo em Ciano.
- **Computador (900 px ou mais):** barra superior com ícone, links (Início, Shows, Comunidade, Minha História, ativo sublinhado em Ciano), botão "Registrar show" em Ciano, sino e avatar. Sem barra inferior.
- **Menu da conta (avatar):** nome, @, etiqueta "Conta de demonstração"; Minha História; Estúdio (laboratório); Área interna (só admin); bloco "Prévia" com os controles da seção 1; Sair.
- **Faixa de prévia** no topo de todas as telas: "Prévia do Livvo final · o site oficial continua no livvomusic.com.br". Sai no site final.
- O ícone usado é o oficial (`public/brand/livvo-icon.png`, só reduzido para `public/livvo/livvo-icon-128.png`). A palavra LIVVO não foi redesenhada.

---

## 4. Tokens e tipografia

Mesmos tokens do Estúdio ("Bilheteria"), mais a superfície elevada e a cor dos números de nota. Definidos em `src/livvo/livvo.css` na classe `.lv-app`.

| Token | Valor | Uso |
| --- | --- | --- |
| `--lv-ink` | `#100C1F` | Fundo (Preto Profundo) |
| `--lv-paper` | `#171226` | Cards e ingressos |
| `--lv-raise` | `#1E1833` | Hover de linhas e menu |
| `--lv-line` / `--lv-line-2` | `#282141` / `#3A3159` | Bordas, picotes, discos vazios |
| `--lv-cyan` / `--lv-cyan-hi` | `#4FDCDE` / `#22E3E6` | Ação principal (um por tela), item ativo, carimbo |
| `--lv-teal` | `#2FB8BA` | Ícones de apoio, selo de verificação |
| `--lv-cream` | `#ECE5D1` | Texto principal, botão selecionado |
| `--lv-muted` / `--lv-dim` | `#B3AE9F` / `#8A8577` | Texto secundário e rótulos |
| `--lv-nota` | `#ECE5D1` | Números de nota. Os ingressos de nota usam Off-white `#ECE5D1` (preenchimento) e Teal `#2FB8BA` (contorno e detalhes). **O amarelo `#FFD60A` saiu das notas** (decisão de 07/10/2026; a identidade oficial ainda o reserva para notas e precisa ser atualizada pelo Edmir) |

| Fonte | Uso |
| --- | --- |
| Alfa Slab One | Títulos de página e seção, nome do artista no pôster e nos ingressos. Título do Passaporte em **Teal** (como "Passaporte Oficial de Shows" do Estúdio) |
| RAYDIS 700 | Números grandes (campos do Passaporte, contagem regressiva, notas, dia no pôster e nas listas). Nunca em texto com acento |
| Barlow 600/700 | Todos os rótulos em caixa alta: tira do ingresso, rótulos de campo, cabeçalhos de grupo, etiquetas, barra inferior, textos do pôster. **Substitui o DM Mono do Estúdio** (a identidade oficial manda Barlow) |
| Plus Jakarta Sans | Corpo do texto, **provisório até a decisão #22** (a identidade oficial indica fonte do sistema; o Estúdio usa Plus Jakarta) |

**Gramática "Bilheteria" do Estúdio (vale para todas as telas).** As classes vêm de `src/index.css` (as mesmas do Estúdio e da Wallet) e funcionam dentro de `.lv-app`; `src/livvo/livvo.css` só troca DM Mono por Barlow e acrescenta o que faltava.

| Elemento | Classe | Onde aparece |
| --- | --- | --- |
| Página-ingresso: papel `#171226`, cantos 10 px | `.lv-ticket` | Topo de Explorar, Registrar, Detalhe do show, Passaporte, Minha História, páginas de espera, entrada do visitante |
| Tira superior: "LIVVO · SEÇÃO" à esquerda, dado à direita (titular, data, passo, total) | `.lv-strip` | Em toda página-ingresso |
| Palco com retícula halftone | `.lv-stage` | Pôster no Detalhe do show, entrada do visitante, páginas de espera |
| Picote com meias-luas: horizontal no celular, vertical a partir de 1024 px | `.lv-perf` | Entre o palco (pôster) e o canhoto (ações) no Detalhe do show |
| Campos de identificação: rótulo + número RAYDIS + nota em Ciano, separados por picote vertical | `.lv-fields` | Passaporte (Shows · Artistas · Cidades com "desde 1998", "mais visto: …", "em 3 estados"), contagem regressiva, médias da comunidade (número em Off-white + ingressos) |
| Marcas de picote como progresso (24 marcas) + percentual | `.lv-ticks` | Faixa do Passaporte, missões (versão fina) |
| Botão-ingresso com canhoto (furos em cima e embaixo, ícone no canhoto, picote tracejado) | `.lv-btn--stub` (+ `--cyan`, `--cream`, `--teal`) | Ações principais: Eu fui, Quero ir/Tenho ingresso marcado, Minha História, Registrar, Compartilhar credencial |
| Botão com recortes laterais | `.lv-btn` | Eu fui nas linhas do Registrar, Registrar show no topo |
| Botão de contorno / link | `.lv-ghost`, `.lv-link` | Ações secundárias |
| Campo sublinhado com rótulo em caixa alta (sem caixa) | `.lv-input` + `.lv-label` | Busca e filtros CIDADE · ANO · CASA do Explorar, busca de artista do Registrar |
| Abas em texto com sublinhado Ciano e contagem | `.lv-tabs` | Passados 6.592 · Próximos 12 |
| Cabeçalho de grupo: rótulo Ciano em caixa alta + linha | `.lv-group` | Todas as seções de lista (Sua agenda, Vem aí, Resenhas, Quem foi, Mais shows…) |
| Linha com picote (data · texto · fim) | `.lv-show` | Agenda, Vem aí, Quem você segue, Registrar, Quem foi, Mais shows do artista e da casa |
| Desafio com caixa de marcar | `.lv-challenge` + `.lv-box` | Missões do mês |
| Canhoto com borda Ciano e furos laterais | `.lv-passport` | "Sua memória" no Detalhe do show |
| Ingresso em contorno Ciano com brilho (recortes em cima e embaixo a 28% da largura, raio 16, cantos 24, picote tracejado) | `IngressoContorno` (desenho do `TransparentTicketItem` da Wallet) | Cartão de momento do Início e a Carteira de ingressos de Minha História |
| Credencial Backstage | `LivvoCredencialCard` (`src/components`) | Passaporte em Minha História |
| Estado vazio tracejado | `.lv-empty` | Vazios e erros |

Regras visuais aplicadas:
- **Nada de cards dentro de cards.** Listas são linhas com picote sob um cabeçalho de grupo; o papel do ingresso fica para a página e para o que é da pessoa.
- **Uma ação principal por estado (#9).** Quando a pessoa já marcou Quero ir ou Tenho ingresso, o escolhido vira botão-canhoto Creme com ✓ e o outro vira contorno.
- **Notas em ingressos** Off-white com contorno Teal; destaques e progresso usam Ciano.
- **Etiquetas retas** (raio 3 px), nunca pílulas. Etiqueta "Exemplo" tracejada.
- **Ícones Lucide** (padrão do Estúdio, decisão de 07/10/2026), só em botões e links. **Sem ícones de data, local e casa nos cards e linhas (#15):** a informação vai em texto.
- **Sem a linha estilo passaporte (MRZ)** (decisão de 07/10/2026).
- Nada de contador zerado: "0 registraram" nunca aparece; vira convite ("Seja a primeira pessoa") ou some.

---

## 5. Componentes (todos em `src/livvo/ui.tsx`, salvo indicação)

| Componente | O que faz | Detalhes para implementar |
| --- | --- | --- |
| **Pôster Halftone** (`Poster`) | Capa de cada show, gerada pelos dados: dia em RAYDIS, mês e ano, UF, nome do artista em Alfa Slab One, casa de show. Fundo com retícula ("sol" halftone) | 5 paletas da marca escolhidas por hash do artista (o mesmo artista sempre tem a mesma cor); posição do sol varia por artista; tamanho do nome se ajusta ao comprimento (unidades `cqw`). Prioridade de imagem: foto da memória da pessoa (`show:<id>`) → foto do artista (`artista:<id>`, atualizada pelo admin) → pôster gerado pelos dados. Fotos salvas já vêm padronizadas (seção 5.1) e aparecem sem filtro extra, só com o degradê que garante a leitura do texto |
| **Card de show** (`CardShow`) | Pôster + artista + casa · cidade + data + linha social | Linha social: avatares + "N registraram" (passado) ou "N querem ir" (futuro) ou a etiqueta Quero ir / Tenho ingresso. Carimbo "Você foi" ou etiqueta "Exemplo" no canto do pôster |
| **Carimbo "Você foi"** (`CarimboFui`) | Marca de presença | Borda Ciano, inclinado −6°, animação de carimbo de 0,42 s ao registrar (desligada com "reduzir movimento") |
| **Notas em ingressos** (`Discos`, nome mantido por compatibilidade) | Nota de meio a cinco em 5 ingressos verticais (desenho do ícone enviado pelo Edmir: recortes laterais, código de barras, picote, palheta com nota musical), em SVG 20 × 30 | Preenchido: Off-white com contorno e detalhes Teal. Meio ponto: metade esquerda preenchida (toque na metade esquerda vale meio ponto, como nos discos). Sem nota: contorno apagado (`#3A3159`), ou Teal a 55% quando dá para tocar. Acessível como `role="slider"` (setas mudam 0,5). `tamanho` = referência; o ingresso mede 0,8 × 1,2 desse valor |
| **Página-ingresso** (`Bilhete`) | `.lv-ticket` + `.lv-strip` com texto à esquerda e à direita | Envolve o topo de cada tela |
| **Grupo** (`Grupo`) | `.lv-group` com ação à direita (ex.: "Ver todos", etiqueta Exemplo) | Cabeçalho de toda lista |
| **Linha** (`Linha`) | `.lv-show`: coluna inicial (data em RAYDIS ou avatar), título, linha de apoio, nota em Ciano e fim (etiqueta, carimbo, botão ou seta) | Coluna inicial de 58 px no celular e 72 px a partir de 640 px |
| **Botão-canhoto** (`Stub`) | `.lv-btn--stub` com ícone Lucide no canhoto | Vira `<a>` quando recebe `to` |
| **Ingresso em contorno** (`IngressoContorno`) | SVG medido com `ResizeObserver`; canhoto com o pôster à esquerda | Altura mínima garante o pôster 4:5 inteiro no canhoto |
| **Etiquetas** | `Exemplo` (tracejada), `Parte N` (o que entra nas próximas partes), Ciano, Teal, Creme | Toda informação fictícia leva "Exemplo" |
| **Avatar** | Iniciais em círculo (Ciano, Teal, Creme ou Muted por hash do nome) | Usado nas pessoas de exemplo e na conta |
| **Picotes** (`Picotes`) | `.lv-ticks`: barra de progresso em marcas de picote | Faixa do Passaporte (24 marcas) e missões (3, versão fina) |
| **Data** (`CaixaData`) | Dia em RAYDIS + mês (e ano) em Barlow, sem caixa | Coluna inicial das linhas |
| **Aviso rápido** (`avisar`) | Confirmação curta em Creme (raio 4 px, como o do Estúdio), acima da barra inferior | "Show guardado na sua história", "Link copiado", notas dadas |
| **Silhuetas** (`.lv-skel`) | Carregamento sem "Carregando…" | Grade, detalhe do show, cartão de momento |
| **Compartilhar** (`compartilharLink`) | Menu nativo do celular; no computador copia o link | Página do show é pública, então o link funciona para quem não tem conta |

### 5.1 Fotos padronizadas (`src/livvo/fotos.ts`, `src/livvo/AtualizarFoto.tsx`, `server.ts`)

| Peça | Como funciona |
| --- | --- |
| **Padrão Livvo** (`padronizar`) | Toda foto, de qualquer fonte, vira um JPEG 640 × 800 (4:5): recorte centralizado e puxado para cima (rostos), contraste automático (percentis 3 e 97) e retícula halftone com células de 7 px sobre Preto Profundo, pontos em Ciano que clareiam para Off-white nas luzes. Feito no `<canvas>` do navegador |
| **Atualizar foto** (memória) | Link em "Sua memória" (detalhe do show) e em cada ingresso da Carteira. Abre uma janela com a prévia do pôster: **Enviar uma foto sua** ou escolher uma das **Fotos do artista** (Deezer Oficial, Wikimedia Commons, Wikipédia; até 12). Salvar, Cancelar e "Voltar ao pôster gerado" (ou à foto do artista). Só a foto enviada pela pessoa sobe a memória para "Com foto" na escada de verificação |
| **Atualizar todas as fotos** (admin) | Menu da conta, só com `?admin=1`. Escopo: artistas da conta e da agenda (rápido) ou todo o catálogo da prévia (653 artistas). Para cada artista: foto do catálogo (Deezer) ou a melhor foto do `/api/artist-search` (só nome exato), padronizada e salva para todos os pôsteres e ingressos do artista. 3 em paralelo, progresso em picotes com %, Parar, opção de refazer quem já tem foto, lista de quem ficou sem foto nas fontes e "Voltar todos aos pôsteres gerados" (pede segundo toque) |
| **`GET /api/foto?url=`** | Busca a imagem pelo próprio domínio para o canvas poder tratá-la. Só HTTPS e só os domínios das fontes (`*.dzcdn.net`, `*.deezer.com`, `upload.wikimedia.org`, `*.mzstatic.com`), só `image/*`, até 6 MB, cache de 7 dias. Qualquer outro endereço responde 403 |
| **Armazenamento na prévia** | IndexedDB do navegador (`livvo_final_fotos`), chaves `show:<id>` e `artista:<id>`, com origem e fonte. No site final: armazenamento de arquivos de B, com a foto do artista compartilhada por todos e a da memória só da pessoa |

Bancos de imagem genéricos (Unsplash, usados como reserva no Estúdio) ficam fora: não são fotos do artista. Antes de produção, o Greg deve conferir os termos de uso das fontes (API do Deezer, licenças por arquivo do Wikimedia) e guardar a fonte de cada foto.

---

## 6. Telas

### 6.1 Início (`src/livvo/pages/Inicio.tsx`)

**Logado**, no computador em duas colunas (principal + lateral de 360 px a partir de 1100 px); no celular em uma coluna, nesta ordem:

1. Data em rótulo e "Oi, Marcelo." (Alfa Slab One).
2. **Cartão de momento**, um só pedido por vez, no **ingresso em contorno Ciano** (pôster no canhoto). Prioridade:
   1. amanhã tem show (Quero ir ou Tenho ingresso para amanhã);
   2. como foi? (show com interesse entre hoje e 3 dias atrás, ainda sem memória) → botão Eu fui;
   3. neste dia (aniversário de um show da história) → Ver memória;
   4. faltam até 3 dias para um show com interesse → Ver show;
   5. complete essa história: **dar a Nota da Organização ali mesmo**, nos discos; ao tocar, salva e passa para a próxima memória sem nota.
3. **Seu Passaporte** (página-ingresso, tira "Livvo · Passaporte de fã / Titular @toboi"): título "Seu Passaporte" em Alfa Teal, nome e "no Livvo desde ago 2026", faixa (Pista Premium), campos Shows · Artistas · Cidades com notas "desde 1998", "mais visto: Dave Matthews Band", "em 3 estados" (decisão #3), 24 marcas de picote com "Faltam 1 show para o nível Camarote" e 94%, botão-canhoto Teal "Minha História".
4. **Missões do mês** (completar o vivido, nunca "vá a mais shows"), como os desafios da Wallet: caixa de marcar, título, apoio, picote fino 0/3 e link. "Avalie a organização de 3 shows" (conta as notas de organização dadas no mês) e "Resgate um show antigo".
5. Lateral (linhas com picote sob cabeçalho de grupo): **Sua agenda** (Quero ir e Tenho ingresso, com "em 10 dias"), **Vem aí** (shows futuros de artistas que a pessoa já viu: "Você viu 1 vez"), **Quem você segue** (atividade de exemplo; sem exemplos, convite para seguir quem foi aos seus shows).

**Visitante:** página-ingresso com palco halftone, "Registre · Avalie · Colecione", "Sua história através dos seus shows.", subtítulo do plano, botões "Comece pela sua história" (abre entrar) e "Explorar shows", e uma faixa de shows recentes. A landing completa é a parte 4.

**Conta zerada:** o cartão de momento vira "Qual foi o último show que você viu?" com "Registrar meu primeiro show".

### 6.2 Explorar (`src/livvo/pages/Explorar.tsx`)

1. Página-ingresso como o topo do Estúdio: tira "Livvo · Shows / 114,8 mil no catálogo", título "Encontre o seu show", subtítulo "Um show que você viveu, para guardar na sua história, ou um que vem aí."
2. Linha de campos sublinhados: **ARTISTA, CASA OU CIDADE** (busca sem acento e sem caixa; espera 220 ms entre teclas) · **CIDADE** · **ANO** (só Passados) · **CASA** (até 80, filtradas pela cidade), `<select>` nativo. No celular a busca ocupa a linha e os três filtros dividem a de baixo.
3. Abas em texto **Passados 6.592 | Próximos 12**. Em Próximos aparece a etiqueta "Datas de exemplo".
4. "Só shows que eu fui" (caixa de marcar, logado) e "Limpar filtros".
5. Contagem: "6.592 shows · prévia com um recorte de 6,6 mil dos 114,8 mil shows do catálogo".
6. Grade por mês, com cabeçalho de grupo ("AGOSTO DE 2026"): 2 colunas no celular, 3 a partir de 640 px, 4 a partir de 1024 px e 5 a partir de 1180 px. Próximos em ordem do mais perto para o mais longe.
7. "Mostrar mais shows" de 40 em 40; no fim, "Não achou o seu show? Peça a inclusão".
8. Estados: carregando (silhuetas), erro ("Não conseguimos carregar os shows agora." + Tentar de novo), vazio ("Nenhum show encontrado para …" + "Meu show não está aqui").

### 6.3 Detalhe do show (`src/livvo/pages/ShowDetalhe.tsx`)

Página-ingresso com tira "Livvo · Shows / 23 nov 2025". Computador: **palco** halftone com o pôster (380 px) · **picote vertical** · **canhoto** com título, dados e ação. Celular: pôster menor (38% da largura) ao lado do título no palco, picote horizontal e a ação logo abaixo, para o **Eu fui aparecer sem rolar**. Abaixo do ingresso, duas colunas no computador: comunidade (médias, resenhas, quem foi) à esquerda; setlist, "Foi com alguém?" e mais shows à direita.

1. Voltar · Compartilhar.
2. Turnê (ou "Show ao vivo" / "Show que vem aí"), etiqueta "Show de exemplo" quando for o caso, artista, casa (link para Explorar filtrado pela casa) · cidade, UF, data por extenso · "há 10 meses" / "em 10 dias". Sem ícones de local e data (#15).
3. **Ação principal:**
   - Passado, sem memória: botão-canhoto **Eu fui** (Ciano, largura total no celular) + "Guarde este show na sua história. Leva um toque; as notas você dá logo depois."
   - Passado, com memória: **Sua memória** no canhoto de borda Ciano (`.lv-passport`): data do registro e visibilidade, carimbo "Você foi" (animado ao registrar), **Nota do Show** e **Nota da Organização** em discos (salvam no toque), frase "Duas notas para o artista não pagar pela fila do bar."; canhoto com **Verificação** (selo da escada: Registrado → Com foto → Com ingresso → Presença confirmada), "Ingresso de Memória · Parte 2" e "Desfazer registro" (pede um segundo toque).
   - Futuro: **Quero ir** e **Tenho ingresso** (um ou outro, tocar de novo desmarca), contagem regressiva no campo "DIAS PARA O SHOW", explicação do lembrete e "O link da ticketeira aparece aqui quando o show vem de uma fonte oficial."
   - O link `?avaliar=org` rola até a Nota da Organização e coloca o foco nela (usado pela missão).
4. Prova social: avatares + "133 pessoas registraram este show, com você" (ou "querem ir"), etiqueta Exemplo. Sem ninguém: "Ninguém registrou este show ainda. Seja a primeira pessoa."
5. **Como foi, para quem estava lá** (só passado e só com amostra mínima): médias de Show e Organização nos campos `.lv-fields` em RAYDIS Off-white + ingressos, até 3 dimensões mais citadas (+ ou −), "Média de N avaliações. As médias só aparecem a partir de 3." Abaixo da amostra, o bloco some (nunca "Sem avaliações" em destaque).
6. **Setlist:** link real para o setlist.fm do show (base do catálogo).
7. **Resenhas de quem foi:** avatar, nome, @, setor, notas de Show e Organização, texto de até 3 linhas, dimensões.
8. **Quem foi / Quem vai:** pessoas com Seguir/Seguindo e "Só aparece quem deixou a memória pública."
9. **Foi com alguém? / Vai com alguém?:** "Chamar no WhatsApp" abre o WhatsApp com texto pronto e o link do show (nada é enviado sozinho).
10. **Mais shows de {artista}** e **Mais shows nesta casa** (até 6 linhas com data, casa ou artista e carimbo "Você foi" quando for o caso, com "Ver todos").

### 6.4 Registrar, versão da parte 1 (`src/livvo/pages/Registrar.tsx`)

Página-ingresso com tira "Livvo · Registrar show / Passo 1 de 2" (e "Passo 2 de 2"). "Qual show você viveu?" → campo sublinhado ARTISTA (com "N shows no catálogo · você foi a N") → lista de datas com casa, cidade e dia da semana, cada uma com **Eu fui** (vira carimbo na hora). Sem busca, mostra "Artistas da sua história". Três toques até guardar. A parte 2 acrescenta a tela de sucesso com o Ingresso de Memória, o Avaliar em camadas e o "Meu show não está aqui".

### 6.5 Minha História (`src/livvo/pages/MinhaHistoria.tsx`)

Mesma página de identificação da Wallet do Estúdio, sem a linha MRZ:
1. Tira "Livvo · Passaporte de fã / Titular @toboi"; ícone de passaporte e **"Passaporte Oficial de Shows"** em Alfa Teal; "Cada show que você registra vira um carimbo aqui. Os antigos contam também."
2. TITULAR · NOME (Alfa) e @ em Ciano; campos Shows · Artistas · Cidades; 24 marcas com "Faltam N shows para o nível X" e percentual.
3. Botões-canhoto "Registrar show" (Ciano) e "Compartilhar credencial" (Creme).
4. À direita (abaixo no celular): **Credencial Backstage** com os dados da conta (nome, @, shows, desde, nível e acesso calculados pelos shows, Nº de cadastro de teste 16), "Adicionar foto" / "Trocar foto" (mesmo tratamento e mesma chave `livvo_user_photo_v1` do Estúdio: até 1024 px, mantém transparência, tenta 640 px sem espaço, aviso para HEIC) e "Compartilhar" (PNG em resolução cheia pelo menu do celular ou download).
5. **Carteira de ingressos 25**: memórias por ano em ingressos de contorno Ciano (duas colunas a partir de 1024 px): pôster no canhoto, artista em Alfa, data, casa · cidade, nota do show em discos ou "Sem nota", e "Falta a organização" (leva direto à nota).
As abas Números, Coleção (medalhas, desafios, stickers), Agenda e Listas entram na parte 3.

### 6.6 Comunidade e Alertas

Páginas de espera em página-ingresso com palco, lista "O que entra aqui" em linhas com picote e um caminho útil (Explorar, Próximos).

---

## 7. Modelo de dados proposto para o banco de B

Nesta prévia tudo fica no navegador (`localStorage`, chave `livvo_final_v1`), como no resto do app A. No site final, cada item é uma tabela de B. Campos em `src/livvo/store.ts`:

| Entidade | Campos | Observações |
| --- | --- | --- |
| **Memória** | `id`, `showId`, `criadaEm`, `atualizadaEm`, `notaShow` (0,5–5), `notaOrganizacao` (0,5–5), `dimensoes` (mapa id → nota), `setor`, `comQuem` (@), `fotoUrl`, `ingressoAnexado`, `presencaConfirmadaPor`, `relato`, `visibilidade` (`privado` / `seguidores` / `publico`) | Uma memória por pessoa e show. O nível da escada de verificação é calculado, não gravado |
| **Interesse** | `showId` → `quero_ir` ou `tenho_ingresso` | Some quando a pessoa registra o show (vira memória) |
| **Seguindo** | lista de @ | Base da Comunidade |
| **Dimensões (IDs fixos)** | `entrada_saida`, `seguranca`, `som`, `visao_palco`, `clima_publico`, `bares_banheiros` | Fixar os IDs agora evita quebrar séries históricas (decisão irreversível nº 2). As três últimas são propostas do plano, a aprovar |

Eventos sugeridos para a medição do beta (PostHog): `show_registrado` (origem: detalhe, registrar, momento), `nota_show`, `nota_organizacao` (origem), `interesse_marcado` (tipo), `link_compartilhado`, `whatsapp_aberto`, `seguir`, `filtro_explorar` (tipo).

---

## 8. O que é real e o que é exemplo

| Dado | Origem |
| --- | --- |
| Catálogo | Real: recorte de 6.592 shows do índice setlist.fm (114.800 shows), gerado por `scripts/gerar-catalogo-livvo.mjs` em `public/livvo/catalogo.json` (≈196 KB compactado, carregado sob demanda). Inclui shows de 2025 e 2026 nas 12 maiores cidades de artistas com 25+ shows no catálogo, todos os shows dos artistas da conta de demonstração desde 2008 nessas cidades e os 290 shows que já estavam no Estúdio. O catálogo completo continua restrito ao Admin |
| Memórias da conta de demonstração | Reais: as 25 memórias do @toboi no site atual em 06/10/2026, ligadas aos IDs do catálogo. Nota do Show copiada do site atual; a Nota da Organização não estava visível e ficou em branco (vira a missão). A 25ª (Dave Matthews Band, Jockey Club, 16/10/1998) foi deduzida das estatísticas do site atual |
| Shows futuros | **Exemplo:** 12 shows com datas fictícias contadas a partir de hoje (o catálogo real não tem shows futuros). Marcados "Show de exemplo" e "Datas de exemplo" |
| Pessoas, contagens, médias, resenhas e atividade | **Exemplo:** 14 pessoas fictícias e números gerados de forma estável a partir do ID do show (`src/livvo/data/social.ts`). Nenhum nome ou texto de beta tester real. Desligáveis no menu |
| Agenda da conta de demonstração | **Exemplo:** Vanguart (Tenho ingresso) e Dave Matthews Band (Quero ir) |

---

## 9. Decisões tomadas nesta prévia (DRAFT, aguardam o Edmir)

1. **Visibilidade padrão da memória: Seguidores** (proposta do plano de fusão). As 25 memórias de demonstração também ficaram em Seguidores.
2. **Médias agregadas usam todas as notas** (inclusive de memórias não públicas, sem identificar ninguém); **listas de pessoas e resenhas mostram só memórias públicas.** Precisa de confirmação, porque afeta privacidade e o B2B.
3. **Amostra mínima para mostrar médias: 3 avaliações** nesta prévia. O plano sugere 30 para relatórios de parceiros; para a página pública do show, o número final é decisão do Edmir.
4. **Faixas do Passaporte** iguais às da Credencial Backstage: Pista até 10, Pista Premium 11–25, Camarote 26–50, Backstage 51–100, All Access 101+. Shows resgatados do passado contam igual.
5. **Cartão de momento:** contagem regressiva só aparece no topo quando faltam até 3 dias; antes disso o show fica na Agenda.
6. ~~Fotos de artista do catálogo fora até haver licença~~ (substituída pela decisão 16).
7. **Nome da área de shows na navegação: "Shows"** (como em B); o título da página é "Shows" com o rótulo "Explorar".
8. **Registrar já funciona** em versão simples nesta parte, para o botão central não levar a uma página vazia.

Decisões do Edmir em 07/10/2026 (revisão 2):

9. **Os parâmetros visuais do Estúdio (A) valem para tudo**; o plano de fusão vale para estrutura, fluxos e conteúdo.
10. **Em conflito entre o Estúdio e a identidade oficial, vale a identidade oficial** (por isso Barlow nos rótulos, no lugar do DM Mono).
11. **Sem a linha estilo passaporte (MRZ).**
12. **Ícones: padrão do Estúdio (Lucide)**, no lugar dos Material Symbols citados na identidade oficial.
13. **Todo documento que existir só no Claude ganha cópia em Markdown na pasta Livvo**, para o ChatGPT e o Codex lerem.

Decisões do Edmir em 07/10/2026, 13h11 e 13h32 (revisão 3):

14. **Notas em ingressos** no lugar dos discos: Off-white onde o ícone é branco, Teal onde é preto. Meio ponto como nos discos (metade esquerda).
15. **Padrão de foto: halftone** nas cores da marca, para pôsteres e ingressos.
16. **Fontes de foto: o mesmo método do Estúdio** (Deezer e as demais fontes de uso permitido: Wikimedia Commons e Wikipédia).
17. **Botão "Atualizar foto"** na memória e **botão de admin para atualizar todas as fotos de uma vez**.
18. Consequência: o amarelo `#FFD60A` deixa de ser a cor das notas. Atualizar o documento da identidade oficial depende do Edmir.

Lembrete de marca: a frase de posicionamento oficial desde 06/10 é "Filmes e séries têm os seus apps. A música ao vivo **encontrou** o seu lugar definitivo." (o plano de fusão de 06/10 ainda traz "ainda não tem"). A landing da parte 4 vai usar a versão oficial.

---

## 10. Próximas partes

| Parte | Conteúdo |
| --- | --- |
| 2 | Registrar completo + tela de sucesso com o **Ingresso de Memória** (faces Ingresso e Pôster, ticket oficial `02-teal-wordmark`, sem selo "verificado") + Avaliar em camadas (dimensões opcionais, relato, visibilidade) + "Meu show não está aqui" + compartilhar a memória |
| 3 | Minha História como **Passaporte**: credencial, abas Ingressos, Números (marcos e gráficos), Coleção (figurinhas e missões), Agenda e Listas; Retrospectiva Livvo |
| 4 | Comunidade (Seguindo, Shows em comum, Fomos juntos), Alertas e agenda, landing pública e páginas públicas de memória e Passaporte |

---

## 11. Arquivos desta parte

| Arquivo | Papel |
| --- | --- |
| `src/main.tsx` | Passa a abrir `LivvoApp` (o app antigo segue em `src/App.tsx`, aberto em `/estudio`) |
| `src/livvo/LivvoApp.tsx` | Rotas e títulos de página; carrega o laboratório sob demanda |
| `src/livvo/router.tsx` | Roteador mínimo por URL (`useRoute`, `navigate`, `setQuery`, `Link`) |
| `src/livvo/AppShell.tsx` | Barra superior, barra inferior, menu da conta, faixa de prévia, avisos, tela de entrar |
| `src/livvo/store.ts` | Memórias, interesses, seguindo, conta de demonstração |
| `src/livvo/stats.ts` | Passaporte: números, faixa, progresso, pendências |
| `src/livvo/format.ts` | Datas, notas, plural e hash em pt-BR |
| `src/livvo/ui.tsx` | Componentes da seção 5 |
| `src/livvo/fotos.ts`, `src/livvo/AtualizarFoto.tsx` | Padrão de foto, armazenamento, fontes, janela Atualizar foto e janela de admin (seção 5.1) |
| `server.ts` | Rota `/api/foto` (seção 5.1); `/api/artist-search` do Estúdio reaproveitada |
| `src/livvo/livvo.css` | Tokens `.lv-app`, troca de DM Mono por Barlow nas classes do Estúdio e os estilos que faltavam (linhas, data, contorno, busca sublinhada) |
| `src/index.css` | Classes "Bilheteria" do Estúdio, usadas sem alteração |
| `src/components/LivvoCredencialCard.tsx`, `src/components/PassportIcon.tsx`, `public/credencial/` | Credencial Backstage e ícone de passaporte do Estúdio, reaproveitados no Passaporte |
| `src/livvo/data/catalog.ts` | Leitura do catálogo e busca |
| `src/livvo/data/demo.ts` | Perfil, memórias, futuros, pessoas e textos de exemplo |
| `src/livvo/data/social.ts` | Comunidade de exemplo |
| `src/livvo/pages/*.tsx` | Início, Explorar, Detalhe do show, Registrar, Minha História, páginas de espera |
| `scripts/gerar-catalogo-livvo.mjs` | Gera `public/livvo/catalogo.json` a partir de `data/shows-index.json` |
| `public/livvo/` | Catálogo recortado e ícone oficial reduzido |
| `src/components/LoginModal.tsx` | Texto ajustado para o novo contexto |
| `index.html` | Título, descrição e ícone da aba |

Verificação da revisão 3 (07/10/2026, commit `d7a24f8`): `tsc` e `npm run build` sem erros; Playwright em 390 × 844 e 1440 × 900: notas em ingressos em todas as telas, Atualizar foto com foto enviada (prévia, salvar, pôster e ingresso da Carteira atualizados, verificação "Com foto"), janela de admin com o escopo da conta (16 artistas) do começo ao fim, `/api/foto` recusando domínio fora da lista e HTTP. Neste ambiente de teste a rede externa é bloqueada, então as fotos do Deezer, Wikimedia e Wikipédia só podem ser conferidas na prévia publicada.

Verificação da revisão 2 (07/10/2026, commit `2f3e3f8`): `tsc` e `npm run build` sem erros; Playwright em 390 × 844 e 1440 × 900 em todas as telas e nos 6 fluxos, sem erro de página e sem rolagem lateral em 390 px em nenhuma rota.

Verificação da primeira versão (07/10/2026): `tsc -b` e `npm run build` sem erros; Playwright em 390 × 844 e 1440 × 900 em todas as telas; fluxos testados: Registrar (artista → data → Eu fui → carimbo), notas no detalhe e no cartão de momento (missão passou para 2/3), Quero ir / Tenho ingresso, visitante → Eu fui abre entrar, comunidade de exemplo desligada (estados vazios), filtros e "Shows que eu fui", laboratório em `/estudio`. Nenhum erro de página. Fotos externas não carregam no ambiente de teste (rede bloqueada); não afeta esta parte, que não usa fotos.
