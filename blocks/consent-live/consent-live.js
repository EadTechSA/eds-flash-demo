/*
 * Consentimento ao vivo: cascata de rede da própria página (Resource
 * Timing, agrupada nas três fases do EDS), estado gravado, log de eventos
 * e contador de bloqueios. Tudo que é texto vem dos rótulos autorados.
 * Linhas: abertura (sobretítulo, título, texto) + rótulos `chave | texto`.
 */
import {
  agora, categoriasAceitas, el, escolhaGravada, rotulos, adiar, abertura, campos,
} from '../../scripts/demo.js';
import { revelar } from '../../scripts/motion.js';

const KB = (b) => (b >= 1000 * 1000 ? `${(b / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1000))} KB`);

function fase(entrada) {
  const nome = entrada.name;
  if (/\/styles\/styles\.css|\/scripts\/(aem|scripts)\.js|\/fonts\/|media_|\.(avif|webp|jpe?g|png)/.test(nome) && entrada.startTime < 1500) return 'e';
  if (/consent|delayed|alloy|launch|adobedtm|assets\.adobedtm/.test(nome)) return 'd';
  return 'l';
}

function cascata(container, r) {
  const todas = performance.getEntriesByType('resource');
  const nav = performance.getEntriesByType('navigation')[0];
  const base = window.location.origin;
  const itens = todas
    .filter((e) => !/data:/.test(e.name))
    .slice(0, 28)
    .map((e) => ({
      nome: e.name.replace(base, '').replace(/\?.*$/, '').replace(/^.*\/(?=[^/]+\/[^/]+$)/, '…/'),
      inicio: e.startTime,
      fim: e.responseEnd || e.startTime,
      bytes: e.transferSize || e.encodedBodySize || 0,
      fase: fase(e),
      terceiro: !e.name.startsWith(base),
    }));
  if (nav) {
    itens.unshift({
      nome: '/ (html)', inicio: 0, fim: nav.responseEnd, bytes: nav.transferSize || 0, fase: 'e',
    });
  }
  const aceitas = categoriasAceitas();
  const presos = [
    { nome: r('cascata-video', 'video.mp4'), cat: 'CC_MEDIA' },
    { nome: r('cascata-analytics', 'alloy.js'), cat: 'CC_ANALYTICS' },
  ].filter((p) => !aceitas.includes(p.cat));
  const fim = Math.max(...itens.map((i) => i.fim), 1) + (presos.length ? 400 : 0);
  container.textContent = '';
  const titulos = { e: r('fase-eager', 'eager'), l: r('fase-lazy', 'lazy'), d: r('fase-delayed', 'delayed') };
  ['e', 'l', 'd'].forEach((f) => {
    container.append(el('div', 'consent-live-fase', titulos[f]));
    itens.filter((i) => i.fase === f).sort((a, b) => a.inicio - b.inicio).forEach((i) => {
      const linha = el('div', `consent-live-linha ${f}${i.terceiro ? ' terceiro' : ''}`);
      const barra = el('span', 'consent-live-barra');
      const b = el('i');
      b.style.setProperty('--ini', `${(i.inicio / fim) * 100}%`);
      b.dataset.largura = `${Math.max(1.5, ((i.fim - i.inicio) / fim) * 100)}%`;
      barra.append(b);
      linha.append(el('span', 'consent-live-nome', i.nome), barra, el('span', 'consent-live-tam', i.bytes ? KB(i.bytes) : '—'));
      container.append(linha);
    });
    if (f === 'd') {
      presos.forEach((p) => {
        const linha = el('div', 'consent-live-linha preso');
        const barra = el('span', 'consent-live-barra');
        const b = el('i');
        b.style.setProperty('--ini', '72%');
        b.dataset.largura = '26%';
        barra.append(b);
        linha.append(el('span', 'consent-live-nome', p.nome), barra, el('span', 'consent-live-tam', r('bloqueado', 'bloqueado')));
        container.append(linha);
      });
    }
  });
  requestAnimationFrame(() => {
    container.querySelectorAll('.consent-live-barra i').forEach((b, k) => {
      b.style.transitionDelay = `${k * 40}ms`;
      b.style.width = b.dataset.largura;
    });
  });
  return presos.length;
}

function montar(block) {
  const ab = campos(block, 3);
  const r = rotulos(block);
  block.textContent = '';
  block.append(abertura(ab, 'consent-live-abertura'));
  const grade = el('div', 'consent-live-grade');

  // cascata
  const p1 = el('div', 'painel consent-live-cascata');
  const h1 = el('h3');
  const seloCascata = el('span', 'selo', '—');
  h1.append(el('span', '', r('cascata-titulo', 'network')), seloCascata);
  const lista = el('div', 'consent-live-lista');
  p1.append(h1, lista, el('p', '', r('cascata-nota', '')));

  // estado
  const p2 = el('div', 'painel consent-live-estado');
  const h2 = el('h3');
  h2.append(el('span', '', r('estado-titulo', 'consent')), el('span', 'selo', `v${r('versao', '')}`));
  const dl = el('dl', 'consent-live-kv');
  const acoes = el('div', 'consent-live-acoes');
  const bPrefs = el('a', 'button', r('botao-definicoes', 'cookies'));
  bPrefs.href = '#definicoes-de-cookies';
  const bReset = el('button', 'button', r('botao-esquecer', 'reset'));
  bReset.type = 'button';
  acoes.append(bPrefs, bReset);
  p2.append(h2, dl, acoes, el('p', '', r('estado-nota', '')));

  // log
  const p3 = el('div', 'painel consent-live-log');
  const h3 = el('h3');
  const contador = el('span', 'grande', '0');
  contador.append(el('small', '', r('bloqueados', '')));
  h3.append(el('span', '', r('log-titulo', 'log')), contador);
  const log = el('div', 'codigo consent-live-eventos');
  p3.append(h3, log);

  const coluna = el('div', 'consent-live-coluna');
  coluna.append(p2, p3);
  grade.append(p1, coluna);
  block.append(grade);
  [p1, p2, p3].forEach((p, i) => revelar(p, i * 80));

  let bloqueados = 0;
  const registrar = (txt, tipo) => {
    const d = el('div', tipo || '', `<span class="t">${agora()}</span> ${txt}`);
    log.prepend(d);
    while (log.children.length > 40) log.lastChild.remove();
  };
  const estado = () => {
    const salvo = escolhaGravada();
    const cats = categoriasAceitas();
    const tem = (c) => cats.includes(c);
    const v = (c) => {
      if (!salvo) return `<dd>${r('sem-escolha', '—')}</dd>`;
      return `<dd class="${tem(c) ? 'ok' : 'alerta'}">${tem(c) ? r('permitido', 'ok') : r('bloqueado', 'x')}</dd>`;
    };
    dl.innerHTML = `<dt>${r('cat-necessarios', 'CC_ESSENTIAL')}</dt><dd class="ok">${r('permitido', 'ok')}</dd>`
      + `<dt>${r('cat-analise', 'CC_ANALYTICS')}</dt>${v('CC_ANALYTICS')}`
      + `<dt>${r('cat-midia', 'CC_MEDIA')}</dt>${v('CC_MEDIA')}`
      + `<dt>localStorage</dt><dd>${salvo ? new Date(salvo.data).toLocaleString() : '—'}</dd>`;
    const presos = cascata(lista, r);
    seloCascata.textContent = presos ? `${presos} ${r('bloqueados', '')}` : r('tudo-liberado', 'ok');
    seloCascata.classList.toggle('alerta', !!presos);
  };

  window.addEventListener('consent', (e) => {
    registrar(`<b>consent</b> → [${(e.detail.categories || []).join(', ')}]`, 'ok');
    estado();
  });
  window.addEventListener('consent-updated', (e) => {
    registrar(`<b>consent-updated</b> → {categories: [${(e.detail.categories || []).join(', ')}]}`, 'ok');
    estado();
  });
  window.addEventListener('demo:log', (e) => registrar(e.detail.texto, e.detail.tipo === 'ok' ? 'ok' : 'alerta'));
  window.addEventListener('demo:consented', () => registrar(r('log-consented', 'consented.js'), 'ok'));
  bReset.addEventListener('click', async () => {
    try { localStorage.removeItem('aem-consent'); } catch (e) { /* sem storage */ }
    window.consent = undefined;
    bloqueados = 0;
    contador.firstChild.textContent = '0';
    registrar(r('log-esquecido', 'reset'));
    // volta ao estado inicial: só obrigatórias valem, e o banner reaparece
    window.dispatchEvent(new CustomEvent('consent-updated', { detail: { categories: ['CC_ESSENTIAL'] } }));
    window.consent = undefined;
    const m = await import('../../scripts/consent.js');
    m.init();
    estado();
  });

  // estado inicial
  const salvo = escolhaGravada();
  if (salvo) {
    registrar(`${r('log-lido', 'localStorage')} → [${salvo.categorias.join(', ')}]`, 'ok');
  } else {
    registrar(r('log-sem-escolha', ''));
    ['CC_MEDIA', 'CC_ANALYTICS'].forEach((c) => {
      bloqueados += 1;
      registrar(`<b>${r('bloqueado', 'bloqueado')}</b>: ${c}`, 'alerta');
    });
    contador.firstChild.textContent = String(bloqueados);
  }
  estado();
  // a cascata ganha as entradas da fase delayed quando elas chegam
  window.setTimeout(estado, 4200);
}

export default function decorate(block) {
  adiar(block, () => montar(block));
}
