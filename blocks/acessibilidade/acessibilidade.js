/*
 * Widget de acessibilidade (o mesmo do portal público já no ar): um botão
 * flutuante abre um painel com seis ferramentas. Cada ferramenta só liga
 * uma classe na raiz do documento (ou um nível de fonte) e guarda a
 * escolha no localStorage. Nenhum bloco "sabe" do widget: cada bloco
 * responde pelo próprio CSS aos modos `html.contrast`, `html.a11y-grayscale`,
 * `html.a11y-invert`, `html.a11y-links`, `html.font-size-1/2`.
 *
 * Conteúdo autorado (fragmento /nav): título do painel + lista com as seis
 * ferramentas na ordem fixa; rótulos `chave | texto` para o botão e o status
 * (abrir, tamanho-maximo, tamanho-minimo, tamanho, nomes dos tamanhos).
 * Referência: LBI art. 63, eMAG 3.1 e WCAG 2.2 AA.
 */
import { el, linhas, rotulos } from '../../scripts/demo.js';

const NS = 'http://www.w3.org/2000/svg';
const NIVEIS = ['', 'font-size-1', 'font-size-2'];
const FERRAMENTAS = [
  { classe: 'a11y-font-increase', glifo: 'mais', passo: 1 },
  { classe: 'a11y-font-decrease', glifo: 'menos', passo: -1 },
  {
    classe: 'a11y-contrast', glifo: 'contraste', modo: 'contrast', chave: 'a11y-contrast',
  },
  {
    classe: 'a11y-grayscale', glifo: 'meioCheio', modo: 'a11y-grayscale', chave: 'a11y-grayscale',
  },
  {
    classe: 'a11y-invert', glifo: 'paleta', modo: 'a11y-invert', chave: 'a11y-invert',
  },
  {
    classe: 'a11y-links', glifo: 'elo', modo: 'a11y-links', chave: 'a11y-links',
  },
];
const GLIFOS = {
  mais: [{
    tag: 'line', x1: '12', y1: '5', x2: '12', y2: '19',
  }, {
    tag: 'line', x1: '5', y1: '12', x2: '19', y2: '12',
  }],
  menos: [{
    tag: 'line', x1: '5', y1: '12', x2: '19', y2: '12',
  }],
  contraste: [{
    tag: 'rect', x: '4', y: '4', width: '16', height: '16', rx: '2',
  }, {
    tag: 'path', d: 'M4 20 20 4v14a2 2 0 0 1-2 2z', fill: 'currentColor', stroke: 'none',
  }],
  meioCheio: [{
    tag: 'circle', cx: '12', cy: '12', r: '9',
  }, {
    tag: 'path', d: 'M12 3a9 9 0 0 1 0 18z', fill: 'currentColor', stroke: 'none',
  }],
  paleta: [{ tag: 'path', d: 'M12 3a9 9 0 1 0 0 18h1.5a2 2 0 0 0 0-4H12a1.5 1.5 0 0 1 0-3h4a5 5 0 0 0 5-5c0-3.5-4-6-9-6z' }, {
    tag: 'circle', cx: '7.5', cy: '11', r: '1.2', fill: 'currentColor', stroke: 'none',
  }, {
    tag: 'circle', cx: '10.5', cy: '7', r: '1.2', fill: 'currentColor', stroke: 'none',
  }, {
    tag: 'circle', cx: '15', cy: '7.5', r: '1.2', fill: 'currentColor', stroke: 'none',
  }],
  elo: [{ tag: 'path', d: 'M10 13a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 0 0-7.07-7.07L11.5 4.4' }, { tag: 'path', d: 'M14 11a5 5 0 0 0-7.07 0L4.1 13.83a5 5 0 0 0 7.07 7.07l1.3-1.3' }],
  pessoa: [{
    tag: 'circle', cx: '12', cy: '12', r: '10.1', 'stroke-width': '1.75',
  }, {
    tag: 'circle', cx: '12', cy: '7.1', r: '1.6', fill: 'currentColor', stroke: 'none',
  }, { tag: 'path', d: 'M6.95 9.3 12 10.5l5.05-1.2', 'stroke-width': '1.5' }, { tag: 'path', d: 'M12 10.4v4.3', 'stroke-width': '3.2' }, { tag: 'path', d: 'M10.95 14.4 10.05 17.8', 'stroke-width': '1.6' }, { tag: 'path', d: 'M13.05 14.4 13.95 17.8', 'stroke-width': '1.6' }],
};

function icone(formas, tamanho) {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', String(tamanho));
  svg.setAttribute('height', String(tamanho));
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  formas.forEach(({ tag, ...atributos }) => {
    const f = document.createElementNS(NS, tag);
    Object.entries(atributos).forEach(([k, v]) => f.setAttribute(k, v));
    svg.append(f);
  });
  return svg;
}

export default function decorate(block) {
  const r = rotulos(block);
  const [textoCel] = linhas(block).map((c) => c[0]);
  const titulo = textoCel && textoCel.querySelector('h1, h2, h3, h4, p');
  const itens = textoCel ? [...textoCel.querySelectorAll('li')].map((li) => li.textContent.trim()) : [];
  block.textContent = '';
  const html = document.documentElement;

  const alternar = el('button', 'a11y-widget-alternar');
  alternar.type = 'button';
  alternar.setAttribute('aria-expanded', 'false');
  alternar.setAttribute('aria-controls', 'a11y-widget-painel');
  alternar.setAttribute('aria-label', r('abrir', titulo ? titulo.textContent : 'Acessibilidade'));
  alternar.append(icone(GLIFOS.pessoa, 26));

  const painel = el('div', 'a11y-widget-painel');
  painel.id = 'a11y-widget-painel';
  painel.hidden = true;
  const tituloEl = el('p', 'a11y-widget-titulo', titulo ? titulo.textContent : '');
  tituloEl.id = 'a11y-widget-titulo';
  const lista = el('ul', 'a11y-widget-lista');
  lista.setAttribute('aria-labelledby', tituloEl.id);
  const status = el('p', 'a11y-widget-status');
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');

  let nivel = NIVEIS.findIndex((c) => c && html.classList.contains(c));
  if (nivel < 0) nivel = 0;
  const nomes = r('tamanhos', 'normal|grande|maior').split('|');
  const aplicarNivel = () => {
    NIVEIS.filter(Boolean).forEach((c) => html.classList.remove(c));
    if (NIVEIS[nivel]) html.classList.add(NIVEIS[nivel]);
    try { localStorage.setItem('a11y-font-level', String(nivel)); } catch (e) { /* sem storage */ }
  };
  try {
    const g = parseInt(localStorage.getItem('a11y-font-level') || '0', 10);
    if (g > 0 && g < NIVEIS.length) { nivel = g; aplicarNivel(); }
  } catch (e) { /* sem storage */ }

  FERRAMENTAS.forEach((f, i) => {
    const li = el('li');
    const b = el('button', f.classe);
    b.type = 'button';
    const fig = el('span', 'a11y-widget-glifo');
    fig.append(icone(GLIFOS[f.glifo], 20));
    b.append(fig, el('span', '', itens[i] || f.classe));
    if (f.passo) {
      b.addEventListener('click', () => {
        const antes = nivel;
        nivel = Math.min(Math.max(nivel + f.passo, 0), NIVEIS.length - 1);
        aplicarNivel();
        if (nivel === antes) status.textContent = f.passo > 0 ? r('tamanho-maximo', '') : r('tamanho-minimo', '');
        else status.textContent = r('tamanho', '{n}').replace('{n}', nomes[nivel] || '');
        window.dispatchEvent(new CustomEvent('demo:log', { detail: { texto: `a11y: font-level ${nivel}`, tipo: 'ok' } }));
      });
    } else {
      b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', () => {
        const ativo = html.classList.toggle(f.modo);
        b.setAttribute('aria-pressed', String(ativo));
        try { localStorage.setItem(f.chave, ativo ? '1' : '0'); } catch (e) { /* sem storage */ }
        window.dispatchEvent(new CustomEvent('demo:log', { detail: { texto: `a11y: html.${f.modo} ${ativo ? 'on' : 'off'}`, tipo: 'ok' } }));
      });
      try {
        if (localStorage.getItem(f.chave) === '1') {
          html.classList.add(f.modo);
          b.setAttribute('aria-pressed', 'true');
        }
      } catch (e) { /* sem storage */ }
    }
    li.append(b);
    lista.append(li);
  });

  painel.append(tituloEl, lista, status);
  block.append(alternar, painel);
  const abrir = (estado) => {
    alternar.setAttribute('aria-expanded', String(estado));
    painel.hidden = !estado;
  };
  alternar.addEventListener('click', () => abrir(alternar.getAttribute('aria-expanded') !== 'true'));
  block.addEventListener('keydown', (e) => {
    if (e.code !== 'Escape' || painel.hidden) return;
    abrir(false);
    alternar.focus();
  });
  document.addEventListener('click', (e) => {
    if (!block.contains(e.target)) abrir(false);
  });
}
