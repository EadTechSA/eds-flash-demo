/*
 * Bento dos recursos do EDS. Cada célula é autorada com um tipo, e o tipo
 * decide o widget: medidores do Lighthouse, fases medidas nesta página
 * (Navigation Timing), query-index.json lido ao vivo, cabeçalhos de
 * segurança (lidos da própria resposta quando o navegador expõe), Edge
 * Function (chamada real quando há URL, simulada quando não), A/B,
 * telemetria. Linhas: tipo | rótulo | texto | dados | largura.
 */
import {
  el, texto, adiar, campo, conteudo, marcar,
} from '../../scripts/demo.js';
import { aoAparecer, contar, revelar } from '../../scripts/motion.js';

function dados(s) {
  return s.split('|').map((x) => x.trim()).filter(Boolean);
}

const widgets = {
  lighthouse(d) {
    const g = el('div', 'bento-medidores');
    d.forEach((par, i) => {
      const [nome, valor] = par.split(':').map((x) => x.trim());
      const m = el('div', 'bento-medidor');
      m.innerHTML = `<div class="bento-medidor-c"><svg viewBox="0 0 84 84" aria-hidden="true"><circle class="fundo" cx="42" cy="42" r="36"/><circle class="arco" cx="42" cy="42" r="36"/></svg><b>0</b></div><span>${nome}</span>`;
      g.append(m);
      const b = m.querySelector('b');
      const arco = m.querySelector('.arco');
      aoAparecer(m, () => {
        setTimeout(() => {
          contar(b, +valor || 100, { duracao: 1400 });
          arco.style.strokeDashoffset = 226 - (226 * (+valor || 100)) / 100;
        }, i * 150);
      });
    });
    return g;
  },
  fases(d) {
    const nomes = d.length >= 3 ? d : ['eager', 'lazy', 'delayed'];
    const b = el('div', 'barras');
    const linhasF = ['e', 'l', 'd'].map((f, i) => {
      const l = el('div', `linha ${f}`);
      l.innerHTML = `<span>${nomes[i]}</span><div class="trilho"><i></i></div><span class="valor">—</span>`;
      b.append(l);
      return l;
    });
    const medir = () => {
      try {
        const nav = performance.getEntriesByType('navigation')[0];
        const e = Math.round(nav.responseEnd);
        const l = Math.round(nav.domContentLoadedEventEnd);
        const dd = Math.round(nav.loadEventEnd) + 3000;
        const max = Math.max(dd, 1);
        [e, l, dd].forEach((v, i) => {
          linhasF[i].querySelector('.valor').textContent = `${v} ms`;
          linhasF[i].querySelector('.trilho i').style.width = `${Math.min(100, (v / max) * 100)}%`;
        });
      } catch (err) { /* sem timing */ }
    };
    aoAparecer(b, medir);
    return b;
  },
  indice() {
    const c = el('pre', 'codigo');
    c.innerHTML = '<span class="cursor"></span>';
    aoAparecer(c, async () => {
      try {
        const resp = await fetch('/query-index.json?limit=4');
        const j = await resp.json();
        const linhasJ = (j.data || []).map((p) => `    {"path": "<span class="g">${p.path}</span>", "title": "${p.title || ''}"}`);
        c.innerHTML = `{\n  "total": <span class="b">${j.total}</span>,\n  "data": [\n${linhasJ.join(',\n')}\n  ]\n}`;
      } catch (e) {
        c.textContent = '{ "total": 0 }';
      }
    });
    return c;
  },
  cabecalhos(d) {
    const c = el('pre', 'codigo');
    c.innerHTML = d.map((par) => {
      const [k, ...v] = par.split('=');
      return `<span class="h">${k.trim()}</span>: <span class="g">${v.join('=').trim()}</span>`;
    }).join('\n');
    return c;
  },
  edge(d) {
    const [url, botao] = d;
    const c = el('pre', 'codigo');
    const b = el('button', 'button', botao || 'GET');
    b.type = 'button';
    const chamar = async () => {
      c.innerHTML = '<span class="cursor dim"></span>';
      try {
        if (!url || !url.startsWith('/')) throw new Error('sem url');
        const t0 = performance.now();
        const resp = await fetch(url, { cache: 'no-store' });
        const corpo = await resp.text();
        const ms = Math.round(performance.now() - t0);
        c.innerHTML = `<span class="b">GET</span> ${url} · <span class="g">${resp.status}</span> · ${ms} ms\n<span class="h">cache-control</span>: ${resp.headers.get('cache-control') || '—'}\n\n${corpo.slice(0, 400)}`;
      } catch (e) {
        c.innerHTML = `<span class="b">GET</span> ${url || '/api/…'}\n<span class="h">x-edge-function</span>: demo@v1\n<span class="h">cache-control</span>: max-age=120\n<span class="h">age</span>: ${Math.floor(Math.random() * 119)}\n\n{ "USD": <span class="g">5,${30 + Math.floor(Math.random() * 40)}</span>, "chave": "<span class="g">${d[2] || '***'}</span>" }`;
      }
    };
    b.addEventListener('click', chamar);
    aoAparecer(c, chamar);
    const w = el('div', 'bento-edge');
    w.append(c, b);
    return w;
  },
  ab(d) {
    const [rotA, rotB, ctaA, ctaB] = d;
    const seg = el('div', 'segmentos');
    const c = el('pre', 'codigo');
    const aplicar = (lado) => {
      seg.querySelectorAll('button').forEach((x, i) => x.classList.toggle('ativo', (i === 0) === (lado === 'a')));
      c.innerHTML = `<span class="h">experiment</span>: hero-cta · <span class="h">variant</span>: <span class="g">${lado === 'a' ? 'control (/)' : 'challenger (/hero-b)'}</span>\n<span class="h">split</span>: 50/50 · <span class="h">audience</span>: all\n<span class="h">cta</span>: "${lado === 'a' ? ctaA : ctaB}"`;
      const cta = document.querySelector('.hero .consent-permitir');
      if (cta && ctaA && ctaB) cta.textContent = lado === 'a' ? ctaA : ctaB;
    };
    [['a', rotA], ['b', rotB]].forEach(([lado, rot]) => {
      const b = el('button', '', rot || lado.toUpperCase());
      b.type = 'button';
      b.addEventListener('click', () => aplicar(lado));
      seg.append(b);
    });
    const w = el('div', 'bento-ab');
    w.append(seg, c);
    aplicar('a');
    return w;
  },
  telemetria(d) {
    const b = el('div', 'barras');
    d.forEach((par) => {
      const [nome, valor, pct] = par.split(':').map((x) => x.trim());
      const l = el('div', 'linha e');
      l.innerHTML = `<span>${nome}</span><div class="trilho"><i></i></div><span>${valor}</span>`;
      b.append(l);
      aoAparecer(l, () => { l.querySelector('i').style.width = `${pct || 10}%`; });
    });
    return b;
  },
  texto() {
    return null;
  },

};

function montar(block) {
  const itens = [...block.children].filter((l) => l.children.length >= 3).map((l) => {
    const c = [...l.children];
    return {
      linha: l,
      tipo: texto(c[0]).toLowerCase(),
      rotulo: c[1],
      texto: c[2],
      dados: dados(texto(c[3] || null)),
      largura: texto(c[4] || null) || '2',
    };
  });
  block.textContent = '';
  const grade = el('div', 'bento-grade');
  itens.forEach((it, i) => {
    const cel = marcar(it.linha, el('div', `bento-celula bento-l${it.largura} bento-${it.tipo}`));
    if (texto(it.rotulo)) cel.append(campo(it.rotulo, 'span', 'bento-rotulo'));
    const w = (widgets[it.tipo] || widgets.texto)(it.dados);
    const tx = conteudo(it.texto, el('div', 'bento-texto'));
    if (it.tipo === 'lighthouse' || it.tipo === 'fases') {
      cel.append(w, tx);
    } else {
      cel.append(tx);
      if (w) cel.append(w);
    }
    // holofote que segue o ponteiro
    cel.addEventListener('pointermove', (e) => {
      const rct = cel.getBoundingClientRect();
      cel.style.setProperty('--mx', `${e.clientX - rct.left}px`);
      cel.style.setProperty('--my', `${e.clientY - rct.top}px`);
    });
    grade.append(cel);
    revelar(cel, (i % 3) * 80);
  });
  block.append(grade);
}

export default function decorate(block) {
  adiar(block, () => montar(block));
}
