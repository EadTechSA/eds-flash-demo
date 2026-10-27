#!/usr/bin/env node
/*
 * Verificador de acessibilidade por modo e por bloco, na página publicada.
 *
 * Para cada URL e cada modo do widget (classes na raiz do documento), roda o
 * axe-core (WCAG 2.2 AA) em dois viewports e agrupa as violações pelo bloco
 * do EDS em que o elemento está. Com --widget, prova também os botões do
 * widget .a11y-widget (aria-pressed e localStorage).
 *
 * Uso: node verificar-modos.mjs <url> [mais urls] [--widget] [--saida pasta] [--axe caminho/axe.min.js]
 */
import { createRequire as cr } from 'node:module';

import {
  existsSync, mkdirSync, readFileSync, writeFileSync,
} from 'node:fs';
import { join } from 'node:path';

const { chromium } = cr(import.meta.url)('playwright');

const require = cr(import.meta.url);

const MODOS = {
  normal: [],
  contrast: ['contrast'],
  'a11y-grayscale': ['a11y-grayscale'],
  'a11y-invert': ['a11y-invert'],
  'a11y-links': ['a11y-links'],
  'font-size-2': ['font-size-2'],
  'contrast+font-size-2': ['contrast', 'font-size-2'],
};

const VIEWPORTS = [
  { nome: 'desktop', width: 1400, height: 900 },
  {
    nome: 'celular', width: 390, height: 844, isMobile: true, hasTouch: true,
  },
];

// botão do widget que liga cada modo: 1ª geração (utility-*) e painel novo
// (a11y-acao[data-chave], Portal de Normas / Prodesp desde 21/10/2026)
const BOTOES = {
  contrast: '.utility-contrast, .a11y-acao[data-chave="contraste"]',
  'a11y-grayscale': '.utility-grayscale, .a11y-acao[data-chave="pb"]',
  'a11y-invert': '.utility-invert, .a11y-acao[data-chave="inverter"]',
  'a11y-links': '.utility-links, .a11y-acao[data-chave="links"]',
};
const BOTAO_MAIS = '.utility-font-increase, .a11y-tamanho-botao:last-of-type';
const CHAVES_STORAGE = ['aem-a11y', 'prodesp:acessibilidade', 'a11y-contrast', 'a11y-grayscale', 'a11y-invert', 'a11y-links', 'a11y-font-level'];

function args() {
  const a = process.argv.slice(2);
  const o = {
    urls: [], widget: false, saida: './a11y-relatorios', axe: '',
  };
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] === '--widget') o.widget = true;
    else if (a[i] === '--saida') { o.saida = a[i + 1]; i += 1; } else if (a[i] === '--axe') { o.axe = a[i + 1]; i += 1; } else o.urls.push(a[i]);
  }
  return o;
}

function acharAxe(caminho) {
  const candidatos = [caminho, '/tmp/axe/package/axe.min.js'];
  try { candidatos.push(require.resolve('axe-core/axe.min.js')); } catch (e) { /* sem pacote local */ }
  const achado = candidatos.find((c) => c && existsSync(c));
  if (!achado) throw new Error('axe.min.js não encontrado: passe --axe ou rode `npm pack axe-core` em /tmp/axe');
  return readFileSync(achado, 'utf8');
}

// roda dentro da página: agrupa violações por bloco e levanta os extras
const SCRIPT_PAGINA = `
async (modo) => {
  const bloco = (el) => {
    const b = el.closest && el.closest('.block');
    if (b) return b.classList[0] || 'block';
    if (el.closest && el.closest('header')) return 'header';
    if (el.closest && el.closest('footer')) return 'footer';
    if (el.closest && el.closest('.a11y-widget')) return 'a11y-widget';
    if (el.closest && el.closest('.consent')) return 'consent';
    return 'default-content';
  };
  const r = await axe.run(document, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] },
    rules: { 'region': { enabled: false }, 'landmark-one-main': { enabled: false }, 'page-has-heading-one': { enabled: false } },
    resultTypes: ['violations'],
  });
  const violacoes = [];
  r.violations.forEach((v) => {
    v.nodes.forEach((n) => {
      const el = document.querySelector(n.target[0]);
      const dados = (n.any[0] && n.any[0].data) || {};
      violacoes.push({
        regra: v.id, impacto: v.impact, bloco: el ? bloco(el) : '?', seletor: n.target[0],
        texto: el ? (el.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 60) : '',
        detalhe: (n.failureSummary || '').replace(/\\s+/g, ' ').slice(0, 200),
        cores: dados.fgColor ? (dados.fgColor + ' sobre ' + dados.bgColor + ' = ' + dados.contrastRatio + ' (mín ' + dados.expectedContrastRatio + ')') : '',
      });
    });
  });
  const fonte = parseFloat(getComputedStyle(document.documentElement).fontSize);
  const comFundo = [];
  if (modo.includes('contrast')) {
    document.querySelectorAll('main *, header *, footer *').forEach((el) => {
      const cs = getComputedStyle(el);
      if (cs.backgroundImage && cs.backgroundImage !== 'none' && !cs.backgroundImage.startsWith('linear-gradient(rgba(0, 0, 0') && el.textContent.trim() && el.getClientRects().length) {
        const vis = el.offsetWidth > 0 && cs.visibility !== 'hidden';
        if (vis) comFundo.push({ bloco: bloco(el), seletor: el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ').filter(Boolean).slice(0,2).join('.') : ''), fundo: cs.backgroundImage.slice(0, 60) });
      }
    });
  }
  return { violacoes, fonte, comFundo: comFundo.slice(0, 30), classesRaiz: document.documentElement.className };
}`;

async function provarWidget(page, modo, classes) {
  const widget = await page.$('.a11y-widget');
  if (!widget) return { existe: false };
  const res = { existe: true, passos: [] };
  const alternar = await page.$('.a11y-widget-alternar, .a11y-widget > button');
  // fecha o painel se já estava aberto
  if (alternar && (await alternar.getAttribute('aria-expanded')) === 'true') { await page.keyboard.press('Escape').catch(() => {}); await page.waitForTimeout(200); }
  if (alternar) {
    await alternar.click().catch(() => {});
    await page.waitForTimeout(300);
  }
  for (const c of classes) {
    const sel = BOTOES[c];
    if (c.startsWith('font-size')) {
      const mais = await page.$(BOTAO_MAIS);
      if (mais) {
        await mais.click().catch(() => {});
        await mais.click().catch(() => {});
        await page.waitForTimeout(300);
        const fonte = await page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize));
        const storage = await page.evaluate((ks) => { try { return ks.map((k) => [k, localStorage.getItem(k)]).filter((x) => x[1]).map((x) => `${x[0]}=${x[1]}`).join(' ') || null; } catch (e) { return null; } }, CHAVES_STORAGE);
        res.passos.push({ botao: 'aumentar ×2', classe: fonte >= 19, fontePx: fonte, storage });
      } else res.passos.push({ botao: 'aumentar fonte', ausente: true });
      continue;
    }
    if (!sel) continue;
    const b = await page.$(sel);
    if (!b) { res.passos.push({ botao: sel, ausente: true }); continue; }
    await b.click().catch(() => {});
    await page.waitForTimeout(200);
    const pressed = (await b.getAttribute('aria-pressed')) || (await b.getAttribute('aria-checked'));
    const temClasse = await page.evaluate((cl) => document.documentElement.classList.contains(cl), c);
    const storage = await page.evaluate((ks) => { try { return ks.map((k) => [k, localStorage.getItem(k)]).filter((x) => x[1]).map((x) => `${x[0]}=${x[1]}`).join(' ') || null; } catch (e) { return null; } }, CHAVES_STORAGE);
    res.passos.push({
      botao: sel, ariaPressed: pressed, classe: temClasse, storage,
    });
  }
  if (alternar) await page.keyboard.press('Escape').catch(() => {});
  return res;
}

async function verificarUrl(browser, url, opts, axeSrc) {
  const host = new URL(url).host.replace(/[^a-z0-9.-]/gi, '_');
  const slug = host + (new URL(url).pathname.replace(/\//g, '_').replace(/_$/, '') || '');
  const resultado = { url, modos: {}, widget: {} };
  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: !!vp.isMobile, hasTouch: !!vp.hasTouch });
    const page = await ctx.newPage();
    for (const [modo, classes] of Object.entries(MODOS)) {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 90000 }).catch(() => {});
      await page.waitForTimeout(3500);
      // fecha o banner de cookies para não mascarar o resto
      await page.evaluate(() => {
        document.querySelectorAll('.consent-banner').forEach((b) => { b.style.display = 'none'; });
      }).catch(() => {});
      let widget = null;
      if (opts.widget && vp.nome === 'desktop' && classes.length) widget = await provarWidget(page, modo, classes);
      await page.evaluate((cls) => {
        ['contrast', 'a11y-grayscale', 'a11y-invert', 'a11y-links', 'font-size-1', 'font-size-2'].forEach((c) => document.documentElement.classList.remove(c));
        document.documentElement.removeAttribute('data-font-size');
        cls.forEach((c) => document.documentElement.classList.add(c));
        // painel novo (Prodesp/d10): o tamanho é atributo, 85–120 %
        if (cls.includes('font-size-2')) document.documentElement.setAttribute('data-font-size', '120');
      }, classes);
      await page.waitForTimeout(800);
      // rola a página inteira para montar blocos adiados e revelar conteúdo
      await page.evaluate(async () => {
        const h = document.documentElement.scrollHeight;
        for (let y = 0; y < h; y += 700) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); }
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(600);
      await page.addScriptTag({ content: axeSrc });
      const dados = await page.evaluate(`(${SCRIPT_PAGINA})(${JSON.stringify(modo)})`);
      if (modo.includes('font-size-2') && dados.fonte < 19) {
        dados.violacoes.push({
          regra: 'font-size-2', impacto: 'serious', bloco: 'html', seletor: 'html', texto: '', detalhe: `font-size da raiz ${dados.fonte}px (< 19px): o modo não aumenta a fonte`, cores: '',
        });
      }
      resultado.modos[`${modo}@${vp.nome}`] = dados;
      if (widget) resultado.widget[modo] = widget;
      if (vp.nome === 'desktop') {
        await page.screenshot({ path: join(opts.saida, `${slug}-${modo}.png`), fullPage: false }).catch(() => {});
      }
    }
    await ctx.close();
  }
  return { slug, resultado };
}

function relatorio(slug, r) {
  const modos = Object.keys(r.modos);
  const blocos = new Set();
  modos.forEach((m) => r.modos[m].violacoes.forEach((v) => blocos.add(v.bloco)));
  const lista = [...blocos].sort();
  let md = `# Acessibilidade por modo e por bloco — ${r.url}\n\n`;
  md += `Gerado em ${new Date().toISOString()}. Violações do axe-core (WCAG 2.2 AA + boas práticas) agrupadas pelo bloco do EDS.\n\n`;
  md += `## Resumo (violações por modo × bloco)\n\n| bloco | ${modos.join(' | ')} |\n|---|${modos.map(() => '---').join('|')}|\n`;
  lista.forEach((b) => {
    md += `| ${b} | ${modos.map((m) => r.modos[m].violacoes.filter((v) => v.bloco === b).length || '·').join(' | ')} |\n`;
  });
  md += `| **total** | ${modos.map((m) => r.modos[m].violacoes.length).join(' | ')} |\n\n`;
  if (Object.keys(r.widget).length) {
    md += '## Widget (.a11y-widget)\n\n';
    Object.entries(r.widget).forEach(([m, w]) => {
      if (!w.existe) { md += `- ${m}: widget ausente na página\n`; return; }
      w.passos.forEach((p) => {
        md += `- ${m}: ${p.botao} → ${p.ausente ? 'botão ausente' : `classe=${p.classe} aria-pressed=${p.ariaPressed ?? '—'} storage=${p.storage}`}\n`;
      });
    });
    md += '\n';
  }
  md += '## Violações\n\n';
  modos.forEach((m) => {
    const d = r.modos[m];
    md += `### ${m} (classes: \`${d.classesRaiz || '—'}\`, fonte da raiz ${d.fonte}px)\n\n`;
    if (!d.violacoes.length) md += 'Nenhuma.\n\n';
    const porBloco = {};
    d.violacoes.forEach((v) => { (porBloco[v.bloco] = porBloco[v.bloco] || []).push(v); });
    Object.entries(porBloco).forEach(([b, vs]) => {
      md += `**${b}**\n\n`;
      vs.forEach((v) => {
        md += `- \`${v.regra}\` (${v.impacto}) \`${v.seletor}\` ${v.texto ? `"${v.texto}"` : ''}${v.cores ? `\n  - ${v.cores}` : ''}\n  - ${v.detalhe}\n`;
      });
      md += '\n';
    });
    if (d.comFundo && d.comFundo.length) {
      md += `Elementos com imagem de fundo e texto visível (só informação): ${d.comFundo.map((x) => `${x.bloco} \`${x.seletor}\``).join(', ')}\n\n`;
    }
  });
  return md;
}

(async () => {
  const opts = args();
  if (!opts.urls.length) {
    console.error('uso: node verificar-modos.mjs <url> [mais urls] [--widget] [--saida pasta]');
    process.exit(1);
  }
  mkdirSync(opts.saida, { recursive: true });
  const axeSrc = acharAxe(opts.axe);
  const browser = await chromium.launch();
  for (const url of opts.urls) {
    console.log('verificando', url);
    const { slug, resultado } = await verificarUrl(browser, url, opts, axeSrc);
    writeFileSync(join(opts.saida, `${slug}-relatorio.json`), JSON.stringify(resultado, null, 1));
    writeFileSync(join(opts.saida, `${slug}-relatorio.md`), relatorio(slug, resultado));
    const modos = Object.keys(resultado.modos);
    console.log(modos.map((m) => `${m}: ${resultado.modos[m].violacoes.length}`).join(' | '));
    console.log('relatório:', join(opts.saida, `${slug}-relatorio.md`));
  }
  await browser.close();
})();
