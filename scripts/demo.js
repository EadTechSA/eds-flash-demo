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

/** Cria elemento com classe e html. */
export function el(tag, classe, html) {
  const e = document.createElement(tag);
  if (classe) e.classList.add(...String(classe).split(/\s+/).filter(Boolean));
  if (html !== undefined) e.innerHTML = html;
  return e;
}

/**
 * Página aberta no author (Universal Editor ou prévia do author): sem
 * animação, sem adiamento e com os textos da interface à vista para editar.
 */
export const emEditor = /\.adobeaemcloud\.com$/.test(window.location.hostname);

const INSTRUMENTACAO = /^data-(aue|richtext)-/;

/**
 * Leva a marcação do Universal Editor (data-aue-*, data-richtext-*) de uma
 * linha ou célula autorada para o elemento que o bloco desenhou no lugar.
 * Sem isso o item deixa de ser clicável e o campo não se edita na página.
 */
export function marcar(de, para) {
  if (!de || !para || de === para) return para;
  [...de.attributes].filter((a) => INSTRUMENTACAO.test(a.name)).forEach((a) => {
    para.setAttribute(a.name, a.value);
    de.removeAttribute(a.name);
  });
  return para;
}

/** Elemento novo com o texto de uma célula, levando a instrumentação dela. */
export function campo(celula, tag, classe) {
  const e = el(tag, classe);
  if (!celula) return e;
  e.textContent = celula.textContent.trim();
  return marcar(celula, e);
}

/** Conteúdo rico de uma célula dentro de `destino`, com a instrumentação. */
export function conteudo(celula, destino) {
  if (!celula) return destino;
  const filhos = [...celula.childNodes];
  const instrumentada = [...celula.attributes].some((x) => INSTRUMENTACAO.test(x.name));
  if (filhos.some((n) => n.nodeType === 1)) {
    if (instrumentada && destino.childNodes.length) {
      // o destino já tem outras coisas: o campo ganha a própria caixa
      const caixa = el('div', 'campo-rico');
      caixa.append(...filhos);
      destino.append(marcar(celula, caixa));
    } else {
      destino.append(...filhos);
      marcar(celula, destino);
    }
  } else if (celula.textContent.trim()) {
    const p = document.createElement('p');
    p.append(...filhos);
    marcar(celula, p);
    destino.append(p);
  } else {
    marcar(celula, destino);
  }
  return destino;
}

/**
 * Campos do bloco (não os itens): as primeiras `n` linhas, na ordem do
 * modelo, cada uma com uma célula. Remove as linhas e devolve as células.
 */
export function campos(block, n) {
  const ls = [...block.children].slice(0, n);
  const cels = ls.map((l) => l.firstElementChild || l);
  ls.forEach((l) => l.remove());
  return cels;
}

/**
 * Abertura em três campos (sobretítulo, título, texto), montada num div
 * novo (classe) ou dentro de um elemento que o bloco já criou.
 * Cada parte continua editável no lugar.
 */
export function abertura([sobre, titulo, txt], classe, nivel = 'h2') {
  const d = classe instanceof Element ? classe : el('div', classe);
  if (sobre && sobre.textContent.trim()) d.append(campo(sobre, 'p', 'sobretitulo'));
  if (titulo && titulo.textContent.trim()) d.append(campo(titulo, nivel));
  if (txt) conteudo(txt, d);
  return d;
}

/**
 * Rótulos autorados: linhas `chave | texto` viram um mapa; devolve uma
 * função `r(chave, padrao)` e remove essas linhas do bloco.
 * No editor, as linhas voltam numa caixa "Textos da interface" ao fim do
 * bloco, clicáveis, para o autor achar e trocar qualquer texto de botão,
 * legenda ou mensagem sem procurar na árvore.
 */
export function rotulos(block) {
  const mapa = {};
  const guardadas = [];
  [...block.children].forEach((l) => {
    const cels = [...l.children];
    if (cels.length !== 2) return;
    const chave = texto(cels[0]);
    if (!/^[a-z][a-z0-9-]*$/.test(chave)) return;
    mapa[chave] = cels[1].innerHTML.trim().replace(/^<p>|<\/p>$/g, '');
    l.remove();
    guardadas.push(l);
  });
  const r = (chave, padrao = '') => (mapa[chave] !== undefined ? mapa[chave] : padrao);
  r.mapa = mapa;
  if (emEditor && guardadas.length) {
    // depois que o bloco terminar de se desenhar
    const anexar = () => {
      if (block.querySelector(':scope > .textos-interface')) return;
      const caixa = el('details', 'textos-interface');
      caixa.innerHTML = `<summary>${mapa['editor-titulo'] || 'Textos da interface'} <small>(${guardadas.length})</small></summary>`;
      const lista = el('div', 'textos-interface-lista');
      guardadas.forEach((l) => {
        l.classList.add('textos-interface-linha');
        lista.append(l);
      });
      caixa.append(lista);
      block.append(caixa);
    };
    const obs = new MutationObserver(() => {
      if (block.dataset.blockStatus === 'loaded') {
        obs.disconnect();
        anexar();
      }
    });
    obs.observe(block, { attributes: true, attributeFilter: ['data-block-status'] });
  }
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

/**
 * Adia a montagem de um bloco pesado até ele se aproximar da janela
 * (800 px antes). Até lá o bloco fica invisível com altura reservada,
 * o que poupa o processamento inicial da página sem deslocar o layout.
 */
export function adiar(block, montar) {
  if (emEditor || !('IntersectionObserver' in window)) {
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
