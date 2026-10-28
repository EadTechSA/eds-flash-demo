#!/usr/bin/env node
/*
 * Contrato de cabeçalhos de segurança: seguranca/cabecalhos.json tem de tirar
 * A+ no critério do securityheaders.com sem nenhum aviso e trazer também os
 * cabeçalhos que ele lista como próximos (COOP, COEP, CORP). As metas de CSP em
 * head.html e 404.html não podem afrouxar a política (sem aviso próprio e só com
 * diretivas que a política da entrega também tem).
 *
 * Uso: node tools/seguranca/contrato-cabecalhos.mjs   (sai com código 1 se houver falha)
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { avaliar, lerCsp } from './nota.mjs';

const raiz = new URL('../../', import.meta.url).pathname;
const falhas = [];
const arq = join(raiz, 'seguranca', 'cabecalhos.json');
const cab = {};
(existsSync(arq) ? JSON.parse(readFileSync(arq, 'utf8'))['/**'] || [] : []).forEach((h) => { cab[h.key.toLowerCase()] = h.value; });

const r = avaliar(cab);
if (r.nota !== 'A+') falhas.push(`nota ${r.nota} (precisa A+)`);
r.faltam.forEach((x) => falhas.push(`falta ${x}`));
r.avisos.forEach((x) => falhas.push(`aviso: ${x}`));
r.proximos.forEach((x) => falhas.push(`falta o cabeçalho próximo ${x}`));

const politica = lerCsp(cab['content-security-policy']);
['head.html', '404.html'].forEach((nome) => {
  const f = join(raiz, nome);
  if (!existsSync(f)) return;
  const m = readFileSync(f, 'utf8').match(/http-equiv=["']Content-Security-Policy["'][^>]*content=(["'])([\s\S]*?)\1/i);
  if (!m) return;
  const meta = lerCsp(m[2]);
  (meta['script-src'] || []).filter((x) => ["'unsafe-inline'", "'unsafe-eval'", 'http:', 'https:', '*'].includes(x))
    .forEach((x) => falhas.push(`${nome}: meta CSP script-src com ${x} (vira um segundo cabeçalho CSP com aviso)`));
  Object.entries(meta).forEach(([dir, v]) => {
    const deLa = politica[dir];
    if (!deLa) falhas.push(`${nome}: meta CSP tem ${dir}, que a política da entrega não tem`);
    else v.filter((x) => !deLa.includes(x)).forEach((x) => falhas.push(`${nome}: meta CSP ${dir} ${x} fora da política da entrega`));
  });
});

if (falhas.length) {
  // eslint-disable-next-line no-console
  console.error(`Contrato de cabeçalhos: ${falhas.length} falha(s)\n- ${falhas.join('\n- ')}`);
  process.exit(1);
}
// eslint-disable-next-line no-console
console.log('Contrato de cabeçalhos: ok, A+ sem avisos no critério do securityheaders.com, com COOP, COEP e CORP');
