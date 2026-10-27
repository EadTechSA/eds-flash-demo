/*
 * Tabela de origens de embed e a categoria de cookie que cada uma exige.
 * Só é lida pelo gate (scripts/consent-gate.js); não aparece na página.
 * Linhas: origem (ex.: youtube.com) | código da categoria (ex.: CC_FUNCTIONAL).
 */
export default function decorate(block) {
  block.setAttribute('hidden', '');
}
