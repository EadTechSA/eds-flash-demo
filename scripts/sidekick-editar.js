/*
 * "Editar no AEM" — a ponte do Sidekick para o Universal Editor.
 *
 * MORA EM scripts/ POR UM MOTIVO MEDIDO: a entrega NAO serve /tools/**
 * (conferido em 03/09/2026 no .aem.page: 404 em /tools/sidekick/config.json e
 * em /tools/sidekick/editar.html; 200 em /scripts/**, /blocks/**, /icons/** e
 * nos arquivos de raiz). O que nao e servido nao existe para o Sidekick.
 *
 * POR QUE EXISTE
 * O botao Editar nativo do Sidekick abre a FONTE do conteudo, e nos projetos
 * de autoria por documento essa fonte e um Google Doc. Aqui a fonte e a
 * entrega do AEM (`type: markup`), e o servico responde 405 com url vazia:
 * o botao fica sem destino e nao abre nada. Medido em 03/09/2026 no
 * `admin.hlx.page/status/...?editUrl=auto`.
 *
 * Entao o projeto declara o seu proprio botao. O Sidekick abre esta pagina
 * passando `?referrer=<url da pagina>`, e ela redireciona para o Universal
 * Editor da pagina correspondente no author.
 *
 * O caminho da entrega e o caminho do conteudo sao o mesmo, com a raiz do
 * site na frente: `/en` -> `/content/eds-flash-demo/en.html`; a raiz `/` é a página `index`.
 */

/** o author do sandbox da EadTech (programa 172553 / ambiente e1847554) */
export const AUTHOR = 'author-p172553-e1847554.adobeaemcloud.com';
/** o tenant da Experience Cloud, que entra no caminho do editor */
export const TENANT = 'eadtech';
/** a raiz do site no repositorio de conteudo */
export const RAIZ = '/content/eds-flash-demo';

/**
 * Hosts de onde um referrer e aceito. Fora desta lista o botao nao redireciona:
 * a pagina recebe o endereco por query, e query e' entrada de terceiro.
 */
export const HOSTS = [
  'main--eds-flash-demo--eadtechsa.aem.page',
  'main--eds-flash-demo--eadtechsa.aem.live',
];

/** caminho de conteudo valido: minusculas, digitos, hifen e barra */
const CAMINHO_VALIDO = /^\/[a-z0-9/-]*$/;

/**
 * O caminho da pagina no repositorio de conteudo, a partir do caminho servido.
 * A raiz da entrega e a pagina `index`; barra final nao conta.
 * @param {string} caminho o pathname da entrega
 * @returns {string|null} o caminho no author, ou null se nao for aceitavel
 */
export function caminhoDeConteudo(caminho) {
  let p = String(caminho || '/').split('?')[0].split('#')[0];
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
  if (p === '' || p === '/') p = '/index';
  if (!CAMINHO_VALIDO.test(p)) return null;
  return `${RAIZ}${p}`;
}

/**
 * O endereco do Universal Editor para a pagina de onde o Sidekick foi acionado.
 * @param {string} referrer a url que o Sidekick passou
 * @returns {string|null} o endereco do editor, ou null quando o referrer nao serve
 */
export function urlDoEditor(referrer) {
  let url;
  try {
    url = new URL(String(referrer));
  } catch (e) {
    return null;
  }
  if (!HOSTS.includes(url.host)) return null;
  const conteudo = caminhoDeConteudo(url.pathname);
  if (!conteudo) return null;
  return `https://${AUTHOR}/ui#/@${TENANT}/aem/universal-editor/canvas/${AUTHOR}${conteudo}.html`;
}

/** o console de Sites, para quando nao ha referrer utilizavel */
export function urlDoConsole() {
  return `https://${AUTHOR}/ui#/aem/sites.html${RAIZ}`;
}

export default urlDoEditor;
