# Livvo final, prévia parte 1: navegação, Início, Explorar e Detalhe do show

Status: **DRAFT** · 08/10/2026 (revisão 11: correções da análise de 07/10, 6 decisões do Edmir, aviso de nova conquista e novidades de quem você segue) · ramo `livvo-final` do repositório `marcelolivvo/livvo-app-complementar`
Para: Greg (implementação no livvomusic.com.br) · Decisões de produto: Edmir · Preparado por: Claude

Este documento descreve a "cara" do Livvo final que está sendo montada dentro do ambiente A (app da Vercel), enquanto o site B (livvomusic.com.br) segue no ar com os beta testers. A prévia junta as partes fortes de B (catálogo, Eu fui, Nota do Show e Nota da Organização, quem foi, setlist, navegação com barra inferior) com o que foi criado em A (linguagem de bilheteria, Passaporte, faixas de acesso, pôster halftone, carimbo). Ela segue o "Plano de fusão Livvo" de 06/10/2026.

> **Revisão 2 (07/10/2026, à tarde):** o visual foi refeito nos parâmetros do Estúdio (app A), que valem para tudo. O plano de fusão vale para estrutura e fluxos. Em conflito, vale o documento da identidade oficial. Detalhes na seção 4 e nas decisões 9 a 13 da seção 9.

> **Revisão 3 (07/10/2026, pedido às 13h11 e respostas às 13h32):** as notas passam a usar o **ingresso** (ícone enviado pelo Edmir) no lugar dos discos; botão **Atualizar foto** na memória, com toda foto no padrão Livvo (corte 4:5 + halftone da marca); botão de admin **Atualizar todas as fotos**, com as fontes que o Estúdio já usava (Deezer, Wikimedia Commons, Wikipédia). Decisões 14 a 18 da seção 9 e seção 5.1.

> **Revisão 4 (07/10/2026, pedido às 14h58 e respostas às 15h09):** todo pôster e ingresso com o logo Livvo (padrão do Estúdio); foto automática de cada artista em todo card, pôster e ingresso; tratamento de foto trocado por um duotone suave que mostra os detalhes; Compartilhar dentro da "Sua memória" com Instagram (Stories e Feed), Facebook, WhatsApp e link; Concert Buddies com marcação de @ e aceite; Comunidade funcionando. Seções 5.1 a 5.4, 6.3, 6.5, 6.6, 7 e decisões 21 a 29.

> **Revisão 5 (07/10/2026, pedido às 16h04 e respostas às 16h11):** nota com o **ingresso inclinado com estrela** (Teal no traço, transparente no fundo), em teste no lugar do ingresso vertical; mais espaço entre Artistas e Cidades no "Seu passaporte"; **nome nunca partido no meio da palavra**; legenda só "Foto automática"; sob o pôster, **Atualizar foto** (Off-white), **Compartilhar** (Teal) e **Personalizar**, que abre as opções na coluna da direita em linhas que abrem e fecham, como no Livvo Virtual Poster; formato **Pôster ou Ingresso** só com carimbos de presença (mantido "Show da minha vida"); **Meu histórico** e **Gerar meu Wrapped** do Livvo Virtual Poster na Minha História. Seções 5, 5.2, 5.5, 5.6, 6.3, 6.5, 7 e decisões 30 a 39.

> **Revisão 6 (07/10/2026, pedido às 17h05 e respostas às 17h09):** chave **Pôster | Ingresso** acima do pôster (grava na hora) e fora do Personalizar; **sem carimbo por padrão**; na página do show, "Como foi" na largura toda, Resenhas e Quem foi lado a lado e a **faixa Setlist · Foi com alguém? · Mais shows do artista · Mais shows nesta casa** lado a lado (drop down no celular); **"N shows juntos" abre a janela** com os ingressos de vocês e convida a avaliar; **convites mostram os shows em comum**; Minha História sem "Compartilhar credencial", Concert Buddies em **caixas** (5 com mais shows) e **números do passaporte clicáveis**. Seções 5.3, 5.5, 6.3, 6.5 e decisões 40 a 49.

> **Revisão 7 (07/10/2026, pedido às 19h23 e respostas às 19h28):** **foto padrão 4:5** (a foto do canhoto dos ingressos, sem textos) no Registrar, no Início (Sua agenda, Vem aí, Quem você segue) e em toda a Comunidade; **janela depois do "Eu fui"** com o pôster padrão e o convite a compartilhar; **Concert Buddies, Shows em comum e Pessoas em caixas** lado a lado que quebram a linha; **janela de shows juntos com as duas fotos e Compartilhar**; **Artistas favoritos** (Favoritar discreto e seção na Minha História antes de Concert Buddies). Seções 5.7, 5.8, 6.1, 6.4, 6.5, 6.6, 7 e decisões 50 a 58.

> **Revisão 8 (07/10/2026, pedido às 21h05 e respostas às 21h11):** a homepage do Livvo (`site/homepage-inicial-livvo.html`, no visual do Livvo final) vira a **página de entrada** da prévia, em `/bem-vindo`. Quem chega sem ter entrado vai para ela; o **ícone do app** leva a ela sem sair da conta; **Pedir acesso** abre o Entrar da prévia; os links da prévia vão ao Explorar; **Entrar** discreto no cabeçalho. A página é uma **cópia ligada ao app** (`public/bem-vindo/index.html`). Seções 2, 6.0 e decisões 59 a 64.

> **Revisão 9 (07/10/2026, pedido às 21h24 e respostas às 21h27):** na página de entrada, **fotos novas** (enviadas pelo Edmir) com o duotone teal, **furos do cartão da frase de posicionamento em cima e embaixo** a 25% da borda esquerda e **"Comece agora"** no lugar de "Pedir acesso", "Quero entrar no Livvo", "Explorar a prévia" e "Pedir acesso ao beta" (sem "Testar a prévia" e sem as frases sobre o beta fechado). Seção 6.0 e decisões 65 a 69.

> **Revisão 10 (07/10/2026, pedido às 21h51):** na Minha História, **"Minhas Conquistas" logo depois de "Registrar show"** e os **4 botões numa linha só**, sem quebrar o texto; o **"Registrar show"** do cabeçalho no mesmo modelo do "Comece agora" da página de entrada; e a regra: **ingressos e botões-ingresso têm os furos sempre em cima e embaixo, nunca nas laterais**. Seções 4, 5 e 6.5 e decisões 70 a 72.

> **Revisão 11 (08/10/2026, aprovada pelo Edmir às 00h55):** as 12 correções da "Análise atualizada do projeto" (07/10) e as 6 decisões que estavam pendentes. **Sem escada de verificação** (frase "Em breve, o Livvo vai verificar a sua presença nos shows."); **conquistas a partir de 5 shows**; frase de posicionamento com **"encontrou"** em todos os lugares; **só as faixas de acesso** (Pista → All Access); Minha História com os **4 botões em grade 2 × 2 no celular** e **boas-vindas na conta zerada**; na página do show no celular, **as notas vêm logo abaixo do pôster**; **Eu fui sem ✓ antes do toque**; **"Falta 1 show"**; Credencial sem rótulo de teste e com um só "Adicionar foto"; página de entrada com os nomes do app; **visitante cria e compartilha 1 pôster sem login**; **médias só com notas públicas e de seguidores, mínimo de 5**. Novidades: **aviso animado de nova conquista** e **sino com "O que quem você segue está vivendo"**, com o Início destacando o que é novo desde a última visita. Seções 5.9, 6.0, 6.1, 6.3, 6.4 e 6.5 e decisões 73 a 86. **Ajuste das 06h18:** botões da Minha História na ordem Registrar show, Meu histórico, Gerar meu Wrapped e Minhas Conquistas; filtros das conquistas na ordem Conquistadas, A conquistar, Todas e Em breve; inclui a correção do Codex no nome do arquivo de conquistas (decisões 87 e 88).

> Importante: pelo plano de fusão, **B continua sendo a base técnica**. Esta prévia é a referência visual e de comportamento. Reaproveitar ou reescrever os componentes no stack de B é decisão do Greg.

---

## 1. Como abrir e testar

| Item | Como |
| --- | --- |
| Prévia na Vercel | `https://livvo-app-complementar-git-livvo-final-livvo1.vercel.app` (padrão de endereço da Vercel; pede login na Vercel, como as outras prévias) |
| Rodar no computador | `npm install` e `npm run dev` (servidor Express + Vite na porta 3000) |
| Conferir tipos e build | `npm run build` (roda `tsc -b` e `vite build`) |
| Conta de demonstração | A primeira visita abre a página de entrada (`/bem-vindo`); "Comece agora" ou "Entrar" com qualquer e-mail abre a conta de demonstração: Marcelo Ferreira, @toboi, com as 25 memórias reais dele no site atual |
| Ver como visitante | Menu da conta (avatar) → "Sair e ver como visitante". Qualquer e-mail na tela de entrar volta para a conta de demonstração (login simulado, nada é enviado) |
| Comunidade de exemplo | Menu da conta → "Comunidade de exemplo" liga e desliga pessoas, números, resenhas e atividade fictícios. Desligada, mostra os estados vazios reais |
| Restaurar ou zerar | Menu da conta → "Restaurar as 25 memórias" ou "Começar do zero" |
| Laboratório | `/estudio` abre o Estúdio, a Wallet e a área interna do redesign como estavam (com `?admin=1` para o menu de admin) |

---

## 2. Rotas (endereços públicos)

Os endereços de show precisam ser definidos agora e nunca mais mudar, porque vão circular no WhatsApp e no Google (decisão irreversível nº 5 do plano de fusão).

| Rota | Tela | Pública sem login? |
| --- | --- | --- |
| `/` | Início (logado). Sem ter entrado, redireciona para `/bem-vindo` | Sim |
| `/bem-vindo` | Página de entrada do Livvo (homepage), página estática fora do app (sem faixa de prévia, barra inferior e menu do app) | Sim |
| `/entrar` | Abre a janela de entrar; depois de entrar, vai ao Início | Sim |
| `/explorar` | Shows: busca, Passados e Próximos, filtros | Sim |
| `/explorar?q=&aba=proximos&cidade=&ano=&casa=&fui=1` | Mesma tela com filtros na URL (dá para compartilhar uma busca) | Sim |
| `/show/:id` | Detalhe do show. `:id` = Setlist ID do catálogo (ex.: `/show/435f27c7`) | Sim, para ler |
| `/registrar` e `/registrar?artista=:mbid` | Registrar: artista → data → Eu fui | Sim, mas Eu fui pede login |
| `/minha-historia` | Minha História (provisória nesta parte) | Não |
| `/comunidade` e `/comunidade?aba=buddies\|convites\|comum\|pessoas` | Comunidade: Seguindo, Concert Buddies, Convites, Shows em comum e Pessoas | Não (pede para entrar) |
| `/alertas` | Página de espera (parte 4) | Sim |
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
| `--lv-teal` | `#2FB8BA` | Ícones de apoio (o selo da escada de verificação saiu da tela na revisão 11) |
| `--lv-cream` | `#ECE5D1` | Texto principal, botão selecionado |
| `--lv-muted` / `--lv-dim` | `#B3AE9F` / `#8A8577` | Texto secundário e rótulos |
| `--lv-nota` | `#FFD60A` | Números de nota em RAYDIS (amarelo, decisão de 07/10/2026 à tarde). Os ingressos de nota usam Off-white `#ECE5D1` (preenchimento) e Teal `#2FB8BA` (contorno e detalhes) |

| Fonte | Uso |
| --- | --- |
| Alfa Slab One | Títulos de página e seção, nome do artista no pôster e nos ingressos. Título do Passaporte em **Teal** (como "Passaporte Oficial de Shows" do Estúdio) |
| RAYDIS 700 | Números grandes (campos do Passaporte, contagem regressiva, notas, dia no pôster e nas listas). Nunca em texto com acento |
| Barlow 600/700 | Todos os rótulos em caixa alta: tira do ingresso, rótulos de campo, cabeçalhos de grupo, etiquetas, barra inferior, textos do pôster. **Substitui o DM Mono do Estúdio** (a identidade oficial manda Barlow) |
| Plus Jakarta Sans | Corpo do texto no app e no site (**decisão #22 tomada em 08/10/2026**; nos impressos, Barlow). O registro na identidade oficial aguarda a aprovação do texto pelo Edmir |

**Gramática "Bilheteria" do Estúdio (vale para todas as telas).** As classes vêm de `src/index.css` (as mesmas do Estúdio e da Wallet) e funcionam dentro de `.lv-app`; `src/livvo/livvo.css` só troca DM Mono por Barlow e acrescenta o que faltava.

| Elemento | Classe | Onde aparece |
| --- | --- | --- |
| Página-ingresso: papel `#171226`, cantos 10 px | `.lv-ticket` | Topo de Explorar, Registrar, Detalhe do show, Passaporte, Minha História, páginas de espera, entrada do visitante |
| Tira superior: "LIVVO · SEÇÃO" à esquerda, dado à direita (titular, data, passo, total) | `.lv-strip` | Em toda página-ingresso |
| Palco com retícula halftone | `.lv-stage` | Pôster no Detalhe do show, entrada do visitante, páginas de espera |
| Picote com meias-luas: horizontal no celular, vertical a partir de 1024 px | `.lv-perf` | Entre o palco (pôster) e o canhoto (ações) no Detalhe do show |
| Campos de identificação: rótulo + número RAYDIS + nota em Ciano, separados por picote vertical | `.lv-fields` | Passaporte (Shows · Artistas · Cidades com "desde 1998", "mais visto: …", "em 3 estados"), contagem regressiva, médias da comunidade (número em RAYDIS amarelo + ingressos) |
| Marcas de picote como progresso (24 marcas) + percentual | `.lv-ticks` | Faixa do Passaporte, missões (versão fina) |
| Botão-ingresso com canhoto (furos em cima e embaixo, ícone no canhoto, picote tracejado) | `.lv-btn--stub` (+ `--cyan`, `--cream`, `--teal`) | Ações principais: Eu fui, Quero ir/Tenho ingresso marcado, Minha História, Registrar (inclusive o "Registrar show" do cabeçalho, desde a revisão 10), Comece agora |
| **Regra dos furos** (revisão 10) | Ingressos e botões-ingresso têm os furos **sempre em cima e embaixo, nunca nas laterais** | Botão-ingresso sem canhoto (`.lv-btn`): furos a 25% da borda esquerda. "+ Registrar" da barra inferior: furos no centro, em cima e embaixo. "Sua memória" (`.lv-passport`): meio círculo para dentro a 25%, em cima e embaixo. Picote horizontal da página-ingresso no celular: só a linha tracejada (o picote vertical do computador já tem os furos em cima e embaixo). Carteira, Ingresso de memória e cartão da página de entrada já seguiam a regra. A Credencial Backstage (credencial, não ingresso) ficou como está |
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
| **Pôster** (`Poster`) | Capa de cada show: **logo Livvo** no canto superior esquerdo (ícone oficial, como no Estúdio), o **@ da pessoa** embaixo do logo só nas memórias e no que é compartilhado, data (dia em RAYDIS, mês e ano) e UF à direita, nome do artista em Alfa Slab One e casa de show embaixo | Imagem, nesta ordem: foto da memória da pessoa (`show:<id>`) → foto definida pelo admin (`artista:<id>`) → **foto automática do artista** (seção 5.1) → pôster halftone gerado pelos dados (5 paletas por hash do artista, "sol" de retícula). A foto automática só é buscada quando o card chega perto da tela. Toda foto aparece com o duotone suave e uma retícula leve por cima, com escurecido em cima e embaixo para o texto |
| **Card de show** (`CardShow`) | Pôster + artista + casa · cidade + data + linha social | Linha social: avatares + "N registraram" (passado) ou "N querem ir" (futuro) ou a etiqueta Quero ir / Tenho ingresso. Carimbo "Você foi" ou etiqueta "Exemplo" no canto do pôster |
| **Carimbo "Você foi"** (`CarimboFui`) | Marca de presença na "Sua memória" e nos cards | Borda Ciano, inclinado −6°, animação de carimbo de 0,42 s ao registrar (desligada com "reduzir movimento") |
| **Carimbo de presença** (`Carimbo`) | Carimbo do pôster e do ingresso escolhido no Personalizar: **Eu fui!** (Ciano, "Presença registrada") ou **Show da minha vida** (amarelo das notas `#FFD60A`, "Memória inesquecível") | Borda tracejada de 2 px, inclinado −12° no pôster e −8° no ingresso, Barlow 800. O vermelho que o Estúdio usava no "Show da vida" saiu: não é da paleta oficial |
| **Nome do artista** (pôster, ingresso, cards e imagens) | **Nunca partido no meio da palavra** (revisão 5): se o nome não cabe numa linha, a palavra seguinte vai inteira para a linha de baixo | `word-break: keep-all`, `hyphens: none`; a fonte diminui até a palavra mais longa caber (`tamanhoNome`: ~0,72 em por letra na Alfa, 0,56 na Barlow, 0,8 na RAYDIS, largura útil de 85% do pôster). Nas imagens geradas, a quebra é feita palavra por palavra no `<canvas>` |
| **Notas em ingressos** (`Discos`, nome mantido por compatibilidade) | Nota de meio a cinco em 5 ícones. **Modelo em teste desde a revisão 5:** ingresso inclinado a −45° com recorte lateral, picote e estrela (ícone enviado pelo Edmir às 16h04), em SVG 24 × 24 só com traço. O modelo anterior (ingresso vertical com código de barras e palheta) fica no código como `IngressoVerticalAnterior` | Preenchido: traço Teal `#2FB8BA`, fundo transparente (onde o ícone é branco). Meio ponto: metade esquerda em Teal (toque na metade esquerda vale meio ponto). Sem nota: traço apagado (`#3A3159`), ou Teal a 38% quando dá para tocar. Acessível como `role="slider"` (setas mudam 0,5). O ícone mede 1,1 × o `tamanho`. O mesmo desenho vai para as imagens de compartilhar |
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
| **Padrão Livvo** (`padronizar`) | Toda foto enviada ou escolhida vira um JPEG 640 × 800 (4:5): recorte centralizado e puxado para cima (rostos) e **duotone suave** (mapa de cores Preto Profundo → azul-petróleo escuro → Teal → Teal claro → Off-white, com ajuste leve de níveis), que mantém os detalhes da foto. Feito no `<canvas>` do navegador. Fotos salvas com o halftone antigo são ignoradas (`v` do tratamento) |
| **Foto automática** (`/api/foto-artista?nome=` e `useFotoAutomatica`) | Todo artista busca sozinho a foto principal, pela mesma regra da "foto certa do artista" abaixo. Resposta com cache na CDN (7 dias) e no navegador (3 dias), até 4 pedidos ao mesmo tempo. A foto aparece com o mesmo duotone por um filtro SVG (`#lv-duotone`, em `AppShell.tsx`), sem copiar a imagem |
| **Atualizar foto** (memória) | Botão logo abaixo do pôster na página do show, link em "Sua memória" e em cada ingresso da Carteira. Abre uma janela com a prévia do pôster: **Enviar uma foto sua** ou escolher uma das **Fotos do artista** (Deezer Oficial, Wikimedia Commons, Wikipédia; até 12). Salvar, Cancelar e "Voltar à foto automática" (ou à foto do artista). A foto enviada pela pessoa fica marcada na memória (base para a verificação, que chega em breve; a escada não aparece na tela desde a revisão 11) |
| **Atualizar todas as fotos** (admin) | Menu da conta, só com `?admin=1`. Escopo: artistas da conta e da agenda (rápido) ou todo o catálogo da prévia (653 artistas). Para cada artista: foto do catálogo (Deezer) ou a melhor foto do `/api/artist-search` (só nome exato), padronizada e salva para todos os pôsteres e ingressos do artista. 3 em paralelo, progresso em picotes com %, Parar, opção de refazer quem já tem foto, lista de quem ficou sem foto nas fontes e "Voltar todos aos pôsteres gerados" (pede segundo toque) |
| **`GET /api/foto?url=`** | Busca a imagem pelo próprio domínio para o canvas poder tratá-la. Só HTTPS e só os domínios das fontes (`*.dzcdn.net`, `*.deezer.com`, `upload.wikimedia.org`, `thumb.wikimedia.org`, `*.mzstatic.com`), só `image/*`, até 6 MB, cache de 7 dias. Qualquer outro endereço responde 403 |
| **Armazenamento na prévia** | IndexedDB do navegador (`livvo_final_fotos`), chaves `show:<id>` e `artista:<id>`, com origem e fonte. No site final: armazenamento de arquivos de B, com a foto do artista compartilhada por todos e a da memória só da pessoa |

**Foto certa do artista** (`/api/artist-search` e `buscarFotosDoArtista`): só entram nomes iguais ao do catálogo; homônimos do Deezer são ordenados por fãs e fica só o principal (ex.: há vários "Oasis"); homônimo com menos de 1.000 fãs sai quando há fonte melhor (ex.: "Biquini" com 34 fãs, enquanto a banda está na Wikipédia como "Biquini (banda)"); a silhueta vazia do Deezer sai; páginas da Wikipédia cuja descrição não é de música saem (ex.: "Oasis", o oásis do deserto). Conferido na prévia publicada com Oasis, Keane, Biquini, Vanguart, Dave Matthews Band e Nenhum de Nós.

Bancos de imagem genéricos (Unsplash, usados como reserva no Estúdio) ficam fora: não são fotos do artista. Antes de produção, o Greg deve conferir os termos de uso das fontes (API do Deezer, licenças por arquivo do Wikimedia) e guardar a fonte de cada foto.

### 5.2 Compartilhar (`src/livvo/Compartilhar.tsx`)

| Peça | Como funciona |
| --- | --- |
| **Onde fica** | Desde a revisão 5, **logo abaixo do "Atualizar foto", sob o pôster**: botão Teal com texto preto (saiu da "Sua memória"). O menu abre para baixo. O "Compartilhar" do topo da página do show só aparece quando a pessoa não foi ao show (não há memória). No celular, as opções abrem numa folha presa embaixo da tela |
| **Instagram Stories e Feed** | O site não consegue postar direto no Instagram. O Livvo gera a imagem pronta no `<canvas>`: 1080 × 1920 (Stories) ou 1080 × 1350 (Feed), com o pôster (mesma imagem e tratamento da tela, logo, @ da pessoa), com a personalização da memória (formato pôster ou ingresso, carimbo de presença, fonte, tamanho, posição, cor, frase, faixa, setor, com quem, casa e @; seção 5.5), Nota do Show e da Organização em ingressos com o número em RAYDIS amarelo, data por extenso e o endereço livvomusic.com.br (#12). No celular abre o menu do aparelho (Web Share com arquivo) e a pessoa escolhe o Instagram; no computador a imagem é baixada com o aviso "Abra o Instagram e publique" |
| **Facebook** | Abre a janela de compartilhar do Facebook com o link do show |
| **WhatsApp e link** | WhatsApp com texto pronto e link; "Copiar link" |

**Para o Greg (prévia do link no Facebook):** para o post mostrar a foto e o nome do show, a página `/show/:id` precisa devolver as meta tags `og:title`, `og:description` e `og:image` geradas no servidor (o app é uma página única e hoje tem tags genéricas). Na prévia da Vercel isso não dá para conferir, porque o Facebook não consegue ler uma página que pede login na Vercel.

### 5.3 Concert Buddies (`src/livvo/ConcertBuddies.tsx`, `src/livvo/store.ts`)

| Peça | Como funciona |
| --- | --- |
| **Marcar no "Foi com alguém?"** | Na página de um show que a pessoa foi: campo "Marcar quem foi com você" com sugestões (primeiro quem foi a este show, depois quem ela segue, depois as demais pessoas). Ao escolher, vira um convite "Aguardando aceite"; dá para desmarcar. Cada marcado mostra quantos shows vocês viram juntos. O WhatsApp continua para quem ainda não está no Livvo. Em show futuro ou sem memória, o bloco convida a registrar primeiro |
| **Aceite** | O show só entra na história do amigo se ele aceitar. Na prévia, as pessoas de exemplo aceitam sozinhas depois de alguns segundos, para mostrar o fluxo |
| **Quem pode marcar você** | Todos, Quem eu sigo (padrão proposto) ou Ninguém, na aba Convites da Comunidade. Uma pessoa de exemplo (@igornunes) não aceita marcações, para mostrar a regra na sugestão |
| **Convites recebidos ("Fomos juntos")** | Aceitar cria a memória do show (ou liga a pessoa à memória que já existe); Recusar só arquiva. A conta de demonstração recebe 3 convites de exemplo |
| **Mais shows juntos** | Lista pessoal (sem ranking geral). Na Comunidade, todos em linhas; na Minha História, os **5 com mais shows em caixas lado a lado** (avatar, nome e "N shows juntos"; no celular, rolagem lateral) com "Ver todos" quando há mais de 5 |
| **Janela "Shows juntos"** (`JanelaShowsJuntos`, revisão 6) | Tocar em "N shows juntos" (no "Foi com alguém?", na Comunidade ou numa caixa da Minha História) abre uma janela por cima da página: "Você e {nome}", @ e quantos shows, e os ingressos virtuais de todos os shows de vocês (pôster no canhoto, com a personalização da memória). Shows sem a sua nota mostram "Falta a sua nota" e o botão **Avaliar**, que leva à página do show com o foco na Nota do Show (`?avaliar=show`); sem a nota da organização, "Falta a organização" (`?avaliar=org`). No alto, um aviso em amarelo conta quantas notas faltam. Os shows sem a sua nota vêm primeiro na lista; depois, do mais recente ao mais antigo |
| **Convites com shows em comum** (revisão 6) | Cada convite "Fomos juntos" mostra uma etiqueta com quantos shows vocês têm em comum (juntos como Concert Buddies + os mesmos shows registrados). A etiqueta abre a mesma janela com esses shows. Sem nenhum: "Primeiro show juntos" |

### 5.4 Comunidade (`src/livvo/pages/Comunidade.tsx`)

Abas em texto: **Seguindo** (o que quem você segue registrou, com notas), **Concert Buddies** (mais shows juntos), **Convites** (quem pode marcar você + convites "Fomos juntos" para aceitar ou recusar, e os respondidos), **Shows em comum** (pessoas que foram aos mesmos shows, com Seguir) e **Pessoas** (para seguir). Com a "Comunidade de exemplo" desligada no menu, cada aba mostra o estado vazio real. Visitante vê o convite para entrar.

### 5.5 Personalizar e formato Ingresso (`src/livvo/Personalizar.tsx`, `src/livvo/Ingresso.tsx`)

| Peça | Como funciona |
| --- | --- |
| **Chave Pôster \| Ingresso** (revisão 6) | Acima do pôster (`.lv-seg` do Estúdio), visível sempre que há memória do show. **Grava na hora** na memória, sem passar pelo Salvar; com o painel aberto, a prévia acompanha. Saiu do Personalizar |
| **Botões sob o pôster** (só com memória) | Em pilha, na largura do pôster (no celular, na largura da tela, abaixo do pôster): **Atualizar foto** (botão-canhoto Off-white, texto preto), **Compartilhar** (botão-canhoto Teal, texto preto) e **Personalizar** (contorno Ciano; aberto, fica preenchido em Ciano). Embaixo, a legenda do tipo de foto: só "Foto automática", "Foto do artista", "Sua foto no padrão Livvo" ou "Pôster gerado pelos dados do show" (sem a fonte, revisão 5) |
| **Painel Personalizar** (revisão 12, 09/10/2026) | Ocupa a coluna da direita do ingresso da página (no lugar do título, da "Sua memória" e da prova social); no celular aparece abaixo dos botões, e o pôster cresce (até 340 px) para a prévia ficar legível. Linhas que abrem e fecham, uma por vez (`.lv-row` do Estúdio): **Memória do show** (Faixa, setor e com quem; **Nota no card**, só quando o show tem nota) e **Identificação** (Seu @ no card, Casa de show). Carimbo de presença, Fonte, Tamanho e Posição do nome, Frase no alto e Cor de destaque saíram do app e ficam só no Estúdio (decisões 89 e 90) |
| **Prévia e salvar** | Toda mudança aparece na hora no pôster ou no ingresso da esquerda. Nada é gravado até **Salvar** (fica apagado sem mudanças). **Descartar e fechar** e **Voltar ao padrão**. Fechar o painel sem salvar volta ao que estava salvo |
| **Opções** (revisão 12) | Faixa marcante (até 40 caracteres), setor (Pista, Pista premium, Cadeira, Arquibancada, Camarote, Backstage; grava no campo `setor` da memória), mostrar setor e mostrar com quem fui (Concert Buddies que aceitaram + `comQuem`), **mostrar a nota** (campo novo `mostrarNota`, padrão ligado; vale para o ingresso e as imagens de Stories e Feed), mostrar @ e mostrar casa. `personalizacaoDe` (`store.ts`) devolve sempre o padrão para `CAMPOS_SO_NO_ESTUDIO` (carimbo, cor, fonte, tamanho, posição e frase): Alfa Slab One, Grande, Embaixo, Ciano, sem carimbo e sem frase, mesmo em memórias salvas antes |
| **Onde vale** | Pôster da página do show, pôster do canhoto na Carteira da Minha História e as imagens de Stories e Feed. Na Carteira, o canhoto continua sendo o pôster (a Carteira já é um ingresso) |
| **Formato Ingresso** (`IngressoMemoria`) | O Ingresso Retrô do Livvo Virtual Poster (A) com o mesmo contorno (960 × 352, furos em cima e embaixo, picote e canhoto), escalado pelo `RetroTicketStage` do A. Ajustado à identidade: rótulos em Barlow (sem DM Mono), logo Livvo e @ no canhoto, data em RAYDIS, foto com o duotone suave (ou retícula Teal sem foto), frase no alto, nome em até duas linhas sem partir palavra, traço na cor de destaque, faixa/setor/com quem, Local e Cidade, nota em ingressos e livvomusic.com.br. Do Estúdio ficaram de fora o selo de colecionador, VIP, contagem regressiva, "Show histórico", filtros e temas: só os carimbos de presença. No computador, a coluna do palco passa de 380 para 540 px quando o formato é Ingresso |

### 5.6 Meu histórico e Wrapped (`src/livvo/HistoricoWrapped.tsx`)

Na Minha História, abaixo de "Registrar show" e "Compartilhar credencial": **Meu histórico** (botão-canhoto Teal, ícone de gráfico) abre, dentro do Passaporte, a seção do Estúdio com a tira "Livvo · Meu histórico" e Fechar e os mesmos gráficos do `MyHistory` do A (shows por ano, por mês em cada ano, linha do tempo acumulada com as faixas, artistas, cidades e casas mais vistos, dias da semana, distância entre shows e marcos). **Gerar meu Wrapped** (botão-canhoto Off-white, ícone de brilho) abre o `TourWrappedModal` do A (Baixar e Compartilhar o PNG). Os dois componentes do A são usados sem mudança; a ponte converte cada memória no `CollectedTicket` do A (data `dd/mm/aaaa`, carimbo e faixa da personalização) e monta o `FanStats` a partir do Passaporte (nível = faixa do Passaporte; artista mais visto com a mesma foto dos pôsteres, passando por `/api/foto` para o PNG). Os rótulos em DM Mono desses componentes aparecem em Barlow dentro do Livvo final. Carregados só quando a pessoa abre.

### 5.7 Foto padrão 4:5 e caixas (`src/livvo/ui.tsx`: `FotoArtista`, `FotoPessoa`, `CaixaFoto`)

| Peça | Como funciona |
| --- | --- |
| **Foto padrão** | A foto do canhoto dos ingressos, **sem textos**: recorte 4:5, duotone suave com retícula leve, cantos 10/5 px (como o canhoto) e contorno Ciano a 18%. Tamanho do canhoto da Carteira: **72 × 90 px no celular** e **96 × 120 px a partir de 640 px** nas listas (`Linha` com `foto`). Nas caixas, até 120 px de largura |
| **Artista** (`FotoArtista`) | Mesma ordem de imagem do pôster: foto salva pelo admin → foto automática (buscada só quando a foto chega perto da tela) → retícula gerada pela paleta do artista |
| **Pessoa** (`FotoPessoa`) | A sua usa a foto da Credencial (`livvo_user_photo_v1`) com o mesmo tratamento. Quem não tem foto (todas as pessoas de exemplo) ganha a retícula da paleta com as **iniciais** em Alfa Slab One |
| **Onde aparece** | Registrar (cabeçalho do artista e linhas de artistas); Início (Sua agenda, Vem aí, Quem você segue); Comunidade inteira. Em linhas sobre um show (atividade de quem você segue, convites, respondidos) a foto é **do artista**; em pessoas (caixas), a foto é da pessoa. Com a foto, o título da linha quebra por palavra em vez de cortar |
| **Caixas** (`CaixaFoto`) | Foto em cima, nome, número (RAYDIS Ciano) e uma ação opcional embaixo (Seguir, coração). Na Minha História: até 5 numa fileira (rolagem lateral no celular). Na Comunidade (Concert Buddies, Shows em comum, Pessoas): **lado a lado até a borda da página e depois a linha de baixo** (colunas de no mínimo 150 px; 2 por linha no celular) |

### 5.8 Janela do Eu fui, Compartilhar shows juntos e Artistas favoritos

| Peça | Como funciona |
| --- | --- |
| **Janela do Eu fui** (Registrar) | Ao tocar em "Eu fui" na lista de datas do artista: a data vira carimbo "Você foi" e abre a janela "Livvo · Eu fui" com o **pôster padrão** do show (com a personalização da memória, sem carimbo por padrão), "Seu pôster está pronto. Compartilhe nos Stories, no Feed ou com quem estava lá.", o **Compartilhar** (Teal; Instagram Stories e Feed, Facebook, WhatsApp e link), **Dar nota agora** (Off-white; leva à página do show com foco na Nota do Show) e **Continuar registrando**. Só no Registrar: a página do show já mostra o pôster |
| **Janela de shows juntos / em comum** | No alto, **as duas fotos lado a lado** (a sua e a da outra pessoa), "Você e {nome}", os dois @ e o número; botão **Compartilhar** (Teal). A imagem gerada (Stories 1080 × 1920 ou Feed 1080 × 1350) traz o logo, as duas fotos com os @, "Você e {nome}", o número em RAYDIS amarelo com "SHOWS JUNTOS" (ou "EM COMUM"), os ingressos dos 5 (Stories) ou 3 (Feed) shows mais recentes, "e mais N no Livvo" e livvomusic.com.br. Também Facebook e WhatsApp |
| **Favoritar** (`src/livvo/Favoritos.tsx`) | Botão discreto em pílula com coração ("Favoritar" / "Favorito", Ciano quando ativo) ao lado do nome do artista na página do show e no cabeçalho do artista em Registrar. Grava na hora |
| **Artistas favoritos** (Minha História) | Antes de Concert Buddies, em caixas como as de Concert Buddies: foto do artista, nome e "N shows" (os seus). Mostra os favoritos, **até 5, os com mais shows seus**. **Sem nenhum favorito**, mostra os seus 5 artistas mais vistos com o título "Artistas favoritos · seus mais vistos" e o convite "Toque no coração para escolher os seus favoritos". Cada caixa leva aos shows do artista no Explorar e tem o coração para favoritar ou tirar |

---

### 5.9 Novidades e pôster grátis (revisão 11: `src/livvo/Novidades.tsx`, `src/livvo/conquistasLogic.ts`, `src/livvo/PosterVisitante.tsx`)

- **Aviso de nova conquista (`AvisoConquista`, montado no `AppShell`):** quando o registro de **1 show** desbloqueia conquistas, abre uma janela com o sticker entrando animado (escala e giro, raios girando atrás), o nome, o critério, "E mais N conquistas: …" quando for mais de uma, o botão-canhoto **"Ver Minhas Conquistas"** (leva a `/minha-historia?ver=conquistas`, que abre a galeria) e "Continuar". Com movimento reduzido no sistema (`prefers-reduced-motion`), nada anima. Restaurar a demonstração ou zerar a conta não dispara aviso. Chave: `livvo_final_conquistas_vistas_v1`.
- **Conquistas a partir de 5 shows (N2):** `avaliarConquistas` (em `conquistasLogic.ts`) trava tudo antes de 5 shows; a galeria mostra "Faltam N shows para a sua primeira conquista", picotes 0/5 e "Registrar show", com todas as figurinhas e sem filtros. A partir de 5 shows, filtros na ordem **Conquistadas, A conquistar, Todas, Em breve**, abrindo em Conquistadas (decisão de 08/10, 06h18). `paraIngressosA` mudou para esse arquivo leve (o `HistoricoWrapped` reexporta), para o aviso não carregar os gráficos e o Wrapped. **Nome do arquivo:** `conquistasLogic.ts`, e não `conquistas.ts`, porque no macOS (que não diferencia maiúscula de minúscula) ele colidia com `Conquistas.tsx`; a correção é do Codex (commits `f4b8864` e `9eb2564`, 08/10).
- **Sino (`SinoAtividade`):** o sino do cabeçalho deixa de ser só o link de Alertas. Ponto Ciano pulsando quando quem você segue registrou algo depois da última visita; o toque abre o painel **"O que quem você segue está vivendo"** (até 6 registros, os novos com a etiqueta Novo, "Ver na Comunidade" e "Alertas de shows"). No celular, o painel ocupa a largura da tela. Abrir o painel ou visitar o Início marca como visto (`livvo_final_atividade_vista_v1`). Nesta prévia a atividade vem da comunidade de exemplo, com horário fixo no dia; no site, vem do banco (registros públicos ou para seguidores de quem a pessoa segue).
- **Pôster grátis do visitante (decisão 3 de 07/10):** sem login, o Eu fui (página do show ou Registrar) abre a janela "Seu pôster" com o pôster do show, **Compartilhar** (Stories, Feed, Facebook, WhatsApp, Copiar link) e **"Entrar e guardar"**. Vale 1 pôster por visitante (`livvo_poster_visitante_v1`); o 2º pede login. "Entrar e guardar" abre o login e, ao entrar, registra o show na história. No site, o limite deve ficar no servidor (por aparelho e IP), não só no navegador. O menu da prévia tem "Zerar pôster grátis e cards sem login" para testar de novo.

## 6. Telas

### 6.0 Página de entrada (`public/bem-vindo/index.html`, revisão 8)

A homepage do Livvo no visual do Livvo final (feita em 07/10 a partir de `site/homepage-inicial-livvo.html`), servida pelo app em `/bem-vindo` como página estática, fora do `AppShell`.

- **Cópia ligada ao app:** `public/bem-vindo/index.html` é uma cópia do arquivo da pasta com só estas mudanças: fontes e imagens do próprio app (`/fonts`, `/brand`, ícone `/livvo/livvo-icon-256.png`, `img/` com o ingresso `02-teal-wordmark` e as duas fotos de show), "Pedir acesso", "Quero entrar no Livvo" e "Pedir acesso ao beta" levam a `/entrar`; "Explorar a experiência", "Conhecer a plataforma", "Explorar a prévia" e "Testar a prévia" levam a `/explorar`; "Entrar" discreto no cabeçalho (no celular, dentro do menu). Para quem já entrou, o "Entrar" vira "Abrir o Livvo" e os botões de acesso levam ao Início (lido da sessão da prévia, `livvo_login_sim_v1`). A mesma cópia fica na pasta do Livvo em `site/homepage-entrada-app/`; mudanças na página do app são feitas nessa cópia e depois sincronizadas no repositório.
- **Quando aparece:** quem abre a raiz sem ter entrado é levado para `/bem-vindo`. A primeira visita não entra mais sozinha na conta de demonstração: o Entrar é que abre essa conta. Quem já entrou e toca no **ícone do app** (cabeçalho) também vai para `/bem-vindo`, sem sair da conta.
- **Servir a página:** na Vercel, `vercel.json` reescreve `/bem-vindo` e `/bem-vindo/` para `/bem-vindo/index.html` antes da regra do app; no servidor local, `server.ts` faz o mesmo. No site final de B, a página de entrada deve ser renderizada no servidor (é a página que o Google e as prévias de link vão ler).
- **Revisão 9:** a abertura usa a foto do show com a plateia de mãos para cima (`img/show-abertura.jpg`, IMG_6117) e o ingresso "Tem noites que passam" usa a do naipe de metais (`img/show-ingresso.jpg`, IMG_6177), as duas com o duotone teal da página (filtro `#lv-duotone`: Preto Profundo → Teal → Off-white) e otimizadas a 1600 px. As outras duas fotos enviadas (orquestra, IMG_5999, e Dave Matthews Band) ficam de reserva na cópia da pasta, sem uso. O cartão "Filmes e séries têm os seus apps…" tem os furos de picote em cima e embaixo, a 25% da borda esquerda (meio círculo de 22 px para dentro do cartão). Todos os botões de acesso dizem **"Comece agora"** e levam ao Entrar da prévia (quem já entrou vai ao Início); saíram "Testar a prévia", "Beta fechado com acesso por convite · Explore uma prévia agora" e "O beta está em fase fechada. O pedido de acesso abre seu aplicativo de e-mail.". "Explorar a experiência" e "Conhecer a plataforma" continuam levando ao Explorar. O original `site/homepage-inicial-livvo.html` não mudou.
- **Frase de posicionamento:** "Filmes e séries têm os seus apps. A música ao vivo encontrou o seu lugar definitivo." — "encontrou" em todos os lugares (decisão do Edmir de 07/10/2026, revisão 11; substitui a de 07/10 às 20h52).
- **Nomes do app (revisão 11):** o item 04 fala em "Minha História" e "Carteira de ingressos", e o bloco do ingresso em "Ingresso de Memória" (saíram "Livvo Wallet" e "Livvo Ticket Memory").

### 6.1 Início (`src/livvo/pages/Inicio.tsx`)

**Logado**, no computador em duas colunas (principal + lateral de 360 px a partir de 1100 px); no celular em uma coluna, nesta ordem:

1. Data em rótulo e "Oi, Marcelo." (Alfa Slab One).
2. **Cartão de momento**, um só pedido por vez, no **ingresso em contorno Ciano** (pôster no canhoto). Prioridade:
   1. amanhã tem show (Quero ir ou Tenho ingresso para amanhã);
   2. como foi? (show com interesse entre hoje e 3 dias atrás, ainda sem memória) → botão Eu fui;
   3. neste dia (aniversário de um show da história) → Ver memória;
   4. faltam até 3 dias para um show com interesse → Ver show;
   5. complete essa história: **dar a Nota da Organização ali mesmo**, nos discos; ao tocar, salva e passa para a próxima memória sem nota.
3. **Seu Passaporte** (página-ingresso, tira "Livvo · Passaporte de fã / Titular @toboi"): título "Seu Passaporte" em Alfa Teal, nome e "no Livvo desde ago 2026", faixa (Pista Premium), campos Shows · Artistas · Cidades com notas "desde 1998", "mais visto: Dave Matthews Band", "em 3 estados" (decisão #3), 24 marcas de picote com "Falta 1 show para o nível Camarote" (singular desde a revisão 11) e 94%, botão-canhoto Teal "Minha História".
4. **Missões do mês** (completar o vivido, nunca "vá a mais shows"), como os desafios da Wallet: caixa de marcar, título, apoio, picote fino 0/3 e link. "Avalie a organização de 3 shows" (conta as notas de organização dadas no mês) e "Resgate um show antigo".
5. Lateral (linhas com picote sob cabeçalho de grupo): **Sua agenda** (Quero ir e Tenho ingresso, com "em 10 dias"), **Vem aí** (shows futuros de artistas que a pessoa já viu: "Você viu 1 vez"), **Quem você segue** (atividade de exemplo; sem exemplos, convite para seguir quem foi aos seus shows).

**Visitante:** página-ingresso com palco halftone, "Registre · Avalie · Colecione", "Sua história através dos seus shows.", subtítulo do plano, botões "Comece pela sua história" (abre entrar) e "Explorar shows", e uma faixa de shows recentes. A landing completa é a parte 4.

**Conta zerada:** o cartão de momento vira "Qual foi o último show que você viu?" com "Registrar meu primeiro show".

**Revisão 11 · O que quem você segue está vivendo** (coluna lateral, que substitui o antigo "Quem você segue"): registros das pessoas seguidas, com a frase "N novidades desde a sua última visita" e as linhas novas marcadas com a borda Ciano e a etiqueta **Novo**. A visita ao Início marca a atividade como vista (o ponto do sino some). Mesmos dados do sino e da aba Seguindo da Comunidade (`useAtividade`, seção 5.9).

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

Página-ingresso com tira "Livvo · Shows / 23 nov 2025". Computador: **palco** halftone com o pôster (380 px) · **picote vertical** · **canhoto** com título, dados e ação. Celular: pôster menor (38% da largura) ao lado do título no palco, picote horizontal e a ação logo abaixo, para o **Eu fui aparecer sem rolar**. Abaixo do ingresso (revisão 6): **Como foi, para quem estava lá** na largura toda; **Resenhas** e **Quem foi** lado a lado no computador (1,45 : 1); e a **faixa de 4 blocos** — Setlist, Foi com alguém?, Mais shows de {artista}, Mais shows nesta casa — em 4 colunas a partir de 1280 px, 2 colunas de 768 a 1279 px e, no celular (até 767 px), em **drop down**: cada bloco é uma linha com o resumo à direita (setlist.fm, "N marcados", quantidade de shows) que abre e fecha.

1. Voltar · Compartilhar (só sem memória). Com memória, sob o pôster: Atualizar foto, Compartilhar e Personalizar (seção 5.5). **No celular (revisão 11)** esses três botões saem de baixo do pôster e vêm **depois das notas**, menores (contornados, numa linha de 3), para as notas aparecerem logo abaixo do pôster.
2. Turnê (ou "Show ao vivo" / "Show que vem aí"), etiqueta "Show de exemplo" quando for o caso, artista, casa (link para Explorar filtrado pela casa) · cidade, UF, data por extenso · "há 10 meses" / "em 10 dias". Sem ícones de local e data (#15).
3. **Ação principal:**
   - Passado, sem memória: botão-canhoto **Eu fui** (Ciano, largura total no celular; ícone **+**, o ✓ só aparece depois do toque, revisão 11) + "Guarde este show na sua história. Leva um toque; as notas você dá logo depois." **Visitante (revisão 11):** o Eu fui abre o **pôster grátis** (seção 5.9) e o texto vira "Crie o pôster deste show e compartilhe, sem precisar de conta. Para guardar na sua história, entre no Livvo."
   - Passado, com memória: **Sua memória** no canhoto de borda Ciano (`.lv-passport`): data do registro e visibilidade, carimbo "Você foi" (animado ao registrar), **Nota do Show** e **Nota da Organização** em ingressos (salvam no toque), frase "Duas notas para o artista não pagar pela fila do bar."; canhoto com a frase **"Em breve, o Livvo vai verificar a sua presença nos shows."** (a escada Registrado → Com foto → Com ingresso → Presença confirmada saiu da tela na revisão 11, pela N1; o cálculo continua guardado em `store.ts`), "Ingresso de Memória · Parte 2" e "Desfazer registro" (pede um segundo toque).
   - Futuro: **Quero ir** e **Tenho ingresso** (um ou outro, tocar de novo desmarca), contagem regressiva no campo "DIAS PARA O SHOW", explicação do lembrete e "O link da ticketeira aparece aqui quando o show vem de uma fonte oficial."
   - O link `?avaliar=org` rola até a Nota da Organização e coloca o foco nela (usado pela missão).
4. Prova social: avatares + "133 pessoas registraram este show, com você" (ou "querem ir"), etiqueta Exemplo. Sem ninguém: "Ninguém registrou este show ainda. Seja a primeira pessoa."
5. **Como foi, para quem estava lá** (só passado e só com amostra mínima): médias de Show e Organização nos campos `.lv-fields` em RAYDIS amarelo + ingressos, até 3 dimensões mais citadas (+ ou −), "Média de N avaliações públicas ou para seguidores. Notas de memórias privadas não entram, e a média só aparece a partir de 5." (revisão 11: `MIN_AMOSTRA_NOTAS = 5` e `MIN_AMOSTRA_RELATORIOS = 30` em `src/livvo/data/social.ts`) Abaixo da amostra, o bloco some (nunca "Sem avaliações" em destaque).
6. **Setlist:** link real para o setlist.fm do show (base do catálogo).
7. **Resenhas de quem foi:** avatar, nome, @, setor, notas de Show e Organização, texto de até 3 linhas, dimensões.
8. **Quem foi / Quem vai:** pessoas com Seguir/Seguindo e "Só aparece quem deixou a memória pública."
9. **Foi com alguém? / Vai com alguém?:** "Chamar no WhatsApp" abre o WhatsApp com texto pronto e o link do show (nada é enviado sozinho).
10. **Mais shows de {artista}** e **Mais shows nesta casa** (até 6 linhas com data, casa ou artista e carimbo "Você foi" quando for o caso, com "Ver todos").

### 6.4 Registrar, versão da parte 1 (`src/livvo/pages/Registrar.tsx`)

Página-ingresso com tira "Livvo · Registrar show / Passo 1 de 2" (e "Passo 2 de 2"). "Qual show você viveu?" → campo sublinhado ARTISTA (com "N shows no catálogo · você foi a N") → lista de datas com casa, cidade e dia da semana, cada uma com **Eu fui** (ícone + antes do toque; vira carimbo ✓ na hora). Sem login, o Eu fui abre o pôster grátis do visitante (seção 5.9). Sem busca, mostra "Artistas da sua história". Três toques até guardar. A parte 2 acrescenta a tela de sucesso com o Ingresso de Memória, o Avaliar em camadas e o "Meu show não está aqui".

### 6.5 Minha História (`src/livvo/pages/MinhaHistoria.tsx`)

Mesma página de identificação da Wallet do Estúdio, sem a linha MRZ:
1. Tira "Livvo · Passaporte de fã / Titular @toboi"; ícone de passaporte e **"Passaporte Oficial de Shows"** em Alfa Teal; "Cada show que você registra vira um carimbo aqui. Os antigos contam também."
2. TITULAR · NOME (Alfa) e @ em Ciano; campos Shows · Artistas · Cidades; 24 marcas com "Faltam N shows para o nível X" ("Falta 1 show", no singular) e percentual. **Conta zerada (revisão 11):** no lugar dos zeros, o quadro "Passaporte em branco · Seu primeiro carimbo está a um show de distância."; "Meu histórico" e "Gerar meu Wrapped" ficam desligados até o 1º show.
3. Botões-canhoto **numa linha só**, na largura toda do Passaporte, nesta ordem (decisão de 08/10, 06h18): **"Registrar show"** (Ciano), **"Meu histórico"** (Teal), **"Gerar meu Wrapped"** (Creme) e **"Minhas Conquistas"** (Creme; abre a galeria de conquistas, `src/livvo/Conquistas.tsx`), seção 5.6. Texto, canhoto e margens acompanham a largura da linha (texto de 11,5 a 13,5 px), sem quebrar texto; abaixo de 720 px, **grade 2 × 2** (revisão 11), com o texto podendo ir para 2 linhas, os 4 sempre à vista. O "Compartilhar credencial" saiu na revisão 6: fica só o "Compartilhar" embaixo da credencial. **Números clicáveis** (revisão 6): Shows rola até a Carteira de ingressos; Artistas e Cidades abrem o Meu histórico e levam ao gráfico "Artistas mais vistos" ou "Cidades", destacado por 2 s. No Início, os mesmos números levam à Minha História (`/minha-historia?ver=carteira|artistas|cidades`). Os campos Shows · Artistas · Cidades ganharam mais espaço entre si (revisão 5).
4. À direita (abaixo no celular): **Credencial Backstage** com os dados da conta (nome, @, shows, desde, nível e acesso calculados pelos shows, Nº de cadastro de teste 16), um só "Adicionar foto" (o botão sobre a credencial; o link "Trocar foto" aparece só depois da foto) e sem o rótulo "Credencial teste" (revisão 11), com o mesmo tratamento e mesma chave `livvo_user_photo_v1` do Estúdio: até 1024 px, mantém transparência, tenta 640 px sem espaço, aviso para HEIC) e "Compartilhar" (PNG em resolução cheia pelo menu do celular ou download).
5. **Carteira de ingressos 25**: memórias por ano em ingressos de contorno Ciano (duas colunas a partir de 1024 px): pôster no canhoto, artista em Alfa, data, casa · cidade, nota do show em ingressos ou "Sem nota", e "Falta a organização" (leva direto à nota). O canhoto mostra a personalização da memória e o nome do artista quebra em até duas linhas, sem cortar palavra.
As abas Números, Coleção (medalhas, desafios, stickers), Agenda e Listas entram na parte 3.

### 6.6 Comunidade e Alertas

Comunidade: seção 5.4 (adiantada da parte 4 em 07/10/2026). Alertas continua como página de espera: página em página-ingresso com palco, lista "O que entra aqui" em linhas com picote e um caminho útil (Explorar, Próximos).

---

## 7. Modelo de dados proposto para o banco de B

Nesta prévia tudo fica no navegador (`localStorage`, chave `livvo_final_v1`), como no resto do app A. No site final, cada item é uma tabela de B. Campos em `src/livvo/store.ts`:

| Entidade | Campos | Observações |
| --- | --- | --- |
| **Pôster grátis do visitante** | na prévia, no navegador (`livvo_poster_visitante_v1`): `showId`, `em`, `guardarAoEntrar` | No site: contar no servidor (aparelho e IP), 1 por visitante; depois do login, vira memória (revisão 11) |
| **Memória** | `id`, `showId`, `criadaEm`, `atualizadaEm`, `notaShow` (0,5–5), `notaOrganizacao` (0,5–5), `dimensoes` (mapa id → nota), `setor`, `comQuem` (@), `fotoUrl`, `ingressoAnexado`, `presencaConfirmadaPor`, `relato`, `personalizacao`, `visibilidade` (`privado` / `seguidores` / `publico`) | Uma memória por pessoa e show. O nível da escada de verificação é calculado, não gravado, e não aparece na tela (N1, revisão 11) |
| **Personalização da memória** | `personalizacao`: `formato` (`poster` / `ingresso`), `carimbo` (`nenhum` / `eu_fui` / `show_da_minha_vida`), `cor` (`ciano` / `teal` / `offwhite`), `fonte` (`alfa` / `barlow` / `raydis`), `tamanho` (`p` / `m` / `g`), `posicao` (`cima` / `meio` / `baixo`), `frase`, `faixa`, `mostrarSetor`, `mostrarComQuem`, `mostrarCasa`, `mostrarUsuario` | Guardada como objeto parcial; o que falta usa o padrão (`PERSONALIZACAO_PADRAO`). O setor escolhido no painel grava no campo `setor` da memória |
| **Artistas favoritos** | `favoritos`: lista de ids de artista do catálogo, na ordem em que foram favoritados | Por pessoa. A seção da Minha História ordena por número de shows da pessoa |
| **Interesse** | `showId` → `quero_ir` ou `tenho_ingresso` | Some quando a pessoa registra o show (vira memória) |
| **Seguindo** | lista de @ | Base da Comunidade |
| **Concert Buddy (marcação)** | na memória: `buddies` = lista de `{ usuario, status (pendente / aceita / recusada), em }` | A marcação gera um convite para a outra pessoa. `comQuem` fica para compatibilidade com B |
| **Convite "Fomos juntos"** | `id`, `de` (@ de quem marcou), `showId`, `em`, `status` (`pendente` / `aceito` / `recusado`) | Aceitar cria a memória ou liga a pessoa à memória existente |
| **Preferência de marcação** | `quemPodeMarcar`: `todos` / `seguindo` / `ninguem` | Padrão `seguindo` ("Quem eu sigo", aprovado em 08/10) |
| **Foto** | por memória (`show:<id>`) e por artista (`artista:<id>`, admin): imagem tratada, `origem`, `fonte`, versão do tratamento | No site final, armazenamento de arquivos de B; a foto automática é só uma referência (endereço e fonte), não uma cópia |
| **Dimensões (IDs fixos)** | `entrada_saida`, `seguranca`, `som`, `visao_palco`, `clima_publico`, `bares_banheiros` | Fixar os IDs agora evita quebrar séries históricas (decisão irreversível nº 2). As três últimas foram aprovadas em 08/10/2026 |

Eventos sugeridos para a medição do beta (PostHog): `show_registrado` (origem: detalhe, registrar, momento, convite), `nota_show`, `nota_organizacao` (origem), `interesse_marcado` (tipo), `link_compartilhado`, `imagem_compartilhada` (stories, feed), `whatsapp_aberto`, `seguir`, `buddy_marcado`, `convite_respondido` (aceito, recusado), `foto_atualizada` (origem), `filtro_explorar` (tipo), `personalizacao_salva` (formato, carimbo), `historico_aberto`, `wrapped_gerado`.

---

## 8. O que é real e o que é exemplo

| Dado | Origem |
| --- | --- |
| Catálogo | Real: recorte de 6.592 shows do índice setlist.fm (114.800 shows), gerado por `scripts/gerar-catalogo-livvo.mjs` em `public/livvo/catalogo.json` (≈196 KB compactado, carregado sob demanda). Inclui shows de 2025 e 2026 nas 12 maiores cidades de artistas com 25+ shows no catálogo, todos os shows dos artistas da conta de demonstração desde 2008 nessas cidades e os 290 shows que já estavam no Estúdio. O catálogo completo continua restrito ao Admin |
| Memórias da conta de demonstração | Reais: as 25 memórias do @toboi no site atual em 06/10/2026, ligadas aos IDs do catálogo. Nota do Show copiada do site atual; a Nota da Organização não estava visível e ficou em branco (vira a missão). A 25ª (Dave Matthews Band, Jockey Club, 16/10/1998) foi deduzida das estatísticas do site atual |
| Shows futuros | **Exemplo:** 12 shows com datas fictícias contadas a partir de hoje (o catálogo real não tem shows futuros). Marcados "Show de exemplo" e "Datas de exemplo" |
| Pessoas, contagens, médias, resenhas e atividade | **Exemplo:** 14 pessoas fictícias e números gerados de forma estável a partir do ID do show (`src/livvo/data/social.ts`). Nenhum nome ou texto de beta tester real. Desligáveis no menu |
| Agenda da conta de demonstração | **Exemplo:** Vanguart (Tenho ingresso) e Dave Matthews Band (Quero ir) |
| Concert Buddies, convites e quem a demonstração segue | **Exemplo:** buddies nas memórias da demonstração (ex.: Helena nos shows de Dave Matthews Band), 3 convites "Fomos juntos" e 4 pessoas seguidas. Somem com a comunidade de exemplo desligada |
| Fotos dos artistas | Reais: fotos públicas do Deezer, Wikimedia Commons e Wikipédia, buscadas na hora (só o artista certo). Termos de uso a conferir antes de produção |

---

## 9. Decisões tomadas nesta prévia (DRAFT, aguardam o Edmir)

1. **Visibilidade padrão da memória: Seguidores** (proposta do plano de fusão). As 25 memórias de demonstração também ficaram em Seguidores.
2. ~~Médias agregadas usam todas as notas~~ (substituída pela decisão 85: só notas públicas e de seguidores). **Médias agregadas usam todas as notas** (inclusive de memórias não públicas, sem identificar ninguém); **listas de pessoas e resenhas mostram só memórias públicas.** Precisa de confirmação, porque afeta privacidade e o B2B.
3. ~~Amostra mínima de 3~~ (substituída pela decisão 85: mínimo de 5 na página e 30 nos relatórios). **Amostra mínima para mostrar médias: 3 avaliações** nesta prévia. O plano sugere 30 para relatórios de parceiros; para a página pública do show, o número final é decisão do Edmir.
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
18. ~~O amarelo `#FFD60A` deixa de ser a cor das notas~~ (substituída pela 19).
19. **Números de nota em RAYDIS amarelo `#FFD60A`** (07/10, 13h41); os ingressos de nota seguem Off-white e Teal. Fica dentro da regra da identidade oficial (amarelo só para notas).
20. **Botão "Atualizar foto" visível logo abaixo do pôster** na página do show (07/10, 13h41).

Decisões do Edmir em 07/10/2026, 14h58 e 15h09 (revisão 4):

21. **Todo pôster ou ingresso gerado pelo Livvo leva o logo Livvo**, como no Estúdio.
22. **O @ da pessoa** aparece só nas memórias e no que é compartilhado; nos cards públicos do catálogo, não.
23. **Todo artista puxa uma foto automaticamente** e todo card, pôster e ingresso tem foto (o pôster gerado fica só como reserva).
24. **Tratamento de foto mais suave**: duotone que deixa ver os detalhes, no lugar da retícula pesada.
25. **Compartilhar dentro da "Sua memória"**, no canto inferior direito, abaixo do "Atualizar foto"; no topo só quando não há memória.
26. **Opções de Instagram e Facebook** no Compartilhar (além de WhatsApp e link).
27. **Concert Buddies** na página do show (dentro do "Foi com alguém?"), na Comunidade e na Minha História.
28. **Marcar o @ de quem foi junto**, que recebe o mesmo card no perfil se autorizar (aceite) e se a preferência dele permitir.
29. **Comunidade funcionando** já nesta prévia, com dados de exemplo marcados.

Decisões do Edmir em 07/10/2026, 16h04 e 16h11 (revisão 5):

30. **Nota com o ingresso inclinado com estrela**, em teste e substituindo o ingresso vertical: Teal onde o ícone é preto, transparente onde é branco.
31. **Mais espaço entre Artistas e Cidades** no "Seu passaporte".
32. **Nunca partir um nome no meio da palavra** no "Encontre o seu show" e em qualquer card: se o nome completo não cabe na primeira linha, a palavra seguinte vai inteira para a segunda.
33. **Legenda só "Foto automática"**, sem citar o Deezer.
34. **"Atualizar foto" logo abaixo do pôster do show**, fundo Off-white e texto preto.
35. **"Compartilhar" sai da "Sua memória"** e fica abaixo do "Atualizar foto", em Teal com texto preto.
36. **"Personalizar" abaixo do Compartilhar**, abrindo as opções na coluna da direita, todas em linhas que abrem e fecham, como no Livvo Virtual Poster. As opções propostas (formato, carimbo, faixa, setor, com quem, fonte, tamanho, posição, frase, cor, @ e casa) foram aprovadas.
37. **Pôster ou Ingresso** (do Livvo Virtual Poster), só com os carimbos de presença, **mantendo "Show da minha vida"**.
38. **"Meu histórico"** com os gráficos da Minha história do Livvo Virtual Poster.
39. **"Gerar meu Wrapped"** no mesmo formato do Livvo Virtual Poster.

Decisões do Edmir em 07/10/2026, 17h05 e 17h09 (revisão 6):

40. **Pôster ou Ingresso acima da foto do pôster**, fora do Personalizar; a chave grava na hora.
41. **Sem carimbo por padrão**; o carimbo só aparece se escolhido no Personalizar.
42. **Faixa lado a lado** na página do show, a partir da esquerda: Setlist, Foi com alguém?, Mais shows do artista, Mais shows nesta casa.
43. **No celular, esses blocos viram drop down.**
44. **Como foi** na largura toda, **Resenhas e Quem foi** lado a lado.
45. **"N shows juntos" abre uma janela** com os ingressos virtuais de todos os shows juntos, estimulando a avaliar os que faltam.
46. **Convites mostram se já há shows em comum.**
47. **Minha História sem o botão "Compartilhar credencial"**; fica o "Compartilhar" embaixo da credencial.
48. **Concert Buddies da Minha História em caixas lado a lado** (foto, nome e shows juntos), só os 5 com mais shows.
49. **Números do passaporte clicáveis**: Shows → Carteira de ingressos; Artistas e Cidades → gráficos do Meu histórico.

Decisões do Edmir em 07/10/2026, 19h23 e 19h28 (revisão 7):

50. **Foto do artista no Registrar**: o círculo com a inicial vira a foto tratada no tamanho das fotos dos ingressos.
51. **Depois do "Eu fui" no Registrar**, abre uma janela com o pôster padrão do show e o convite a compartilhar (só no Registrar).
52. **A mesma foto em Sua agenda e Vem aí** no Início.
53. **A mesma foto em toda a Comunidade**: linhas sobre show com a foto do artista; pessoas sem foto com a retícula e as iniciais.
54. **Concert Buddies, Shows em comum e Pessoas em caixas** lado a lado até a borda da página, quebrando para a linha de baixo.
55. **Janela de shows em comum / juntos com a foto das duas pessoas e um botão Compartilhar.**
56. **Artistas favoritos**: a pessoa escolhe os favoritos (botão discreto de favoritar); seção na Minha História antes de Concert Buddies, no formato de caixas, com quantos shows foi de cada artista, só 5 por enquanto.
57. **Sem favoritos escolhidos**, a seção mostra os 5 artistas mais vistos.
58. **Com mais de 5 favoritos**, aparecem os 5 com mais shows da pessoa.

Decisões do Edmir em 07/10/2026, 21h05 e 21h11 (revisão 8):

59. **A homepage do Livvo é a página de entrada** da prévia, para quem entra direto.
60. **Quem já entrou e toca no ícone do app** também vai para essa página, sem sair da conta.
61. **"Pedir acesso" e "Quero entrar no Livvo" abrem o Entrar da prévia** (no lugar do e-mail).
62. **Os links da prévia** ("Explorar a experiência", "Conhecer a plataforma", "Explorar a prévia", "Testar a prévia") levam ao Explorar.
63. **"Entrar" discreto no cabeçalho** da página.
64. **Cópia ligada ao app:** a página do app é uma cópia do arquivo da pasta, mantida em `site/homepage-entrada-app/` e ligada a `public/bem-vindo/index.html`.

Decisões do Edmir em 07/10/2026, 21h24 e 21h27 (revisão 9):

65. **Fotos da página de entrada trocadas** pelas enviadas, com filtro em tons de teal: abertura com IMG_6117, ingresso com IMG_6177; as outras duas de reserva.
66. **Furos do cartão da frase de posicionamento em cima e embaixo**, a cerca de 25% da borda esquerda.
67. **"Pedir acesso ao beta" vira "Comece agora"** e sai "Testar a prévia"; onde houver algo sobre a prévia, "Comece agora".
68. **"Comece agora" abre o Entrar da prévia.**
69. **"Pedir acesso" do cabeçalho e "Quero entrar no Livvo" também viram "Comece agora"**; as mudanças valem só para a cópia ligada ao app (o original da pasta fica como está).

Decisões do Edmir em 07/10/2026, 21h51 (revisão 10):

70. ~~"Minhas Conquistas" logo depois de "Registrar show"~~ (ordem substituída pela decisão 87) na Minha História, e os **4 botões numa única linha**, sem quebrar o texto.
71. **O "Registrar show" usa o modelo do "Comece agora"** da página de entrada.
72. **Ingressos sempre com os furos em cima e embaixo, nunca nas laterais.**

Decisões do Edmir em 08/10/2026, 00h55 (revisão 11, a partir da "Análise atualizada do projeto" de 07/10):

73. **Sem escada de verificação na tela** (N1): a frase "Em breve, o Livvo vai verificar a sua presença nos shows." no lugar do selo; o cálculo fica guardado para quando a ferramenta existir.
74. **Conquistas a partir de 5 shows** (N2), com o convite "Faltam N shows para a sua primeira conquista".
75. **Frase de posicionamento com "encontrou" em todos os lugares:** "Filmes e séries têm os seus apps. A música ao vivo encontrou o seu lugar definitivo."
76. **Só as faixas de acesso:** Pista, Pista Premium, Camarote, Backstage e All Access. A pílula da Credencial mostra "Nível 1" a "Nível 5" no lugar de Fã Bronze, Prata, Ouro, Platina e Lenda Viva.
77. **Minha História no celular em grade 2 × 2** (a linha única fica só a partir de 720 px).
78. **Página do show no celular:** notas logo abaixo do pôster; os três botões depois delas, menores.
79. **✓ só depois do toque** no Eu fui (e no Quero ir); antes, ícone +.
80. **"Falta 1 show"** no singular.
81. **Conta zerada com boas-vindas** no lugar dos zeros; Wrapped e Meu histórico a partir do 1º show.
82. **Credencial com um só "Adicionar foto" e sem o rótulo de teste.**
83. **Página de entrada com os nomes do app** (Minha História, Carteira de ingressos, Ingresso de Memória).
84. **Visitante cria e compartilha 1 pôster sem login;** login para guardar na história ou fazer o 2º pôster.
85. **Médias só com notas públicas e de seguidores**, mínimo de 5 na página pública e de 30 nos relatórios para produtoras e casas.
86. **Novidades:** aviso animado ao desbloquear uma conquista e aviso de "O que quem você segue está vivendo" (ponto no sino, painel e destaque no Início).

Decisões do Edmir em 08/10/2026, 06h18 (depois da atualização do Codex):

87. **Ordem dos botões da Minha História:** Registrar show, Meu histórico, Gerar meu Wrapped e Minhas Conquistas (a ordem que o Codex aplicou).
88. **Filtros de Minhas Conquistas:** Conquistadas, A conquistar, Todas e Em breve, nesta ordem; a galeria abre em Conquistadas.

Decisões do Edmir em 09/10/2026, depois do teste de usabilidade de 08/10 com a Gabriela Barros (revisão 12, commit `d2aeb0d`):

89. **Personalizar no app só com faixa, setor, com quem, @ e casa de show** (mais a nota, decisão 92). Fonte, tamanho e posição do nome, frase no alto e cor de destaque ficam só no Estúdio; o PNG exportado sai igual ao que está na tela.
90. **Carimbo de presença ("Eu fui" e "Show da minha vida") só no Estúdio:** sai do painel, do pôster, do ingresso e das imagens exportadas. O "Você foi" das listas de shows e a galeria Minhas Conquistas continuam.
91. **Shows sem nota:** sem ícones nem rótulo "NOTA" na tela, no ingresso e nas imagens de Stories e Feed; a data por extenso sobe quando não há notas (corrige a falha vista com Racionais e Pequeno Cavaquinho).
92. **Interruptor "Mostrar a nota"** na linha "Nota no card", ligado por padrão, que só aparece quando o show tem nota.
93. **Um ingresso + número fora da hora de dar a nota:** os 5 ingressos (`Discos` com `onChange`) ficam só onde se escolhe a nota (página do show e "completar" do Início); nos demais lugares, `NotaIngresso` (`ui.tsx`): um ingresso Teal e o número em amarelo (ex.: 4,5). Médias da comunidade com uma casa decimal (ex.: 4,3), sem arredondar para meio ponto.

Decisões do Edmir em 09/10/2026, 10h41 (revisão 13, commit `d910d5d`):

94. **Nome dos arquivos das imagens de compartilhar:** `Livvo_Artista_DDMMAA.png` (`nomeArquivoShow` em `format.ts`): artista sem acentos e sem apóstrofos, `_` no lugar de espaços e símbolos. Ex.: `Livvo_Dave_Matthews_Band_111213.png`, `Livvo_Racionais_MCs_010225.png`. Pôster, ingresso, Feed e Stories do mesmo show saem com o mesmo nome (o navegador acrescenta "(1)" se baixar mais de um).
95. **Data centralizada nas imagens de Stories e Feed;** as notas (um ingresso + número) também ficam centralizadas, lado a lado no Feed e uma embaixo da outra no Stories.
96. **Selos de conquista ainda não conquistados:** ficam como estão até mais pesquisas.

Também aprovadas em 08/10 (decisão 6 da análise), deixam de ser DRAFT: visibilidade padrão **"Seguidores"**; primeira visita na **página de entrada**; **"Show da minha vida" em amarelo**; quem pode marcar você = **"Quem eu sigo"**; IDs das dimensões novas **`visao_palco`**, **`clima_publico`** e **`bares_banheiros`** (não podem mudar depois de publicados). Fonte do corpo: **Plus Jakarta Sans no app e no site, Barlow nos impressos** (decisão 4 da análise); ícones Lucide. O registro na identidade oficial (`LIVVO_IDENTIDADE_VISUAL_OFICIAL.md`) aguarda o Edmir aprovar o texto.

Escolha de execução da revisão 8 (aprovada em 08/10): a primeira visita não entra mais sozinha na conta de demonstração, para quem chega ver a página de entrada; o Entrar abre essa conta.

Escolhas de execução da revisão 5 (aprovadas em 08/10): "Show da minha vida" em amarelo das notas e "Eu fui" em Ciano (o vermelho do Estúdio não é da paleta);  RAYDIS só para nomes sem acento; "Meu histórico" e "Gerar meu Wrapped" dentro do Passaporte, abaixo dos dois botões que já existiam.

Lembrete de marca: a frase de posicionamento é "Filmes e séries têm os seus apps. A música ao vivo **encontrou** o seu lugar definitivo.", em todos os lugares (decisão do Edmir de 07/10/2026, registrada na revisão 11; a versão "ainda não tem", de 07/10 às 20h52, foi substituída).

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
| `src/livvo/Compartilhar.tsx`, `src/livvo/ConcertBuddies.tsx`, `src/livvo/pages/Comunidade.tsx` | Compartilhar e imagens (5.2), Concert Buddies (5.3), Comunidade (5.4) |
| `src/livvo/Personalizar.tsx`, `src/livvo/Ingresso.tsx` | Painel Personalizar e formato Ingresso (5.5) |
| `src/livvo/HistoricoWrapped.tsx` | Ponte para o `MyHistory` e o `TourWrappedModal` do A (5.6) |
| `src/livvo/Favoritos.tsx` | Favoritar e Artistas favoritos (5.8) |
| `src/livvo/Conquistas.tsx` | Galeria Minhas Conquistas (figurinhas do Passaporte, com filtros; travada até 5 shows desde a revisão 11) |
| `src/livvo/conquistasLogic.ts` | Cálculo das conquistas com a trava de 5 shows e `paraIngressosA` (revisão 11) |
| `src/livvo/Novidades.tsx` | Aviso de nova conquista, sino com o painel de atividade e `useAtividade` (revisão 11, seção 5.9) |
| `src/livvo/PosterVisitante.tsx` | Pôster grátis do visitante e `useEuFui` (revisão 11, seção 5.9) |
| `public/bem-vindo/` | Página de entrada (cópia ligada ao app) e as imagens dela (6.0) |
| `src/livvo/pages/Entrar.tsx` | Rota `/entrar` (6.0) |
| `src/components/RetroTicket.tsx`, `src/components/MyHistory.tsx`, `src/components/TourWrappedModal.tsx` | Componentes do Estúdio reaproveitados sem alteração (escala do ingresso, gráficos e Wrapped) |
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

Verificação do ajuste das 06h18 (08/10/2026): `tsc` e `npm run build` sem erros; Playwright em 390 × 844 e 1440 × 900 sem erros de página e sem rolagem lateral: botões na ordem Registrar show, Meu histórico, Gerar meu Wrapped e Minhas Conquistas; filtros na ordem Conquistadas (aberto, 13 figurinhas na demonstração), A conquistar, Todas e Em breve; conta zerada com as 51 figurinhas e sem filtros. `conquistasLegacy.ts`, cópia sem uso deixada no rename, foi apagado.

Verificação da revisão 11 (08/10/2026, commit `3d1a055`): `tsc` e `npm run build` sem erros; Playwright em 390 × 844, 360 × 844 e 1440 × 900 sem erros de página e sem rolagem lateral: Minha História com os 4 botões em 2 × 2 no celular e numa linha no computador; Credencial com "Nível 2 · Pista Premium", sem rótulo de teste e com um só "Adicionar foto"; página do show no celular com as notas logo abaixo do pôster e os 3 botões menores depois; sino com ponto e painel; Início com "5 novidades desde a sua última visita"; conta zerada com o Passaporte em branco, Minhas Conquistas travada e Meu histórico desligado; 5 shows registrados → aviso "Eu Tava Lá" + 4 conquistas → "Ver Minhas Conquistas" abre a galeria; visitante: 1º pôster abre "Seu pôster", 2º pede login, "Entrar e guardar" registra o show depois do login.

Verificação da revisão 10 (07/10/2026, commit `b4fb651`): `tsc` e `npm run build` sem erros; medição em 390, 720, 768, 1024, 1280, 1440 e 1920 px: os 4 botões numa linha em todas, sem texto quebrado e sem estourar o botão (no celular a linha rola de lado); Playwright em 390 × 844 e 1440 × 900 sem erros de página (Minha História, Minhas Conquistas, página do show com "Sua memória" e o picote).

Verificação da revisão 9 (07/10/2026, commit `a1ea17a`): `npm run build` sem erros; Playwright em 390 × 844 e 1440 × 900 sem erros de página e sem arquivo faltando: 4 botões "Comece agora" (nenhum texto de prévia ou beta), o último levando a `/entrar`, fotos novas carregadas e furos do cartão para dentro, em cima e embaixo.

Verificação da revisão 8 (07/10/2026, commit `88acc2a`): `tsc` e `npm run build` sem erros; Playwright em 390 × 844 e 1440 × 900 sem erros de página e sem arquivo faltando: visitante na raiz vai para `/bem-vindo` (mesma altura de página do arquivo original, 4854 px no computador), Entrar abre a janela e depois o Início, o ícone do app leva de volta à página com "Abrir o Livvo" no cabeçalho, e "Explorar a experiência" leva ao Explorar.

Verificação da revisão 7 (07/10/2026, commit `c6d6859`): `tsc` e `npm run build` sem erros; Playwright em 390 × 844 e 1440 × 900 sem erros de página: Registrar com a foto do artista, Eu fui abrindo a janela do pôster, Favoritar, Início com as fotos, as 5 abas da Comunidade (caixas quebrando a linha), janela de shows juntos com as duas fotos e a imagem de Stories gerada, Artistas favoritos na Minha História e o coração na página do show. No ambiente de teste a internet é bloqueada, então as fotos aparecem como retícula; a foto automática foi conferida na prévia publicada.

Verificação da revisão 6 (07/10/2026, commit `368bcad`): `tsc` e `npm run build` sem erros; Playwright em 390 × 844 e 1440 × 900 sem erros de página: chave Pôster | Ingresso, faixa lado a lado e em drop down, marcar um Concert Buddy até o aceite e abrir a janela pelo "N shows juntos", Avaliar pela janela (foco na Nota do Show), convites com shows em comum, caixas de Concert Buddies e janela, números do passaporte levando à Carteira e aos gráficos de Artistas e Cidades, inclusive a partir do Início.

Verificação da revisão 5 (07/10/2026, commit `950d05f`): `tsc` e `npm run build` sem erros; Playwright em 390 × 844 e 1440 × 900 sem erros de página: botões sob o pôster, Personalizar (carimbo, faixa, setor, frase, fonte Barlow, Ingresso, Salvar, posição No meio), imagens de Stories e Feed no formato Ingresso e no pôster com carimbo "Show da minha vida", Meu histórico, Gerar meu Wrapped e nomes longos no Explorar (Humberto Gessinger, Móveis Coloniais de Acaju, Ben Harper & The Innocent Criminals) sem palavra partida e sem nome estourando a caixa. O aviso de console `stop-color` vem do `LivvoLogo` do Estúdio, que já existia.

Verificação da revisão 4 (07/10/2026, commits `d150ed5` e `7449220`): `tsc` e `npm run build` sem erros; Playwright em 390 × 844 e 1440 × 900 sem erros de página (Comunidade nas 5 abas, marcar Concert Buddy até o aceite, convites, imagens de Stories e Feed geradas, menu de compartilhar). Na prévia publicada, pelo navegador do app: fotos automáticas com o duotone suave no Explorar e na página do show, logo e @ no pôster, menu de compartilhar no computador e no celular. Gerar e baixar a imagem do Instagram não foi feito na prévia publicada (baixaria um arquivo no seu computador); foi conferido no ambiente de teste.

Ajustes de 07/10 à tarde (commits `46522c8` e `020fb4e`), conferidos na prévia publicada da Vercel pelo navegador do app: botão sob o pôster, números em amarelo, escolha e tratamento de foto do Deezer e do Wikimedia (as do Wikimedia vinham de `thumb.wikimedia.org` e não eram tratadas antes da correção), salvar e "Voltar ao pôster gerado".

Verificação da revisão 3 (07/10/2026, commit `d7a24f8`): `tsc` e `npm run build` sem erros; Playwright em 390 × 844 e 1440 × 900: notas em ingressos em todas as telas, Atualizar foto com foto enviada (prévia, salvar, pôster e ingresso da Carteira atualizados, verificação "Com foto"), janela de admin com o escopo da conta (16 artistas) do começo ao fim, `/api/foto` recusando domínio fora da lista e HTTP. Neste ambiente de teste a rede externa é bloqueada, então as fotos do Deezer, Wikimedia e Wikipédia só podem ser conferidas na prévia publicada.

Verificação da revisão 2 (07/10/2026, commit `2f3e3f8`): `tsc` e `npm run build` sem erros; Playwright em 390 × 844 e 1440 × 900 em todas as telas e nos 6 fluxos, sem erro de página e sem rolagem lateral em 390 px em nenhuma rota.

Verificação da primeira versão (07/10/2026): `tsc -b` e `npm run build` sem erros; Playwright em 390 × 844 e 1440 × 900 em todas as telas; fluxos testados: Registrar (artista → data → Eu fui → carimbo), notas no detalhe e no cartão de momento (missão passou para 2/3), Quero ir / Tenho ingresso, visitante → Eu fui abre entrar, comunidade de exemplo desligada (estados vazios), filtros e "Shows que eu fui", laboratório em `/estudio`. Nenhum erro de página. Fotos externas não carregam no ambiente de teste (rede bloqueada); não afeta esta parte, que não usa fotos.
