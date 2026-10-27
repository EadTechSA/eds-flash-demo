/*
 * Ferramentas que dependem de consentimento (categoria CC_ANALYTICS).
 * Nesta demo nada é carregado de verdade: o bloco consent-live mostra o
 * momento em que esta função roda. Um site real ligaria aqui o Web SDK da
 * Adobe (alloy) com a configuração do cliente.
 */
export default function carregar() {
  window.dispatchEvent(new CustomEvent('demo:consented', { detail: { modulo: 'consented.js' } }));
}

carregar();
