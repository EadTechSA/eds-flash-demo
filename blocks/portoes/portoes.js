/*
 * Portões de qualidade: cada verificação que uma mudança atravessa antes de
 * chegar ao site, explicada pelo conteúdo. O visitante filtra por momento
 * (a cada push, na entrega, no navegador) e vê o comando que roda.
 * Linhas: abertura (sobretítulo, título, texto), itens
 * (nome | quando | texto | comando) e rótulos `chave | texto`.
 */
import {
  el, rotulos, texto, abertura, campos, campo, conteudo, marcar,
} from '../../scripts/demo.js';
import { revelar } from '../../scripts/motion.js';

export default function decorate(block) {
  const ab = campos(block, 3);
  const r = rotulos(block);
  const itens = [...block.children].filter((l) => l.children.length >= 3).map((l) => {
    const c = [...l.children];
    return {
      linha: l,
      nome: c[0],
      quando: texto(c[1]).toLowerCase(),
      quandoCel: c[1],
      texto: c[2],
      comando: c[3],
    };
  });
  block.textContent = '';
  block.append(abertura(ab, 'portoes-abertura'));

  // filtros: um por momento, na ordem em que aparecem
  const nomesMomento = {};
  (r('momentos', '') || '').split('|').forEach((par) => {
    const [k, v] = par.split('=').map((x) => (x || '').trim());
    if (k && v) nomesMomento[k.toLowerCase()] = v;
  });
  const momentos = [...new Set(itens.map((i) => i.quando).filter(Boolean))];
  const filtros = el('div', 'segmentos portoes-filtros');
  filtros.setAttribute('role', 'group');
  filtros.setAttribute('aria-label', r('filtros-rotulo', ''));
  const botoes = [['', r('todos', '')], ...momentos.map((m) => [m, nomesMomento[m] || m])].map(([m, nome]) => {
    const b = el('button', m ? '' : 'ativo', nome);
    b.type = 'button';
    b.dataset.momento = m;
    b.setAttribute('aria-pressed', m ? 'false' : 'true');
    filtros.append(b);
    return b;
  });
  const contador = el('p', 'portoes-contador');
  contador.setAttribute('aria-live', 'polite');

  const grade = el('ol', 'portoes-grade');
  itens.forEach((it, i) => {
    const li = marcar(it.linha, el('li', 'portoes-item'));
    li.dataset.momento = it.quando;
    const topo = el('div', 'portoes-topo');
    const etiqueta = campo(it.quandoCel, 'span', 'portoes-quando');
    etiqueta.textContent = nomesMomento[it.quando] || it.quando;
    topo.append(el('span', 'portoes-numero', String(i + 1).padStart(2, '0')), etiqueta);
    li.append(topo, campo(it.nome, 'h3'));
    conteudo(it.texto, li);
    if (it.comando && texto(it.comando)) {
      const pre = el('p', 'portoes-comando');
      pre.append(el('span', 'portoes-prompt', '$'), campo(it.comando, 'code'), el('span', 'portoes-ok', r('ok', '✓')));
      li.append(pre);
    }
    grade.append(li);
    revelar(li, (i % 3) * 70);
  });

  const filtrar = (m) => {
    let n = 0;
    grade.querySelectorAll('.portoes-item').forEach((li) => {
      const mostra = !m || li.dataset.momento === m;
      li.hidden = !mostra;
      if (mostra) n += 1;
    });
    botoes.forEach((b) => {
      const ativo = b.dataset.momento === m;
      b.classList.toggle('ativo', ativo);
      b.setAttribute('aria-pressed', String(ativo));
    });
    contador.textContent = (r('contador', '{n}') || '{n}').replace('{n}', n);
  };
  filtros.addEventListener('click', (ev) => {
    const b = ev.target.closest('button');
    if (b) filtrar(b.dataset.momento);
  });
  block.append(filtros, contador, grade);
  if (r('nota', '')) block.append(el('p', 'portoes-nota', r('nota', '')));
  filtrar('');
}
