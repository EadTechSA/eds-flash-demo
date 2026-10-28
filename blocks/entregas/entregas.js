/*
 * Entregas: cartões com um número que conta até o valor autorado, a unidade
 * ao lado, título e texto. O número aceita prefixo e sufixo ("+40", "99%").
 *
 * Linhas do bloco (na ordem do modelo): sobretítulo, título, texto.
 * Depois, uma linha por entrega: título | texto | número | unidade.
 */
import {
  el, adiar, abertura as montarAbertura, campos, campo, conteudo, marcar, texto,
} from '../../scripts/demo.js';
import { contar, palavras, revelar } from '../../scripts/motion.js';

/* local de propósito: um demo.js antigo no cache do navegador não derruba o bloco */
function numeroDe(s) {
  const m = String(s || '').match(/-?[\d.]*\d(?:,\d+)?/);
  if (!m) return 0;
  const n = parseFloat(m[0].replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

function casasDe(s) {
  const m = String(s || '').match(/\d[,.](\d+)/);
  return m ? m[1].length : 0;
}

function abertura(cels) {
  const d = montarAbertura(cels, 'entregas-abertura');
  const h = d.querySelector('h2');
  if (h) palavras(h);
  d.querySelectorAll('p').forEach((p, i) => revelar(p, i * 80));
  return d;
}

function montar(block) {
  const ab = campos(block, 3);
  const itens = [...block.children].map((l) => {
    const [t, tx, n, u] = [...l.children];
    return {
      linha: l, titulo: t, texto: tx, numero: n, unidade: u,
    };
  });
  block.textContent = '';

  const grade = el('ul', 'entregas-grade');
  itens.forEach((it, i) => {
    const li = marcar(it.linha, el('li', 'entrega'));
    const bruto = texto(it.numero || null);
    const n = marcar(it.numero, el('span', 'entrega-numero', '0'));
    const prefixo = bruto.match(/^[^\d-]*/)[0];
    const sufixo = bruto.replace(/^[^\d-]*-?[\d.,]*\d/, '');
    contar(n, numeroDe(bruto), { casas: casasDe(bruto), sufixo, prefixo });
    const cab = el('div', 'entrega-cabeca');
    cab.append(n);
    if (it.unidade) cab.append(campo(it.unidade, 'span', 'entrega-unidade'));
    const tx = el('div', 'entrega-texto');
    if (it.titulo) tx.append(campo(it.titulo, 'h3'));
    if (it.texto) conteudo(it.texto, tx);
    li.append(cab, tx);
    revelar(li, i * 80);
    grade.append(li);
  });
  block.append(abertura(ab), grade);
}

export default function decorate(block) {
  adiar(block, () => montar(block));
}
