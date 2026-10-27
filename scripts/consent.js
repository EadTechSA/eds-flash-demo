/*
 * Consentimento de cookies (LGPD) — pacote EadTech para sites em EDS.
 * Módulo de scripts/ (e não bloco), porque o gate de embeds também o importa e,
 * pela convenção da Adobe, só fragment.js pode ser importado entre blocos.
 *
 * Base: bloco `consent` da Adobe (aem-block-collection, PR #50) e o gancho
 * `scripts/consent-check.js` do aem-boilerplate. Desvios conscientes da referência:
 *  - nenhum texto visível nasce no código: rótulos de botão, títulos e avisos
 *    vêm do documento de consentimento autorado no Universal Editor;
 *  - a escolha guarda versão da política e data, e expira em 12 meses;
 *  - recusar tem o mesmo peso visual de aceitar (LGPD);
 *  - os eventos levam `detail` (a referência passava o array fora do `detail`).
 *
 * O documento de consentimento fica em /cookie-consent/padrao (como /nav e
 * /footer); o metadado `cookie-consent` aponta outro documento, se preciso.
 * Seções do documento, identificadas pelo metadado de seção `papel`:
 *  - banner:       texto do aviso + links #aceitar, #recusar, #preferencias
 *  - preferencias: título e texto do painel + links #aceitar, #recusar, #salvar
 *  - categoria:    uma por categoria; metadados `codigo` e `opcional` (sim/não)
 *  - gate:         aviso que substitui embed bloqueado + links #permitir e #abrir
 *  - origens:      bloco `consent-origens` (origem | código da categoria)
 * O metadado de seção `versao-politica` (na seção banner) versiona a escolha.
 */
import {
  getMetadata, loadCSS, sampleRUM, toCamelCase,
} from './aem.js';

const CHAVE = 'aem-consent';
const VALIDADE_MS = 365 * 24 * 60 * 60 * 1000;

let documentoPromessa;

/** Lê o documento de consentimento uma vez por página. */
export function carregarDocumento() {
  if (!documentoPromessa) {
    // mesma convenção do /nav e do /footer no boilerplate: o metadado
    // escolhe outro documento; sem ele vale o caminho padrão do site
    const caminho = getMetadata('cookie-consent') || '/cookie-consent/padrao';
    // sem documento (ou falha de rede) o site segue sem banner e sem gate.
    // Lido como .plain.html direto, sem fragment.js: evita o ciclo de import
    // com scripts.js e não carrega nada além do texto.
    documentoPromessa = fetch(`${caminho}.plain.html`)
      .then((r) => (r.ok ? r.text() : null))
      .then((html) => {
        if (!html) return null;
        // só os dados do documento: seções, metadados e a tabela de origens.
        // Não decora nem carrega blocos — nada disso aparece na página.
        // DOMParser: nada do documento executa; os nós só são copiados depois
        return new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html').body.firstElementChild;
      })
      .catch(() => null);
  }
  return documentoPromessa;
}

/**
 * Lê os metadados de seção. Versões do aem.js que tratam `section-metadata`
 * no navegador os põem em data-*; nas mais novas a tabela pode vir intacta,
 * então lemos dela também e a tiramos do conteúdo.
 */
function metadados(secao) {
  const tabela = secao.querySelector(':scope .section-metadata');
  if (tabela) {
    [...tabela.children].forEach((linha) => {
      const [k, v] = [...linha.children].map((c) => c.textContent.trim());
      if (k) secao.dataset[toCamelCase(k)] = v || '';
    });
    const wrapper = tabela.parentElement;
    tabela.remove();
    if (wrapper && wrapper !== secao && !wrapper.children.length) wrapper.remove();
  }
  return secao.dataset;
}

export function secoes(doc, papel) {
  if (!doc) return [];
  return [...doc.children]
    .filter((s) => metadados(s).papel === papel);
}

function sim(valor) {
  return ['sim', 'yes', 'true'].includes((valor || '').trim().toLowerCase());
}

export function categorias(doc) {
  return secoes(doc, 'categoria').map((s) => ({
    codigo: s.dataset.codigo,
    opcional: sim(s.dataset.opcional),
    secao: s,
  })).filter((c) => c.codigo);
}

export function versaoPolitica(doc) {
  const [banner] = secoes(doc, 'banner');
  return (banner && banner.dataset.versaoPolitica) || '';
}

/** Escolha guardada, ou null se não existe, expirou ou a política mudou. */
export function escolhaGuardada(versao) {
  try {
    const salvo = JSON.parse(localStorage.getItem(CHAVE));
    if (!salvo || !Array.isArray(salvo.categorias)) return null;
    if (Date.now() - Date.parse(salvo.data) > VALIDADE_MS) return null;
    if (versao !== undefined && salvo.versao !== versao) return null;
    return salvo;
  } catch (e) {
    return null;
  }
}

function anunciar(nome, cats) {
  window.consent = { status: 'done', categories: cats };
  // martech da Adobe escuta `consent` / `consent-updated` com detail.categories
  window.dispatchEvent(new CustomEvent(nome, { detail: { categories: cats } }));
  // gancho do aem-boilerplate (scripts/consent-check.js)
  window.dispatchEvent(new CustomEvent('consent.update', { detail: { categories: cats } }));
}

function gravar(cats, versao) {
  const registro = { categorias: cats, versao, data: new Date().toISOString() };
  try {
    localStorage.setItem(CHAVE, JSON.stringify(registro));
  } catch (e) { /* navegador sem storage: vale só para esta página */ }
  sampleRUM('consentupdate', { source: cats.join(',') });
  anunciar('consent-updated', cats);
}

/** Grava uma escolha vinda de fora do painel (ex.: "permitir" do gate). */
export async function gravarEscolha(cats) {
  const doc = await carregarDocumento();
  gravar(cats, versaoPolitica(doc));
  document.querySelectorAll('.consent-banner').forEach((b) => b.remove());
}

/** Conteúdo autorado da seção, sem a tabela de metadados. */
export function conteudo(secao) {
  const div = document.createElement('div');
  [...secao.cloneNode(true).childNodes].forEach((n) => {
    if (n.nodeType === 1 && n.matches('.section-metadata, .consent-origens')) return;
    div.append(n);
  });
  return div;
}

/** Elemento a substituir pelo botão: o parágrafo, quando o link está sozinho nele. */
export function alvoDoLink(a) {
  const p = a.parentElement;
  return p && p.tagName === 'P' && p.textContent.trim() === a.textContent.trim() ? p : a;
}

/** Troca os links-âncora autorados (#aceitar etc.) por botões com o mesmo texto. */
function botoes(container, acoes) {
  container.querySelectorAll('a[href^="#"]').forEach((a) => {
    const acao = a.getAttribute('href').slice(1);
    if (!acoes[acao]) return;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `consent-button consent-${acao}`;
    b.textContent = a.textContent;
    b.addEventListener('click', acoes[acao]);
    alvoDoLink(a).replaceWith(b);
  });
  const lista = [...container.querySelectorAll('.consent-button')];
  if (lista.length) {
    const barra = document.createElement('div');
    barra.className = 'consent-acoes';
    barra.append(...lista);
    container.append(barra);
  }
}

function abrirPainel(doc, versao, aoFechar) {
  const cats = categorias(doc);
  const atuais = (window.consent && window.consent.categories) || [];
  const [intro] = secoes(doc, 'preferencias');
  const dialog = document.createElement('dialog');
  dialog.className = 'consent consent-painel';
  const corpo = intro ? conteudo(intro) : document.createElement('div');
  const titulo = corpo.querySelector('h1, h2, h3');
  if (titulo) {
    titulo.id = 'consent-painel-titulo';
    dialog.setAttribute('aria-labelledby', titulo.id);
  }

  const lista = document.createElement('ul');
  lista.className = 'consent-categorias';
  cats.forEach((c) => {
    const item = document.createElement('li');
    const bloco = conteudo(c.secao);
    const nome = bloco.querySelector('h1, h2, h3, h4, p');
    const id = `consent-cat-${c.codigo}`;
    const caixa = document.createElement('input');
    caixa.type = 'checkbox';
    caixa.id = id;
    caixa.value = c.codigo;
    caixa.checked = !c.opcional || atuais.includes(c.codigo);
    caixa.disabled = !c.opcional;
    const rotulo = document.createElement('label');
    rotulo.htmlFor = id;
    rotulo.textContent = nome ? nome.textContent : c.codigo;
    if (nome) nome.remove();
    const cabeca = document.createElement('div');
    cabeca.className = 'consent-categoria-cabeca';
    cabeca.append(caixa, rotulo);
    bloco.className = 'consent-categoria-texto';
    item.append(cabeca, bloco);
    lista.append(item);
  });

  const marcadas = () => [...lista.querySelectorAll('input')].filter((i) => i.checked).map((i) => i.value);
  const fechar = (escolha) => {
    gravar(escolha, versao);
    dialog.close();
  };
  const todas = cats.map((c) => c.codigo);
  const obrigatorias = cats.filter((c) => !c.opcional).map((c) => c.codigo);
  corpo.append(lista);
  botoes(corpo, {
    aceitar: () => fechar(todas),
    recusar: () => fechar(obrigatorias),
    salvar: () => fechar(marcadas()),
  });
  // a barra de ações fica depois da lista de categorias
  const barra = corpo.querySelector('.consent-acoes');
  if (barra) corpo.append(barra);
  dialog.append(corpo);
  dialog.addEventListener('close', () => {
    dialog.remove();
    if (aoFechar) aoFechar();
  });
  document.body.append(dialog);
  dialog.showModal();
}

function mostrarBanner(doc, versao) {
  const [secao] = secoes(doc, 'banner');
  if (!secao) return;
  const banner = document.createElement('section');
  banner.className = 'consent consent-banner';
  banner.setAttribute('role', 'region');
  const corpo = conteudo(secao);
  const titulo = corpo.querySelector('h1, h2, h3');
  if (titulo) {
    titulo.id = 'consent-banner-titulo';
    banner.setAttribute('aria-labelledby', titulo.id);
  }
  const cats = categorias(doc);
  const fechar = (escolha) => {
    gravar(escolha, versao);
    banner.remove();
  };
  botoes(corpo, {
    aceitar: () => fechar(cats.map((c) => c.codigo)),
    recusar: () => fechar(cats.filter((c) => !c.opcional).map((c) => c.codigo)),
    preferencias: () => {
      banner.remove();
      abrirPainel(doc, versao, () => {
        if (!escolhaGuardada(versao)) mostrarBanner(doc, versao);
      });
    },
  });
  banner.append(corpo);
  document.body.append(banner);
  sampleRUM('showconsent', { source: versao });
}

/**
 * Ponto de entrada, chamado por scripts/consent-check.js.
 * Com escolha válida, só anuncia; sem ela, mostra o banner.
 */
export async function init() {
  const doc = await carregarDocumento();
  if (!doc) return;
  const versao = versaoPolitica(doc);
  const salvo = escolhaGuardada(versao);
  if (salvo) {
    anunciar('consent', salvo.categorias);
    return;
  }
  // até haver escolha, valem só as categorias obrigatórias
  window.consent = { status: 'pending', categories: categorias(doc).filter((c) => !c.opcional).map((c) => c.codigo) };
  loadCSS(`${window.hlx.codeBasePath}/styles/consent.css`);
  mostrarBanner(doc, versao);
}

/** Reabre as preferências (link "Definições de Cookies" do rodapé). */
export async function abrirPreferencias() {
  const doc = await carregarDocumento();
  if (!doc) return;
  loadCSS(`${window.hlx.codeBasePath}/styles/consent.css`);
  abrirPainel(doc, versaoPolitica(doc));
}

/**
 * Liga ao painel os links "#definicoes-de-cookies" (rodapé ou qualquer lugar).
 * Por delegação no documento: funciona mesmo que o rodapé carregue depois.
 */
export function ligarLinkPreferencias() {
  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[href$="#definicoes-de-cookies"]');
    if (!a) return;
    e.preventDefault();
    abrirPreferencias();
  });
}
