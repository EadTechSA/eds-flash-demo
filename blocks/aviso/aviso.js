/*
 * Faixa do topo: aviso de uso (autorado) e os links de idioma. Os links
 * são conteúdo: cada idioma é uma página (/, /es/, /en/), e o link da
 * página atual fica marcado.
 * Linhas: aviso | idiomas (links).
 */
import { el, linhas } from '../../scripts/demo.js';

export default function decorate(block) {
  const [avisoCel, idiomasCel] = linhas(block).map((c) => c[0]);
  block.textContent = '';
  const txt = el('div', 'aviso-texto');
  if (avisoCel) txt.append(...avisoCel.childNodes);
  const nav = el('nav', 'aviso-idiomas');
  nav.setAttribute('aria-label', 'Idiomas');
  if (idiomasCel) {
    idiomasCel.querySelectorAll('a').forEach((a) => {
      a.classList.remove(...a.classList);
      const atual = new URL(a.href, window.location.href).pathname.replace(/\/$/, '') === window.location.pathname.replace(/\/(index)?$/, '');
      if (atual) a.setAttribute('aria-current', 'page');
      a.setAttribute('hreflang', (a.textContent.trim().toLowerCase() === 'pt') ? 'pt-BR' : a.textContent.trim().toLowerCase());
      nav.append(a);
    });
  }
  block.append(txt, nav);
}
