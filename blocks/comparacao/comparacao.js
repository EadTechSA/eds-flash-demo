/*
 * Comparação entre dois caminhos (A × B), com os mesmos critérios. Um botão
 * alterna o lado em destaque; a barra de cada linha mede o primeiro número
 * do valor autorado ("26 semanas" → 26), relativo ao maior dos dois.
 *
 * Linhas do bloco (na ordem do modelo): sobretítulo, título, texto, nome do
 * caminho A, nome do caminho B, trocar sozinho para B (true/false).
 * Depois, uma linha por critério: título | texto | valor A | valor B.
 */
import {
  el, adiar, abertura as montarAbertura, campos, campo, conteudo, marcar, numeroDe, texto,
} from '../../scripts/demo.js';
import { palavras, reduzido, revelar } from '../../scripts/motion.js';

function abertura(cels) {
  const d = montarAbertura(cels, 'comparacao-abertura');
  const h = d.querySelector('h2');
  if (h) palavras(h);
  d.querySelectorAll('p').forEach((p, i) => revelar(p, i * 80));
  return d;
}

function botao(celula, reserva) {
  const b = celula && celula.textContent.trim() ? campo(celula, 'button') : el('button', '', reserva);
  b.type = 'button';
  return b;
}

function montar(block) {
  const [sobre, titulo, txt, nomeA, nomeB, sozinho] = campos(block, 6);
  const trocar = texto(sozinho || null) !== 'false';
  const itens = [...block.children].map((l) => {
    const [t, tx, a, b] = [...l.children];
    return {
      linha: l, titulo: t, texto: tx, a, b,
    };
  });
  block.textContent = '';

  const painel = el('div', 'comparacao-painel');
  const seg = el('div', 'segmentos comparacao-alternar');
  const bA = botao(nomeA, 'A');
  const bB = botao(nomeB, 'B');
  seg.append(bA, bB);
  const lista = el('ul', 'comparacao-linhas');
  itens.forEach((it) => {
    const li = marcar(it.linha, el('li', 'comparacao-linha'));
    const cab = el('div', 'comparacao-linha-cabeca');
    if (it.titulo) cab.append(campo(it.titulo, 'h3'));
    const vals = el('div', 'comparacao-linha-valores');
    vals.append(campo(it.a, 'span', 'comparacao-a'), campo(it.b, 'span', 'comparacao-b'));
    const tr = el('div', 'comparacao-trilho');
    tr.append(el('i'));
    const nA = numeroDe(texto(it.a || null));
    const nB = numeroDe(texto(it.b || null));
    const max = Math.max(nA, nB, 1);
    li.dataset.a = (nA / max) * 100;
    li.dataset.b = (nB / max) * 100;
    li.append(cab, vals, tr);
    if (it.texto) li.append(conteudo(it.texto, el('div', 'comparacao-linha-texto')));
    lista.append(li);
    revelar(li);
  });
  const aplicar = (lado) => {
    painel.dataset.lado = lado;
    bA.classList.toggle('ativo', lado === 'a');
    bB.classList.toggle('ativo', lado === 'b');
    bA.setAttribute('aria-pressed', lado === 'a');
    bB.setAttribute('aria-pressed', lado === 'b');
    lista.querySelectorAll('.comparacao-linha').forEach((li) => {
      li.querySelector('.comparacao-trilho i').style.width = `${li.dataset[lado]}%`;
    });
  };
  bA.addEventListener('click', () => aplicar('a'));
  bB.addEventListener('click', () => aplicar('b'));
  painel.append(seg, lista);
  aplicar('a');
  // ao aparecer, mostra o caminho A e, 1,6 s depois, troca para o B (se o autor quiser)
  if (trocar && !reduzido) {
    const obs = new IntersectionObserver((es) => {
      if (!es[0].isIntersecting) return;
      obs.disconnect();
      setTimeout(() => aplicar('b'), 1600);
    }, { threshold: 0.5 });
    obs.observe(lista);
  }
  block.append(abertura([sobre, titulo, txt]), painel);
}

export default function decorate(block) {
  adiar(block, () => montar(block));
}
