#!/usr/bin/env node
/*
 * Resume um relatório JSON do Lighthouse em lighthouse/medicao.json, o
 * arquivo que a página lê para mostrar a nota medida (selo do hero e
 * célula do bento). Nada de número escrito à mão.
 *
 * Uso: node tools/lighthouse/resumir.mjs relatorio.json [saida.json]
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const [entrada, saida = 'lighthouse/medicao.json'] = process.argv.slice(2);
const r = JSON.parse(readFileSync(entrada, 'utf8'));
const nota = (k) => (r.categories[k] && r.categories[k].score !== null ? Math.round(r.categories[k].score * 100) : null);
const valor = (k) => (r.audits[k] ? r.audits[k].numericValue : null);
const resumo = {
  medidoEm: r.fetchTime,
  url: r.finalDisplayedUrl || r.requestedUrl,
  dispositivo: r.configSettings.formFactor,
  ferramenta: `Lighthouse ${r.lighthouseVersion}`,
  notas: {
    desempenho: nota('performance'),
    acessibilidade: nota('accessibility'),
    praticas: nota('best-practices'),
    seo: nota('seo'),
  },
  metricas: {
    lcpMs: Math.round(valor('largest-contentful-paint')),
    fcpMs: Math.round(valor('first-contentful-paint')),
    tbtMs: Math.round(valor('total-blocking-time')),
    cls: Math.round(valor('cumulative-layout-shift') * 1000) / 1000,
  },
  observacao: 'SEO medido sem a auditoria is-crawlable: o aem.page responde noindex de propósito.',
};
mkdirSync(dirname(saida), { recursive: true });
writeFileSync(saida, `${JSON.stringify(resumo, null, 2)}\n`);
console.log(`${saida}: ${Object.entries(resumo.notas).map(([k, v]) => `${k} ${v}`).join(' · ')}`);
