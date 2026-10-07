# Livvo final, prévia parte 1: navegação, Início, Explorar e Detalhe do show

Status: **DRAFT** · 07/10/2026 · ramo `livvo-final` do repositório `marcelolivvo/livvo-app-complementar`
Para: Greg (implementação no livvomusic.com.br) · Decisões de produto: Edmir · Preparado por: Claude

Este documento descreve a "cara" do Livvo final que está sendo montada dentro do ambiente A (app da Vercel), enquanto o site B (livvomusic.com.br) segue no ar com os beta testers. A prévia junta as partes fortes de B (catálogo, Eu fui, Nota do Show e Nota da Organização, quem foi, setlist, navegação com barra inferior) com o que foi criado em A (linguagem de bilheteria, Passaporte, faixas de acesso, pôster halftone, carimbo). Ela segue o "Plano de fusão Livvo" de 06/10/2026.

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

Mesmos tokens do Estúdio ("Bilheteria"), mais a superfície elevada e o amarelo das notas. Definidos em `src/livvo/livvo.css` na classe `.lv-app`.

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
| `--lv-nota` | `#FFD60A` | **Somente** notas (discos e números de nota) |

| Fonte | Uso |
| --- | --- |
| Alfa Slab One | Títulos de página e seção, nome do artista no pôster |
| RAYDIS 700 | Números grandes (Passaporte, contagem regressiva, notas, dia no pôster). Nunca em texto com acento |
| Barlow 500/600/700 | Rótulos em caixa alta (`.lv-kicker`), etiquetas, barra inferior, textos do pôster |
| Plus Jakarta Sans | Corpo do texto, **provisório até a decisão #22** (fonte do corpo) |

Regras visuais aplicadas:
- **"Bilheteria contida":** formato de ingresso (picote, meias-luas, carimbo) só no que é da pessoa (sua memória, cartão de momento, Passaporte). Busca, filtros e listas usam superfície lisa.
- **Um botão Ciano por tela.** Quando a pessoa já marcou Quero ir ou Tenho ingresso, o escolhido fica em Creme com ✓ e o outro vira contorno.
- **Amarelo só nas notas.** Destaques e progresso usam Ciano.
- Ícones Lucide (decisão anterior do Edmir), em Teal ou Ciano.
- Nada de contador zerado: "0 registraram" nunca aparece; vira convite ("Seja a primeira pessoa") ou some.

---

## 5. Componentes (todos em `src/livvo/ui.tsx`, salvo indicação)

| Componente | O que faz | Detalhes para implementar |
| --- | --- | --- |
| **Pôster Halftone** (`Poster`) | Capa de cada show, gerada pelos dados: dia em RAYDIS, mês e ano, UF, nome do artista em Alfa Slab One, casa de show. Fundo com retícula ("sol" halftone) | 5 paletas da marca escolhidas por hash do artista (o mesmo artista sempre tem a mesma cor); posição do sol varia por artista; tamanho do nome se ajusta ao comprimento (unidades `cqw`). Prioridade de imagem do plano: foto do usuário → foto licenciada → pôster gerado. **As fotos de artista do catálogo (Deezer) não são usadas**: não há licença para peças públicas. O componente aceita `fotoUsuario` e `fotoLicenciada` para quando houver |
| **Card de show** (`CardShow`) | Pôster + artista + casa · cidade + data + linha social | Linha social: avatares + "N registraram" (passado) ou "N querem ir" (futuro) ou a etiqueta Quero ir / Tenho ingresso. Carimbo "Você foi" ou etiqueta "Exemplo" no canto do pôster |
| **Carimbo "Você foi"** (`CarimboFui`) | Marca de presença | Borda Ciano, inclinado −6°, animação de carimbo de 0,42 s ao registrar (desligada com "reduzir movimento") |
| **Discos de nota** (`Discos`) | Nota de meio a cinco, em discos de vinil amarelos | Interativo: metade esquerda do disco = meio ponto. Acessível como `role="slider"` (setas mudam 0,5). Sem nota: contorno amarelo fraco no interativo, cinza no só-leitura |
| **Ingresso** (`.lv-tix`) | Bloco "ingresso" com corpo e canhoto separados por picote | No celular o canhoto fica embaixo; a partir de 720 px fica à direita (236 px) |
| **Etiquetas** | `Exemplo` (tracejada), `Parte N` (o que entra nas próximas partes), Ciano, Teal, Creme | Toda informação fictícia leva "Exemplo" |
| **Avatar** | Iniciais em círculo (Ciano, Teal, Creme ou Muted por hash do nome) | Usado nas pessoas de exemplo e na conta |
| **Picotes** (`Picotes`) | Barra de progresso em marcas de picote | Faixa do Passaporte (24 marcas) e missões (3) |
| **Caixa de data** (`CaixaData`) | Dia em RAYDIS + mês (e ano curto) | Agenda, Registrar, Minha História |
| **Aviso rápido** (`avisar`) | Confirmação curta em Creme, acima da barra inferior | "Show guardado na sua história", "Link copiado", notas dadas |
| **Silhuetas** (`.lv-skel`) | Carregamento sem "Carregando…" | Grade, detalhe do show, cartão de momento |
| **Compartilhar** (`compartilharLink`) | Menu nativo do celular; no computador copia o link | Página do show é pública, então o link funciona para quem não tem conta |

---

## 6. Telas

### 6.1 Início (`src/livvo/pages/Inicio.tsx`)

**Logado**, no computador em duas colunas (principal + lateral de 360 px a partir de 1100 px); no celular em uma coluna, nesta ordem:

1. Data em rótulo e "Oi, Marcelo." (Alfa Slab One).
2. **Cartão de momento**, um só pedido por vez, em formato de ingresso. Prioridade:
   1. amanhã tem show (Quero ir ou Tenho ingresso para amanhã);
   2. como foi? (show com interesse entre hoje e 3 dias atrás, ainda sem memória) → botão Eu fui;
   3. neste dia (aniversário de um show da história) → Ver memória;
   4. faltam até 3 dias para um show com interesse → Ver show;
   5. complete essa história: **dar a Nota da Organização ali mesmo**, nos discos do canhoto; ao tocar, salva e passa para a próxima memória sem nota.
3. **Resumo do Passaporte:** avatar, nome, @, "No Livvo desde ago 2026", faixa (Pista Premium), 3 números grandes (Shows, Artistas, Cidades), picotes até a próxima faixa com "Mais 1 show na sua história e você chega ao Camarote. Shows antigos contam.", rodapé com o artista mais visto e link Minha História.
4. **Missões do mês** (completar o vivido, nunca "vá a mais shows"): "Avalie a organização de 3 shows" (0/3, conta as notas de organização dadas no mês) e "Resgate um show antigo".
5. Lateral: **Sua agenda** (Quero ir e Tenho ingresso, com contagem), **Vem aí** (shows futuros de artistas que a pessoa já viu: "Você viu 1 vez"), **Quem você segue** (atividade de exemplo; sem exemplos, convite para seguir quem foi aos seus shows).

**Visitante:** bloco de entrada com "Registre · Avalie · Colecione", "Sua história através dos seus shows.", subtítulo do plano, botões "Comece pela sua história" (abre entrar) e "Explorar shows", e uma faixa de shows recentes. A landing completa é a parte 4.

**Conta zerada:** o cartão de momento vira "Qual foi o último show que você viu?" com "Registrar meu primeiro show".

### 6.2 Explorar (`src/livvo/pages/Explorar.tsx`)

1. Rótulo "Explorar", título "Shows", subtítulo "Encontre um show que você viveu para guardar na sua história, ou um que vem aí."
2. Busca grande: "Artista, casa de show ou cidade" (sem acento e sem caixa; espera 220 ms entre teclas).
3. Abas **Passados | Próximos**. Em Próximos aparece a etiqueta "Datas de exemplo".
4. Chips de filtro (por baixo, `<select>` nativo): Cidade, Ano (só Passados), Casa (até 80, filtradas pela cidade), "Shows que eu fui" (logado), "Limpar".
5. Contagem: "6.592 shows · prévia com um recorte de 6,6 mil dos 114,8 mil shows do catálogo".
6. Grade por mês ("Agosto de 2026"): 2 colunas no celular, 3 a partir de 640 px, 4 a partir de 1024 px e 5 a partir de 1180 px. Próximos em ordem do mais perto para o mais longe.
7. "Mostrar mais shows" de 40 em 40; no fim, "Não achou o seu show? Peça a inclusão".
8. Estados: carregando (silhuetas), erro ("Não conseguimos carregar os shows agora." + Tentar de novo), vazio ("Nenhum show encontrado para …" + "Meu show não está aqui").

### 6.3 Detalhe do show (`src/livvo/pages/ShowDetalhe.tsx`)

Celular: pôster menor (38% da largura) ao lado do título, para o **Eu fui aparecer sem rolar**. Computador: pôster fixo à esquerda (380 px) e conteúdo à direita.

1. Voltar · Compartilhar.
2. Turnê (ou "Show ao vivo" / "Show que vem aí"), etiqueta "Show de exemplo" quando for o caso, artista, casa (link para Explorar filtrado pela casa) · cidade, UF, data por extenso · "há 10 meses" / "em 10 dias".
3. **Ação principal:**
   - Passado, sem memória: botão **Eu fui** (Ciano, largura total no celular) + "Guarde este show na sua história. Leva um toque; as notas você dá logo depois."
   - Passado, com memória: **Sua memória** em formato de ingresso: data do registro e visibilidade, carimbo "Você foi" (animado ao registrar), **Nota do Show** e **Nota da Organização** em discos (salvam no toque), frase "Duas notas para o artista não pagar pela fila do bar."; canhoto com **Verificação** (selo da escada: Registrado → Com foto → Com ingresso → Presença confirmada), "Ingresso de Memória · Parte 2" e "Desfazer registro" (pede um segundo toque).
   - Futuro: **Quero ir** e **Tenho ingresso** (um ou outro, tocar de novo desmarca), contagem regressiva em RAYDIS, explicação do lembrete e "O link da ticketeira aparece aqui quando o show vem de uma fonte oficial."
   - O link `?avaliar=org` rola até a Nota da Organização e coloca o foco nela (usado pela missão).
4. Prova social: avatares + "133 pessoas registraram este show, com você" (ou "querem ir"), etiqueta Exemplo. Sem ninguém: "Ninguém registrou este show ainda. Seja a primeira pessoa."
5. **Como foi, para quem estava lá** (só passado e só com amostra mínima): médias de Show e Organização em RAYDIS amarelo + discos, até 3 dimensões mais citadas (+ ou −), "Média de N avaliações. As médias só aparecem a partir de 3." Abaixo da amostra, o bloco some (nunca "Sem avaliações" em destaque).
6. **Setlist:** link real para o setlist.fm do show (base do catálogo).
7. **Resenhas de quem foi:** avatar, nome, @, setor, notas de Show e Organização, texto de até 3 linhas, dimensões.
8. **Quem foi / Quem vai:** pessoas com Seguir/Seguindo e "Só aparece quem deixou a memória pública."
9. **Foi com alguém? / Vai com alguém?:** "Chamar no WhatsApp" abre o WhatsApp com texto pronto e o link do show (nada é enviado sozinho).
10. **Mais shows de {artista}** e **Mais shows nesta casa** (faixas roláveis, com "Ver todos").

### 6.4 Registrar, versão da parte 1 (`src/livvo/pages/Registrar.tsx`)

"Qual show você viveu?" → busca de artista (com "N shows no catálogo · você foi a N") → lista de datas com casa, cidade e dia da semana, cada uma com **Eu fui** (vira carimbo na hora). Sem busca, mostra "Artistas da sua história". Três toques até guardar. A parte 2 acrescenta a tela de sucesso com o Ingresso de Memória, o Avaliar em camadas e o "Meu show não está aqui".

### 6.5 Minha História, provisória (`src/livvo/pages/MinhaHistoria.tsx`)

Resumo do Passaporte e a lista de memórias por ano (nota do show em discos, "Falta a organização" quando não tem). Vira o Passaporte completo na parte 3.

### 6.6 Comunidade e Alertas

Páginas de espera com o que entra na parte 4 e um caminho útil (Explorar, Próximos).

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
6. **Fotos de artista do catálogo fora** até haver licença; o pôster gerado pelos dados é o padrão.
7. **Nome da área de shows na navegação: "Shows"** (como em B); o título da página é "Shows" com o rótulo "Explorar".
8. **Registrar já funciona** em versão simples nesta parte, para o botão central não levar a uma página vazia.

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
| `src/livvo/livvo.css` | Tokens e estilos `.lv-app` |
| `src/livvo/data/catalog.ts` | Leitura do catálogo e busca |
| `src/livvo/data/demo.ts` | Perfil, memórias, futuros, pessoas e textos de exemplo |
| `src/livvo/data/social.ts` | Comunidade de exemplo |
| `src/livvo/pages/*.tsx` | Início, Explorar, Detalhe do show, Registrar, Minha História, páginas de espera |
| `scripts/gerar-catalogo-livvo.mjs` | Gera `public/livvo/catalogo.json` a partir de `data/shows-index.json` |
| `public/livvo/` | Catálogo recortado e ícone oficial reduzido |
| `src/components/LoginModal.tsx` | Texto ajustado para o novo contexto |
| `index.html` | Título, descrição e ícone da aba |

Verificação feita em 07/10/2026: `tsc -b` e `npm run build` sem erros; Playwright em 390 × 844 e 1440 × 900 em todas as telas; fluxos testados: Registrar (artista → data → Eu fui → carimbo), notas no detalhe e no cartão de momento (missão passou para 2/3), Quero ir / Tenho ingresso, visitante → Eu fui abre entrar, comunidade de exemplo desligada (estados vazios), filtros e "Shows que eu fui", laboratório em `/estudio`. Nenhum erro de página. Fotos externas não carregam no ambiente de teste (rede bloqueada); não afeta esta parte, que não usa fotos.
