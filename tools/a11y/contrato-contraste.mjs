#!/usr/bin/env node
/*
 * Contrato de acessibilidade por bloco (skill acessibilidade-por-bloco, passo 6):
 * todo bloco cujo CSS tem cor própria (hex, rgb/hsl, gradiente ou imagem de fundo)
 * precisa responder ao modo de alto contraste com regras `html.contrast .<bloco>`.
 * Também reprova `!important` no CSS de bloco.
 *
 * Uso: node tools/a11y/contrato-contraste.mjs   (sai com código 1 se houver falha)
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const raiz = new URL('../../blocks/', import.meta.url).pathname;
const corPropria = /#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(|gradient\(|url\(/i;
const falhas = [];

readdirSync(raiz, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .forEach(({ name }) => {
    const arquivo = join(raiz, name, `${name}.css`);
    if (!existsSync(arquivo)) return;
    const css = readFileSync(arquivo, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    if (/!important/.test(css)) falhas.push(`${name}: usa !important`);
    const semContraste = css.split('}').filter((r) => !r.includes('html.contrast')).join('}');
    if (corPropria.test(semContraste) && !css.includes(`html.contrast .${name}`) && !css.includes('html.contrast header') && !css.includes('html.contrast footer')) {
      falhas.push(`${name}: tem cor própria e nenhuma regra html.contrast .${name}`);
    }
  });

if (falhas.length) {
  // eslint-disable-next-line no-console
  console.error(`Contrato de contraste: ${falhas.length} falha(s)\n- ${falhas.join('\n- ')}`);
  process.exit(1);
}
// eslint-disable-next-line no-console
console.log('Contrato de contraste: ok, todo bloco com cor própria responde a html.contrast');
