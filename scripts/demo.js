/*
 * Utilidades dos blocos de demonstração: leitura de linhas autoradas,
 * rótulos por chave (texto visível vem do conteúdo, nunca do código),
 * estado do consentimento e relógio para os logs.
 */

/** Linhas do bloco como arrays de células (elementos). */
export function linhas(block) {
  return [...block.children].map((l) => [...l.children]);
}

/** Texto de uma célula, ou ''. */
export function texto(celula) {
  return celula ? celula.textContent.trim() : '';
}

/**
 * Rótulos autorados: linhas `chave | texto` viram um mapa; devolve uma
 * função `r(chave, padrao)` e remove essas linhas do bloco.
 * Linhas com mais ou menos de duas células ficam para o bloco tratar.
 */
export function rotulos(block) {
  const mapa = {};
  [...block.children].forEach((l) => {
    const cels = [...l.children];
    if (cels.length !== 2) return;
    const chave = texto(cels[0]);
    if (!/^[a-z][a-z0-9-]*$/.test(chave)) return;
    mapa[chave] = cels[1].innerHTML.trim().replace(/^<p>|<\/p>$/g, '');
    l.remove();
  });
  const r = (chave, padrao = '') => (mapa[chave] !== undefined ? mapa[chave] : padrao);
  r.mapa = mapa;
  return r;
}

/** Categorias aceitas agora (do módulo de consentimento ou do storage). */
export function categoriasAceitas() {
  if (window.consent && Array.isArray(window.consent.categories)) return window.consent.categories;
  try {
    const salvo = JSON.parse(localStorage.getItem('aem-consent'));
    if (salvo && Array.isArray(salvo.categorias)) return salvo.categorias;
  } catch (e) { /* sem storage */ }
  return [];
}

export function escolhaGravada() {
  try {
    return JSON.parse(localStorage.getItem('aem-consent'));
  } catch (e) {
    return null;
  }
}

export function agora() {
  const d = new Date();
  return `${d.toTimeString().slice(0, 8)}.${String(d.getMilliseconds()).padStart(3, '0')}`;
}

/** Cria elemento com classe e html. */
export function el(tag, classe, html) {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (html !== undefined) e.innerHTML = html;
  return e;
}

/**
 * Adia a montagem de um bloco pesado até ele se aproximar da janela
 * (800 px antes). Até lá o bloco fica invisível com altura reservada,
 * o que poupa o processamento inicial da página sem deslocar o layout.
 */
export function adiar(block, montar) {
  if (!('IntersectionObserver' in window)) {
    montar();
    return;
  }
  block.setAttribute('data-adiado', '');
  const obs = new IntersectionObserver((es) => {
    if (!es[0].isIntersecting) return;
    obs.disconnect();
    block.removeAttribute('data-adiado');
    montar();
  }, { rootMargin: '800px 0px' });
  obs.observe(block);
}
