/*
 * Valor: "rápido não quer dizer fácil". Três partes, todas autoradas:
 *  1. Iceberg por rolagem: a ponta é a semana no cliente; cada camada
 *     submersa é um investimento feito antes (número + unidade), revelada
 *     conforme a página rola, com a água descendo.
 *  2. Comparação difícil × rápido: alternância entre os dois caminhos, com
 *     os números de cada linha animando de um para o outro.
 *  3. Entregas da semana: contadores.
 *
 * Linhas: 3 richtexts (aberturas), itens de 5 células
 * (tipo | título | texto | a | b) e rótulos `chave | texto`.
 */
import {
  el, linhas, rotulos, texto, adiar,
} from '../../scripts/demo.js';
import {
  aoRolar, contar, palavras, reduzido, revelar,
} from '../../scripts/motion.js';

function numero(s) {
  const n = parseFloat(String(s).replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function casas(s) {
  const m = String(s).match(/[,.](\d+)\s*$/);
  return m ? m[1].length : 0;
}

function abertura(celula, classe) {
  const d = el('div', `valor-abertura ${classe}`);
  if (celula) d.append(...celula.childNodes);
  const h = d.querySelector('h2, h3');
  if (h) palavras(h);
  d.querySelectorAll('p').forEach((p, i) => revelar(p, i * 80));
  return d;
}

/* 1. iceberg */
function iceberg(itens, r) {
  const sec = el('div', 'valor-iceberg');
  const fixo = el('div', 'valor-iceberg-fixo');
  const agua = el('div', 'valor-agua');
  const ponta = el('div', 'valor-ponta');
  ponta.append(el('span', 'valor-ponta-numero', r('ponta-numero', '1')), el('span', 'valor-ponta-texto', r('ponta-texto', '')));
  const pilha = el('ol', 'valor-camadas');
  itens.forEach((it, i) => {
    const li = el('li', 'valor-camada');
    li.style.setProperty('--i', i);
    const n = el('span', 'valor-camada-numero', '0');
    n.dataset.ate = numero(it.a);
    n.dataset.casas = casas(it.a);
    const cab = el('div', 'valor-camada-cabeca');
    cab.append(n, el('span', 'valor-camada-unidade', it.b), el('h3', '', it.titulo));
    const tx = el('div', 'valor-camada-texto');
    tx.append(...it.texto.childNodes);
    li.append(cab, tx);
    pilha.append(li);
  });
  const legenda = el('p', 'valor-legenda', r('iceberg-legenda', ''));
  fixo.append(agua, ponta, pilha, legenda);
  sec.append(fixo);
  sec.style.setProperty('--n', itens.length);

  let contados = new Set();
  aoRolar(sec, (p) => {
    const total = itens.length;
    const visiveis = Math.min(total, Math.floor(p * (total + 0.6)));
    sec.style.setProperty('--p', p);
    [...pilha.children].forEach((li, i) => {
      const on = i < visiveis;
      li.classList.toggle('visivel', on);
      if (on && !contados.has(i)) {
        contados.add(i);
        const n = li.querySelector('.valor-camada-numero');
        contar(n, +n.dataset.ate, { casas: +n.dataset.casas, duracao: 900 });
      }
    });
    if (reduzido) contados = new Set(itens.map((x, i) => i));
  });
  return sec;
}

/* 2. comparação */
function comparacao(itens, r) {
  const sec = el('div', 'valor-comparacao');
  const seg = el('div', 'segmentos valor-alternar');
  const bA = el('button', 'ativo', r('caminho-a', 'A'));
  const bB = el('button', '', r('caminho-b', 'B'));
  bA.type = 'button';
  bB.type = 'button';
  seg.append(bA, bB);
  const lista = el('ul', 'valor-linhas');
  itens.forEach((it) => {
    const li = el('li', 'valor-linha');
    const cab = el('div', 'valor-linha-cabeca');
    cab.append(el('h3', '', it.titulo));
    const vals = el('div', 'valor-linha-valores');
    const va = el('span', 'valor-a', it.a);
    const vb = el('span', 'valor-b', it.b);
    vals.append(va, vb);
    const tr = el('div', 'valor-trilho');
    const barra = el('i');
    tr.append(barra);
    const nA = numero(it.a);
    const nB = numero(it.b);
    const max = Math.max(nA, nB, 1);
    li.dataset.a = (nA / max) * 100;
    li.dataset.b = (nB / max) * 100;
    const tx = el('div', 'valor-linha-texto');
    tx.append(...it.texto.childNodes);
    li.append(cab, vals, tr, tx);
    lista.append(li);
    revelar(li);
  });
  const aplicar = (lado) => {
    sec.dataset.lado = lado;
    bA.classList.toggle('ativo', lado === 'a');
    bB.classList.toggle('ativo', lado === 'b');
    lista.querySelectorAll('.valor-linha').forEach((li) => {
      li.querySelector('.valor-trilho i').style.width = `${li.dataset[lado]}%`;
    });
  };
  bA.addEventListener('click', () => aplicar('a'));
  bB.addEventListener('click', () => aplicar('b'));
  sec.append(seg, lista);
  aplicar('a');
  // ao aparecer, mostra o caminho difícil e, 1,6 s depois, troca para o rápido
  if (!reduzido) {
    const obs = new IntersectionObserver((es) => {
      if (!es[0].isIntersecting) return;
      obs.disconnect();
      setTimeout(() => aplicar('b'), 1600);
    }, { threshold: 0.5 });
    obs.observe(lista);
  }
  return sec;
}

/* 3. entregas */
function entregas(itens) {
  const grade = el('ul', 'valor-entregas');
  itens.forEach((it, i) => {
    const li = el('li', 'valor-entrega');
    const n = el('span', 'valor-entrega-numero', '0');
    const prefixo = String(it.a).match(/^[^\d]*/)[0];
    const ate = numero(it.a);
    const sufixo = String(it.a).replace(/^[^\d]*[\d.,]+/, '');
    contar(n, ate, { casas: casas(it.a), sufixo });
    if (prefixo) n.prepend(prefixo);
    const un = el('span', 'valor-entrega-unidade', it.b);
    const cab = el('div', 'valor-entrega-cabeca');
    cab.append(n, un);
    const tx = el('div', 'valor-entrega-texto');
    tx.append(el('h3', '', it.titulo), ...it.texto.childNodes);
    li.append(cab, tx);
    revelar(li, i * 80);
    grade.append(li);
  });
  return grade;
}

function montar(block) {
  const r = rotulos(block);
  const todas = linhas(block);
  const aberturas = todas.filter((c) => c.length === 1).map((c) => c[0]);
  const itens = todas.filter((c) => c.length === 5).map((c) => ({
    tipo: texto(c[0]).toLowerCase(),
    titulo: texto(c[1]),
    texto: c[2],
    a: texto(c[3]),
    b: texto(c[4]),
  }));
  block.textContent = '';
  const por = (t) => itens.filter((i) => i.tipo === t);

  const p1 = el('section', 'valor-parte valor-parte-iceberg');
  p1.append(abertura(aberturas[0], 'valor-abertura-iceberg'), iceberg(por('camada'), r));
  const p2 = el('section', 'valor-parte valor-parte-comparacao');
  p2.append(abertura(aberturas[1], 'valor-abertura-comparacao'), comparacao(por('comparacao'), r));
  const p3 = el('section', 'valor-parte valor-parte-entregas');
  p3.append(abertura(aberturas[2], 'valor-abertura-entregas'), entregas(por('entrega')));
  block.append(p1, p2, p3);
}

export default function decorate(block) {
  adiar(block, () => montar(block));
}
