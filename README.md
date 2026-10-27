# EDS Flash Demo

Landing page de demonstração da EadTech para o Adobe Professional Services:
AEM Edge Delivery Services com AEM Authoring (Universal Editor), AEM Assets e
consentimento de cookies nativo (pacote EadTech), em português, espanhol e inglês.

Uso exclusivo para apresentação ao Adobe Professional Services. Não é site de cliente.

- Prévia: `https://main--eds-flash-demo--eadtechsa.aem.page/` (`/es`, `/en`)
- Publicado: `https://main--eds-flash-demo--eadtechsa.aem.live/` (login Adobe: `@eadtech.com.br` e convidados)
- Author: `author-p172553-e1847554.adobeaemcloud.com`, site `/content/eds-flash-demo`

## O que a página demonstra

| Seção | Bloco | O que acontece de verdade |
|---|---|---|
| Capa | `hero` (variante `video`) | O player da Adobe só é inserido depois que a categoria `CC_MEDIA` é aceita; revogar nas definições remove o player sem recarregar |
| Rápido não é fácil | `valor` | Iceberg por rolagem (investimento feito antes), comparação difícil × Express com números animados, entregas da semana |
| Consentimento | `consent-live` | Cascata de rede da própria página (Resource Timing) nas três fases, estado gravado, log dos eventos `consent` / `consent-updated` |
| Três fases | `fases` | Navegador simulado que pinta eager → lazy → delayed conforme a rolagem |
| Assets e Dynamic Media | `dm-showcase` | Mesma imagem do DAM em três proporções com ponto de interesse; rendition por URL real do media bus (ou do Dynamic Media quando houver `urlBase`) |
| EDS | `bento` | Medidores do Lighthouse, Navigation Timing real, `query-index.json` lido ao vivo, cabeçalhos, Edge Function, A/B, telemetria |
| Agentic | `agentic` | Cinco verificações e o `curl` do `.plain.html` da própria página |
| Autoria | `passos` | Trilha horizontal fixada com os passos de autoria e governança |

Regras da casa: todo texto visível vem do conteúdo (linhas `chave | texto` dos
blocos); a variante é escolha do autor no Universal Editor; imagens só do Assets;
nada de biblioteca de animação (CSS + IntersectionObserver + rAF em `scripts/motion.js`).

## Consentimento

`scripts/consent.js`, `consent-gate.js`, `consent-check.js`, `consented.js`,
`styles/consent.css` e o bloco `consent-origens`. O documento autorado fica em
`/cookie-consent/padrao` (um por idioma), apontado pelo metadado `cookie-consent`
da página. Categorias: `CC_ESSENTIAL`, `CC_ANALYTICS`, `CC_MEDIA`.

## Conteúdo reproduzível

`tools/conteudo/conteudo.py` gera `conteudo.json` (as 15 páginas nos três idiomas,
como árvore do author). Importação: `importar.py` no Mac com o token da conta
técnica, ou `importar.js` colado no console de uma aba logada do author.

## Desenvolvimento

```
npm install
npx -y @adobe/aem-cli up --no-open
npm run lint
```
