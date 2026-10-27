/*
 * Agentic readiness: as verificações autoradas com placar que conta, e a
 * visão "curl" da própria página (busca o .plain.html real e mostra o
 * início do HTML), com alternância para o texto renderizado.
 * Linhas: abertura (1 célula), verificações (texto | estado), rótulos.
 */
import {
  el, linhas, rotulos, texto,
} from '../../scripts/demo.js';
import { aoAparecer, contar, revelar } from '../../scripts/motion.js';

function escapar(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export default function decorate(block) {
  const r = rotulos(block);
  const todas = linhas(block);
  const abertura = todas.find((c) => c.length === 1);
  const checks = todas.filter((c) => c.length === 2 && /^(ok|pendente)$/i.test(texto(c[1]))).map((c) => ({ texto: texto(c[0]), ok: /^ok$/i.test(texto(c[1])) }));
  block.textContent = '';
  if (abertura) {
    const ab = el('div', 'agentic-abertura');
    ab.append(...abertura[0].childNodes);
    block.append(ab);
  }
  const grade = el('div', 'agentic-grade');

  const p1 = el('div', 'painel');
  const h1 = el('h3');
  const placar = el('span', 'agentic-placar');
  const n = el('span', '', '0');
  placar.append(n, el('small', '', `/${checks.length}`));
  h1.append(el('span', '', r('verificacoes', 'checks')), placar);
  const ul = el('ul', 'agentic-lista');
  checks.forEach((c) => {
    const li = el('li', c.ok ? '' : 'pendente');
    li.append(el('span', 'agentic-marca', c.ok ? '✓' : '·'), el('span', '', c.texto));
    ul.append(li);
  });
  p1.append(h1, ul);
  contar(n, checks.filter((c) => c.ok).length, { duracao: 1200 });

  const p2 = el('div', 'painel');
  const h2 = el('h3');
  const seg = el('div', 'segmentos');
  const bRaw = el('button', 'ativo', 'HTML');
  const bRen = el('button', '', r('renderizado', 'render'));
  bRaw.type = 'button';
  bRen.type = 'button';
  seg.append(bRaw, bRen);
  h2.append(el('span', '', r('curl-titulo', 'curl')), seg);
  const c = el('pre', 'codigo agentic-curl');
  c.innerHTML = '<span class="cursor"></span>';
  let html = '';
  let plain = '';
  const mostrar = (raw) => {
    bRaw.classList.toggle('ativo', raw);
    bRen.classList.toggle('ativo', !raw);
    if (raw) {
      c.innerHTML = `<span class="dim">$ curl -s ${window.location.origin}${window.location.pathname}.plain.html | head -c 900</span>\n${escapar(html.slice(0, 900))}…`;
    } else {
      c.innerHTML = `<span class="dim">${r('renderizado-nota', '')}</span>\n\n${escapar(plain.slice(0, 700))}…`;
    }
  };
  bRaw.addEventListener('click', () => mostrar(true));
  bRen.addEventListener('click', () => mostrar(false));
  aoAparecer(c, async () => {
    try {
      const p = window.location.pathname.replace(/\/$/, '/index');
      const resp = await fetch(`${p}.plain.html`);
      html = await resp.text();
      const d = new DOMParser().parseFromString(html, 'text/html');
      plain = d.body.textContent.replace(/\s+/g, ' ').trim();
    } catch (e) {
      html = '<main>…</main>';
      plain = '…';
    }
    // efeito de digitação
    const alvo = `$ curl -s …${window.location.pathname}.plain.html\n${html.slice(0, 900)}`;
    let i = 0;
    const passo = () => {
      i += 4;
      if (i >= alvo.length) {
        mostrar(true);
        return;
      }
      c.innerHTML = `${escapar(alvo.slice(0, i))}<span class="cursor"></span>`;
      setTimeout(passo, 10);
    };
    passo();
  });
  p2.append(h2, c);
  grade.append(p1, p2);
  block.append(grade);
  revelar(p1);
  revelar(p2, 100);
}
