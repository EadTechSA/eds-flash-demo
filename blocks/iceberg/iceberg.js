/*
 * Iceberg: a ponta é o que o cliente vê (o número e o texto da ponta); cada
 * camada submersa é um investimento feito antes, com número e unidade,
 * revelada conforme a página rola, com a água descendo. No celular e com
 * movimento reduzido, a lista é estática.
 *
 * Linhas do bloco (na ordem do modelo): sobretítulo, título, texto, número
 * da ponta, texto da ponta, legenda. Depois, uma linha por camada:
 * título | texto | número | unidade.
 */
import {
  el, adiar, abertura as montarAbertura, campos, campo, conteudo, marcar, texto,
} from '../../scripts/demo.js';
import {
  aoRolar, contar, palavras, reduzido, revelar,
} from '../../scripts/motion.js';

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
  const d = montarAbertura(cels, 'iceberg-abertura');
  const h = d.querySelector('h2');
  if (h) palavras(h);
  d.querySelectorAll('p').forEach((p, i) => revelar(p, i * 80));
  return d;
}

function montar(block) {
  const [sobre, titulo, txt, pontaNumero, pontaTexto, legenda] = campos(block, 6);
  const itens = [...block.children].map((l) => {
    const [t, tx, n, u] = [...l.children];
    return {
      linha: l, titulo: t, texto: tx, numero: n, unidade: u,
    };
  });
  block.textContent = '';

  const palco = el('div', 'iceberg-palco');
  const fixo = el('div', 'iceberg-fixo');
  const agua = el('div', 'iceberg-agua');
  const ponta = el('div', 'iceberg-ponta');
  if (pontaNumero) ponta.append(campo(pontaNumero, 'span', 'iceberg-ponta-numero'));
  if (pontaTexto) ponta.append(campo(pontaTexto, 'span', 'iceberg-ponta-texto'));
  const pilha = el('ol', 'iceberg-camadas');
  itens.forEach((it, i) => {
    const li = marcar(it.linha, el('li', 'iceberg-camada'));
    li.style.setProperty('--i', i);
    const bruto = texto(it.numero || null);
    const n = marcar(it.numero, el('span', 'iceberg-camada-numero', '0'));
    n.dataset.ate = numeroDe(bruto);
    n.dataset.casas = casasDe(bruto);
    const cab = el('div', 'iceberg-camada-cabeca');
    cab.append(n);
    if (it.unidade) cab.append(campo(it.unidade, 'span', 'iceberg-camada-unidade'));
    if (it.titulo) cab.append(campo(it.titulo, 'h3'));
    li.append(cab);
    if (it.texto) li.append(conteudo(it.texto, el('div', 'iceberg-camada-texto')));
    pilha.append(li);
  });
  fixo.append(agua, ponta, pilha);
  if (legenda && legenda.textContent.trim()) fixo.append(campo(legenda, 'p', 'iceberg-legenda'));
  palco.append(fixo);
  palco.style.setProperty('--n', itens.length);

  let contados = new Set();
  aoRolar(palco, (p) => {
    const total = itens.length;
    const visiveis = Math.min(total, Math.floor(p * (total + 0.6)));
    palco.style.setProperty('--p', p);
    [...pilha.children].forEach((li, i) => {
      const on = i < visiveis;
      li.classList.toggle('visivel', on);
      if (on && !contados.has(i)) {
        contados.add(i);
        const n = li.querySelector('.iceberg-camada-numero');
        contar(n, +n.dataset.ate, { casas: +n.dataset.casas, duracao: 900 });
      }
    });
    if (reduzido) contados = new Set(itens.map((x, i) => i));
  });

  block.append(abertura([sobre, titulo, txt]), palco);
}

export default function decorate(block) {
  adiar(block, () => montar(block));
}
