#!/usr/bin/env node
/*
 * Confere os cabeçalhos que a entrega devolve de verdade: mesma nota do
 * contrato (critério securityheaders.com) e igualdade com seguranca/cabecalhos.json.
 *
 * Uso: AEM_SITE_TOKEN=... node tools/seguranca/verificar-cabecalhos.mjs <url> [mais urls]
 */
import { readFileSync } from 'node:fs';
import { avaliar } from './nota.mjs';

const esperado = {};
JSON.parse(readFileSync(new URL('../../seguranca/cabecalhos.json', import.meta.url), 'utf8'))['/**']
  .forEach((h) => { esperado[h.key.toLowerCase()] = h.value; });
const semNonce = (v = '') => v.replace(/'nonce-[^']+'/g, "'nonce-aem'").replace(/\s+/g, ' ').trim();

const urls = process.argv.slice(2);
if (!urls.length) {
  console.error('uso: AEM_SITE_TOKEN=... node tools/seguranca/verificar-cabecalhos.mjs <url> [mais urls]');
  process.exit(1);
}
let falhas = 0;
for (const url of urls) {
  const headers = process.env.AEM_SITE_TOKEN ? { authorization: `token ${process.env.AEM_SITE_TOKEN}` } : {};
  const resp = await fetch(url, { headers, redirect: 'follow' });
  const cab = {};
  resp.headers.forEach((v, k) => { cab[k] = v; });
  const problemas = [];
  if (resp.status !== 200) problemas.push(`status ${resp.status}`);
  const csp = cab['content-security-policy'] || '';
  const politicas = csp.split(/,(?=\s*[a-z-]+-src|\s*base-uri|\s*default-src)/).length;
  if (politicas > 1) problemas.push(`${politicas} políticas CSP no mesmo cabeçalho (meta movida + config); vale a interseção`);
  const r = avaliar({ ...cab, 'content-security-policy': csp.split(/,(?=\s*[a-z-]+-src|\s*base-uri|\s*default-src)/)[0] });
  if (r.nota !== 'A+') problemas.push(`nota ${r.nota}`);
  r.faltam.forEach((x) => problemas.push(`falta ${x}`));
  r.avisos.forEach((x) => problemas.push(`aviso: ${x}`));
  r.proximos.forEach((x) => problemas.push(`falta ${x}`));
  Object.entries(esperado).forEach(([k, v]) => {
    const real = k === 'content-security-policy' ? csp.split(/,(?=\s*[a-z-]+-src|\s*base-uri|\s*default-src)/)[0] : cab[k];
    if (semNonce(real) !== semNonce(v)) problemas.push(`${k} diferente do repositório${real ? '' : ' (ausente)'}`);
  });
  // aem.page e aem.live: o HSTS é escrito pela própria plataforma (max-age de
  // um ano, sem includeSubDomains) e não aceita o do config. No domínio do
  // cliente, a CDN dele entrega o valor do repositório; aqui vira só aviso.
  const plataforma = /\.aem\.(page|live)$/.test(new URL(url).hostname);
  const daPlataforma = (x) => plataforma && /HSTS|strict-transport-security/i.test(x);
  const avisosPlataforma = problemas.filter((x) => daPlataforma(x) || (plataforma && x === 'nota A' && problemas.filter((y) => !daPlataforma(y) && y !== 'nota A').length === 0));
  avisosPlataforma.forEach((x) => problemas.splice(problemas.indexOf(x), 1));
  if (avisosPlataforma.length) console.log(`${url}: aviso da plataforma (HSTS do aem.page/aem.live): ${avisosPlataforma.join('; ')}`);
  falhas += problemas.length;
  console.log(`${url}: nota ${r.nota}${problemas.length ? `\n- ${problemas.join('\n- ')}` : ' · igual ao repositório'}`);
}
process.exit(falhas ? 1 : 0);
