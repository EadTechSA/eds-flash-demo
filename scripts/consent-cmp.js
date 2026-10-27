/*
 * Adaptador para CMPs de mercado. Quando o site usa OneTrust, Cookiebot ou
 * um CMP com a API TCF v2, o CMP é a fonte da decisão: este módulo escuta o
 * CMP, traduz as categorias dele para as nossas (CC_ESSENTIAL, CC_ANALYTICS,
 * CC_MEDIA…) e anuncia os mesmos eventos `consent` / `consent-updated` que
 * o gate e o plugin de martech da Adobe já escutam. O gate dos blocos não
 * muda: continua lendo `data-consent-category` e os eventos.
 *
 * A tradução é CONTEÚDO: no documento de consentimento, uma seção com o
 * metadado `papel: cmp` e um bloco `consent-origens` com linhas
 * `código do CMP | nossa categoria`, por exemplo:
 *   C0002 | CC_ANALYTICS        (OneTrust)
 *   statistics | CC_ANALYTICS   (Cookiebot)
 *   tcf:1 | CC_ESSENTIAL        (TCF v2, finalidade 1)
 * O metadado de página `cmp` (onetrust | cookiebot | tcf) diz qual escutar;
 * sem ele, o banner próprio do pacote é usado.
 */
import { carregarDocumento, secoes } from './consent.js';

function mapa(doc) {
  const m = {};
  secoes(doc, 'cmp').forEach((s) => {
    s.querySelectorAll('.consent-origens > div').forEach((l) => {
      const [de, para] = [...l.children].map((d) => d.textContent.trim());
      if (de && para) m[de.toLowerCase()] = para.toUpperCase();
    });
  });
  return m;
}

function anunciar(nome, cats) {
  const lista = [...new Set(cats)];
  window.consent = { status: 'done', categories: lista, source: 'cmp' };
  try {
    localStorage.setItem('aem-consent', JSON.stringify({ categorias: lista, versao: 'cmp', data: new Date().toISOString() }));
  } catch (e) { /* sem storage */ }
  window.dispatchEvent(new CustomEvent(nome, { detail: { categories: lista } }));
  window.dispatchEvent(new CustomEvent('consent.update', { detail: { categories: lista } }));
}

function traduzir(ativos, m) {
  return ativos.map((c) => m[String(c).toLowerCase()]).filter(Boolean);
}

function onetrust(m) {
  const ler = () => (window.OnetrustActiveGroups || '').split(',').filter(Boolean);
  let primeira = true;
  const aplicar = () => {
    anunciar(primeira ? 'consent' : 'consent-updated', traduzir(ler(), m));
    primeira = false;
  };
  if (window.OnetrustActiveGroups) aplicar();
  window.addEventListener('OneTrustGroupsUpdated', aplicar);
  // o OneTrust também chama OptanonWrapper quando a escolha muda
  const anterior = window.OptanonWrapper;
  window.OptanonWrapper = () => {
    if (typeof anterior === 'function') anterior();
    aplicar();
  };
}

function cookiebot(m) {
  const ler = () => {
    const c = (window.Cookiebot && window.Cookiebot.consent) || {};
    return ['necessary', 'preferences', 'statistics', 'marketing'].filter((k) => c[k]);
  };
  let primeira = true;
  const aplicar = () => {
    anunciar(primeira ? 'consent' : 'consent-updated', traduzir(ler(), m));
    primeira = false;
  };
  if (window.Cookiebot && window.Cookiebot.consented) aplicar();
  ['CookiebotOnConsentReady', 'CookiebotOnAccept', 'CookiebotOnDecline'].forEach((e) => window.addEventListener(e, aplicar));
}

function tcf(m) {
  // nome definido pela especificação TCF v2 da IAB
  const api = window['__tcfapi']; // eslint-disable-line dot-notation
  if (typeof api !== 'function') return;
  let primeira = true;
  api('addEventListener', 2, (tc, ok) => {
    if (!ok || !tc || !['tcloaded', 'useractioncomplete'].includes(tc.eventStatus)) return;
    const fins = Object.entries((tc.purpose && tc.purpose.consents) || {}).filter(([, v]) => v).map(([k]) => `tcf:${k}`);
    anunciar(primeira ? 'consent' : 'consent-updated', traduzir(fins, m));
    primeira = false;
  });
}

/** Liga o adaptador do CMP indicado pelo metadado `cmp`. Devolve true se ligou. */
export default async function ligarCmp(nomeCmp) {
  const doc = await carregarDocumento();
  const m = mapa(doc);
  const nome = (nomeCmp || '').toLowerCase();
  if (nome === 'onetrust') onetrust(m);
  else if (nome === 'cookiebot') cookiebot(m);
  else if (nome === 'tcf') tcf(m);
  else return false;
  return true;
}
