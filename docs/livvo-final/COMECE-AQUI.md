# Livvo final: comece aqui (Greg)

Status: **DRAFT** para avaliação do Greg · 07/10/2026 · revisão 10 · preparado por Claude, decisões de produto do Edmir.

Esta pasta reúne tudo o que foi montado hoje para a "cara" do Livvo final. É uma **prévia de referência visual e de comportamento**, feita dentro do app A (Vercel). Pelo plano de fusão de 06/10/2026, **o site B (livvomusic.com.br) continua sendo a base técnica**: reaproveitar ou reescrever estes componentes no stack de B é decisão sua.

## 1. Os três lugares

| O quê | Onde |
| --- | --- |
| Prévia funcionando | https://livvo-app-complementar-git-livvo-final-livvo1.vercel.app (pede login na Vercel, time `livvo1`) |
| Código | GitHub `marcelolivvo/livvo-app-complementar`, ramo **`livvo-final`** (`main`, `redesign-estudio` e `EstudioOut20` intactos) |
| Especificação completa | [`HANDOFF_PARTE1.md`](HANDOFF_PARTE1.md), nesta pasta |

## 2. Abrir em 1 minuto

- **Na Vercel:** abra o link acima. A primeira visita mostra a página de entrada (`/bem-vindo`). "Comece agora" ou "Entrar" com qualquer e-mail abre a conta de demonstração (Marcelo, @toboi, 25 memórias reais). O login é simulado e nada é enviado.
- **No computador:**

```bash
git clone https://github.com/marcelolivvo/livvo-app-complementar.git
cd livvo-app-complementar
git checkout livvo-final
npm install
npm run dev        # Express + Vite em http://localhost:3000
npm run build      # tsc -b + vite build
```

- **Controles da prévia:** menu da conta (avatar). Ali você liga e desliga a comunidade de exemplo, restaura as 25 memórias, começa do zero ou sai para ver como visitante.
- **Laboratório:** o app antigo do Estúdio continua em `/estudio`; use `?admin=1` para o menu de admin.

## 3. O que ler primeiro no HANDOFF (cerca de 15 minutos)

1. **Topo:** resumo das revisões 2 a 10.
2. **Seção 2** (rotas) e **seção 3** (navegação).
3. **Seção 4** (tokens e tipografia) e **seção 5** (componentes).
   - Regra fixa: ingressos e botões-ingresso têm os furos **só em cima e embaixo**.
4. **Seção 7:** modelo de dados proposto para o banco de B. Esta é a parte que mais pede a sua decisão.
5. **Seção 8:** o que é real e o que é exemplo.
6. **Seção 9:** as 72 decisões já tomadas com o Edmir.
7. **Seção 11:** mapa dos arquivos.

## 4. Telas

46 capturas em [`telas/`](telas/), tiradas em celular (390 × 844) e computador (1440 × 900). O prefixo indica a revisão:

- **sem prefixo:** telas principais;
- **`r7-`:** fotos, janela do Eu fui, Comunidade em caixas, favoritos;
- **`r8-` e `r9-`:** página de entrada;
- **`r10-`:** Minha História com os 4 botões e Minhas Conquistas.

Quando uma captura antiga diferir de uma nova, valem a **mais nova** e a **prévia publicada**.

No ambiente onde as capturas foram feitas a internet era bloqueada, então algumas fotos de artista aparecem como retícula. Na prévia publicada elas carregam.

## 5. Em aberto com o Edmir

- Confirmar a primeira visita: hoje ela cai na página de entrada, em vez de entrar sozinha na conta de demonstração.
- Confirmar se a Credencial Backstage também segue a regra dos furos em cima e embaixo.

## 6. Próximas partes

- **Parte 2:** Registrar completo com o Ingresso de Memória e o Avaliar em camadas.
- **Parte 3:** Minha História como Passaporte completo.
- **Parte 4:** Comunidade, Alertas e páginas públicas.

Detalhes na seção 10 do HANDOFF.

## 7. Como responder

Registre sua resposta em `entregas-para-greg.md`, na pasta Livvo do Edmir, ou responda direto ao Edmir. Status possíveis:

- `VALIDATING`
- `APPROVED`
- `ACTIVE`
- `REJECTED` (com o motivo)
