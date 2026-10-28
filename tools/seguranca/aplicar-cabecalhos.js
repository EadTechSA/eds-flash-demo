/*
 * Aplica seguranca/cabecalhos.json no config service do aem.live.
 * Rodar no console de uma aba logada em https://admin.hlx.page (login Adobe):
 *   1. cole este arquivo; 2. chame aplicarCabecalhos(conteúdoDoJson, { teste: true })
 * `teste: true` grava CSP e COOP como *-report-only (só avisam no console, não
 * bloqueiam). Sem `teste`, grava valendo.
 */
// eslint-disable-next-line no-unused-vars
async function aplicarCabecalhos(json, { teste = false, org = 'eadtechsa', site = 'eds-flash-demo' } = {}) {
  const corpo = {};
  Object.entries(json).filter(([k]) => k.startsWith('/')).forEach(([caminho, lista]) => {
    corpo[caminho] = lista.map((h) => (teste && ['content-security-policy', 'cross-origin-opener-policy'].includes(h.key)
      ? { ...h, key: `${h.key}-report-only` } : h));
  });
  const r = await fetch(`https://admin.hlx.page/config/${org}/sites/${site}/headers.json`, {
    method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify(corpo),
  });
  return `${r.status} ${await r.text()}`;
}
