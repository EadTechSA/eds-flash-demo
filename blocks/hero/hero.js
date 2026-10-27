/*
 * Hero. Variante `video`: o pôster (do Assets) aparece sempre; o vídeo só
 * é inserido depois que a categoria autorada (CC_MEDIA) é aceita, e some
 * quando ela é revogada, sem recarregar. Nem um byte do vídeo sai antes.
 *
 * Linhas autoradas (ordem do modelo): imagem | texto | vídeo | categoria,
 * depois as linhas `chave | texto` dos rótulos do HUD.
 * No título, um <em> com palavras separadas por "|" vira a palavra rotativa.
 */
import { comGateCategoria } from '../../scripts/consent-gate.js';
import {
  agora, el, linhas, rotulos, texto,
} from '../../scripts/demo.js';
import { reduzido } from '../../scripts/motion.js';

function palavraRotativa(em) {
  const palavras = em.textContent.split('|').map((p) => p.trim()).filter(Boolean);
  if (palavras.length < 2) return;
  em.classList.add('hero-rotativa');
  let i = 0;
  const mostrar = (p, anima) => {
    const velho = em.firstElementChild;
    const novo = el('span', 'hero-rotativa-palavra');
    [...p].forEach((ch, k) => {
      const l = el('span', 'hero-letra', ch === ' ' ? '&nbsp;' : ch);
      l.style.setProperty('--i', k);
      novo.append(l);
    });
    em.textContent = '';
    if (velho && anima) {
      velho.classList.add('saindo');
      em.append(velho);
      setTimeout(() => velho.remove(), 500);
    }
    em.append(novo);
  };
  mostrar(palavras[0], false);
  if (reduzido) return;
  setInterval(() => {
    if (document.hidden) return;
    i = (i + 1) % palavras.length;
    mostrar(palavras[i], true);
  }, 2600);
}

function urlDoVideo(celula) {
  const a = celula && celula.querySelector('a');
  return a ? a.href : texto(celula);
}

function montarVideo(palco, url, hud, r) {
  let bytes = 0;
  let timer = 0;
  const video = el('video');
  video.playsInline = true;
  video.muted = true;
  video.loop = true;
  video.preload = 'auto';
  video.controls = true;
  video.src = url;
  palco.append(video);
  palco.dataset.estado = 'liberado';
  hud.estado.textContent = r('hud-liberado', 'ok');
  hud.bytes.textContent = '…';
  // bytes de verdade quando o navegador expõe; senão estima pelo buffer
  const medir = () => {
    try {
      const b = video.buffered;
      if (b.length && video.duration) {
        const frac = b.end(b.length - 1) / video.duration;
        bytes = Math.round(frac * (video.dataset.total || 4800));
        hud.bytes.textContent = bytes >= 1000 ? `${(bytes / 1000).toFixed(1)} MB` : `${bytes} KB`;
      }
    } catch (e) { /* sem buffer ainda */ }
    timer = window.setTimeout(medir, 400);
  };
  medir();
  video.play().catch(() => { /* autoplay bloqueado: fica o controle */ });
  window.dispatchEvent(new CustomEvent('demo:log', { detail: { texto: r('log-liberado', `CC_MEDIA → <video> ${agora()}`), tipo: 'ok' } }));
  return () => {
    clearTimeout(timer);
    video.pause();
    video.removeAttribute('src');
    video.load();
    video.remove();
    palco.dataset.estado = 'bloqueado';
    hud.estado.textContent = r('hud-bloqueado', 'gate');
    hud.bytes.textContent = '0 KB';
    window.dispatchEvent(new CustomEvent('demo:log', { detail: { texto: r('log-revogado', 'CC_MEDIA revogado'), tipo: 'alerta' } }));
  };
}

function montarEmbed(palco, url, hud, r) {
  const iframe = el('iframe');
  iframe.src = url;
  iframe.allow = 'autoplay; fullscreen; picture-in-picture';
  iframe.loading = 'lazy';
  iframe.title = r('titulo-video', 'Adobe');
  palco.append(iframe);
  palco.dataset.estado = 'liberado';
  hud.estado.textContent = r('hud-liberado', 'ok');
  hud.bytes.textContent = r('hud-embed', 'iframe');
  window.dispatchEvent(new CustomEvent('demo:log', { detail: { texto: r('log-liberado', 'CC_MEDIA → iframe'), tipo: 'ok' } }));
  return () => {
    iframe.remove();
    palco.dataset.estado = 'bloqueado';
    hud.estado.textContent = r('hud-bloqueado', 'gate');
    hud.bytes.textContent = '0 KB';
    window.dispatchEvent(new CustomEvent('demo:log', { detail: { texto: r('log-revogado', 'CC_MEDIA revogado'), tipo: 'alerta' } }));
  };
}

export default async function decorate(block) {
  const r = rotulos(block);
  const [imagem, textoCel, videoCel, categoriaCel] = linhas(block).map((c) => c[0]);
  const video = block.classList.contains('video') ? urlDoVideo(videoCel) : '';
  const categoria = texto(categoriaCel) || 'CC_MEDIA';
  block.textContent = '';

  const topo = el('div', 'hero-texto');
  if (textoCel) topo.append(...textoCel.childNodes);
  const h1 = topo.querySelector('h1');
  if (h1) {
    const em = h1.querySelector('em');
    if (em) palavraRotativa(em);
  }
  const selos = el('div', 'hero-selos');
  ['selo-1', 'selo-2'].forEach((k) => {
    if (r(k)) selos.append(el('span', 'selo', r(k)));
  });
  const seloConsent = el('span', 'selo inativo hero-selo-consent', r('selo-sem-consentimento', ''));
  if (r('selo-sem-consentimento')) selos.append(seloConsent);
  if (selos.children.length) topo.append(selos);
  block.append(topo);

  if (!block.classList.contains('video')) {
    if (imagem) block.prepend(imagem);
    return;
  }

  const palco = el('div', 'hero-palco');
  palco.dataset.estado = 'bloqueado';
  if (imagem) {
    const pic = imagem.querySelector('picture') || imagem;
    pic.classList.add('hero-poster');
    palco.append(pic);
  }
  const brilho = el('div', 'hero-brilho');
  palco.append(brilho);
  const hud = {
    bytes: el('span', 'selo hero-bytes', '0 KB'),
    estado: el('span', 'selo hero-estado', r('hud-bloqueado', 'gate')),
  };
  const fonte = el('span', 'selo hero-fonte', r('fonte', ''));
  const barra = el('div', 'hero-hud');
  barra.append(hud.bytes, hud.estado);
  const gateAlvo = el('div', 'hero-gate');
  palco.append(gateAlvo, barra);
  if (r('fonte')) palco.append(fonte);
  block.append(palco);

  // o holofote segue o ponteiro (só com mouse)
  if (!reduzido && window.matchMedia('(hover: hover)').matches) {
    palco.addEventListener('pointermove', (e) => {
      const rect = palco.getBoundingClientRect();
      palco.style.setProperty('--mx', `${((e.clientX - rect.left) / rect.width) * 100}%`);
      palco.style.setProperty('--my', `${((e.clientY - rect.top) / rect.height) * 100}%`);
    });
  }

  const ehEmbed = /youtube\.com|youtu\.be|video\.tv\.adobe\.com|vimeo\.com/.test(video);
  let desmontar = null;
  const montar = () => {
    if (!video) return;
    desmontar = ehEmbed ? montarEmbed(palco, video, hud, r) : montarVideo(palco, video, hud, r);
    seloConsent.classList.remove('inativo');
    seloConsent.textContent = r('selo-com-consentimento', seloConsent.textContent);
  };
  const tirar = () => {
    if (desmontar) desmontar();
    desmontar = null;
    seloConsent.classList.add('inativo');
    seloConsent.textContent = r('selo-sem-consentimento', '');
  };
  // o gate só roda depois do consentimento (fase delayed); até lá, pôster
  let ligado = false;
  const iniciar = () => {
    if (ligado) return;
    ligado = true;
    comGateCategoria(gateAlvo, categoria, montar, tirar);
  };
  if (window.consent) iniciar(); else window.addEventListener('consent', iniciar, { once: true });
  // sem escolha ainda, consent-check não dispara `consent`: liga o gate mesmo assim
  window.setTimeout(iniciar, 3600);
}
