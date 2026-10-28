/*
 * Medidor de cookies: o visitante digita um endereço e a página mostra a
 * leitura real do que aquele site gravou e chamou ANTES de qualquer escolha
 * de consentimento. Quem mede é uma ação do App Builder com um navegador
 * remoto saindo do Brasil; aqui só desenhamos o resultado.
 * Linhas: abertura (1 célula), endereço da ação (1 célula, https://…) e
 * rótulos `chave | texto`. Nenhum texto visível nasce do código.
 */
import {
  el, linhas, rotulos, texto,
} from '../../scripts/demo.js';

const CATS_CONSENTIMENTO = ['publicidade', 'medicao', 'personalizacao'];
const ETAPAS_MS = [0, 5000, 14000, 28000];
const ESPERA_TIPICA = 42000;

function preencher(modelo, valores) {
  return String(modelo).replace(/\{(\w+)\}/g, (_, k) => (valores[k] !== undefined ? valores[k] : ''));
}

function escapar(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function segundos(ms, lang) {
  const n = new Intl.NumberFormat(lang, { maximumFractionDigits: 1, minimumFractionDigits: 1 });
  return `${n.format(ms / 1000)} s`;
}

function ambienteSemLogin() {
  const h = window.location.hostname;
  return h.endsWith('.aem.page') || h.endsWith('.adobeaemcloud.com');
}

function kpi(valor, rotulo, classe = '') {
  return el('div', `medidor-kpi ${classe}`, `<strong>${valor}</strong><span>${rotulo}</span>`);
}

function categoria(r, c) {
  return `<span class="medidor-cat cat-${escapar(c)}">${r(`cat-${c}`, c)}</span>`;
}

function linhaDoTempo(r, dados, lang) {
  const caixa = el('div', 'painel medidor-tempo');
  caixa.append(el('h3', '', r('linha-titulo', '')));
  const fim = Math.max(dados.janelaMs || 0, ...dados.terceiros.map((t) => t.primeiroMs), 1);
  const eixo = el('div', 'medidor-eixo');
  eixo.setAttribute('aria-hidden', 'true');
  dados.terceiros.forEach((t) => {
    const p = el('i', `cat-${t.categoria}`);
    p.style.setProperty('--x', `${Math.min(100, (t.primeiroMs / fim) * 100)}%`);
    p.title = `${t.host} · ${segundos(t.primeiroMs, lang)}`;
    eixo.append(p);
  });
  eixo.append(el('span', 'medidor-eixo-ini', '0 s'), el('span', 'medidor-eixo-fim', segundos(fim, lang)));
  caixa.append(eixo);
  const lista = el('ol', 'medidor-hosts');
  dados.terceiros.forEach((t, i) => {
    const li = el('li', CATS_CONSENTIMENTO.includes(t.categoria) ? 'exige' : '');
    li.innerHTML = `<span class="medidor-ms">${segundos(t.primeiroMs, lang)}</span><span class="medidor-host">${escapar(t.host)}<small>${escapar(t.servico)}</small></span>${categoria(r, t.categoria)}`;
    if (i >= 12) li.hidden = true;
    lista.append(li);
  });
  caixa.append(lista);
  if (dados.terceiros.length > 12) {
    const mais = el('button', 'button secondary medidor-mais', preencher(r('mostrar-mais', '+{n}'), { n: dados.terceiros.length }));
    mais.type = 'button';
    mais.addEventListener('click', () => {
      lista.querySelectorAll('li[hidden]').forEach((li) => { li.hidden = false; });
      mais.remove();
    });
    caixa.append(mais);
  }
  caixa.append(el('p', 'medidor-nota', r('linha-nota', '')));
  return caixa;
}

function tabelaCookies(r, dados) {
  const caixa = el('div', 'painel medidor-cookies-lista');
  caixa.append(el('h3', '', r('cookies-titulo', '')));
  const tabela = el('table');
  tabela.innerHTML = `<thead><tr><th scope="col">${r('col-nome', '')}</th><th scope="col">${r('col-dominio', '')}</th><th scope="col">${r('col-categoria', '')}</th><th scope="col">${r('col-validade', '')}</th></tr></thead>`;
  const corpo = el('tbody');
  dados.cookies.forEach((c) => {
    const tr = el('tr', CATS_CONSENTIMENTO.includes(c.categoria) ? 'exige' : '');
    const validade = c.sessao ? r('sessao', '') : preencher(r('dias', '{n}'), { n: c.dias });
    const parte = c.terceiro ? r('parte-3', '3') : r('parte-1', '1');
    tr.innerHTML = `<th scope="row">${escapar(c.nome)}</th><td>${escapar(c.dominio)} <small>${parte}</small></td><td>${categoria(r, c.categoria)}</td><td>${validade}</td>`;
    corpo.append(tr);
  });
  tabela.append(corpo);
  const rolagem = el('div', 'medidor-rolagem');
  rolagem.tabIndex = 0;
  rolagem.setAttribute('role', 'region');
  rolagem.setAttribute('aria-label', r('cookies-titulo', ''));
  rolagem.append(tabela);
  caixa.append(rolagem);
  return caixa;
}

function desenhar(r, dados, saida, refazer) {
  const lang = document.documentElement.lang || 'pt-BR';
  const s = dados.resumo;
  saida.textContent = '';
  const n = s.rastreadoresAntesDaEscolha;
  const topo = el('div', `medidor-veredito ${n ? 'alerta' : 'ok'}`);
  const titulo = el('h3', '', preencher(r(n ? 'veredito-alerta' : 'veredito-ok', ''), { n }));
  titulo.tabIndex = -1;
  let host = dados.urlFinal;
  try { host = new URL(dados.urlFinal).hostname; } catch (e) { /* mantém */ }
  topo.append(el('p', 'medidor-alvo', escapar(host)), titulo);
  const quando = new Date(dados.medidoEm).toLocaleString(lang, { dateStyle: 'short', timeStyle: 'short' });
  const local = dados.local ? [dados.local.cidade, dados.local.regiao, dados.local.pais].filter(Boolean).join(', ') : '—';
  const origem = el('p', 'medidor-origem', preencher(r('origem', ''), {
    local: escapar(local), rede: escapar(dados.local ? dados.local.rede : ''), quando,
  }));
  if (dados.cache) {
    const b = el('button', 'medidor-refazer', r('refazer', ''));
    b.type = 'button';
    b.addEventListener('click', refazer);
    origem.append(' · ', el('span', '', r('cache', '')), ' ', b);
  }
  topo.append(origem);
  saida.append(topo);

  const kpis = el('div', 'medidor-kpis');
  const cmp = dados.banner.cmp || r('cmp-proprio', '');
  kpis.append(
    kpi(s.hostsTerceiros, r('k-terceiros', '')),
    kpi(s.cookies, r('k-cookies', '')),
    kpi(s.cookiesQueEsperariamConsentimento, r('k-esperariam', ''), s.cookiesQueEsperariamConsentimento ? 'alerta' : 'ok'),
    kpi(s.primeiroRastreador ? segundos(s.primeiroRastreador.ms, lang) : '—', s.primeiroRastreador ? `${r('k-primeiro', '')} · ${escapar(s.primeiroRastreador.servico)}` : r('k-primeiro', '')),
    kpi(dados.banner.visivel ? r('banner-sim', '') : r('banner-nao', ''), `${r('k-banner', '')}${dados.banner.visivel ? ` · ${escapar(cmp)}` : ''}`),
  );
  saida.append(kpis);

  const grade = el('div', 'medidor-grade');
  grade.append(linhaDoTempo(r, dados, lang));
  const lado = el('div', 'medidor-lado');
  if (dados.captura) {
    const fig = el('figure', 'painel medidor-captura');
    const img = el('img');
    img.src = dados.captura;
    img.alt = r('captura-alt', '');
    img.width = 1366;
    img.height = 820;
    img.loading = 'lazy';
    fig.append(el('h3', '', r('captura-titulo', '')), img);
    if (dados.banner.texto) fig.append(el('figcaption', '', `“${escapar(dados.banner.texto.slice(0, 180))}${dados.banner.texto.length > 180 ? '…' : ''}”`));
    lado.append(fig);
  }
  lado.append(tabelaCookies(r, dados));
  grade.append(lado);
  saida.append(grade, el('p', 'medidor-nota', r('nota', '')));
  titulo.focus({ preventScroll: true });
}

function montar(block) {
  const r = rotulos(block);
  const unicas = linhas(block).filter((c) => c.length === 1).map((c) => c[0]);
  const endpointCel = unicas.find((c) => /^https:\/\/\S+$/.test(texto(c)));
  const endpoint = endpointCel ? texto(endpointCel).replace(/\/+$/, '') : '';
  const abertura = unicas.find((c) => c !== endpointCel);
  block.textContent = '';
  if (abertura) {
    const ab = el('div', 'medidor-abertura');
    ab.append(...abertura.childNodes);
    block.append(ab);
  }

  const form = el('form', 'painel medidor-form');
  form.noValidate = true;
  const id = `medidor-url-${Math.random().toString(36).slice(2, 7)}`;
  form.innerHTML = `<label for="${id}">${r('campo-rotulo', '')}</label><div class="medidor-campo"><input id="${id}" name="url" type="url" inputmode="url" autocomplete="url" spellcheck="false" placeholder="${escapar(r('campo-exemplo', ''))}" required><button class="button primary" type="submit">${r('botao', '')}</button></div>`;
  const input = form.querySelector('input');
  const botao = form.querySelector('button');
  const exemplos = el('div', 'medidor-exemplos');
  (r('exemplos', '') || '').split('|').map((x) => x.split('=')).filter(([n, u]) => n && u).forEach(([n, u]) => {
    const b = el('button', 'medidor-exemplo', n.trim());
    b.type = 'button';
    b.dataset.url = u.trim();
    exemplos.append(b);
  });
  form.append(exemplos);
  const status = el('div', 'medidor-status');
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  form.append(status);
  block.append(form);
  const saida = el('div', 'medidor-saida');
  block.append(saida);

  if (ambienteSemLogin() || !endpoint) {
    input.disabled = true;
    botao.disabled = true;
    exemplos.querySelectorAll('button').forEach((b) => { b.disabled = true; });
    status.innerHTML = `<p class="medidor-aviso">${endpoint ? r('so-login', '') : r('erro-sem-chave', '')}</p>`;
    return;
  }

  const etapas = (r('etapas', '') || '').split('|');
  let relogio = null;
  const parar = () => { window.clearInterval(relogio); relogio = null; };
  const progresso = () => {
    const t0 = Date.now();
    status.innerHTML = '<div class="medidor-progresso"><i></i></div><p><span class="medidor-etapa"></span> <span class="medidor-segundos"></span></p>';
    const barra = status.querySelector('i');
    const etapa = status.querySelector('.medidor-etapa');
    const seg = status.querySelector('.medidor-segundos');
    const tick = () => {
      const ms = Date.now() - t0;
      const k = ETAPAS_MS.filter((x) => ms >= x).length - 1;
      if (etapas[k] && etapa.textContent !== etapas[k]) etapa.textContent = etapas[k];
      seg.textContent = preencher(r('segundos', '{n} s'), { n: Math.floor(ms / 1000) });
      barra.style.width = `${Math.min(96, (ms / ESPERA_TIPICA) * 100)}%`;
    };
    tick();
    relogio = window.setInterval(tick, 500);
  };

  const erro = (codigo, msg) => {
    const chave = ['origem', 'limite', 'url', 'navegador', 'sem-chave'].includes(codigo) ? `erro-${codigo}` : 'erro-rede';
    status.innerHTML = `<p class="medidor-aviso">${preencher(r(chave, ''), { m: escapar(msg || '') })}</p>`;
  };

  const medir = async (novo = false) => {
    const alvo = input.value.trim();
    if (!alvo) { input.focus(); return; }
    botao.disabled = true;
    block.dataset.estado = 'medindo';
    progresso();
    try {
      const q = new URLSearchParams({ url: alvo });
      if (novo) q.set('novo', '1');
      const resp = await fetch(`${endpoint}/medir?${q}`);
      const dados = await resp.json().catch(() => ({}));
      parar();
      if (!resp.ok) {
        erro(dados.codigo, dados.erro);
        block.dataset.estado = 'erro';
        return;
      }
      status.textContent = '';
      block.dataset.estado = 'pronto';
      desenhar(r, dados, saida, () => medir(true));
    } catch (e) {
      parar();
      erro('rede');
      block.dataset.estado = 'erro';
    } finally {
      botao.disabled = false;
    }
  };

  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    medir();
  });
  exemplos.addEventListener('click', (ev) => {
    const b = ev.target.closest('.medidor-exemplo');
    if (!b) return;
    input.value = b.dataset.url;
    medir();
  });
}

export default function decorate(block) {
  montar(block);
}
