/*
 * Passos de autoria e governança numa trilha horizontal fixada: a página
 * rola para baixo, os cartões andam para o lado e a linha de progresso
 * avança. No celular viram uma coluna.
 * Linhas: abertura (1 célula), passos (ícone | título | texto), rótulos.
 */
import {
  el, linhas, rotulos, texto,
} from '../../scripts/demo.js';
import { aoRolar, reduzido } from '../../scripts/motion.js';

export default function decorate(block) {
  const r = rotulos(block);
  const todas = linhas(block);
  const abertura = todas.find((c) => c.length === 1);
  const passos = todas.filter((c) => c.length === 3)
    .map((c) => ({ icone: texto(c[0]), titulo: texto(c[1]), texto: c[2] }));
  block.textContent = '';
  const fixo = el('div', 'passos-fixo');
  const ab = el('div', 'passos-abertura');
  if (abertura) ab.append(...abertura[0].childNodes);
  const linha = el('div', 'passos-linha');
  const fill = el('i');
  linha.append(fill);
  const trilha = el('div', 'passos-trilha');
  passos.forEach((p, i) => {
    const c = el('div', 'passos-cartao');
    c.append(el('span', 'passos-icone', p.icone), el('span', 'passos-numero', String(i + 1).padStart(2, '0')), el('h3', '', p.titulo), ...p.texto.childNodes);
    trilha.append(c);
  });
  const dica = el('p', 'passos-dica', r('dica', ''));
  fixo.append(ab, linha, trilha, dica);
  block.append(fixo);

  const largo = window.matchMedia('(min-width: 900px)');
  if (!largo.matches || reduzido) {
    block.classList.add('passos-coluna');
    fill.style.width = '100%';
    return;
  }
  block.style.setProperty('--n', passos.length);
  aoRolar(block, (p) => {
    const dist = Math.max(0, trilha.scrollWidth - fixo.clientWidth);
    trilha.style.transform = `translateX(${-dist * p}px)`;
    fill.style.width = `${p * 100}%`;
  });
}
