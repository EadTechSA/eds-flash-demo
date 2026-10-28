#!/usr/bin/env node
/*
 * Contrato Rybená por bloco: o código do site não pode cortar a ligação entre o
 * widget Rybená (usado pelo Bradesco) e o conteúdo de cada bloco.
 *
 * Fontes: documentação oficial (docs.rybena.com.br: configuration, api,
 * api/accessibility-features, api/event-handlers, csp-configuration) e, para o
 * que ela não cobre (efeito no DOM), o comportamento observado em
 * economiaemdia.com.br em 27/10/2026 ligando cada modo pela API.
 *
 * Como o Rybená age no DOM (não documentado; observado):
 *  - contraste escuro/claro, fonte para dislexia, espaçamento, entrelinha,
 *    alinhamento, destaque de links e títulos: põe uma classe em CADA elemento
 *    (rybDarkContrast, rybLightContrast, rybDislexia, rybLetterSpacing1,
 *    rybLineHeigth1, rybTextAlignmentCenter, rybLinkContrast-*, rybDestacarTitulos)
 *    e uma folha com regras `.rybDarkContrast { ... !important }`; um
 *    MutationObserver marca também o que os blocos criam depois;
 *  - contraste invertido e saturação: classe e `filter` na raiz (html).
 *
 * O que quebra essa ligação, e por isso reprova:
 *  R1 `!important` no CSS ou estilo inline com prioridade `important` no JS
 *     (empata ou vence as regras do Rybená);
 *  R2 trocar a lista de classes inteira (`.className =`, `setAttribute('class')`)
 *     apaga a classe que o Rybená pôs; use classList.add/remove/toggle;
 *  R3 imagem ou gradiente de fundo sem regra `<seletor>.rybDarkContrast` e
 *     `<seletor>.rybLightContrast` que o desligue (o Rybená só troca a cor de
 *     fundo; o gradiente continuaria por cima dela);
 *  R4 pseudo-elemento com texto (`content: "..."`) e cor própria: o Rybená não
 *     alcança pseudo-elementos, o texto só acompanha se herdar a cor;
 *  R5 SVG com `fill`/`stroke` de cor fixa: use currentColor, que segue o Rybená;
 *  R6 CSP: a política de seguranca/cabecalhos.json (a que vai para a entrega)
 *     tem de ser estrita, com a base da Adobe (aem.live/docs/csp: nonce-aem,
 *     strict-dynamic, base-uri, object-src none), default-src sem coringa, sem
 *     'unsafe-eval', com frame-ancestors, e liberar exatamente o que a página de
 *     CSP do Rybená exige; as metas de head.html e 404.html também não podem
 *     bloquear o Rybená;
 *  R7 Referrer-Policy tem de mandar a origem para fora: o Rybená autentica o
 *     domínio contratado pelo Referer (docs, Configuração > token);
 *  R8 Permissions-Policy não pode negar câmera e microfone à própria origem
 *     (comando de voz e controle por rosto do Rybená).
 *
 * Uso: node tools/a11y/contrato-rybena.mjs   (sai com código 1 se houver falha)
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const raiz = new URL('../../', import.meta.url).pathname;
const IGNORAR_JS = new Set(['scripts/aem.js', 'scripts/dompurify.min.js']);
const PINTURA_LIVRE = /^(currentcolor|none|inherit|transparent|context-fill|context-stroke)$/i;
const falhas = [];

function arquivos(pasta, ext) {
  const dir = join(raiz, pasta);
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter((d) => d.isFile() && d.name.endsWith(ext))
    .map((d) => join(d.parentPath || d.path, d.name));
}

const cssArquivos = [...arquivos('blocks', '.css'), ...arquivos('styles', '.css')];
const jsArquivos = [...arquivos('blocks', '.js'), ...arquivos('scripts', '.js')]
  .filter((f) => !IGNORAR_JS.has(relative(raiz, f)));

/** Regras de um CSS como { seletores[], decl } (achata @media; ignora @font-face/@keyframes). */
function regras(css) {
  const limpo = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const out = [];
  limpo.split('}').forEach((bloco) => {
    const i = bloco.lastIndexOf('{');
    if (i < 0) return;
    const seletor = bloco.slice(0, i).replace(/^[\s\S]*\{/, '').trim();
    if (!seletor || seletor.startsWith('@') || /^(from|to|\d+%)/.test(seletor)) return;
    const decl = {};
    bloco.slice(i + 1).split(';').forEach((d) => {
      const j = d.indexOf(':');
      if (j > 0) decl[d.slice(0, j).trim().toLowerCase()] = d.slice(j + 1).trim();
    });
    out.push({ seletores: seletor.split(',').map((s) => s.trim().replace(/\s+/g, ' ')), decl });
  });
  return out;
}

// variáveis globais que guardam gradiente ou imagem (ex.: --bra-gradiente)
const varsComImagem = new Set();
cssArquivos.forEach((f) => regras(readFileSync(f, 'utf8')).forEach(({ decl }) => {
  Object.entries(decl).forEach(([k, v]) => {
    if (k.startsWith('--') && /gradient\(|url\(/i.test(v)) varsComImagem.add(k);
  });
}));
const temImagem = (v = '') => /gradient\(|url\(/i.test(v)
  || [...v.matchAll(/var\((--[\w-]+)/g)].some((m) => varsComImagem.has(m[1]));

/** `.a .b::before` + classe → `.a .b.classe::before` */
function comClasse(seletor, classe) {
  const m = seletor.match(/^(.*?)(::?(before|after|marker|placeholder)\b.*)?$/);
  return `${m[1]}.${classe}${m[2] || ''}`;
}

cssArquivos.forEach((f) => {
  const nome = relative(raiz, f);
  const css = readFileSync(f, 'utf8');
  const lista = regras(css);
  const desligam = new Set();
  lista.forEach(({ seletores, decl }) => {
    const bg = decl['background-image'] || decl.background || '';
    if (/^none\b/.test(bg) || /^none$/.test(decl['background-image'] || '')) {
      seletores.filter((s) => /\.ryb(Dark|Light)Contrast/.test(s)).forEach((s) => desligam.add(s));
    }
  });

  if (/!important/.test(css.replace(/\/\*[\s\S]*?\*\//g, ''))) falhas.push(`${nome}: R1 usa !important`);

  lista.forEach(({ seletores, decl }) => {
    if (seletores.some((s) => /html\.contrast|\.ryb/.test(s))) return;

    const bg = decl['background-image'] || decl.background;
    if (temImagem(bg)) {
      seletores.forEach((s) => {
        const faltam = ['rybDarkContrast', 'rybLightContrast'].filter((c) => !desligam.has(comClasse(s, c)));
        if (faltam.length) falhas.push(`${nome}: R3 "${s}" tem imagem/gradiente de fundo sem ${faltam.map((c) => `"${comClasse(s, c)} { background-image: none }"`).join(' e ')}`);
      });
    }

    const pseudo = seletores.some((s) => /::?(before|after)\b/.test(s));
    const conteudo = (decl.content || '').replace(/^["']|["']$/g, '');
    if (pseudo && decl.content && conteudo && !/^none$/i.test(decl.content) && decl.color && !/^(inherit|currentcolor)$/i.test(decl.color)) {
      falhas.push(`${nome}: R4 "${seletores.join(', ')}" escreve texto em pseudo-elemento com cor própria (${decl.color}); deixe herdar`);
    }

    ['fill', 'stroke'].forEach((p) => {
      if (decl[p] && !PINTURA_LIVRE.test(decl[p])) falhas.push(`${nome}: R5 "${seletores.join(', ')}" usa ${p}: ${decl[p]}; use currentColor e defina color`);
    });
  });
});

jsArquivos.forEach((f) => {
  const nome = relative(raiz, f);
  readFileSync(f, 'utf8').split('\n').forEach((linha, i) => {
    const onde = `${nome}:${i + 1}`;
    const codigo = linha.replace(/\/\/.*$/, '');
    if (/\.className\s*=(?!=)/.test(codigo) || /setAttribute\(\s*['"]class['"]/.test(codigo)) {
      falhas.push(`${onde}: R2 substitui a lista de classes; use classList`);
    }
    if (/setProperty\([^)]*['"]important['"]/.test(codigo) || /cssText[^;]*!important/.test(codigo)) {
      falhas.push(`${onde}: R1 estilo inline com prioridade important`);
    }
    const attr = codigo.match(/setAttribute\(\s*['"](fill|stroke)['"]\s*,\s*['"]([^'"]+)['"]/);
    if (attr && !PINTURA_LIVRE.test(attr[2])) falhas.push(`${onde}: R5 SVG com ${attr[1]} fixo (${attr[2]}); use currentColor`);
    const obj = codigo.match(/\b(fill|stroke):\s*['"]([^'"]+)['"]/);
    if (obj && !PINTURA_LIVRE.test(obj[2])) falhas.push(`${onde}: R5 SVG com ${obj[1]} fixo (${obj[2]}); use currentColor`);
  });
});

// R6: CSP exigida pela documentação (docs.rybena.com.br/docs/getting-started/csp-configuration)
const CSP_RYBENA = {
  'script-src': ['cdn.rybena.com.br', 'libras.rybena.com.br'],
  'connect-src': ['libras.rybena.com.br', 'tts.rybena.com.br', 'dicio.rybena.com.br', 'repository.rybena.com.br', 'cm.rybena.com.br'],
  'frame-src': ['repository.rybena.com.br'],
  'style-src': ["'unsafe-inline'"],
  'img-src': ['data:', 'cdn.rybena.com.br', 'libras.rybena.com.br', 'repository.rybena.com.br'],
  'font-src': ['cdn.rybena.com.br', 'repository.rybena.com.br'],
  'media-src': ['repository.rybena.com.br'],
};
const RECUO = { 'frame-src': 'child-src' };
const lerCsp = (texto) => Object.fromEntries(texto.split(';').map((d) => d.trim().split(/\s+/))
  .filter((d) => d[0]).map(([k, ...v]) => [k.toLowerCase(), v]));

function cspLiberaRybena(onde, diretivas, regra) {
  Object.entries(CSP_RYBENA).forEach(([dir, exigidos]) => {
    const valores = diretivas[dir] || diretivas[RECUO[dir]] || diretivas['default-src'];
    if (!valores) return; // diretiva livre: nada bloqueado
    if (dir === 'script-src' && valores.includes("'strict-dynamic'")) return; // carregado por script confiável (delayed.js)
    const libera = (x) => valores.includes(x) || valores.includes('*') || (x !== "'unsafe-inline'" && x !== 'data:' && valores.includes('https:'));
    const faltam = exigidos.filter((x) => !libera(x));
    if (faltam.length) falhas.push(`${onde}: ${regra} CSP ${dir} bloqueia ${faltam.join(', ')} (exigido pela documentação do Rybená)`);
  });
}

['head.html', '404.html'].forEach((arq) => {
  const f = join(raiz, arq);
  if (!existsSync(f)) return;
  const m = readFileSync(f, 'utf8').match(/http-equiv=["']Content-Security-Policy["'][^>]*content=(["'])([\s\S]*?)\1/i);
  if (m) cspLiberaRybena(arq, lerCsp(m[2]), 'R6');
});

const arqCab = join(raiz, 'seguranca', 'cabecalhos.json');
if (!existsSync(arqCab)) {
  falhas.push('seguranca/cabecalhos.json: R6 ausente (cabeçalhos de segurança da entrega)');
} else {
  const onde = 'seguranca/cabecalhos.json';
  const cab = {};
  (JSON.parse(readFileSync(arqCab, 'utf8'))['/**'] || []).forEach((h) => { cab[h.key.toLowerCase()] = h.value; });
  const csp = cab['content-security-policy'];
  if (!csp) {
    falhas.push(`${onde}: R6 sem content-security-policy valendo em /** (report-only não protege)`);
  } else {
    const d = lerCsp(csp);
    const tem = (dir, v) => (d[dir] || []).includes(v);
    [['script-src', "'nonce-aem'"], ['script-src', "'strict-dynamic'"], ['base-uri', "'self'"], ['object-src', "'none'"]]
      .filter(([dir, v]) => !tem(dir, v)).forEach(([dir, v]) => falhas.push(`${onde}: R6 falta ${dir} ${v} (base da Adobe, aem.live/docs/csp)`));
    if (!d['default-src']) falhas.push(`${onde}: R6 sem default-src: o que não estiver listado fica liberado`);
    Object.entries(d).filter(([dir, v]) => dir !== 'script-src' && v.some((x) => x === '*' || x === 'http:' || x === 'https:'))
      .forEach(([dir]) => falhas.push(`${onde}: R6 ${dir} com coringa (*, http: ou https:)`));
    if (/'unsafe-eval'/.test(csp)) falhas.push(`${onde}: R6 usa 'unsafe-eval'`);
    if (!d['frame-ancestors']) falhas.push(`${onde}: R6 sem frame-ancestors (proteção contra clickjacking)`);
    cspLiberaRybena(onde, d, 'R6');
    // com default-src, o Rybená precisa estar listado em cada diretiva, inclusive script-src
    CSP_RYBENA['script-src'].filter((x) => !tem('script-src', x) && !tem('script-src', "'strict-dynamic'"))
      .forEach((x) => falhas.push(`${onde}: R6 script-src não libera ${x}`));
  }
  const ref = (cab['referrer-policy'] || '').toLowerCase();
  if (/(^|,\s*)(no-referrer|same-origin)\s*$/.test(ref)) falhas.push(`${onde}: R7 referrer-policy "${ref}" não manda a origem; o Rybená não autentica o domínio`);
  const perm = cab['permissions-policy'] || '';
  ['camera', 'microphone'].filter((p) => new RegExp(`${p}=\\(\\s*\\)`).test(perm))
    .forEach((p) => falhas.push(`${onde}: R8 permissions-policy nega ${p}; o Rybená usa (comando de voz, controle por rosto)`));
}

if (falhas.length) {
  // eslint-disable-next-line no-console
  console.error(`Contrato Rybená: ${falhas.length} falha(s)\n- ${falhas.join('\n- ')}`);
  process.exit(1);
}
// eslint-disable-next-line no-console
console.log(`Contrato Rybená: ok (${cssArquivos.length} CSS, ${jsArquivos.length} JS): nenhum bloco corta a ligação com o Rybená`);
