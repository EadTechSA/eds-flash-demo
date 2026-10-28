/*
 * Movimento sem biblioteca: revelação por IntersectionObserver, títulos
 * palavra a palavra, contadores, rolagem fixada e pontos laterais.
 * Tudo respeita prefers-reduced-motion. Os blocos importam daqui.
 */

// no editor (author) tudo fica parado e visível: o autor precisa ver e clicar
const noAuthor = /\.adobeaemcloud\.com$/.test(window.location.hostname);
export const reduzido = noAuthor || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const largo = () => window.matchMedia('(min-width: 900px)').matches;

const io = ('IntersectionObserver' in window)
  ? new IntersectionObserver((entradas) => {
    entradas.forEach((e) => {
      if (e.isIntersecting) {
        e.target.setAttribute('data-visivel', '');
        io.unobserve(e.target);
      }
    });
  }, { rootMargin: '0px 0px -12% 0px' })
  : null;

/** Marca o elemento para revelar quando entrar na tela. */
export function revelar(el, atraso = 0) {
  if (reduzido || !io) return;
  el.setAttribute('data-revelar', '');
  if (atraso) el.style.setProperty('--atraso', `${atraso}ms`);
  io.observe(el);
}

/**
 * Quebra o texto do título em palavras animáveis (mantém <em>), nas seções
 * em que o autor marcou o estilo "Títulos animados" no Universal Editor.
 */
export function palavras(h) {
  // só anima onde o autor ligou a opção da seção "Títulos animados"
  if (reduzido || h.dataset.palavras || !h.closest('.section.titulos-animados')) return;
  h.dataset.palavras = '1';
  let i = 0;
  const envolver = (no) => {
    if (no.nodeType === 3) {
      const frag = document.createDocumentFragment();
      no.textContent.split(/(\s+)/).forEach((t) => {
        if (!t) return;
        if (/^\s+$/.test(t)) {
          frag.append(t);
          return;
        }
        const p = document.createElement('span');
        p.classList.add('palavra');
        const s = document.createElement('span');
        s.style.setProperty('--i', i);
        i += 1;
        s.textContent = t;
        p.append(s);
        frag.append(p);
      });
      no.replaceWith(frag);
    } else if (no.nodeType === 1) {
      [...no.childNodes].forEach(envolver);
    }
  };
  [...h.childNodes].forEach(envolver);
  revelar(h);
}

/** Conta de 0 até o valor quando o elemento aparece. */
export function contar(el, ate, {
  duracao = 1400, casas = 0, sufixo = '', prefixo = '',
} = {}) {
  const fim = () => { el.textContent = `${prefixo}${ate.toFixed(casas)}${sufixo}`; };
  if (reduzido || !io) {
    fim();
    return;
  }
  const obs = new IntersectionObserver((es) => {
    if (!es[0].isIntersecting) return;
    obs.disconnect();
    const t0 = performance.now();
    const passo = (t) => {
      const p = Math.min(1, (t - t0) / duracao);
      const e = 1 - (1 - p) ** 3;
      el.textContent = `${prefixo}${(ate * e).toFixed(casas)}${sufixo}`;
      if (p < 1) requestAnimationFrame(passo); else fim();
    };
    requestAnimationFrame(passo);
  }, { threshold: 0.4 });
  obs.observe(el);
}

/** Chama `fn` uma vez quando o elemento aparece. */
export function aoAparecer(el, fn, threshold = 0.3) {
  if (!io) {
    fn();
    return;
  }
  const obs = new IntersectionObserver((es) => {
    if (es[0].isIntersecting) {
      obs.disconnect();
      fn();
    }
  }, { threshold });
  obs.observe(el);
}

/**
 * Progresso de rolagem de um elemento fixado (sticky): chama `fn(p)` com
 * p de 0 a 1 enquanto o pai rola pela janela. O pai precisa ser mais alto
 * que a janela; o filho fica `position: sticky`.
 */
export function aoRolar(pai, fn) {
  let agendado = false;
  const medir = () => {
    agendado = false;
    const r = pai.getBoundingClientRect();
    const total = r.height - window.innerHeight;
    const p = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 1;
    fn(p);
  };
  const pedir = () => {
    if (!agendado) {
      agendado = true;
      requestAnimationFrame(medir);
    }
  };
  // sem movimento reduzido e em tela larga: no celular as seções fixadas viram estáticas
  if (reduzido || !largo()) {
    fn(1);
    return;
  }
  window.addEventListener('scroll', pedir, { passive: true });
  window.addEventListener('resize', pedir);
  medir();
}

/** Pontos laterais: um por seção com id, marcando a seção visível. */
function pontos(main) {
  const secoes = [...main.querySelectorAll('.section[id]')];
  if (secoes.length < 3 || !io || noAuthor) return;
  const ul = document.createElement('ul');
  ul.classList.add('pontos');
  secoes.forEach((s) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = `#${s.id}`;
    a.setAttribute('aria-label', s.dataset.nome || s.id);
    li.append(a);
    ul.append(li);
  });
  document.body.append(ul);
  const obs = new IntersectionObserver((es) => {
    es.forEach((e) => {
      if (e.isIntersecting) {
        ul.querySelectorAll('a').forEach((a) => a.classList.toggle('ativo', a.getAttribute('href') === `#${e.target.id}`));
      }
    });
  }, { rootMargin: '-35% 0px -55% 0px' });
  secoes.forEach((s) => obs.observe(s));
}

/** Revelações padrão: cabeçalhos e blocos de cada seção. */
export function iniciar(main) {
  main.querySelectorAll('.section').forEach((s) => {
    // id da seção vem do metadado `id` autorado (data-id) ou do primeiro título
    if (!s.id && s.dataset.id) s.id = s.dataset.id;
    s.querySelectorAll('.default-content-wrapper > h2').forEach((h) => palavras(h));
    s.querySelectorAll('.default-content-wrapper > p').forEach((p, i) => revelar(p, i * 80));
  });
  pontos(main);
}
