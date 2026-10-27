/*
 * Cabeçalho da demo, carregado do fragmento /nav. Seções do fragmento:
 *  1. faixa de aviso (bloco `aviso`: uso exclusivo + idiomas),
 *  2. marca (imagem ou texto + subtítulo),
 *  3. links das seções da página,
 *  4. ferramentas (link #definicoes-de-cookies).
 * A barra fica fixa, com a seção visível marcada e a linha de progresso.
 */
import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

export default async function decorate(block) {
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);
  block.textContent = '';
  const secoes = [...fragment.children];
  const faixa = secoes.find((s) => s.querySelector('.aviso'));
  if (faixa) {
    faixa.className = 'header-faixa';
    block.append(faixa);
  }
  const barra = document.createElement('div');
  barra.className = 'header-barra';
  // widget de acessibilidade: seção própria do /nav, fica flutuando fora da barra
  const a11y = secoes.find((s) => s.querySelector('.acessibilidade'));
  const resto = secoes.filter((s) => s !== faixa && s !== a11y);
  const nomes = ['header-marca', 'header-links', 'header-ferramentas'];
  resto.slice(0, 3).forEach((s, i) => {
    s.className = nomes[i];
    barra.append(s);
  });
  const progresso = document.createElement('i');
  progresso.className = 'header-progresso';
  barra.append(progresso);
  block.append(barra);
  if (a11y) {
    const widget = a11y.querySelector('.acessibilidade');
    block.append(widget);
  }

  // botão hambúrguer no celular
  const links = barra.querySelector('.header-links');
  if (links) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'header-menu';
    b.setAttribute('aria-expanded', 'false');
    b.setAttribute('aria-controls', 'header-links');
    b.setAttribute('aria-label', links.dataset.menu || 'Menu');
    b.innerHTML = '<span></span><span></span><span></span>';
    links.id = 'header-links';
    b.addEventListener('click', () => {
      const aberto = b.getAttribute('aria-expanded') === 'true';
      b.setAttribute('aria-expanded', String(!aberto));
      barra.classList.toggle('aberta', !aberto);
    });
    links.before(b);
    links.addEventListener('click', (e) => {
      if (e.target.closest('a')) {
        b.setAttribute('aria-expanded', 'false');
        barra.classList.remove('aberta');
      }
    });
  }

  // seção ativa e progresso de leitura
  let agendado = false;
  const medir = () => {
    agendado = false;
    const h = document.documentElement;
    const total = h.scrollHeight - h.clientHeight;
    progresso.style.transform = `scaleX(${total > 0 ? Math.min(1, h.scrollTop / total) : 0})`;
  };
  window.addEventListener('scroll', () => {
    if (!agendado) {
      agendado = true;
      requestAnimationFrame(medir);
    }
  }, { passive: true });
  medir();
  if ('IntersectionObserver' in window && links) {
    const obs = new IntersectionObserver((es) => {
      es.forEach((e) => {
        if (!e.isIntersecting) return;
        links.querySelectorAll('a').forEach((a) => a.classList.toggle('ativo', a.getAttribute('href') === `#${e.target.id}`));
      });
    }, { rootMargin: '-35% 0px -55% 0px' });
    const ligar = () => document.querySelectorAll('main .section[id]').forEach((s) => obs.observe(s));
    // as seções ganham id no motion.js; liga quando a página terminar de carregar
    if (document.readyState === 'complete') ligar(); else window.addEventListener('load', ligar);
  }
}
