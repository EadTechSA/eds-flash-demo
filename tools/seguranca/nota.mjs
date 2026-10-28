/*
 * Nota de cabeçalhos de segurança no critério do securityheaders.com (Snyk),
 * conferido em 28/10/2026 no relatório da própria ferramenta:
 *  - seis cabeçalhos pontuam: Strict-Transport-Security, Content-Security-Policy,
 *    X-Frame-Options (ou frame-ancestors na CSP), X-Content-Type-Options,
 *    Referrer-Policy e Permissions-Policy;
 *  - "Upcoming headers": Cross-Origin-Embedder-Policy e Cross-Origin-Opener-Policy
 *    (e Cross-Origin-Resource-Policy, listado nas informações adicionais).
 * Aqui o nível máximo é: os seis presentes, nenhum aviso, e os três próximos
 * presentes. Os avisos seguem o próprio securityheaders e o Mozilla Observatory.
 *
 * Exceção documentada: style-src 'unsafe-inline' é exigido pela documentação de
 * CSP do Rybená (estilos do player). O securityheaders mostra aviso mas não tira
 * o A+ por isso; a exceção só vale com o Rybená liberado na CSP.
 */
const FEATURES = new Set(['accelerometer', 'ambient-light-sensor', 'attribution-reporting', 'autoplay', 'bluetooth', 'browsing-topics', 'camera', 'compute-pressure', 'cross-origin-isolated', 'display-capture', 'encrypted-media', 'fullscreen', 'gamepad', 'geolocation', 'gyroscope', 'hid', 'identity-credentials-get', 'idle-detection', 'local-fonts', 'magnetometer', 'microphone', 'midi', 'otp-credentials', 'payment', 'picture-in-picture', 'publickey-credentials-create', 'publickey-credentials-get', 'screen-wake-lock', 'serial', 'storage-access', 'usb', 'web-share', 'window-management', 'xr-spatial-tracking']);

export const lerCsp = (texto = '') => Object.fromEntries(texto.split(';').map((d) => d.trim().split(/\s+/))
  .filter((d) => d[0]).map(([k, ...v]) => [k.toLowerCase(), v]));

/** cab: { nome-em-minúsculas: valor }. Devolve { nota, faltam[], avisos[], proximos[] } */
export function avaliar(cab) {
  const faltam = [];
  const avisos = [];
  const proximos = [];
  const csp = cab['content-security-policy'];
  const d = lerCsp(csp);

  if (!csp) faltam.push('Content-Security-Policy');
  else {
    const scripts = d['script-src'] || d['default-src'] || [];
    ["'unsafe-inline'", "'unsafe-eval'", '*', 'http:', 'https:', 'data:'].filter((x) => scripts.includes(x))
      .forEach((x) => avisos.push(`CSP script-src permite ${x}`));
    Object.entries(d).filter(([dir, v]) => dir !== 'script-src' && v.some((x) => x === '*' || x === 'http:' || x === 'https:'))
      .forEach(([dir]) => avisos.push(`CSP ${dir} com coringa`));
    if (/'unsafe-eval'/.test(csp)) avisos.push("CSP usa 'unsafe-eval'");
    if (!d['default-src']) avisos.push('CSP sem default-src');
    if (!(d['object-src'] || []).includes("'none'")) avisos.push("CSP sem object-src 'none'");
    if (!d['base-uri']) avisos.push('CSP sem base-uri');
    if (!d['form-action']) avisos.push('CSP sem form-action');
    const estilo = d['style-src'] || d['default-src'] || [];
    const rybena = (d['connect-src'] || []).some((x) => /rybena\.com\.br/.test(x));
    if (estilo.includes("'unsafe-inline'") && !rybena) avisos.push("CSP style-src 'unsafe-inline' sem o Rybená que o justifique");
  }
  if (cab['content-security-policy-report-only'] && !csp) avisos.push('CSP só em report-only: não protege');

  const hsts = cab['strict-transport-security'];
  if (!hsts) faltam.push('Strict-Transport-Security');
  else {
    const idade = Number((hsts.match(/max-age=(\d+)/i) || [])[1] || 0);
    if (idade < 31536000) avisos.push(`HSTS max-age ${idade} abaixo de 1 ano`);
    if (!/includesubdomains/i.test(hsts)) avisos.push('HSTS sem includeSubDomains');
  }

  const xfo = (cab['x-frame-options'] || '').toUpperCase();
  const fa = d['frame-ancestors'];
  if (!xfo && !fa) faltam.push('X-Frame-Options (ou frame-ancestors)');
  if (xfo && !['DENY', 'SAMEORIGIN'].includes(xfo)) avisos.push(`X-Frame-Options inválido: ${xfo}`);
  if (xfo === 'DENY' && fa && !fa.includes("'none'")) avisos.push("X-Frame-Options DENY e frame-ancestors diferentes de 'none'");
  if (!fa) avisos.push('CSP sem frame-ancestors');

  const xcto = cab['x-content-type-options'];
  if (!xcto) faltam.push('X-Content-Type-Options');
  else if (xcto.trim().toLowerCase() !== 'nosniff') avisos.push('X-Content-Type-Options diferente de nosniff');

  const ref = (cab['referrer-policy'] || '').toLowerCase();
  if (!ref) faltam.push('Referrer-Policy');
  else if (/unsafe-url|no-referrer-when-downgrade/.test(ref)) avisos.push(`Referrer-Policy fraca: ${ref}`);

  const perm = cab['permissions-policy'];
  if (!perm) faltam.push('Permissions-Policy');
  else {
    perm.split(',').map((p) => p.trim()).filter(Boolean).forEach((p) => {
      const m = p.match(/^([a-z-]+)=\(([^)]*)\)$/);
      if (!m) avisos.push(`Permissions-Policy com sintaxe inválida: ${p}`);
      else if (!FEATURES.has(m[1])) avisos.push(`Permissions-Policy com recurso desconhecido: ${m[1]}`);
    });
  }

  const xss = cab['x-xss-protection'];
  if (xss && xss.trim() !== '0') avisos.push('X-XSS-Protection obsoleto; use 0 ou não envie');
  ['x-powered-by', 'x-aspnet-version'].filter((h) => cab[h]).forEach((h) => avisos.push(`${h} expõe a tecnologia do servidor`));

  [['cross-origin-opener-policy', 'Cross-Origin-Opener-Policy'], ['cross-origin-embedder-policy', 'Cross-Origin-Embedder-Policy'], ['cross-origin-resource-policy', 'Cross-Origin-Resource-Policy']]
    .forEach(([k, nome]) => { if (!cab[k] && !cab[`${k}-report-only`]) proximos.push(nome); });

  const pontos = 6 - faltam.length;
  let nota = ['F', 'E', 'D', 'C', 'B', 'A', 'A'][pontos];
  if (pontos === 6 && !avisos.length) nota = 'A+';
  return {
    nota, faltam, avisos, proximos,
  };
}
