/*
 * Acessibilidade ao vivo: os seis modos como alternadores (os mesmos botões
 * do widget, para o estado ser um só) e um verificador bloco a bloco que
 * mede, agora, o contraste do texto de cada bloco desta página e diz se o
 * bloco tem regra própria `html.contrast .<bloco>` nas folhas de estilo.
 * Muda o modo, a tabela remede. Nada é simulado: é a página de verdade.
 * Linhas: abertura (1 célula) + rótulos `chave | texto`.
 */
import { el, linhas, rotulos } from '../../scripts/demo.js';
import { revelar } from '../../scripts/motion.js';

const FERRAMENTAS = ['a11y-font-increase', 'a11y-font-decrease', 'a11y-contrast', 'a11y-grayscale', 'a11y-invert', 'a11y-links'];

function rgb(s) {
  const m = s.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/);
  if (!m) return null;
  return {
    r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4],
  };
}

function luminancia({ r, g, b }) {
  const f = (c) => {
    const x = c / 255;
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function fundoEfetivo(elm) {
  let e = elm;
  let cor = null;
  while (e && e !== document.documentElement) {
    const c = rgb(getComputedStyle(e).backgroundColor);
    if (c && c.a > 0) {
      if (!cor) cor = c;
      else {
        const { a } = cor;
        const mistura = (x, y) => x * a + y * (1 - a);
        cor = {
          r: mistura(cor.r, c.r),
          g: mistura(cor.g, c.g),
          b: mistura(cor.b, c.b),
          a: Math.min(1, a + c.a * (1 - a)),
        };
      }
      if (cor.a >= 0.99) return cor;
    }
    e = e.parentElement;
  }
  const raiz = rgb(getComputedStyle(document.documentElement).backgroundColor) || {
    r: 11, g: 12, b: 15, a: 1,
  };
  if (!cor) return raiz;
  const { a } = cor;
  const mistura = (x, y) => x * a + y * (1 - a);
  return {
    r: mistura(cor.r, raiz.r), g: mistura(cor.g, raiz.g), b: mistura(cor.b, raiz.b), a: 1,
  };
}

function contraste(fg, bg) {
  const l1 = luminancia(fg);
  const l2 = luminancia(bg);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

function hex({ r, g, b }) {
  return `#${[r, g, b].map((x) => Math.round(x).toString(16).padStart(2, '0')).join('')}`;
}

/** Primeiro texto visível do bloco (parágrafo, título, botão, rótulo). */
function amostra(bloco) {
  const cands = bloco.querySelectorAll('p, h1, h2, h3, h4, span, a, button, dt, dd, li, label');
  return [...cands].find((c) => {
    if (!c.textContent.trim()) return false;
    const r = c.getBoundingClientRect();
    const st = getComputedStyle(c);
    return r.width > 0 && r.height > 0 && st.visibility !== 'hidden' && +st.opacity > 0.5;
  }) || bloco;
}

/** Nomes de bloco que têm regra própria sob html.contrast nas folhas carregadas. */
function blocosComRegra() {
  const nomes = new Set();
  [...document.styleSheets].forEach((folha) => {
    let regras;
    try { regras = folha.cssRules; } catch (e) { return; }
    [...regras].forEach((r) => {
      const sel = r.selectorText || '';
      const m = sel.match(/html\.contrast\s+(?:[a-z]+\s+)?\.([a-z0-9-]+)/g);
      if (m) m.forEach((x) => nomes.add(x.replace(/.*\./, '')));
      if (r.cssRules) {
        [...r.cssRules].forEach((rr) => {
          const s2 = rr.selectorText || '';
          const m2 = s2.match(/html\.contrast\s+(?:[a-z]+\s+)?\.([a-z0-9-]+)/g);
          if (m2) m2.forEach((x) => nomes.add(x.replace(/.*\./, '')));
        });
      }
    });
  });
  return nomes;
}

function montar(block) {
  const r = rotulos(block);
  const [aberturaCel] = linhas(block).map((c) => c[0]);
  block.textContent = '';
  if (aberturaCel) {
    const ab = el('div', 'a11y-painel-abertura');
    ab.append(...aberturaCel.childNodes);
    block.append(ab);
  }
  const grade = el('div', 'a11y-painel-grade');

  // alternadores: espelham os botões do widget
  const p1 = el('div', 'painel a11y-painel-modos');
  const h1 = el('h3');
  const seloModo = el('span', 'selo inativo', r('modo-normal', 'normal'));
  h1.append(el('span', '', r('modos-titulo', 'modos')), seloModo);
  const lista = el('div', 'a11y-painel-botoes');
  const nomes = (r('modos', '') || '').split('|');
  FERRAMENTAS.forEach((classe, i) => {
    const b = el('button', 'button', nomes[i] || classe);
    b.type = 'button';
    b.dataset.classe = classe;
    b.addEventListener('click', () => {
      const alvo = document.querySelector(`.acessibilidade .${classe}`);
      if (alvo) alvo.click();
    });
    lista.append(b);
  });
  const nota = el('p', '', r('modos-nota', ''));
  p1.append(h1, lista, nota);

  // verificador bloco a bloco
  const p2 = el('div', 'painel a11y-painel-tabela');
  const h2 = el('h3');
  const resumo = el('span', 'selo', '—');
  h2.append(el('span', '', r('tabela-titulo', 'blocos')), resumo);
  const tabela = el('table', 'a11y-painel-blocos');
  tabela.innerHTML = `<thead><tr><th scope="col">${r('col-bloco', 'bloco')}</th><th scope="col">${r('col-cores', 'cores')}</th><th scope="col">${r('col-contraste', 'contraste')}</th><th scope="col">${r('col-regra', 'regra')}</th></tr></thead><tbody></tbody>`;
  const corpo = tabela.querySelector('tbody');
  p2.append(h2, tabela, el('p', '', r('tabela-nota', '')));
  grade.append(p1, p2);
  block.append(grade);
  revelar(p1);
  revelar(p2, 100);

  const medir = () => {
    const html = document.documentElement;
    const modos = ['contrast', 'a11y-grayscale', 'a11y-invert', 'a11y-links', 'font-size-1', 'font-size-2'].filter((c) => html.classList.contains(c));
    seloModo.textContent = modos.length ? modos.join(' + ') : r('modo-normal', 'normal');
    seloModo.classList.toggle('inativo', !modos.length);
    lista.querySelectorAll('button').forEach((b) => {
      const w = document.querySelector(`.acessibilidade .${b.dataset.classe}`);
      b.classList.toggle('primary', !!(w && w.getAttribute('aria-pressed') === 'true'));
    });
    const comRegra = blocosComRegra();
    const emContraste = html.classList.contains('contrast');
    corpo.textContent = '';
    let ok = 0;
    const blocos = [...document.querySelectorAll('header .header, main .block, footer .footer')];
    blocos.forEach((bl) => {
      const nome = bl.classList[0];
      const texto = amostra(bl);
      const fg = rgb(getComputedStyle(texto).color) || {
        r: 255, g: 255, b: 255, a: 1,
      };
      const bg = fundoEfetivo(texto);
      const c = contraste(fg, bg);
      const tam = parseFloat(getComputedStyle(texto).fontSize);
      const minimo = tam >= 24 ? 3 : 4.5;
      const passa = c >= minimo;
      if (passa) ok += 1;
      const tr = el('tr', passa ? 'ok' : 'falha');
      tr.innerHTML = `<th scope="row">${nome}</th><td><i style="background:${hex(fg)}"></i><i style="background:${hex(bg)}"></i><span>${hex(fg)} / ${hex(bg)}</span></td><td>${c.toFixed(2)}:1 ${passa ? '✓' : '✗'}</td><td>${comRegra.has(nome) ? r('regra-propria', 'própria') : r('regra-tokens', 'tokens')}</td>`;
      corpo.append(tr);
    });
    resumo.textContent = `${ok}/${blocos.length} ${r('aa', 'AA')}${emContraste ? ` · ${r('em-contraste', 'contraste')}` : ''}`;
    resumo.classList.toggle('alerta', ok !== blocos.length);
  };
  new MutationObserver(() => window.setTimeout(medir, 350)).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  window.addEventListener('load', () => window.setTimeout(medir, 1200));
  window.setTimeout(medir, 1500);
}

export default function decorate(block) {
  montar(block);
}
