/*
 * Gate de embeds e mídia de terceiros: até o visitante aceitar a categoria,
 * nada carrega e no lugar aparece o aviso autorado (seção `papel: gate`).
 *
 * Duas portas:
 *  - comGate(alvo, url, montar): a categoria vem da origem da URL, pela
 *    tabela `consent-origens` do documento de consentimento (embed, iframe);
 *  - comGateCategoria(alvo, codigo, montar, desmontar): a categoria é dita
 *    pelo bloco (ex.: o hero de vídeo exige CC_MEDIA), e a revogação nas
 *    definições desfaz a montagem sem recarregar a página.
 * Nada de lista fixa no código: origem fora da tabela carrega livre.
 */
import { loadCSS } from './aem.js';
import {
  alvoDoLink, carregarDocumento, categorias, conteudo,
  escolhaGuardada, gravarEscolha, secoes, versaoPolitica,
} from './consent.js';

function host(url) {
  try {
    return new URL(url, window.location.href).hostname.toLowerCase();
  } catch (e) {
    return '';
  }
}

function origens(doc) {
  const linhas = doc ? doc.querySelectorAll('.consent-origens > div') : [];
  return [...linhas].map((l) => {
    const [o, c] = [...l.children].map((d) => d.textContent.trim().toLowerCase());
    return { origem: o, codigo: c && c.toUpperCase() };
  }).filter((x) => x.origem && x.codigo);
}

/** Código da categoria exigida pela URL, ou null se a origem é livre. */
export async function categoriaDe(url) {
  const doc = await carregarDocumento();
  const h = host(url);
  const achado = origens(doc).find((x) => h === x.origem || h.endsWith(`.${x.origem}`));
  return achado ? achado.codigo : null;
}

function aceita(codigo, doc) {
  // o gate pode rodar antes de consent-check: lê direto a escolha guardada
  const salvo = escolhaGuardada(versaoPolitica(doc));
  const cats = (window.consent && window.consent.categories) || (salvo && salvo.categorias) || [];
  return cats.includes(codigo);
}

/** Monta o aviso autorado da seção `gate`, com "permitir" gravando a categoria. */
function aviso(doc, codigo, url) {
  const [secao] = secoes(doc, 'gate');
  loadCSS(`${window.hlx.codeBasePath}/styles/consent.css`);
  const el = document.createElement('div');
  el.className = 'consent consent-gate';
  if (secao) el.append(...conteudo(secao).childNodes);
  el.querySelectorAll('a[href="#abrir"]').forEach((a) => {
    if (url) {
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener';
    } else {
      alvoDoLink(a).remove();
    }
  });
  el.querySelectorAll('a[href="#permitir"]').forEach((a) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'consent-button consent-permitir';
    b.textContent = a.textContent;
    b.addEventListener('click', () => {
      const salvo = escolhaGuardada(versaoPolitica(doc));
      const obrigatorias = categorias(doc).filter((c) => !c.opcional).map((c) => c.codigo);
      const atuais = window.consent && window.consent.categories;
      const base = atuais || (salvo && salvo.categorias) || [];
      gravarEscolha([...new Set([...obrigatorias, ...base, codigo])]);
    });
    alvoDoLink(a).replaceWith(b);
  });
  return el;
}

/**
 * Embed atrás do gate pela origem da URL.
 * @param {Element} alvo onde o embed seria inserido
 * @param {string} url endereço do embed
 * @param {Function} montar insere o embed real em `alvo`
 */
export async function comGate(alvo, url, montar) {
  const codigo = await categoriaDe(url);
  if (codigo) {
    alvo.dataset.consentCategory = codigo;
    const bloco = alvo.closest('.block');
    if (bloco) bloco.dataset.consentCategory = codigo;
  }
  const doc = await carregarDocumento();
  if (!codigo || aceita(codigo, doc)) {
    montar();
    return;
  }
  const el = aviso(doc, codigo, url);
  alvo.append(el);
  const liberar = (e) => {
    if (e.detail?.categories?.includes(codigo)) {
      window.removeEventListener('consent-updated', liberar);
      window.removeEventListener('consent', liberar);
      el.remove();
      montar();
    }
  };
  window.addEventListener('consent-updated', liberar);
  window.addEventListener('consent', liberar);
}

/**
 * Mídia atrás do gate por categoria declarada pelo bloco, com revogação:
 * aceitar monta; revogar desmonta e devolve o aviso, sem recarregar.
 * @param {Element} alvo onde o aviso ou a mídia entram
 * @param {string} codigo categoria exigida (ex.: CC_MEDIA)
 * @param {Function} montar insere a mídia real
 * @param {Function} desmontar remove a mídia real
 */
export async function comGateCategoria(alvo, codigo, montar, desmontar) {
  // marca legível por qualquer CMP de mercado (OneTrust, Cookiebot, TCF):
  // a categoria exigida fica no HTML do bloco e do lugar da mídia
  alvo.dataset.consentCategory = codigo;
  const bloco = alvo.closest('.block');
  if (bloco) bloco.dataset.consentCategory = codigo;
  const doc = await carregarDocumento();
  let el = null;
  let montado = false;
  const bloquear = () => {
    if (montado && desmontar) desmontar();
    montado = false;
    if (!el) {
      el = aviso(doc, codigo, null);
      alvo.append(el);
    }
    alvo.dataset.gate = 'ativo';
  };
  const liberar = () => {
    if (el) {
      el.remove();
      el = null;
    }
    if (!montado) montar();
    montado = true;
    alvo.dataset.gate = 'liberado';
  };
  if (!doc || aceita(codigo, doc)) liberar(); else bloquear();
  const aoMudar = (e) => {
    const cats = (e.detail && e.detail.categories) || [];
    if (cats.includes(codigo)) liberar(); else bloquear();
  };
  window.addEventListener('consent-updated', aoMudar);
  window.addEventListener('consent', aoMudar);
}
