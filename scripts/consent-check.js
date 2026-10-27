/*
 * Gancho de consentimento do aem-boilerplate (fase delayed), ligado ao
 * módulo scripts/consent.js, que mostra o banner e guarda a escolha.
 *
 * O módulo anuncia a escolha em `consent.update` (detail.categories).
 * consented.js (Web SDK: Analytics e AJO) só carrega quando a categoria de
 * desempenho (CC_ANALYTICS) está aceita — e carrega uma vez só.
 */
const CATEGORIA_MARTECH = 'CC_ANALYTICS';
let consentedLoaded = false;

function aoAtualizar(e) {
  const cats = (e.detail && e.detail.categories) || [];
  if (consentedLoaded || !cats.includes(CATEGORIA_MARTECH)) return;
  consentedLoaded = true;
  import('./consented.js');
}

window.addEventListener('consent.update', aoAtualizar);

// eslint-disable-next-line import/no-cycle
import('./consent.js').then((m) => {
  m.init();
  m.ligarLinkPreferencias();
});
