/*
 * Três fases do carregamento, contadas por rolagem: o bloco fica fixo na
 * tela e um navegador simulado pinta o LCP (eager), depois os blocos
 * (lazy), depois o banner de cookies (delayed), com o relógio em ms.
 * Linhas: abertura (1 célula), fases (sigla | título | texto), rótulos.
 */
import {
  el, linhas, rotulos, texto, adiar,
} from '../../scripts/demo.js';
import { aoRolar } from '../../scripts/motion.js';

function montar(block) {
  const r = rotulos(block);
  const todas = linhas(block);
  const abertura = todas.find((c) => c.length === 1);
  const fases = todas.filter((c) => c.length === 3)
    .map((c) => ({ sigla: texto(c[0]), titulo: texto(c[1]), texto: c[2] }));
  block.textContent = '';

  const fixo = el('div', 'fases-fixo');
  const txt = el('div', 'fases-texto');
  if (abertura) txt.append(...abertura[0].childNodes);
  const passos = fases.map((f, i) => {
    const d = el('div', `fases-passo${i === 0 ? ' ativo' : ''}`);
    const corpo = el('div');
    corpo.append(el('h3', '', f.titulo), ...f.texto.childNodes);
    d.append(el('b', '', f.sigla), corpo);
    txt.append(d);
    return d;
  });

  const nav = el('div', 'fases-navegador');
  const barra = el('div', 'fases-barra');
  const ms = el('span', 'fases-ms', '0 ms');
  barra.append(el('i'), el('i'), el('i'), el('span', 'fases-url', r('url', 'https://…/')), ms);
  const vp = el('div', 'fases-viewport');
  const menu = el('div', 'fases-menu', '<span style="width:80px"></span><span></span><span></span><span></span>');
  const hero = el('div', 'fases-hero');
  const lcp = el('span', 'fases-lcp', r('lcp', 'LCP'));
  hero.append(lcp, el('div', 'fases-t'), el('div', 'fases-t2'));
  const blocos = el('div', 'fases-blocos', '<span></span><span></span><span></span>');
  const cookies = el('div', 'fases-cookies', `<span>${r('cookies', 'cookies')}</span><i></i>`);
  vp.append(menu, hero, blocos, cookies);
  nav.append(barra, vp);
  fixo.append(txt, nav);
  block.append(fixo);

  aoRolar(block, (p) => {
    let etapa = 0;
    if (p >= 0.66) etapa = 2; else if (p >= 0.33) etapa = 1;
    passos.forEach((d, i) => d.classList.toggle('ativo', i === etapa));
    ms.textContent = `${Math.round(p * 3400)} ms`;
    block.dataset.etapa = etapa;
    block.style.setProperty('--p', p);
  });
}

export default function decorate(block) {
  adiar(block, () => montar(block));
}
