/*
 * Gancho de consentimento (fase delayed), ligado ao módulo scripts/consent.js,
 * que mostra o banner e guarda a escolha.
 *
 * Com o metadado de página `cmp` (onetrust | cookiebot | tcf), o banner
 * próprio NÃO aparece: o adaptador scripts/consent-cmp.js escuta o CMP do
 * site e anuncia os mesmos eventos. Em qualquer caso, consented.js (martech)
 * só carrega quando a categoria CC_ANALYTICS está aceita, uma vez só.
 */
import { getMetadata } from './aem.js';

const CATEGORIA_MARTECH = 'CC_ANALYTICS';
let consentedLoaded = false;

function aoAtualizar(e) {
  const cats = (e.detail && e.detail.categories) || [];
  if (consentedLoaded || !cats.includes(CATEGORIA_MARTECH)) return;
  consentedLoaded = true;
  import('./consented.js');
}

window.addEventListener('consent.update', aoAtualizar);

const cmp = getMetadata('cmp');
if (cmp) {
  // eslint-disable-next-line import/no-cycle
  import('./consent-cmp.js').then((m) => m.default(cmp)).then((ligou) => {
    if (ligou) return;
    import('./consent.js').then((c) => { c.init(); c.ligarLinkPreferencias(); });
  });
} else {
  // eslint-disable-next-line import/no-cycle
  import('./consent.js').then((m) => {
    m.init();
    m.ligarLinkPreferencias();
  });
}
