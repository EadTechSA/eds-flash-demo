/*
 * Assets e Dynamic Media: a mesma imagem do DAM em três proporções, com o
 * ponto de interesse ajustável (com Dynamic Media isso é o perfil de smart
 * crop; sem ele, object-position sobre a mesma imagem, rotulado como
 * simulação), e o construtor de rendition por URL (largura, qualidade,
 * formato) com estimativa de peso.
 * Linhas: imagem | url base (DM OpenAPI, opcional) | original em KB,
 * mais rótulos `chave | texto`.
 */
import {
  agora, el, linhas, rotulos, texto,
} from '../../scripts/demo.js';
import { revelar } from '../../scripts/motion.js';

const FATOR = { avif: 0.055, webp: 0.085, jpg: 0.13 };

export default function decorate(block) {
  const r = rotulos(block);
  const [imagemCel, urlCel, originalCel] = linhas(block).map((c) => c[0]);
  const pic = imagemCel && imagemCel.querySelector('picture');
  const img = pic && pic.querySelector('img');
  const srcBase = img ? img.getAttribute('src').replace(/\?.*$/, '') : '';
  const urlBase = texto(urlCel);
  const original = parseInt(texto(originalCel), 10) || 2400;
  const temDM = !!urlBase;
  block.textContent = '';

  const grade = el('div', 'dm-grade');

  // painel 1: smart crop
  const p1 = el('div', 'painel dm-recortes');
  const h1 = el('h3');
  h1.append(el('span', '', r('recorte-titulo', 'smart crop')), el('span', `selo${temDM ? '' : ' inativo'}`, temDM ? r('recorte-real', 'Dynamic Media') : r('recorte-simulado', 'simulação')));
  const recortes = el('div', 'dm-recortes-grade');
  const proporcoes = [['16-9', '16:9', r('recorte-hero', 'hero')], ['1-1', '1:1', r('recorte-card', 'card')], ['9-16', '9:16', r('recorte-stories', 'stories')]];
  proporcoes.forEach(([cls, prop, nome]) => {
    const c = el('div', `dm-recorte dm-r${cls}`);
    if (img) {
      const i = el('img');
      i.src = img.currentSrc || img.src;
      i.alt = img.alt;
      i.loading = 'lazy';
      c.append(i);
    }
    c.append(el('span', 'dm-moldura'), el('span', 'selo dm-rotulo', `${prop} · ${nome}`));
    recortes.append(c);
  });
  const foco = el('input');
  foco.type = 'range';
  foco.min = '10';
  foco.max = '90';
  foco.value = '55';
  foco.setAttribute('aria-label', r('sujeito', 'foco'));
  const focoLinha = el('label', 'dm-controle');
  focoLinha.append(el('span', '', r('sujeito', 'foco')), foco);
  const aplicarFoco = () => {
    recortes.querySelectorAll('img').forEach((i) => { i.style.objectPosition = `${foco.value}% 45%`; });
  };
  foco.addEventListener('input', aplicarFoco);
  aplicarFoco();
  const trocar = el('button', 'button', r('trocar', 'swap'));
  trocar.type = 'button';
  const trocaNota = el('span', 'dm-nota', r('trocar-nota', ''));
  const acoes = el('div', 'dm-acoes');
  acoes.append(trocar, trocaNota);
  let filtro = 0;
  const filtros = ['none', 'hue-rotate(160deg)', 'hue-rotate(260deg) saturate(1.3)', 'grayscale(1) contrast(1.2)'];
  trocar.addEventListener('click', () => {
    filtro = (filtro + 1) % filtros.length;
    recortes.querySelectorAll('img').forEach((i) => { i.style.filter = filtros[filtro]; });
    trocaNota.textContent = `${r('trocar-feito', 'ok')} ${agora().slice(0, 8)}`;
    window.dispatchEvent(new CustomEvent('demo:log', { detail: { texto: r('trocar-log', 'DAM swap'), tipo: 'ok' } }));
  });
  p1.append(h1, recortes, focoLinha, acoes, el('p', '', r('recorte-nota', '')));

  // painel 2: rendition por URL
  const p2 = el('div', 'painel dm-url');
  p2.append(el('h3', '', r('url-titulo', 'URL')));
  const controles = el('div', 'dm-controles');
  const faixa = (chave, min, max, passo, val) => {
    const i = el('input');
    i.type = 'range';
    i.min = min;
    i.max = max;
    i.step = passo;
    i.value = val;
    i.setAttribute('aria-label', r(chave, chave));
    const o = el('output', '', val);
    const l = el('label', 'dm-controle dm-controle-3');
    l.append(el('span', '', r(chave, chave)), i, o);
    controles.append(l);
    return [i, o];
  };
  const [larg, oLarg] = faixa('largura', 200, 2400, 100, 1200);
  const [qual, oQual] = faixa('qualidade', 40, 100, 5, 80);
  const seg = el('div', 'segmentos');
  let fmt = 'avif';
  ['avif', 'webp', 'jpg'].forEach((f) => {
    const b = el('button', f === fmt ? 'ativo' : '', f.toUpperCase());
    b.type = 'button';
    b.addEventListener('click', () => {
      fmt = f;
      seg.querySelectorAll('button').forEach((x) => x.classList.toggle('ativo', x === b));
      // eslint-disable-next-line no-use-before-define
      atualizar();
    });
    seg.append(b);
  });
  const lFmt = el('div', 'dm-controle');
  lFmt.append(el('span', '', r('formato', 'formato')), seg);
  controles.append(lFmt);
  const saida = el('div', 'codigo dm-saida');
  const peso = el('div', 'dm-peso');
  const kb = el('span', 'grande', '—');
  peso.append(kb, el('span', 'dm-nota', `${r('kb', 'KB')} · ${r('original', 'original')} ${original.toLocaleString('pt-BR')} KB`));
  const trilho = el('div', 'dm-trilho');
  const barra = el('i');
  trilho.append(barra);
  const previa = el('img', 'dm-previa');
  previa.alt = '';
  previa.loading = 'lazy';
  const atualizar = () => {
    const w = +larg.value;
    const q = +qual.value;
    oLarg.textContent = w;
    oQual.textContent = q;
    const est = Math.round(((w * w * 0.5625) / 1000) * FATOR[fmt] * (q / 80));
    kb.textContent = est.toLocaleString('pt-BR');
    barra.style.width = `${Math.min(100, (est / original) * 100)}%`;
    const url = temDM
      ? `${urlBase.replace(/\.[a-z]+$/i, '')}.${fmt}?width=${w}&quality=${q}&smartcrop=Hero`
      : `${srcBase}?width=${w}&format=${fmt === 'jpg' ? 'jpeg' : fmt}&optimize=medium`;
    saida.innerHTML = url
      .replace(/(width=\d+)/, '<b class="g">$1</b>')
      .replace(/(quality=\d+|optimize=\w+)/, '<b class="g">$1</b>')
      .replace(/(format=\w+|\.(avif|webp|jpg)\?)/, '<b class="b">$1</b>');
    if (srcBase || temDM) previa.src = url;
  };
  larg.addEventListener('input', atualizar);
  qual.addEventListener('input', atualizar);
  atualizar();
  p2.append(controles, saida, peso, trilho, previa, el('p', '', r('url-nota', '')));

  grade.append(p1, p2);
  block.append(grade);
  revelar(p1);
  revelar(p2, 100);
}
