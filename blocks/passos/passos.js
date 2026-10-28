/*
 * Passos de autoria e governança numa trilha horizontal fixada: a página
 * rola para baixo, os cartões andam para o lado e a linha de progresso
 * avança. No celular viram uma coluna.
 * Linhas: abertura (sobretítulo, título, texto), passos (ícone | título |
 * texto), rótulos.
 */
import {
  el, rotulos, adiar, abertura, campos, campo, conteudo, marcar,
} from '../../scripts/demo.js';
import { aoRolar, reduzido } from '../../scripts/motion.js';

function montar(block) {
  const cabeca = campos(block, 3);
  const r = rotulos(block);
  const passos = [...block.children].filter((l) => l.children.length === 3)
    .map((l) => ({ linha: l, cels: [...l.children] }));
  block.textContent = '';
  const fixo = el('div', 'passos-fixo');
  const ab = abertura(cabeca, 'passos-abertura');
  const linha = el('div', 'passos-linha');
  const fill = el('i');
  linha.append(fill);
  const trilha = el('div', 'passos-trilha');
  passos.forEach((p, i) => {
    const c = marcar(p.linha, el('div', 'passos-cartao'));
    c.append(campo(p.cels[0], 'span', 'passos-icone'), el('span', 'passos-numero', String(i + 1).padStart(2, '0')), campo(p.cels[1], 'h3'));
    conteudo(p.cels[2], c);
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

export default function decorate(block) {
  adiar(block, () => montar(block));
}
