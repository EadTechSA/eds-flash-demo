/*
 * Importa o conteúdo gerado por conteudo.py no author, pela sessão logada
 * do navegador. Cole no console de uma aba do author
 * (https://author-p172553-e1847554.adobeaemcloud.com) e rode:
 *   await importar('https://main--eds-flash-demo--eadtechsa.aem.page/tools/conteudo/conteudo.json')
 * Cada página é gravada inteira (Sling :operation=import, :replace=true).
 * Depois, pré-visualize e publique pelo Sites ou pela Admin API.
 */
async function importar(url, somente) {
  const dados = await (await fetch(url, { cache: 'no-store' })).json();
  const tk = (await (await fetch('/libs/granite/csrf/token.json', { credentials: 'include' })).json()).token;
  const saida = [];
  for (const [caminho, conteudo] of Object.entries(dados)) {
    if (somente && !somente.some((s) => caminho.endsWith(s))) continue;
    const i = caminho.lastIndexOf('/');
    const pai = caminho.slice(0, i);
    const nome = caminho.slice(i + 1);
    const fd = new FormData();
    fd.append(':operation', 'import');
    fd.append(':contentType', 'json');
    fd.append(':name', nome);
    fd.append(':replace', 'true');
    fd.append(':replaceProperties', 'true');
    fd.append(':content', JSON.stringify({ 'jcr:primaryType': 'cq:Page', 'jcr:content': conteudo }));
    fd.append('_charset_', 'utf-8');
    const r = await fetch(pai, { method: 'POST', body: fd, credentials: 'include', headers: { 'CSRF-Token': tk } });
    saida.push(`${r.status} ${caminho}`);
  }
  return saida.join('\n');
}
