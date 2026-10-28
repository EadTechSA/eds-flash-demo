import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/*
 * Rodapé carregado do fragmento /footer. Seções do fragmento:
 *  1. marca e uma linha sobre o site,
 *  2. mapa do site (lista de grupos, cada um com as páginas dele),
 *  3. base: aviso, Definições de cookies e idiomas.
 */
export default async function decorate(block) {
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const fragment = await loadFragment(footerPath);

  block.textContent = '';
  const footer = document.createElement('div');
  const secoes = [...fragment.children];
  const nomes = ['footer-marca', 'footer-mapa', 'footer-base'];
  secoes.forEach((s, i) => {
    if (nomes[i]) s.classList.add(nomes[i]);
    footer.append(s);
  });
  const mapa = footer.querySelector('.footer-mapa');
  if (mapa) {
    const nav = document.createElement('nav');
    // o primeiro parágrafo (fora da lista) é o nome do mapa: vira o rótulo do nav
    const rotulo = mapa.querySelector('.default-content-wrapper > p');
    if (rotulo) {
      nav.setAttribute('aria-label', rotulo.textContent.trim());
      rotulo.remove();
    }
    while (mapa.firstChild) nav.append(mapa.firstChild);
    mapa.append(nav);
  }
  block.append(footer);
}
