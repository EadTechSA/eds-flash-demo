/*
 * Hero no modelo da Adobe (aem-boilerplate-xwalk: imagem, alt, texto) com
 * três campos a mais para a palavra que gira, cada um no seu lugar:
 *  - trecho do título que gira (texto exato de um pedaço do H1);
 *  - outras palavras que entram no lugar (lista);
 *  - intervalo da troca (segundos).
 * O H1 sai inteiro no HTML entregue; o bloco só troca o trecho no navegador.
 * Selos são itens autorados; o selo com {desempenho} etc. lê a nota medida
 * pelo Lighthouse no CI. Vídeo não mora aqui: é o bloco Embed.
 * Linhas (ordem do modelo): imagem | texto | trecho | palavras | intervalo,
 * depois os selos `chave | texto`.
 */
import {
  el, rotulos, texto, campos, campo, conteudo, marcar, emEditor, lighthouse, dataCurta,
} from '../../scripts/demo.js';
import { reduzido } from '../../scripts/motion.js';

/** Envolve o trecho do título num span, sem tirar nada do texto. */
function envolverTrecho(h1, trecho) {
  const walker = document.createTreeWalker(h1, NodeFilter.SHOW_TEXT);
  let no = walker.nextNode();
  while (no) {
    const i = no.textContent.indexOf(trecho);
    if (i >= 0) {
      const depois = no.splitText(i);
      depois.splitText(trecho.length);
      const alvo = el('span', 'hero-rotativa');
      depois.replaceWith(alvo);
      alvo.append(depois);
      return alvo;
    }
    no = walker.nextNode();
  }
  return null;
}

function girar(alvo, palavras, intervalo) {
  const mostrar = (p, anima) => {
    const velho = alvo.firstElementChild;
    const novo = el('span', 'hero-rotativa-palavra');
    [...p].forEach((ch, k) => {
      const l = el('span', 'hero-letra', ch === ' ' ? '&nbsp;' : '');
      if (ch !== ' ') l.textContent = ch;
      l.style.setProperty('--i', k);
      novo.append(l);
    });
    alvo.textContent = '';
    if (velho && anima) {
      velho.classList.add('saindo');
      alvo.append(velho);
      setTimeout(() => velho.remove(), 500);
    }
    alvo.append(novo);
  };
  // leitor de tela ouve a frase como está no HTML, sem a troca
  const leitor = el('span', 'hero-rotativa-leitor');
  leitor.textContent = palavras[0];
  alvo.before(leitor);
  alvo.setAttribute('aria-hidden', 'true');
  mostrar(palavras[0], false);
  let i = 0;
  setInterval(() => {
    if (document.hidden) return;
    i = (i + 1) % palavras.length;
    mostrar(palavras[i], true);
  }, intervalo * 1000);
}

function preencher(modelo, m) {
  return modelo.replace(/\{(\w+)\}/g, (_, k) => {
    if (k === 'data') return dataCurta(m.medidoEm);
    return m.notas[k] ?? '—';
  });
}

export default function decorate(block) {
  const [imagemCel, textoCel, trechoCel, palavrasCel, intervaloCel] = campos(block, 5);
  const r = rotulos(block);
  const trecho = texto(trechoCel);
  const outras = palavrasCel ? [...palavrasCel.querySelectorAll('li')].map((li) => li.textContent.trim()).filter(Boolean) : [];
  if (!outras.length && palavrasCel && texto(palavrasCel)) outras.push(...texto(palavrasCel).split(/\s*,\s*/));
  const intervalo = Math.max(1, parseFloat(texto(intervaloCel).replace(',', '.')) || 2.6);
  block.textContent = '';

  const topo = conteudo(textoCel, el('div', 'hero-texto'));
  const h1 = topo.querySelector('h1');
  if (h1 && trecho && outras.length && !emEditor) {
    const alvo = envolverTrecho(h1, trecho);
    if (alvo && !reduzido) girar(alvo, [trecho, ...outras], intervalo);
  }

  // selos autorados; os que pedem a nota medida esperam o JSON do CI
  const selos = el('div', 'hero-selos');
  Object.entries(r.mapa).forEach(([chave, modelo]) => {
    if (!/^selo/.test(chave) || !modelo) return;
    const s = el('span', 'selo', modelo);
    if (/\{(desempenho|acessibilidade|praticas|seo|data)\}/.test(modelo)) {
      s.hidden = true;
      lighthouse().then((m) => {
        if (!m) return;
        s.textContent = preencher(s.textContent, m);
        s.hidden = false;
      });
    }
    selos.append(s);
  });
  if (selos.children.length) topo.append(selos);

  // no editor, os campos da palavra que gira ficam à vista para clicar e editar
  if (emEditor && (trechoCel || palavrasCel)) {
    const giro = el('div', 'hero-giro-editor');
    giro.append(campo(trechoCel, 'span', 'hero-giro-trecho'));
    const lista = conteudo(palavrasCel, el('div', 'hero-giro-palavras'));
    giro.append(lista, campo(intervaloCel, 'span', 'hero-giro-intervalo'));
    topo.append(giro);
  }
  block.append(topo);

  const pic = imagemCel && imagemCel.querySelector('picture');
  if (pic) {
    const fig = marcar(imagemCel, el('div', 'hero-imagem'));
    fig.append(pic);
    block.append(fig);
  }
}
