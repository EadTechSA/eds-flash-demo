/*
 * Cabeçalho da demo, carregado do fragmento /nav. Seções do fragmento:
 *  1. faixa de aviso (bloco `aviso`: uso exclusivo + idiomas),
 *  2. marca (imagem ou texto + subtítulo),
 *  3. menu: lista de grupos (rótulo + lista de páginas), cada grupo vira
 *     um botão que abre o painel com as páginas dele,
 *  4. ferramentas (link #definicoes-de-cookies).
 * A barra fica fixa, com a página atual marcada e a linha de progresso.
 */
import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

const caminho = (u) => new URL(u, window.location.href).pathname.replace(/\/(index)?$/, '') || '/';

/**
 * Cada item do menu com sublista vira um grupo: o rótulo vira botão
 * (aria-expanded) e a sublista, o painel. A página atual ganha
 * aria-current e marca o grupo dela.
 */
function grupos(links) {
  const aqui = caminho(window.location.href);
  const botoes = [];
  const fechar = (exceto) => botoes.forEach((b) => {
    if (b !== exceto) b.setAttribute('aria-expanded', 'false');
  });
  links.querySelectorAll('a[href]').forEach((a) => {
    if (caminho(a.href) === aqui) a.setAttribute('aria-current', 'page');
  });
  [...links.querySelectorAll(':scope ul')].filter((ul) => !ul.parentElement.closest('ul'))
    .forEach((topo) => [...topo.children].forEach((li, i) => {
      const sub = li.querySelector(':scope > ul');
      if (!sub) return;
      const rotulo = li.querySelector(':scope > p') || li.firstChild;
      const b = document.createElement('button');
      b.type = 'button';
      b.classList.add('header-grupo');
      b.textContent = (rotulo?.textContent || '').trim();
      b.setAttribute('aria-expanded', 'false');
      sub.id = sub.id || `header-painel-${i}`;
      sub.classList.add('header-painel');
      b.setAttribute('aria-controls', sub.id);
      if (rotulo) rotulo.replaceWith(b); else li.prepend(b);
      li.classList.add('header-item-grupo');
      if (sub.querySelector('[aria-current]')) b.classList.add('ativo');
      b.addEventListener('click', () => {
        const abrir = b.getAttribute('aria-expanded') !== 'true';
        fechar(b);
        b.setAttribute('aria-expanded', String(abrir));
      });
      // no desktop, o painel também abre ao passar o ponteiro
      li.addEventListener('pointerenter', (e) => {
        if (e.pointerType === 'mouse' && window.matchMedia('(width >= 900px)').matches) {
          fechar(b);
          b.setAttribute('aria-expanded', 'true');
        }
      });
      li.addEventListener('pointerleave', (e) => {
        if (e.pointerType === 'mouse' && window.matchMedia('(width >= 900px)').matches) b.setAttribute('aria-expanded', 'false');
      });
      botoes.push(b);
    }));
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const aberto = botoes.find((b) => b.getAttribute('aria-expanded') === 'true');
    if (aberto) {
      fechar();
      aberto.focus();
    }
  });
  document.addEventListener('click', (e) => {
    if (!links.contains(e.target)) fechar();
  });
  links.addEventListener('focusout', (e) => {
    if (e.relatedTarget && !links.contains(e.relatedTarget)) fechar();
  });
}

export default async function decorate(block) {
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);
  block.textContent = '';
  const secoes = [...fragment.children];
  const faixa = secoes.find((s) => s.querySelector('.aviso'));
  if (faixa) {
    faixa.classList.add('header-faixa');
    block.append(faixa);
  }
  const barra = document.createElement('div');
  barra.classList.add('header-barra');
  // widget de acessibilidade: seção própria do /nav, fica flutuando fora da barra
  const a11y = secoes.find((s) => s.querySelector('.acessibilidade'));
  const resto = secoes.filter((s) => s !== faixa && s !== a11y);
  const nomes = ['header-marca', 'header-links', 'header-ferramentas'];
  resto.slice(0, 3).forEach((s, i) => {
    s.classList.remove(...s.classList);
    s.classList.add(nomes[i]);
    barra.append(s);
  });
  const progresso = document.createElement('i');
  progresso.classList.add('header-progresso');
  barra.append(progresso);
  block.append(barra);
  if (a11y) {
    const widget = a11y.querySelector('.acessibilidade');
    block.append(widget);
  }

  const links = barra.querySelector('.header-links');
  if (links) grupos(links);

  // botão hambúrguer no celular
  if (links) {
    const b = document.createElement('button');
    b.type = 'button';
    b.classList.add('header-menu');
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
  }

  // progresso de leitura
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
}
