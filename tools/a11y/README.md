# Verificador de acessibilidade por modo e por bloco

Confere, na página publicada, se cada bloco continua acessível em todos os
modos do widget de acessibilidade: alto contraste, preto e branco, inverter
cores, destacar links, fonte maior e contraste + fonte maior. Roda o axe-core
(WCAG 2.2 AA e boas práticas) em desktop (1400×900) e celular (390×844) e
agrupa cada violação pelo bloco do EDS em que o elemento está.

```
node tools/a11y/verificar-modos.mjs <url> [mais urls] [--widget] [--saida pasta]
```

- Usa o Playwright já instalado (não precisa instalar) e o `axe.min.js`: rode
  antes `mkdir -p /tmp/axe && cd /tmp/axe && npm pack axe-core && tar xzf axe-core-*.tgz`,
  ou passe `--axe caminho/axe.min.js`.
- Cada modo liga as classes conhecidas das três gerações do widget
  (`contrast`/`a11y-contraste`, `a11y-grayscale`/`a11y-pb`, `a11y-invert`/`a11y-inverter`,
  `a11y-links`, `font-size-2`/`a11y-fonte-2` e `data-font-size="120"`); o site
  responde às suas.
- `--widget` também prova os botões do widget quando ele existe
  (`.a11y-widget`, painel novo `.a11y-acao` ou `.a11y-botao`/`.a11y-painel`):
  aria-pressed/aria-checked, classe na raiz e persistência em localStorage.
- Além do axe: no modo de fonte maior o corpo tem de crescer ≥ 15 %; nos modos
  preto e branco e inverter, avisa quando o site não aplica filtro nenhum
  (modo não oferecido); no contraste lista elementos com imagem de fundo e
  texto por cima (só informação).
- Saída por URL: `<pasta>/<host>[_caminho]-relatorio.md` (tabela modo × bloco e
  as violações com seletor, cores e razão), `.json` e uma captura por modo.
- Para conferir um branch que o Code Sync ainda não serviu: `npx -y @adobe/aem-cli up --no-open`
  na pasta do repo e verifique `http://localhost:3000/`.

O que o relatório costuma apontar: tokens que o modo de contraste não remapeia
(`html.contrast { --token: … }` em `styles/styles.css` resolve para todos os
blocos de uma vez), fundos claros fixos em blocos e textos "suaves" em cinza.
