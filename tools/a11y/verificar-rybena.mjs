#!/usr/bin/env node
/*
 * Prova em navegador que cada bloco continua ligado ao Rybená.
 *
 * Abre a página, carrega o script oficial do Rybená (o mesmo que o Bradesco usa)
 * em `mode=api` e liga cada modo pela API documentada
 * (RybenaApi.getInstance().startX() e stopX(), após handleLoaded;
 * docs.rybena.com.br/docs/api/accessibility-features). Para cada
 * bloco do EDS (e cabeçalho e rodapé) mede:
 *  - cobertura: todo texto visível do bloco recebeu a classe do modo
 *    (o Rybená marca elemento por elemento; texto sem a classe ficou de fora);
 *  - contraste (modos escuro e claro): razão WCAG de cada texto contra o fundo
 *    efetivo, sem imagem/gradiente atrás (4,5:1; 3:1 para texto grande);
 *  - filtro (invertido e saturação): o filtro do Rybená está valendo na raiz;
 *  - transbordo (fontes e espaçamentos): o bloco não ganhou rolagem lateral.
 *
 * Uso: AEM_SITE_TOKEN=... node tools/a11y/verificar-rybena.mjs <url> [mais urls] [--saida pasta]
 * AEM_SITE_TOKEN: só enquanto o site estiver fechado (cabeçalho Authorization).
 * RYBENA_TOKEN: token de domínio do Rybená, quando o domínio testado não é o
 * contratado (a autenticação padrão é pelo Referer). Nunca no repositório.
 */
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const { chromium } = createRequire(import.meta.url)('playwright');

const SCRIPT_RYBENA = `https://cdn.rybena.com.br/dom/master/latest/rybena.js?mode=api${process.env.RYBENA_TOKEN ? `&token=${encodeURIComponent(process.env.RYBENA_TOKEN)}` : ''}`;

// modo (sufixo da API start*/stop*) → como verificar
const MODOS = {
  DarkContrast: { classe: 'rybDarkContrast', contraste: true },
  LightContrast: { classe: 'rybLightContrast', contraste: true },
  InvertedContrast: { filtro: 'invert' },
  NoSaturation: { filtro: 'saturate' },
  HighSaturation: { filtro: 'saturate' },
  LowSaturation: { filtro: 'saturate' },
  DislexiaFont: { classe: 'rybDislexia', transbordo: true },
  LetterSpacing: { classe: 'rybLetterSpacing1', transbordo: true },
  LineHeight: { classe: 'rybLineHeigth1', transbordo: true },
  TitleHighlight: { classe: 'rybDestacarTitulos', alvo: 'h1,h2,h3,h4,h5,h6' },
  LinkHighlight: { classe: 'rybLinkContrast-link', alvo: 'a[href]' },
};

const args = process.argv.slice(2);
const urls = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--saida');
const saida = args.includes('--saida') ? args[args.indexOf('--saida') + 1] : './a11y-relatorios';

/* roda dentro da página: mede um modo em todos os blocos */
function medir({ classe, contraste, filtro, transbordo, alvo }) {
  const lum = (c) => {
    const [r, g, b] = c.match(/[\d.]+/g).slice(0, 3).map(Number).map((v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const alfa = (c) => { const p = c.match(/[\d.]+/g) || []; return p.length > 3 ? Number(p[3]) : 1; };
  const fundo = (e) => {
    for (let n = e; n && n.nodeType === 1; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (cs.backgroundImage !== 'none') return { imagem: true };
      if (alfa(cs.backgroundColor) > 0.5) return { cor: cs.backgroundColor };
    }
    return { cor: 'rgb(255, 255, 255)' };
  };
  const visivel = (e) => {
    const r = e.getBoundingClientRect();
    const cs = getComputedStyle(e);
    return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && !e.closest('[aria-hidden="true"]');
  };
  const nomeDe = (e) => e.closest('[data-block-name]')?.dataset.blockName || (e.closest('header') ? 'header' : 'footer');
  const caminho = (e) => `${e.tagName.toLowerCase()}${e.classList.length ? `.${[...e.classList].filter((c) => !/^ryb/i.test(c)).slice(0, 2).join('.')}` : ''}`;

  const blocos = [...document.querySelectorAll('main .block[data-block-name], header, footer')]
    .filter((b) => !b.parentElement.closest('main .block[data-block-name]'));
  const raiz = getComputedStyle(document.documentElement).filter;

  return blocos.map((b) => {
    const r = { bloco: nomeDe(b), textos: 0, semClasse: [], contraste: [] };
    const textos = [...b.querySelectorAll('*')].filter((e) => !e.closest('[id^="rybena"], .ryb-ignore')
      && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && visivel(e));
    r.textos = textos.length;
    if (classe) {
      const alvos = alvo ? [...b.querySelectorAll(alvo)].filter(visivel) : textos;
      r.semClasse = alvos.filter((e) => !e.classList.contains(classe)).map(caminho).slice(0, 10);
      r.alvos = alvos.length;
    }
    if (contraste) {
      textos.forEach((e) => {
        const cs = getComputedStyle(e);
        const f = fundo(e);
        if (f.imagem) { r.contraste.push({ el: caminho(e), motivo: 'imagem ou gradiente de fundo' }); return; }
        const [l1, l2] = [lum(cs.color), lum(f.cor)].sort((x, y) => y - x);
        const razao = (l1 + 0.05) / (l2 + 0.05);
        const grande = parseFloat(cs.fontSize) >= 24 || (parseFloat(cs.fontSize) >= 18.66 && Number(cs.fontWeight) >= 700);
        if (razao < (grande ? 3 : 4.5)) r.contraste.push({ el: caminho(e), motivo: `${razao.toFixed(2)}:1 (${cs.color} sobre ${f.cor})` });
      });
      r.contraste = r.contraste.slice(0, 10);
    }
    if (filtro) r.filtro = raiz.includes(filtro) ? 'ok' : `filtro da raiz é "${raiz}"`;
    if (transbordo) r.transbordo = b.scrollWidth > b.clientWidth + 1 ? `${b.scrollWidth - b.clientWidth}px de rolagem lateral` : 'ok';
    r.ok = !r.semClasse.length && !r.contraste.length && (!filtro || r.filtro === 'ok') && (!transbordo || r.transbordo === 'ok');
    return r;
  });
}

async function verificar(browser, url, viewport) {
  const headers = process.env.AEM_SITE_TOKEN ? { authorization: `token ${process.env.AEM_SITE_TOKEN}` } : {};
  const ctx = await browser.newContext({ viewport, extraHTTPHeaders: headers });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'networkidle', timeout: 90000 }).catch(() => {});
  await page.waitForTimeout(3000);
  await page.addScriptTag({ url: SCRIPT_RYBENA });
  await page.waitForFunction(() => window.RybenaApi?.getInstance, null, { timeout: 60000 });
  await page.evaluate(() => new Promise((ok) => { window.RybenaApi.getInstance().handleLoaded(ok); }));
  await page.waitForTimeout(1000);
  const res = {};
  for (const [modo, cfg] of Object.entries(MODOS)) {
    await page.evaluate((m) => window.RybenaApi.getInstance()[`start${m}`](), modo);
    await page.waitForTimeout(1800);
    res[modo] = await page.evaluate(medir, cfg);
    await page.evaluate((m) => window.RybenaApi.getInstance()[`stop${m}`](), modo);
    await page.waitForTimeout(800);
  }
  await ctx.close();
  return res;
}

function relatorio(url, porViewport) {
  let md = `# Rybená por bloco: ${url}\n\nGerado em ${new Date().toISOString()} com o script oficial do Rybená e a API documentada RybenaApi.\n\n`;
  Object.entries(porViewport).forEach(([vp, modos]) => {
    const blocos = [...new Set(Object.values(modos).flat().map((r) => r.bloco))];
    md += `## ${vp}\n\n| bloco | ${Object.keys(modos).join(' | ')} |\n|---|${Object.keys(modos).map(() => '---').join('|')}|\n`;
    blocos.forEach((b) => {
      md += `| ${b} | ${Object.values(modos).map((rs) => { const r = rs.find((x) => x.bloco === b); return !r ? '·' : (r.ok ? 'ok' : 'falha'); }).join(' | ')} |\n`;
    });
    md += '\n';
    Object.entries(modos).forEach(([m, rs]) => rs.filter((r) => !r.ok).forEach((r) => {
      md += `- **${m} · ${r.bloco}**${r.semClasse.length ? ` sem a classe do Rybená: ${r.semClasse.join(', ')}` : ''}${r.contraste.length ? ` contraste: ${r.contraste.map((c) => `${c.el} ${c.motivo}`).join('; ')}` : ''}${r.filtro && r.filtro !== 'ok' ? ` ${r.filtro}` : ''}${r.transbordo && r.transbordo !== 'ok' ? ` ${r.transbordo}` : ''}\n`;
    }));
    md += '\n';
  });
  return md;
}

(async () => {
  if (!urls.length) {
    console.error('uso: AEM_SITE_TOKEN=... node tools/a11y/verificar-rybena.mjs <url> [mais urls] [--saida pasta]');
    process.exit(1);
  }
  mkdirSync(saida, { recursive: true });
  const browser = await chromium.launch();
  let falhas = 0;
  for (const url of urls) {
    const porViewport = {
      desktop: await verificar(browser, url, { width: 1400, height: 900 }),
      celular: await verificar(browser, url, { width: 390, height: 844 }),
    };
    const slug = new URL(url).pathname.replace(/\W+/g, '-').replace(/^-|-$/g, '') || 'home';
    writeFileSync(join(saida, `rybena-${slug}.json`), JSON.stringify(porViewport, null, 1));
    writeFileSync(join(saida, `rybena-${slug}.md`), relatorio(url, porViewport));
    const n = Object.values(porViewport).flatMap((m) => Object.values(m).flat()).filter((r) => !r.ok).length;
    falhas += n;
    console.log(`${url}: ${n ? `${n} falha(s)` : 'ok'} → ${join(saida, `rybena-${slug}.md`)}`);
  }
  await browser.close();
  process.exit(falhas ? 1 : 0);
})();
