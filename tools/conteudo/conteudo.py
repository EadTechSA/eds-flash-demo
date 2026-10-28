#!/usr/bin/env python3
"""
Conteúdo da EDS Flash Demo em três idiomas, como árvore JSON do author
(xwalk / Universal Editor), pronto para o Sling :operation=import.

Uso: python3 conteudo.py > conteudo.json
Saída: {"/content/eds-flash-demo/index": {...jcr:content...}, ...}
Cada chave é o caminho da página; o valor é o nó jcr:content inteiro.
Texto visível só aqui: o código dos blocos não tem rótulo nenhum.
"""
import json

AUTHOR_DAM = '/content/dam/eds-flash-demo'
VIDEO = 'https://video.tv.adobe.com/v/3427989/?learn=on&quality=12'
VERSAO = '2026-10-27'

PAGE_RT = 'core/franklin/components/page/v1/page'
ROOT_RT = 'core/franklin/components/root/v1/root'
SEC_RT = 'core/franklin/components/section/v1/section'
BLOCK_RT = 'core/franklin/components/block/v1/block'
ITEM_RT = 'core/franklin/components/block/v1/block/item'
TEXT_RT = 'core/franklin/components/text/v1/text'
TITLE_RT = 'core/franklin/components/title/v1/title'
IMAGE_RT = 'core/franklin/components/image/v1/image'


def node(rt, **props):
    n = {'jcr:primaryType': 'nt:unstructured', 'sling:resourceType': rt}
    n.update({k: v for k, v in props.items() if v is not None and v != ''})
    return n


def text(html):
    return node(TEXT_RT, text=html)


def block(name, model, fields=None, items=None, classes=None, filt=None):
    b = node(BLOCK_RT, name=name, model=model)
    if classes:
        b['classes'] = classes
    if filt:
        b['filter'] = filt
    for k, v in (fields or {}).items():
        if v not in (None, ''):
            b[k] = v
    for i, (nome, modelo, campos) in enumerate(items or []):
        n = node(ITEM_RT, name=nome, model=modelo)
        n.update({k: v for k, v in campos.items() if v not in (None, '')})
        b[f'item_{i}'] = n
    return b


def ab3(html, prefixo=''):
    """Abertura '<p>sobre</p><h2>título</h2><p>…</p>' em três campos do modelo."""
    import re
    m = re.match(r'\s*(?:<p>(.*?)</p>)?\s*(?:<h2>(.*?)</h2>)?(.*)$', html or '', re.S)
    sobre, titulo, resto = (m.group(1) or ''), (m.group(2) or ''), (m.group(3) or '').strip()
    n = (lambda x: prefixo + x[0].upper() + x[1:]) if prefixo else (lambda x: x)
    return {n('sobretitulo'): sobre, n('titulo'): titulo, n('texto'): resto}


def rotulos(prefixo, mapa):
    """Itens `rotulo` (chave | texto) para um bloco."""
    # o nome aparece no painel e na árvore do Universal Editor
    return [(f'Texto da interface · {k}', 'rotulo', {'chave': k, 'texto': v}) for k, v in mapa.items()]


def section(children, id=None, style=None, nome=None, **meta):
    s = node(SEC_RT)
    if style:
        s['style'] = style
    if nome:
        s['name'] = nome
    if id:
        s['id'] = id
    for k, v in meta.items():
        s[k] = v
    for i, (nome_no, c) in enumerate(children):
        s[nome_no] = c
    return s


def page(title, sections, **props):
    jc = {
        'jcr:primaryType': 'cq:PageContent',
        'jcr:title': title,
        'sling:resourceType': PAGE_RT,
        'cq:template': '/libs/core/franklin/templates/page',
    }
    jc.update({k: v for k, v in props.items() if v not in (None, '')})
    root = node(ROOT_RT)
    for i, s in enumerate(sections):
        root['section' if i == 0 else f'section_{i}'] = s
    jc['root'] = root
    return jc


# --------------------------------------------------------------------------
# textos
# --------------------------------------------------------------------------
T = {}

T['pt'] = dict(
    lang='pt-BR', raiz='', titulo='EDS Flash Demo', idioma='PT',
    descricao='Demonstração ao vivo de AEM Edge Delivery Services, Assets e Dynamic Media com consentimento nativo, feita pela EadTech para o Adobe Professional Services.',
    aviso='<p><strong>Uso exclusivo para apresentação ao Adobe Professional Services</strong> · ambiente de demonstração EadTech</p>',
    marca='<p><strong>EadTech</strong> <em>EDS Flash Demo</em></p>',
    cookies='Definições de cookies',
    rodape='<p>EadTech · parceira estratégica Adobe · demonstração interna, não é site de cliente</p>',
    rodape_link='<p><a href="#definicoes-de-cookies">Definições de cookies</a></p>',
    hero_texto='<p>AEM Edge Delivery Services · AEM Assets · Dynamic Media · consentimento nativo</p>'
               '<h1>O site que <em>carrega rápido no celular | é acessível por bloco | recorta por IA | fala com agentes | pede permissão | publica sem TI</em> em uma semana de migração.</h1>'
               '<p>Este site é uma demonstração ao vivo, não um slide: cada página mostra um recurso do EDS, do Assets e do método da EadTech funcionando de verdade. Acessibilidade que vale para todo bloco, Lighthouse medido a cada publicação, agentes de IA, consentimento nativo. O vídeo da Adobe abaixo é o primeiro exemplo: só carrega depois do seu sim.</p>',
    hero_rotulos={'selo-1': 'Lighthouse {desempenho} · {acessibilidade} · {praticas} · {seo} · medido {data}', 'selo-2': 'acessível por bloco · 6 ferramentas', 'selo-sem-consentimento': 'sem consentimento', 'selo-com-consentimento': 'mídia e vídeo permitidos', 'hud-bloqueado': 'gate ativo', 'hud-liberado': 'vídeo liberado', 'hud-embed': 'player da Adobe', 'fonte': 'vídeo: video.tv.adobe.com', 'titulo-video': 'Vídeo da Adobe sobre Edge Delivery Services', 'log-liberado': 'gate CC_MEDIA: liberado → player inserido', 'log-revogado': 'gate CC_MEDIA: revogado → player removido, aviso de volta (sem reload)'},
    como='<p>Como usar na apresentação</p><p>1. Clique no botão de acessibilidade à direita e ligue o alto contraste: a página inteira muda, bloco a bloco.</p><p>2. Abra Método no menu e deixe o iceberg contar o investimento.</p><p>3. Dê play no vídeo: ele pede consentimento, carrega na hora e some ao revogar, sem recarregar.</p>',
    valor_iceberg='<p>Rápido não quer dizer fácil</p><h2>Uma semana no cliente. Anos antes dela.</h2><p>O que você vê é a ponta: a migração entregue em uma semana. O que torna isso possível está embaixo da linha d\'água, e foi investido antes de qualquer cliente aparecer. Role para ver.</p>',
    valor_comparacao='<p>O caminho difícil × a Migração Express</p><h2>Difícil não entrega mais. Entrega menos, mais tarde.</h2><p>Os mesmos critérios, nos dois caminhos. Alterne e veja para onde vai cada número.</p>',
    valor_entregas='<p>O que a semana entrega</p><h2>Rápido é o que sobra quando o método está pronto.</h2><p>Cada número abaixo é medido, não prometido.</p>',
    valor_rotulos={'ponta-numero': '1', 'ponta-texto': 'semana no cliente, do kickoff ao site no ar', 'iceberg-legenda': 'embaixo da linha d\'água: o investimento feito antes', 'caminho-a': 'Caminho difícil', 'caminho-b': 'Migração Express'},
    camadas=[
        ('Método em roteiro', '<p>Cada migração vira roteiro: o que se faz, em que ordem, o que se confere. A próxima começa do passo 1 já escrito, e o cliente só valida.</p>', '511', 'páginas no último portal'),
        ('Biblioteca de blocos', '<p>Blocos já modelados para o Universal Editor, com a variante decidida pelo autor e nunca por regra de código. Dicionário com captura real de cada um.</p>', '43', 'blocos prontos'),
        ('Portão de qualidade', '<p>Lint, contrato de blocos, testes automatizados e Lighthouse a cada mudança. Nada entra na main sem passar.</p>', '308', 'testes'),
        ('Pacote de consentimento', '<p>Banner, preferências e gate de mídia conforme LGPD, com o texto todo autorado e auditoria axe sem violações.</p>', '23', 'verificações'),
        ('Automação do conteúdo', '<p>Migrador, verificador de paridade visual, índice e redirecionamentos. A parte repetitiva deixa de ser manual e de depender de memória.</p>', '3', 'fases de carregamento'),
        ('Conhecimento da suíte', '<p>Assets, Dynamic Media, Target, Analytics, App Builder, autenticação de site: o que cada um exige e onde encaixa, sem experimentar no cliente.</p>', '6', 'produtos da suíte'),
        ('Acessibilidade por bloco', '<p>Seis ferramentas (fonte, contraste, preto e branco, inversão, links) que só ligam uma classe na raiz; cada bloco responde pelo próprio CSS. LBI, eMAG 3.1 e WCAG 2.2 AA, sem script de terceiro.</p>', '6', 'ferramentas · 0 terceiros'),
    ],
    comparacoes=[
        ('Prazo até o site no ar', '<p>Projeto tradicional: levantamento, design, componentes, integração, homologação. Express: o método já existe, o conteúdo entra.</p>', '26 semanas', '1 semana'),
        ('Desempenho no Lighthouse (celular)', '<p>Sites em frameworks pesados costumam ficar entre 40 e 70. O EDS fica entre 85 e 100 nas medições desta página, porque carrega em três fases; a nota oscila um pouco a cada medição. A última, com data, está na página EDS por dentro.</p>', '55', '85 a 100'),
        ('Scripts de terceiros antes do sim', '<p>Tag managers, pixels e vídeos costumam entrar antes de qualquer escolha. Aqui, zero.</p>', '12', '0'),
        ('Horas de TI do cliente por mês', '<p>Sem bloco novo, não há sprint: quem publica é a área de negócio, no Universal Editor.</p>', '160', '8'),
        ('Tempo para publicar um ajuste', '<p>Da fila de TI para um clique de quem escreve.</p>', '14 dias', '1 minuto'),
        ('Agentic readiness', '<p>Conteúdo no HTML, estrutura semântica, metadados, índice e llms.txt.</p>', '2 de 5', '5 de 5'),
    ],
    entregas=[
        ('Lighthouse medido a cada publicação', '<p>Desempenho, acessibilidade, boas práticas e SEO, no celular, medidos pelo CI. A nota aparece com data no início e na página EDS por dentro.</p>', '4', 'eixos medidos'),
        ('Agentic readiness', '<p>As cinco verificações, com llms.txt publicado.</p>', '5', 'de 5'),
        ('Scripts antes do consentimento', '<p>Nenhum pixel, tag manager ou vídeo entra antes do sim.</p>', '0', 'scripts'),
        ('Clique para publicar', '<p>Autor aprova, publica. CDN da Adobe ou a do cliente na frente.</p>', '1', 'clique'),
        ('Validade do consentimento', '<p>Escolha guardada por origem, com versão da política. Muda a política, o banner volta.</p>', '12', 'meses'),
        ('Cabeçalhos de segurança', '<p>CSP, COOP, HSTS, nosniff e permissions-policy versionados no serviço de configuração.</p>', '6', 'cabeçalhos'),
    ],
    consent_abertura='<p>Consentimento nativo em EDS · bloco EadTech</p><h2>Consentimento nativo, sem CMP pesado. E pronto para o CMP do cliente.</h2><p>Banner e categorias são conteúdo autorado; o código só faz o gate. Cada bloco que precisa de permissão leva a categoria no HTML (<code>data-consent-category</code>), e um adaptador traduz OneTrust, Cookiebot ou TCF para os mesmos eventos. Abaixo, a rede desta página em tempo real.</p>',
    consent_rotulos={'cascata-titulo': 'Cascata de rede desta página', 'cascata-nota': 'Recursos reais desta página (Resource Timing), nas três fases do EDS. O que o consentimento segurou aparece riscado em vermelho. Aceite e veja as linhas carregarem.', 'cascata-video': 'player da Adobe (vídeo)', 'cascata-analytics': 'alloy.js (Web SDK)', 'fase-eager': 'eager', 'fase-lazy': 'lazy', 'fase-delayed': 'delayed · +3 s', 'bloqueado': 'bloqueado', 'bloqueados': 'bloqueados', 'tudo-liberado': 'tudo liberado', 'estado-titulo': 'Estado do consentimento', 'versao': VERSAO, 'cat-necessarios': 'Necessários', 'cat-analise': 'Análise', 'cat-midia': 'Mídia e vídeo', 'permitido': 'permitido', 'sem-escolha': 'sem escolha', 'botao-definicoes': 'Definições de cookies', 'botao-esquecer': 'Esquecer escolha (recomeçar)', 'estado-nota': 'Gravado em localStorage, por origem, com versão da política e data. Os eventos ao lado são os que o plugin de martech da Adobe escuta.', 'log-titulo': 'Eventos ao vivo', 'log-lido': 'consent lido do localStorage', 'log-sem-escolha': 'sem escolha gravada → banner exibido; só categorias necessárias valem', 'log-esquecido': 'escolha esquecida → banner volta', 'log-consented': 'consented.js: CC_ANALYTICS → aqui entraria o Web SDK (alloy), na fase delayed'},
    fases_abertura='<p>Carregamento em três fases · role para ver</p><h2>Por que é rápido no celular.</h2>',
    fases=[('E', 'Eager', '<p>HTML, CSS e a primeira imagem: só o que pinta o LCP. Nada de terceiro.</p>'), ('L', 'Lazy', '<p>Os blocos entram em ordem, cada um com o próprio CSS e JS. Fontes e imagens fora da tela esperam.</p>'), ('D', 'Delayed', '<p>Três segundos depois: consentimento, e só então martech. O Lighthouse já terminou de medir.</p>')],
    fases_rotulos={'url': 'https://demo.eadtech…/', 'lcp': 'LCP {lcp}', 'cookies': 'cookies · aceitar / recusar'},
    midia_abertura='<p>AEM Assets · Dynamic Media com OpenAPI</p><h2>Uma imagem no DAM, infinitas entregas na borda.</h2><p>Toda mídia desta página mora no Assets e é referenciada de lá. Com Dynamic Media, a mesma foto sai recortada por IA para cada proporção e otimizada por URL, sem ninguém gerar arquivo.</p>',
    midia_rotulos={'recorte-titulo': 'Smart Crop por IA', 'recorte-real': 'Dynamic Media', 'recorte-simulado': 'simulação · liga com DM no sandbox', 'recorte-hero': 'hero', 'recorte-card': 'card', 'recorte-stories': 'stories', 'sujeito': 'Ponto de interesse', 'trocar': 'Trocar a imagem no DAM', 'trocar-nota': 'reaprova no Assets → a página troca sem republicar', 'trocar-feito': 'ativo reaprovado às', 'trocar-log': 'Assets: ativo reaprovado → entrega atualizada, 0 republicação', 'recorte-nota': 'Arraste: o ponto de interesse muda e os três recortes o seguem. No Dynamic Media isso é o perfil de smart crop aplicado no upload.', 'url-titulo': 'Rendition por URL', 'largura': 'Largura', 'qualidade': 'Qualidade', 'formato': 'Formato', 'kb': 'KB estimados', 'original': '· o original tem', 'url-nota': 'Só ativos aprovados no Assets são entregues. A URL é o contrato: largura, qualidade, formato e perfil de recorte.'},
    eds_abertura='<p>Edge Delivery Services · o que esta página usa</p><h2>Cada caixa é um recurso real, medido nesta página.</h2>',
    bento=[
        ('lighthouse', 'Lighthouse · celular · medido', '<p>Lighthouse de verdade, rodado pelo CI na prévia a cada push e todo dia. O SEO é medido sem a auditoria de indexação, porque o aem.page não é indexado de propósito.</p>', 'Desempenho|Acessibilidade|Boas práticas|SEO', '3'),
        ('fases', 'Fases medidas nesta página', '<p>Navigation Timing do seu navegador, agora. Primeiro o LCP, depois os blocos, por último martech e consentimento.</p>', 'eager|lazy|delayed', '3'),
        ('indice', 'query-index.json', '<p>Índice publicado automaticamente; alimenta listas, cards e agentes.</p>', '', '2'),
        ('cabecalhos', 'Cabeçalhos de segurança', '<p>Versionados no serviço de configuração, conferidos a cada publicação.</p>', "content-security-policy=default-src 'self' …|cross-origin-opener-policy=same-origin|x-content-type-options=nosniff|permissions-policy=camera=(), geolocation=()|strict-transport-security=max-age=31557600", '2'),
        ('edge', 'Funções serverless · App Builder', '<p>Chamada real, agora: a função roda no Adobe I/O Runtime, busca a PTAX do dólar no Banco Central e guarda 10 minutos. O segredo da função fica no servidor; a resposta só diz o tamanho dele. Numa CDN do cliente, o mesmo papel é de um edge worker.</p>', 'Chamar a função|https://3763698-creciuploadsdemo-stage.adobeioruntime.net/api/v1/web/demo-ps/cotacao/usd', '2'),
        ('ab', 'Experimentação', '<p>A/B por metadado de página, com variantes como URLs e resultado na telemetria operacional. Target entra pelo mesmo Web SDK quando o cliente tem.</p>', 'Variante A|Variante B|Permitir e assistir|Ver o vídeo (12 s)', '2'),
        ('texto', 'Autoria', '<p>Universal Editor com catálogo de blocos em português. Variante é escolha do autor, nunca regra de caminho no código.</p><p><a href="#autoria">Ver o fluxo</a></p>', '', '2'),
        ('telemetria', 'Operational Telemetry', '<p>Core Web Vitals de usuários reais, por página e dispositivo, sem script de terceiro. Os números abaixo são um exemplo do painel: esta demo não tem tráfego real que sustente uma medição.</p>', 'LCP:0,4 s:22|INP:48 ms:12|CLS:0,00:4', '2'),
        ('texto', 'Acessibilidade por bloco', '<p>Abra o botão de acessibilidade à direita e ligue o alto contraste: a página inteira muda na hora, inclusive o gate do vídeo, o banner de cookies e estes painéis. O botão só troca uma classe na raiz; o tema troca os tokens e cada bloco traz a própria regra. Nenhum bloco precisa saber do botão.</p>', '', '6'),
    ],
    agentic_abertura='<p>Agentic readiness</p><h2>O que um agente de IA recebe desta página.</h2>',
    verificacoes=[('Conteúdo completo no HTML, sem depender de script', 'ok'), ('Estrutura semântica: main, títulos, listas e tabelas de verdade', 'ok'), ('Metadados e JSON-LD em cada página', 'ok'), ('Índice e sitemap consultáveis por máquina', 'ok'), ('llms.txt com o conteúdo prioritário e as regras de uso', 'ok')],
    agentic_rotulos={'verificacoes': 'Cinco verificações', 'curl-titulo': 'Visto por um agente (curl)', 'renderizado': 'Renderizado', 'renderizado-nota': 'o mesmo texto, agora sem marcação: nada muda para o agente'},
    passos_abertura='<p>Autoria e governança</p><h2>Quem publica é a área de negócio. TI só entra em bloco novo.</h2>',
    passos=[('✎', 'Universal Editor', '<p>Edição visual na própria página, com Asset Selector do DAM e catálogo de blocos.</p>'), ('⚿', 'Prévia com login', '<p>Autenticação de site na borda: só e-mails da EadTech e da Adobe veem a prévia.</p>'), ('✓', 'Portão de qualidade', '<p>Lint, contrato de blocos, testes e Lighthouse a cada mudança. Nada entra sem passar.</p>'), ('↗', 'Publicar', '<p>Um clique. CDN da Adobe, ou a do cliente na frente. Imagens pelo path mapping, nunca pelo código.</p>'), ('∞', 'Medir e repetir', '<p>Telemetria operacional e experimentos alimentam a próxima rodada. Sem sprint de TI.</p>')],
    passos_rotulos={'dica': 'role para avançar'},
    a11y_abertura='<p>Acessibilidade por bloco · LBI, eMAG 3.1, WCAG 2.2 AA</p><h2>Um botão. Todo bloco responde.</h2><p>O botão de acessibilidade só liga uma classe na raiz da página; o tema troca os tokens e cada bloco traz a própria regra de contraste. A tabela abaixo mede, agora, o contraste do texto de cada bloco desta página. Troque o modo e veja os números mudarem.</p>',
    a11y_painel_rotulos={'modos-titulo': 'Modos', 'modo-normal': 'normal', 'modos': 'Aumentar fonte|Diminuir fonte|Alto contraste|Preto e branco|Inverter cores|Destacar links', 'modos-nota': 'Os mesmos botões do widget à direita: a escolha fica no navegador e vale para o site inteiro, sem script de terceiro.', 'tabela-titulo': 'Blocos desta página, medidos agora', 'col-bloco': 'bloco', 'col-cores': 'texto / fundo', 'col-contraste': 'contraste', 'col-regra': 'regra de contraste', 'regra-propria': 'própria + tokens', 'regra-tokens': 'tokens do tema', 'aa': 'AA', 'em-contraste': 'alto contraste ligado', 'tabela-nota': 'Mínimo WCAG AA: 4,5:1 (3:1 para texto grande). "Própria" quer dizer que o CSS do bloco tem regra sob html.contrast; "tokens" quer dizer que o bloco só usa as cores do tema e já responde.'},
    a11y_texto='<h2>Acessibilidade</h2><ul><li>Aumentar fonte</li><li>Diminuir fonte</li><li>Alto contraste</li><li>Preto e branco</li><li>Inverter cores</li><li>Destacar links</li></ul>',
    a11y_rotulos={'abrir': 'Ferramentas de acessibilidade', 'tamanho-maximo': 'Tamanho máximo da fonte', 'tamanho-minimo': 'Tamanho padrão da fonte', 'tamanho': 'Tamanho da fonte: {n}', 'tamanhos': 'normal|grande|maior'},
    cc_banner=('Este site usa cookies e mídia de terceiros', 'Só o necessário carrega agora. Análise e vídeo esperam a sua escolha. Aceitar e recusar têm o mesmo peso.', 'Aceitar', 'Recusar', 'Preferências'),
    cc_prefs=('Definições de cookies', 'Escolha por categoria. A mudança vale na hora, inclusive para revogar.', 'Recusar', 'Salvar', 'Aceitar tudo'),
    cc_cats=[('CC_ESSENTIAL', 'não', 'Necessários', 'Sessão, segurança e a própria escolha de cookies.'), ('CC_ANALYTICS', 'sim', 'Análise', 'Medição de uso. Nesta demo: Web SDK da Adobe, só após o sim.'), ('CC_MEDIA', 'sim', 'Mídia e vídeo', 'Vídeos e embeds. Sem esta categoria, o bloco mostra o aviso no lugar do player.')],
    cc_gate=('Vídeo da Adobe: precisa de "Mídia e vídeo"', 'O bloco de vídeo não carrega nem um byte antes de você permitir esta categoria. A escolha fica no navegador por 12 meses, ou até a política mudar.', 'Permitir e assistir', 'Abrir em nova aba'),
)

T['es'] = dict(
    lang='es', raiz='/es', titulo='EDS Flash Demo', idioma='ES',
    descricao='Demostración en vivo de AEM Edge Delivery Services, Assets y Dynamic Media con consentimiento nativo, hecha por EadTech para Adobe Professional Services.',
    aviso='<p><strong>Uso exclusivo para presentación a Adobe Professional Services</strong> · ambiente de demostración EadTech</p>',
    marca='<p><strong>EadTech</strong> <em>EDS Flash Demo</em></p>',
    cookies='Configuración de cookies',
    rodape='<p>EadTech · partner estratégico de Adobe · demostración interna, no es sitio de cliente</p>',
    rodape_link='<p><a href="#definicoes-de-cookies">Configuración de cookies</a></p>',
    hero_texto='<p>AEM Edge Delivery Services · AEM Assets · Dynamic Media · consentimiento nativo</p>'
               '<h1>El sitio que <em>carga rápido en el móvil | es accesible por bloque | recorta con IA | habla con agentes | pide permiso | publica sin TI</em> en una semana de migración.</h1>'
               '<p>Este sitio es una demostración en vivo, no una diapositiva: cada página muestra un recurso de EDS, de Assets y del método de EadTech funcionando de verdad. Accesibilidad que vale para todo bloque, Lighthouse medido en cada publicación, agentes de IA, consentimiento nativo. El video de Adobe de abajo es el primer ejemplo: solo carga después de su sí.</p>',
    hero_rotulos={'selo-1': 'Lighthouse {desempenho} · {acessibilidade} · {praticas} · {seo} · medido {data}', 'selo-2': 'accesible por bloque · 6 herramientas', 'selo-sem-consentimento': 'sin consentimiento', 'selo-com-consentimento': 'medios y video permitidos', 'hud-bloqueado': 'gate activo', 'hud-liberado': 'video liberado', 'hud-embed': 'player de Adobe', 'fonte': 'video: video.tv.adobe.com', 'titulo-video': 'Video de Adobe sobre Edge Delivery Services', 'log-liberado': 'gate CC_MEDIA: liberado → player insertado', 'log-revogado': 'gate CC_MEDIA: revocado → player retirado, aviso de vuelta (sin reload)'},
    como='<p>Cómo usar en la presentación</p><p>1. Pulse el botón de accesibilidad a la derecha y active el alto contraste: toda la página cambia, bloque a bloque.</p><p>2. Abra Método en el menú y deje que el iceberg cuente la inversión.</p><p>3. Dé play al video: pide consentimiento, carga al instante y desaparece al revocar, sin recargar.</p>',
    valor_iceberg='<p>Rápido no quiere decir fácil</p><h2>Una semana en el cliente. Años antes de ella.</h2><p>Lo que ve es la punta: la migración entregada en una semana. Lo que la hace posible está bajo la línea de flotación, y fue invertido antes de que apareciera cualquier cliente. Desplace para ver.</p>',
    valor_comparacao='<p>El camino difícil × la Migración Express</p><h2>Difícil no entrega más. Entrega menos, más tarde.</h2><p>Los mismos criterios, en los dos caminos. Alterne y vea adónde va cada número.</p>',
    valor_entregas='<p>Lo que entrega la semana</p><h2>Rápido es lo que queda cuando el método está listo.</h2><p>Cada número de abajo se mide, no se promete.</p>',
    valor_rotulos={'ponta-numero': '1', 'ponta-texto': 'semana en el cliente, del kickoff al sitio en el aire', 'iceberg-legenda': 'bajo la línea de flotación: la inversión hecha antes', 'caminho-a': 'Camino difícil', 'caminho-b': 'Migración Express'},
    camadas=[
        ('Método en guion', '<p>Cada migración se vuelve guion: qué se hace, en qué orden, qué se verifica. La siguiente empieza del paso 1 ya escrito, y el cliente solo valida.</p>', '511', 'páginas en el último portal'),
        ('Biblioteca de bloques', '<p>Bloques ya modelados para el Universal Editor, con la variante decidida por el autor y nunca por una regla en el código. Diccionario con captura real de cada uno.</p>', '43', 'bloques listos'),
        ('Compuerta de calidad', '<p>Lint, contrato de bloques, pruebas automatizadas y Lighthouse en cada cambio. Nada entra en main sin pasar.</p>', '308', 'pruebas'),
        ('Paquete de consentimiento', '<p>Banner, preferencias y gate de medios conforme a la ley, con todo el texto autorado y auditoría axe sin violaciones.</p>', '23', 'verificaciones'),
        ('Automatización del contenido', '<p>Migrador, verificador de paridad visual, índice y redirecciones. La parte repetitiva deja de ser manual y de depender de la memoria.</p>', '3', 'fases de carga'),
        ('Conocimiento de la suite', '<p>Assets, Dynamic Media, Target, Analytics, App Builder, autenticación de sitio: qué exige cada uno y dónde encaja, sin experimentar en el cliente.</p>', '6', 'productos de la suite'),
        ('Accesibilidad por bloque', '<p>Seis herramientas (fuente, contraste, blanco y negro, inversión, enlaces) que solo activan una clase en la raíz; cada bloque responde con su propio CSS. WCAG 2.2 AA, sin scripts de terceros.</p>', '6', 'herramientas · 0 terceros'),
    ],
    comparacoes=[
        ('Plazo hasta el sitio en el aire', '<p>Proyecto tradicional: relevamiento, diseño, componentes, integración, homologación. Express: el método ya existe, el contenido entra.</p>', '26 semanas', '1 semana'),
        ('Rendimiento en Lighthouse (móvil)', '<p>Sitios en frameworks pesados suelen quedar entre 40 y 70. EDS queda entre 85 y 100 en las mediciones de esta página, porque carga en tres fases; la nota varía un poco en cada medición. La última, con fecha, está en la página EDS por dentro.</p>', '55', '85 a 100'),
        ('Scripts de terceros antes del sí', '<p>Tag managers, píxeles y videos suelen entrar antes de cualquier elección. Aquí, cero.</p>', '12', '0'),
        ('Horas de TI del cliente por mes', '<p>Sin bloque nuevo no hay sprint: quien publica es el área de negocio, en el Universal Editor.</p>', '160', '8'),
        ('Tiempo para publicar un ajuste', '<p>De la cola de TI a un clic de quien escribe.</p>', '14 días', '1 minuto'),
        ('Agentic readiness', '<p>Contenido en el HTML, estructura semántica, metadatos, índice y llms.txt.</p>', '2 de 5', '5 de 5'),
    ],
    entregas=[
        ('Lighthouse medido en cada publicación', '<p>Rendimiento, accesibilidad, buenas prácticas y SEO, en móvil, medidos por el CI. La nota aparece con fecha en el inicio y en la página EDS por dentro.</p>', '4', 'ejes medidos'),
        ('Agentic readiness', '<p>Las cinco verificaciones, con llms.txt publicado.</p>', '5', 'de 5'),
        ('Scripts antes del consentimiento', '<p>Ningún píxel, tag manager o video entra antes del sí.</p>', '0', 'scripts'),
        ('Clic para publicar', '<p>El autor aprueba, publica. CDN de Adobe o la del cliente adelante.</p>', '1', 'clic'),
        ('Validez del consentimiento', '<p>Elección guardada por origen, con versión de la política. Cambia la política, vuelve el banner.</p>', '12', 'meses'),
        ('Cabeceras de seguridad', '<p>CSP, COOP, HSTS, nosniff y permissions-policy versionadas en el servicio de configuración.</p>', '6', 'cabeceras'),
    ],
    consent_abertura='<p>Consentimiento nativo en EDS · bloque EadTech</p><h2>Consentimiento nativo, sin CMP pesado. Y listo para el CMP del cliente.</h2><p>Banner y categorías son contenido autorado; el código solo hace el gate. Cada bloque que necesita permiso lleva la categoría en el HTML (<code>data-consent-category</code>), y un adaptador traduce OneTrust, Cookiebot o TCF a los mismos eventos. Abajo, la red de esta página en tiempo real.</p>',
    consent_rotulos={'cascata-titulo': 'Cascada de red de esta página', 'cascata-nota': 'Recursos reales de esta página (Resource Timing), en las tres fases de EDS. Lo que el consentimiento retuvo aparece tachado en rojo. Acepte y vea las líneas cargar.', 'cascata-video': 'player de Adobe (video)', 'cascata-analytics': 'alloy.js (Web SDK)', 'fase-eager': 'eager', 'fase-lazy': 'lazy', 'fase-delayed': 'delayed · +3 s', 'bloqueado': 'bloqueado', 'bloqueados': 'bloqueados', 'tudo-liberado': 'todo liberado', 'estado-titulo': 'Estado del consentimiento', 'versao': VERSAO, 'cat-necessarios': 'Necesarios', 'cat-analise': 'Análisis', 'cat-midia': 'Medios y video', 'permitido': 'permitido', 'sem-escolha': 'sin elección', 'botao-definicoes': 'Configuración de cookies', 'botao-esquecer': 'Olvidar elección (reiniciar)', 'estado-nota': 'Guardado en localStorage, por origen, con versión de la política y fecha. Los eventos al lado son los que escucha el plugin de martech de Adobe.', 'log-titulo': 'Eventos en vivo', 'log-lido': 'consent leído del localStorage', 'log-sem-escolha': 'sin elección guardada → banner mostrado; solo valen las categorías necesarias', 'log-esquecido': 'elección olvidada → vuelve el banner', 'log-consented': 'consented.js: CC_ANALYTICS → aquí entraría el Web SDK (alloy), en la fase delayed'},
    fases_abertura='<p>Carga en tres fases · desplace para ver</p><h2>Por qué es rápido en el móvil.</h2>',
    fases=[('E', 'Eager', '<p>HTML, CSS y la primera imagen: solo lo que pinta el LCP. Nada de terceros.</p>'), ('L', 'Lazy', '<p>Los bloques entran en orden, cada uno con su propio CSS y JS. Fuentes e imágenes fuera de pantalla esperan.</p>'), ('D', 'Delayed', '<p>Tres segundos después: consentimiento, y solo entonces martech. Lighthouse ya terminó de medir.</p>')],
    fases_rotulos={'url': 'https://demo.eadtech…/', 'lcp': 'LCP {lcp}', 'cookies': 'cookies · aceptar / rechazar'},
    midia_abertura='<p>AEM Assets · Dynamic Media con OpenAPI</p><h2>Una imagen en el DAM, infinitas entregas en el borde.</h2><p>Todo medio de esta página vive en Assets y se referencia desde ahí. Con Dynamic Media, la misma foto sale recortada por IA para cada proporción y optimizada por URL, sin que nadie genere archivos.</p>',
    midia_rotulos={'recorte-titulo': 'Smart Crop con IA', 'recorte-real': 'Dynamic Media', 'recorte-simulado': 'simulación · se activa con DM en el sandbox', 'recorte-hero': 'hero', 'recorte-card': 'card', 'recorte-stories': 'stories', 'sujeito': 'Punto de interés', 'trocar': 'Cambiar la imagen en el DAM', 'trocar-nota': 'se reaprueba en Assets → la página cambia sin republicar', 'trocar-feito': 'activo reaprobado a las', 'trocar-log': 'Assets: activo reaprobado → entrega actualizada, 0 republicación', 'recorte-nota': 'Arrastre: el punto de interés cambia y los tres recortes lo siguen. En Dynamic Media esto es el perfil de smart crop aplicado al subir.', 'url-titulo': 'Rendition por URL', 'largura': 'Ancho', 'qualidade': 'Calidad', 'formato': 'Formato', 'kb': 'KB estimados', 'original': '· el original pesa', 'url-nota': 'Solo los activos aprobados en Assets se entregan. La URL es el contrato: ancho, calidad, formato y perfil de recorte.'},
    eds_abertura='<p>Edge Delivery Services · lo que usa esta página</p><h2>Cada caja es un recurso real, medido en esta página.</h2>',
    bento=[
        ('lighthouse', 'Lighthouse · móvil · medido', '<p>Lighthouse de verdad, corrido por el CI en la vista previa en cada push y todos los días. El SEO se mide sin la auditoría de indexación, porque aem.page no se indexa a propósito.</p>', 'Rendimiento|Accesibilidad|Buenas prácticas|SEO', '3'),
        ('fases', 'Fases medidas en esta página', '<p>Navigation Timing de su navegador, ahora. Primero el LCP, luego los bloques, al final martech y consentimiento.</p>', 'eager|lazy|delayed', '3'),
        ('indice', 'query-index.json', '<p>Índice publicado automáticamente; alimenta listas, tarjetas y agentes.</p>', '', '2'),
        ('cabecalhos', 'Cabeceras de seguridad', '<p>Versionadas en el servicio de configuración, verificadas en cada publicación.</p>', "content-security-policy=default-src 'self' …|cross-origin-opener-policy=same-origin|x-content-type-options=nosniff|permissions-policy=camera=(), geolocation=()|strict-transport-security=max-age=31557600", '2'),
        ('edge', 'Funciones serverless · App Builder', '<p>Llamada real, ahora: la función corre en Adobe I/O Runtime, busca la PTAX del dólar en el Banco Central de Brasil y la guarda 10 minutos. El secreto de la función queda en el servidor; la respuesta solo dice su tamaño. En la CDN del cliente, el mismo papel lo cumple un edge worker.</p>', 'Llamar a la función|https://3763698-creciuploadsdemo-stage.adobeioruntime.net/api/v1/web/demo-ps/cotacao/usd', '2'),
        ('ab', 'Experimentación', '<p>A/B por metadato de página, con variantes como URLs y resultado en la telemetría operacional. Target entra por el mismo Web SDK cuando el cliente lo tiene.</p>', 'Variante A|Variante B|Permitir y ver|Ver el video (12 s)', '2'),
        ('texto', 'Autoría', '<p>Universal Editor con catálogo de bloques en el idioma del cliente. La variante la elige el autor, nunca una regla de ruta en el código.</p><p><a href="#autoria">Ver el flujo</a></p>', '', '2'),
        ('telemetria', 'Operational Telemetry', '<p>Core Web Vitals de usuarios reales, por página y dispositivo, sin scripts de terceros. Los números de abajo son un ejemplo del panel: esta demo no tiene tráfico real que sostenga una medición.</p>', 'LCP:0,4 s:22|INP:48 ms:12|CLS:0,00:4', '2'),
        ('texto', 'Accesibilidad por bloque', '<p>Abra el botón de accesibilidad a la derecha y active el alto contraste: toda la página cambia al instante, incluidos el gate del video, el banner de cookies y estos paneles. El botón solo cambia una clase en la raíz; el tema cambia los tokens y cada bloque trae su propia regla. Ningún bloque necesita saber del botón.</p>', '', '6'),
    ],
    agentic_abertura='<p>Agentic readiness</p><h2>Lo que un agente de IA recibe de esta página.</h2>',
    verificacoes=[('Contenido completo en el HTML, sin depender de scripts', 'ok'), ('Estructura semántica: main, títulos, listas y tablas de verdad', 'ok'), ('Metadatos y JSON-LD en cada página', 'ok'), ('Índice y sitemap consultables por máquina', 'ok'), ('llms.txt con el contenido prioritario y las reglas de uso', 'ok')],
    agentic_rotulos={'verificacoes': 'Cinco verificaciones', 'curl-titulo': 'Visto por un agente (curl)', 'renderizado': 'Renderizado', 'renderizado-nota': 'el mismo texto, ahora sin marcado: nada cambia para el agente'},
    passos_abertura='<p>Autoría y gobernanza</p><h2>Quien publica es el área de negocio. TI solo entra con un bloque nuevo.</h2>',
    passos=[('✎', 'Universal Editor', '<p>Edición visual en la propia página, con Asset Selector del DAM y catálogo de bloques.</p>'), ('⚿', 'Preview con login', '<p>Autenticación de sitio en el borde: solo correos de EadTech y Adobe ven el preview.</p>'), ('✓', 'Compuerta de calidad', '<p>Lint, contrato de bloques, pruebas y Lighthouse en cada cambio. Nada entra sin pasar.</p>'), ('↗', 'Publicar', '<p>Un clic. CDN de Adobe, o la del cliente adelante. Imágenes por path mapping, nunca por el código.</p>'), ('∞', 'Medir y repetir', '<p>La telemetría operacional y los experimentos alimentan la próxima ronda. Sin sprint de TI.</p>')],
    passos_rotulos={'dica': 'desplace para avanzar'},
    a11y_abertura='<p>Accesibilidad por bloque · WCAG 2.2 AA</p><h2>Un botón. Todo bloque responde.</h2><p>El botón de accesibilidad solo activa una clase en la raíz de la página; el tema cambia los tokens y cada bloque trae su propia regla de contraste. La tabla de abajo mide, ahora, el contraste del texto de cada bloque de esta página. Cambie el modo y vea los números cambiar.</p>',
    a11y_painel_rotulos={'modos-titulo': 'Modos', 'modo-normal': 'normal', 'modos': 'Aumentar fuente|Disminuir fuente|Alto contraste|Blanco y negro|Invertir colores|Destacar enlaces', 'modos-nota': 'Los mismos botones del widget de la derecha: la elección queda en el navegador y vale para todo el sitio, sin scripts de terceros.', 'tabela-titulo': 'Bloques de esta página, medidos ahora', 'col-bloco': 'bloque', 'col-cores': 'texto / fondo', 'col-contraste': 'contraste', 'col-regra': 'regla de contraste', 'regra-propria': 'propia + tokens', 'regra-tokens': 'tokens del tema', 'aa': 'AA', 'em-contraste': 'alto contraste activo', 'tabela-nota': 'Mínimo WCAG AA: 4,5:1 (3:1 para texto grande). "Propia" significa que el CSS del bloque tiene regla bajo html.contrast; "tokens" significa que el bloque solo usa los colores del tema y ya responde.'},
    a11y_texto='<h2>Accesibilidad</h2><ul><li>Aumentar fuente</li><li>Disminuir fuente</li><li>Alto contraste</li><li>Blanco y negro</li><li>Invertir colores</li><li>Destacar enlaces</li></ul>',
    a11y_rotulos={'abrir': 'Herramientas de accesibilidad', 'tamanho-maximo': 'Tamaño máximo de la fuente', 'tamanho-minimo': 'Tamaño estándar de la fuente', 'tamanho': 'Tamaño de la fuente: {n}', 'tamanhos': 'normal|grande|mayor'},
    cc_banner=('Este sitio usa cookies y medios de terceros', 'Solo lo necesario carga ahora. Análisis y video esperan su elección. Aceptar y rechazar tienen el mismo peso.', 'Aceptar', 'Rechazar', 'Preferencias'),
    cc_prefs=('Configuración de cookies', 'Elija por categoría. El cambio vale al instante, incluso para revocar.', 'Rechazar', 'Guardar', 'Aceptar todo'),
    cc_cats=[('CC_ESSENTIAL', 'não', 'Necesarios', 'Sesión, seguridad y la propia elección de cookies.'), ('CC_ANALYTICS', 'sim', 'Análisis', 'Medición de uso. En esta demo: Web SDK de Adobe, solo después del sí.'), ('CC_MEDIA', 'sim', 'Medios y video', 'Videos y embeds. Sin esta categoría, el bloque muestra el aviso en lugar del player.')],
    cc_gate=('Video de Adobe: necesita "Medios y video"', 'El bloque de video no carga ni un byte antes de que permita esta categoría. La elección queda en el navegador por 12 meses, o hasta que cambie la política.', 'Permitir y ver', 'Abrir en nueva pestaña'),
)

T['en'] = dict(
    lang='en', raiz='/en', titulo='EDS Flash Demo', idioma='EN',
    descricao='Live demo of AEM Edge Delivery Services, Assets and Dynamic Media with native consent, built by EadTech for Adobe Professional Services.',
    aviso='<p><strong>For presentation to Adobe Professional Services only</strong> · EadTech demo environment</p>',
    marca='<p><strong>EadTech</strong> <em>EDS Flash Demo</em></p>',
    cookies='Cookie settings',
    rodape='<p>EadTech · Adobe strategic partner · internal demo, not a client site</p>',
    rodape_link='<p><a href="#definicoes-de-cookies">Cookie settings</a></p>',
    hero_texto='<p>AEM Edge Delivery Services · AEM Assets · Dynamic Media · native consent</p>'
               '<h1>The site that <em>loads fast on mobile | is accessible per block | crops with AI | talks to agents | asks permission | ships without IT</em> in a one-week migration.</h1>'
               '<p>This site is a live demo, not a slide: every page shows an EDS, Assets or EadTech-method capability actually working. Accessibility that holds for every block, Lighthouse measured on every publish, AI agents, native consent. The Adobe video below is the first example: it only loads after your yes.</p>',
    hero_rotulos={'selo-1': 'Lighthouse {desempenho} · {acessibilidade} · {praticas} · {seo} · measured {data}', 'selo-2': 'accessible per block · 6 tools', 'selo-sem-consentimento': 'no consent yet', 'selo-com-consentimento': 'media & video allowed', 'hud-bloqueado': 'gate active', 'hud-liberado': 'video unlocked', 'hud-embed': 'Adobe player', 'fonte': 'video: video.tv.adobe.com', 'titulo-video': 'Adobe video on Edge Delivery Services', 'log-liberado': 'gate CC_MEDIA: allowed → player inserted', 'log-revogado': 'gate CC_MEDIA: revoked → player removed, notice back (no reload)'},
    como='<p>How to use it in the presentation</p><p>1. Click the accessibility button on the right and turn on high contrast: the whole page changes, block by block.</p><p>2. Open Method in the menu and let the iceberg tell the investment.</p><p>3. Press play on the video: it asks for consent, loads instantly and disappears when revoked, without a reload.</p>',
    valor_iceberg='<p>Fast does not mean easy</p><h2>One week at the client. Years before it.</h2><p>What you see is the tip: the migration delivered in a week. What makes it possible sits below the waterline, invested before any client showed up. Scroll to see.</p>',
    valor_comparacao='<p>The hard way × Express Migration</p><h2>Hard does not deliver more. It delivers less, later.</h2><p>Same criteria, both paths. Toggle and watch where each number goes.</p>',
    valor_entregas='<p>What the week delivers</p><h2>Fast is what is left when the method is ready.</h2><p>Every number below is measured, not promised.</p>',
    valor_rotulos={'ponta-numero': '1', 'ponta-texto': 'week at the client, from kickoff to the site live', 'iceberg-legenda': 'below the waterline: the investment made before', 'caminho-a': 'The hard way', 'caminho-b': 'Express Migration'},
    camadas=[
        ('Method as a script', '<p>Every migration becomes a script: what is done, in what order, what is checked. The next one starts from step 1 already written, and the client only validates.</p>', '511', 'pages on the last portal'),
        ('Block library', '<p>Blocks already modelled for the Universal Editor, with the variant chosen by the author and never by a rule in code. A dictionary with a real capture of each one.</p>', '43', 'ready blocks'),
        ('Quality gate', '<p>Lint, block contract, automated tests and Lighthouse on every change. Nothing reaches main without passing.</p>', '308', 'tests'),
        ('Consent package', '<p>Banner, preferences and media gate under privacy law, with all copy authored and an axe audit with zero violations.</p>', '23', 'checks'),
        ('Content automation', '<p>Migrator, visual parity checker, index and redirects. The repetitive part stops being manual and stops depending on memory.</p>', '3', 'loading phases'),
        ('Suite knowledge', '<p>Assets, Dynamic Media, Target, Analytics, App Builder, site authentication: what each requires and where it fits, without experimenting on the client.</p>', '6', 'suite products'),
        ('Accessibility per block', '<p>Six tools (font, contrast, black and white, inversion, links) that only set a class on the root; every block answers with its own CSS. WCAG 2.2 AA, no third-party script.</p>', '6', 'tools · 0 third parties'),
    ],
    comparacoes=[
        ('Time to go live', '<p>Traditional project: discovery, design, components, integration, acceptance. Express: the method already exists, the content goes in.</p>', '26 weeks', '1 week'),
        ('Lighthouse performance (mobile)', '<p>Sites on heavy frameworks usually land between 40 and 70. EDS lands between 85 and 100 in this page\'s measurements, because it loads in three phases; the score moves a little on every run. The latest, with its date, is on the EDS inside page.</p>', '55', '85 to 100'),
        ('Third-party scripts before yes', '<p>Tag managers, pixels and videos usually run before any choice. Here, zero.</p>', '12', '0'),
        ('Client IT hours per month', '<p>No new block, no sprint: business teams publish in the Universal Editor.</p>', '160', '8'),
        ('Time to publish a change', '<p>From the IT queue to one click by the person who writes.</p>', '14 days', '1 minute'),
        ('Agentic readiness', '<p>Content in the HTML, semantic structure, metadata, index and llms.txt.</p>', '2 of 5', '5 of 5'),
    ],
    entregas=[
        ('Lighthouse measured on every publish', '<p>Performance, accessibility, best practices and SEO, on mobile, measured by CI. The score shows with its date on the home page and on the EDS inside page.</p>', '4', 'axes measured'),
        ('Agentic readiness', '<p>All five checks, with llms.txt published.</p>', '5', 'of 5'),
        ('Scripts before consent', '<p>No pixel, tag manager or video runs before yes.</p>', '0', 'scripts'),
        ('Click to publish', '<p>The author approves, publishes. Adobe\'s CDN or the client\'s in front.</p>', '1', 'click'),
        ('Consent validity', '<p>Choice stored per origin, with policy version. Change the policy and the banner is back.</p>', '12', 'months'),
        ('Security headers', '<p>CSP, COOP, HSTS, nosniff and permissions-policy versioned in the config service.</p>', '6', 'headers'),
    ],
    consent_abertura='<p>Native consent on EDS · EadTech block</p><h2>Native consent, no heavy CMP. And ready for the client\'s CMP.</h2><p>Banner and categories are authored content; code only does the gate. Every block that needs permission carries its category in the HTML (<code>data-consent-category</code>), and an adapter translates OneTrust, Cookiebot or TCF into the same events. Below, this page\'s network in real time.</p>',
    consent_rotulos={'cascata-titulo': 'This page\'s network waterfall', 'cascata-nota': 'Real resources of this page (Resource Timing), in the three EDS phases. What consent held back is struck through in red. Accept and watch the lines load.', 'cascata-video': 'Adobe player (video)', 'cascata-analytics': 'alloy.js (Web SDK)', 'fase-eager': 'eager', 'fase-lazy': 'lazy', 'fase-delayed': 'delayed · +3 s', 'bloqueado': 'blocked', 'bloqueados': 'blocked', 'tudo-liberado': 'all allowed', 'estado-titulo': 'Consent state', 'versao': VERSAO, 'cat-necessarios': 'Necessary', 'cat-analise': 'Analytics', 'cat-midia': 'Media & video', 'permitido': 'allowed', 'sem-escolha': 'no choice', 'botao-definicoes': 'Cookie settings', 'botao-esquecer': 'Forget choice (start over)', 'estado-nota': 'Stored in localStorage, per origin, with policy version and date. The events beside are what Adobe\'s martech plugin listens to.', 'log-titulo': 'Live events', 'log-lido': 'consent read from localStorage', 'log-sem-escolha': 'no stored choice → banner shown; only necessary categories apply', 'log-esquecido': 'choice forgotten → banner is back', 'log-consented': 'consented.js: CC_ANALYTICS → the Web SDK (alloy) would load here, in the delayed phase'},
    fases_abertura='<p>Three-phase loading · scroll to see</p><h2>Why it is fast on mobile.</h2>',
    fases=[('E', 'Eager', '<p>HTML, CSS and the first image: only what paints the LCP. Nothing third-party.</p>'), ('L', 'Lazy', '<p>Blocks come in order, each with its own CSS and JS. Fonts and off-screen images wait.</p>'), ('D', 'Delayed', '<p>Three seconds later: consent, and only then martech. Lighthouse has already finished measuring.</p>')],
    fases_rotulos={'url': 'https://demo.eadtech…/', 'lcp': 'LCP {lcp}', 'cookies': 'cookies · accept / refuse'},
    midia_abertura='<p>AEM Assets · Dynamic Media with OpenAPI</p><h2>One image in the DAM, endless deliveries at the edge.</h2><p>Every media file on this page lives in Assets and is referenced from there. With Dynamic Media, the same photo comes out AI-cropped for each ratio and optimised by URL, with nobody generating files.</p>',
    midia_rotulos={'recorte-titulo': 'AI Smart Crop', 'recorte-real': 'Dynamic Media', 'recorte-simulado': 'simulation · live once DM is enabled on the sandbox', 'recorte-hero': 'hero', 'recorte-card': 'card', 'recorte-stories': 'stories', 'sujeito': 'Point of interest', 'trocar': 'Swap the image in the DAM', 'trocar-nota': 're-approve in Assets → the page changes without republishing', 'trocar-feito': 'asset re-approved at', 'trocar-log': 'Assets: asset re-approved → delivery updated, 0 republish', 'recorte-nota': 'Drag: the point of interest moves and all three crops follow it. In Dynamic Media this is the smart-crop profile applied on upload.', 'url-titulo': 'Rendition by URL', 'largura': 'Width', 'qualidade': 'Quality', 'formato': 'Format', 'kb': 'estimated KB', 'original': '· the original is', 'url-nota': 'Only approved assets are delivered. The URL is the contract: width, quality, format and crop profile.'},
    eds_abertura='<p>Edge Delivery Services · what this page uses</p><h2>Every box is a real capability, measured on this page.</h2>',
    bento=[
        ('lighthouse', 'Lighthouse · mobile · measured', '<p>Real Lighthouse, run by CI on the preview on every push and every day. SEO is measured without the indexing audit, because aem.page is not indexed on purpose.</p>', 'Performance|Accessibility|Best practices|SEO', '3'),
        ('fases', 'Phases measured on this page', '<p>Your browser\'s Navigation Timing, right now. LCP first, then blocks, martech and consent last.</p>', 'eager|lazy|delayed', '3'),
        ('indice', 'query-index.json', '<p>Index published automatically; feeds lists, cards and agents.</p>', '', '2'),
        ('cabecalhos', 'Security headers', '<p>Versioned in the config service, checked on every publish.</p>', "content-security-policy=default-src 'self' …|cross-origin-opener-policy=same-origin|x-content-type-options=nosniff|permissions-policy=camera=(), geolocation=()|strict-transport-security=max-age=31557600", '2'),
        ('edge', 'Serverless functions · App Builder', '<p>A real call, right now: the function runs on Adobe I/O Runtime, fetches the USD PTAX rate from Brazil\'s Central Bank and keeps it for 10 minutes. The function secret stays on the server; the response only states its length. On a client CDN, an edge worker plays the same role.</p>', 'Call the function|https://3763698-creciuploadsdemo-stage.adobeioruntime.net/api/v1/web/demo-ps/cotacao/usd', '2'),
        ('ab', 'Experimentation', '<p>A/B by page metadata, variants as URLs, results in operational telemetry. Target plugs in through the same Web SDK when the client has it.</p>', 'Variant A|Variant B|Allow and watch|Watch the video (12 s)', '2'),
        ('texto', 'Authoring', '<p>Universal Editor with a block catalogue in the client\'s language. Variants are the author\'s choice, never a path rule in code.</p><p><a href="#autoria">See the flow</a></p>', '', '2'),
        ('telemetria', 'Operational Telemetry', '<p>Real-user Core Web Vitals, by page and device, with no third-party script. The numbers below are a sample of the dashboard: this demo has no real traffic to back a measurement.</p>', 'LCP:0.4 s:22|INP:48 ms:12|CLS:0.00:4', '2'),
        ('texto', 'Accessibility per block', '<p>Open the accessibility button on the right and turn on high contrast: the whole page changes instantly, including the video gate, the cookie banner and these panels. The button only sets a class on the root; the theme swaps the tokens and each block brings its own rule. No block needs to know about the button.</p>', '', '6'),
    ],
    agentic_abertura='<p>Agentic readiness</p><h2>What an AI agent gets from this page.</h2>',
    verificacoes=[('Full content in the HTML, no script required', 'ok'), ('Semantic structure: main, headings, real lists and tables', 'ok'), ('Metadata and JSON-LD on every page', 'ok'), ('Machine-readable index and sitemap', 'ok'), ('llms.txt with priority content and usage rules', 'ok')],
    agentic_rotulos={'verificacoes': 'Five checks', 'curl-titulo': 'As an agent sees it (curl)', 'renderizado': 'Rendered', 'renderizado-nota': 'the same text, now without markup: nothing changes for the agent'},
    passos_abertura='<p>Authoring and governance</p><h2>Business teams publish. IT only steps in for a new block.</h2>',
    passos=[('✎', 'Universal Editor', '<p>Visual editing on the page itself, with the DAM Asset Selector and a block catalogue.</p>'), ('⚿', 'Preview with login', '<p>Site authentication at the edge: only EadTech and Adobe emails see the preview.</p>'), ('✓', 'Quality gate', '<p>Lint, block contract, tests and Lighthouse on every change. Nothing ships without passing.</p>'), ('↗', 'Publish', '<p>One click. Adobe\'s CDN, or the client\'s in front. Images via path mapping, never via code.</p>'), ('∞', 'Measure and repeat', '<p>Operational telemetry and experiments feed the next round. No IT sprint.</p>')],
    passos_rotulos={'dica': 'scroll to advance'},
    a11y_abertura='<p>Accessibility per block · WCAG 2.2 AA</p><h2>One button. Every block answers.</h2><p>The accessibility button only sets a class on the page root; the theme swaps the tokens and each block brings its own contrast rule. The table below measures, right now, the text contrast of every block on this page. Switch the mode and watch the numbers change.</p>',
    a11y_painel_rotulos={'modos-titulo': 'Modes', 'modo-normal': 'normal', 'modos': 'Increase font|Decrease font|High contrast|Black and white|Invert colours|Highlight links', 'modos-nota': 'The same buttons as the widget on the right: the choice stays in the browser and applies to the whole site, with no third-party script.', 'tabela-titulo': 'Blocks on this page, measured now', 'col-bloco': 'block', 'col-cores': 'text / background', 'col-contraste': 'contrast', 'col-regra': 'contrast rule', 'regra-propria': 'own + tokens', 'regra-tokens': 'theme tokens', 'aa': 'AA', 'em-contraste': 'high contrast on', 'tabela-nota': 'WCAG AA minimum: 4.5:1 (3:1 for large text). "Own" means the block CSS has a rule under html.contrast; "tokens" means the block only uses theme colours and already answers.'},
    a11y_texto='<h2>Accessibility</h2><ul><li>Increase font</li><li>Decrease font</li><li>High contrast</li><li>Black and white</li><li>Invert colours</li><li>Highlight links</li></ul>',
    a11y_rotulos={'abrir': 'Accessibility tools', 'tamanho-maximo': 'Maximum font size', 'tamanho-minimo': 'Default font size', 'tamanho': 'Font size: {n}', 'tamanhos': 'normal|large|larger'},
    cc_banner=('This site uses cookies and third-party media', 'Only the essentials load now. Analytics and video wait for your choice. Accept and refuse carry the same weight.', 'Accept', 'Refuse', 'Preferences'),
    cc_prefs=('Cookie settings', 'Choose by category. Changes apply instantly, including revocation.', 'Refuse', 'Save', 'Accept all'),
    cc_cats=[('CC_ESSENTIAL', 'não', 'Necessary', 'Session, security and the cookie choice itself.'), ('CC_ANALYTICS', 'sim', 'Analytics', 'Usage measurement. In this demo: Adobe Web SDK, only after yes.'), ('CC_MEDIA', 'sim', 'Media & video', 'Videos and embeds. Without this category, the block shows a notice instead of the player.')],
    cc_gate=('Adobe video: needs "Media & video"', 'The video block does not load a single byte before you allow this category. The choice stays in your browser for 12 months, or until the policy changes.', 'Allow and watch', 'Open in a new tab'),
)

# --------------------------------------------------------------------------
# medidor de cookies (leitura real de outro site, pela ação do App Builder)
# --------------------------------------------------------------------------
MEDIDOR = 'https://3763698-creciuploadsdemo-stage.adobeioruntime.net/api/v1/web/demo-ps/medir'
PREVIA = 'https://main--eds-flash-demo--eadtechsa.aem.page/'

T['pt']['medidor_abertura'] = ('<p>Medidor de cookies · leitura real</p>'
    '<h2>Digite um site. Veja o que ele grava antes do seu sim.</h2>'
    '<p>Um navegador limpo, saindo de uma conexão no Brasil, abre o endereço e não clica em nada. Em uns 40 segundos aparece aqui quem foi chamado, quais cookies ficaram gravados e se havia banner na tela. Compare com esta demo: zero.</p>')
T['pt']['medidor_rotulos'] = {
    'campo-rotulo': 'Endereço do site', 'campo-exemplo': 'www.seusite.com.br', 'botao': 'Medir agora',
    'exemplos': f'Esta demo (prévia)={PREVIA}',
    'etapas': 'conectando a um navegador no Brasil…|abrindo o site sem clicar em nada…|parado, como quem ainda não escolheu…|lendo cookies e terceiros…',
    'segundos': '{n} s',
    'veredito-alerta': '{n} serviços de publicidade, medição ou personalização rodaram antes de qualquer escolha',
    'veredito-ok': 'Nenhum serviço de publicidade, medição ou personalização antes da escolha',
    'origem': 'Medido de {local} · {rede} · {quando}', 'cache': 'leitura feita há pouco, guardada por 30 min.', 'refazer': 'Medir de novo',
    'k-terceiros': 'serviços de terceiros chamados', 'k-cookies': 'cookies gravados', 'k-esperariam': 'cookies que deveriam esperar o sim',
    'k-primeiro': 'primeiro rastreador', 'k-banner': 'banner de cookies', 'banner-sim': 'na tela', 'banner-nao': 'não apareceu', 'cmp-proprio': 'banner próprio',
    'linha-titulo': 'Quando cada terceiro foi chamado', 'linha-nota': 'Tempo contado do início da navegação, já com a demora do proxy no Brasil (um visitante comum vê tudo isso mais cedo). Ninguém clicou em nada.', 'mostrar-mais': 'Ver os {n}',
    'cookies-titulo': 'Cookies gravados antes da escolha', 'col-nome': 'nome', 'col-dominio': 'domínio', 'col-categoria': 'categoria', 'col-validade': 'validade',
    'parte-1': '1ª parte', 'parte-3': '3ª parte', 'sessao': 'sessão', 'dias': '{n} dias',
    'captura-titulo': 'O que o visitante vê nesse momento', 'captura-alt': 'Captura da página medida antes de qualquer escolha do visitante',
    'cat-publicidade': 'publicidade', 'cat-medicao': 'medição', 'cat-personalizacao': 'personalização', 'cat-gerenciador': 'gerenciador de tags',
    'cat-cmp': 'gestão de consentimento', 'cat-desempenho': 'desempenho', 'cat-seguranca': 'segurança', 'cat-necessario': 'necessário',
    'cat-infraestrutura': 'infraestrutura', 'cat-atendimento': 'atendimento', 'cat-midia': 'vídeo', 'cat-outros': 'outros', 'cat-primeira-parte': '1ª parte',
    'nota': 'Leitura técnica do que o navegador registrou, não parecer jurídico. Publicidade, medição e personalização são as categorias que, pelo Guia de Cookies da ANPD, deveriam esperar o consentimento. Cookies necessários e de segurança não entram na conta. Os valores dos cookies não são lidos.',
    'so-login': 'Na prévia pública o campo fica desligado. A medição roda só na versão com login, para ninguém usar a demo para varrer sites de terceiros.',
    'erro-origem': 'O medidor só responde à versão com login desta demo.', 'erro-limite': 'Chegamos ao limite de medições por agora. Tente de novo mais tarde.',
    'erro-url': 'Esse endereço não foi aceito: {m}.', 'erro-navegador': 'O site não abriu no navegador de medição: {m}.',
    'erro-rede': 'Não deu para falar com o medidor. Confira a conexão e tente de novo.', 'erro-sem-chave': 'O medidor ainda não foi configurado.',
}

T['es']['medidor_abertura'] = ('<p>Medidor de cookies · lectura real</p>'
    '<h2>Escribe un sitio. Mira lo que graba antes de tu sí.</h2>'
    '<p>Un navegador limpio, saliendo de una conexión en Brasil, abre la dirección y no hace clic en nada. En unos 40 segundos aparece aquí a quién llamó, qué cookies quedaron grabadas y si había banner en pantalla. Compara con esta demo: cero.</p>')
T['es']['medidor_rotulos'] = {
    'campo-rotulo': 'Dirección del sitio', 'campo-exemplo': 'www.tusitio.com', 'botao': 'Medir ahora',
    'exemplos': f'Esta demo (vista previa)={PREVIA}',
    'etapas': 'conectando a un navegador en Brasil…|abriendo el sitio sin hacer clic…|quieto, como quien todavía no eligió…|leyendo cookies y terceros…',
    'segundos': '{n} s',
    'veredito-alerta': '{n} servicios de publicidad, medición o personalización corrieron antes de cualquier elección',
    'veredito-ok': 'Ningún servicio de publicidad, medición o personalización antes de la elección',
    'origem': 'Medido desde {local} · {rede} · {quando}', 'cache': 'lectura reciente, guardada por 30 min.', 'refazer': 'Medir de nuevo',
    'k-terceiros': 'servicios de terceros llamados', 'k-cookies': 'cookies grabadas', 'k-esperariam': 'cookies que deberían esperar el sí',
    'k-primeiro': 'primer rastreador', 'k-banner': 'banner de cookies', 'banner-sim': 'en pantalla', 'banner-nao': 'no apareció', 'cmp-proprio': 'banner propio',
    'linha-titulo': 'Cuándo se llamó a cada tercero', 'linha-nota': 'Tiempo desde el inicio de la navegación, ya con la demora del proxy en Brasil (un visitante común lo ve antes). Nadie hizo clic.', 'mostrar-mais': 'Ver los {n}',
    'cookies-titulo': 'Cookies grabadas antes de la elección', 'col-nome': 'nombre', 'col-dominio': 'dominio', 'col-categoria': 'categoría', 'col-validade': 'validez',
    'parte-1': '1ª parte', 'parte-3': '3ª parte', 'sessao': 'sesión', 'dias': '{n} días',
    'captura-titulo': 'Lo que ve el visitante en ese momento', 'captura-alt': 'Captura de la página medida antes de cualquier elección del visitante',
    'cat-publicidade': 'publicidad', 'cat-medicao': 'medición', 'cat-personalizacao': 'personalización', 'cat-gerenciador': 'gestor de etiquetas',
    'cat-cmp': 'gestión de consentimiento', 'cat-desempenho': 'rendimiento', 'cat-seguranca': 'seguridad', 'cat-necessario': 'necesaria',
    'cat-infraestrutura': 'infraestructura', 'cat-atendimento': 'atención', 'cat-midia': 'video', 'cat-outros': 'otros', 'cat-primeira-parte': '1ª parte',
    'nota': 'Lectura técnica de lo que registró el navegador, no un dictamen jurídico. Publicidad, medición y personalización son las categorías que, según la guía de cookies de la ANPD (Brasil), deberían esperar el consentimiento. Las cookies necesarias y de seguridad no cuentan. Los valores de las cookies no se leen.',
    'so-login': 'En la vista previa pública el campo está apagado. La medición corre solo en la versión con login, para que nadie use la demo para escanear sitios ajenos.',
    'erro-origem': 'El medidor solo responde a la versión con login de esta demo.', 'erro-limite': 'Llegamos al límite de mediciones por ahora. Inténtalo más tarde.',
    'erro-url': 'Esa dirección no fue aceptada: {m}.', 'erro-navegador': 'El sitio no abrió en el navegador de medición: {m}.',
    'erro-rede': 'No se pudo hablar con el medidor. Revisa la conexión e inténtalo de nuevo.', 'erro-sem-chave': 'El medidor todavía no está configurado.',
}

T['en']['medidor_abertura'] = ('<p>Cookie meter · live reading</p>'
    '<h2>Type a site. See what it stores before your yes.</h2>'
    '<p>A clean browser on a Brazilian connection opens the address and clicks nothing. In about 40 seconds you see who was called, which cookies were stored and whether a banner was on screen. Compare with this demo: zero.</p>')
T['en']['medidor_rotulos'] = {
    'campo-rotulo': 'Site address', 'campo-exemplo': 'www.yoursite.com', 'botao': 'Measure now',
    'exemplos': f'This demo (preview)={PREVIA}',
    'etapas': 'connecting to a browser in Brazil…|opening the site without clicking anything…|waiting, like someone who has not chosen yet…|reading cookies and third parties…',
    'segundos': '{n} s',
    'veredito-alerta': '{n} advertising, measurement or personalization services ran before any choice',
    'veredito-ok': 'No advertising, measurement or personalization before the choice',
    'origem': 'Measured from {local} · {rede} · {quando}', 'cache': 'recent reading, kept for 30 min.', 'refazer': 'Measure again',
    'k-terceiros': 'third-party services called', 'k-cookies': 'cookies stored', 'k-esperariam': 'cookies that should wait for yes',
    'k-primeiro': 'first tracker', 'k-banner': 'cookie banner', 'banner-sim': 'on screen', 'banner-nao': 'did not show', 'cmp-proprio': 'in-house banner',
    'linha-titulo': 'When each third party was called', 'linha-nota': 'Time from the start of navigation, including the Brazilian proxy delay (a regular visitor gets all this sooner). Nobody clicked anything.', 'mostrar-mais': 'Show all {n}',
    'cookies-titulo': 'Cookies stored before the choice', 'col-nome': 'name', 'col-dominio': 'domain', 'col-categoria': 'category', 'col-validade': 'lifetime',
    'parte-1': '1st party', 'parte-3': '3rd party', 'sessao': 'session', 'dias': '{n} days',
    'captura-titulo': 'What the visitor sees at that moment', 'captura-alt': 'Screenshot of the measured page before any visitor choice',
    'cat-publicidade': 'advertising', 'cat-medicao': 'measurement', 'cat-personalizacao': 'personalization', 'cat-gerenciador': 'tag manager',
    'cat-cmp': 'consent management', 'cat-desempenho': 'performance', 'cat-seguranca': 'security', 'cat-necessario': 'necessary',
    'cat-infraestrutura': 'infrastructure', 'cat-atendimento': 'support', 'cat-midia': 'video', 'cat-outros': 'other', 'cat-primeira-parte': '1st party',
    'nota': 'A technical reading of what the browser recorded, not legal advice. Advertising, measurement and personalization are the categories that, under the Brazilian ANPD cookie guide, should wait for consent. Necessary and security cookies are not counted. Cookie values are never read.',
    'so-login': 'On the public preview the field is off. Measuring only runs on the signed-in version, so nobody can use the demo to scan other sites.',
    'erro-origem': 'The meter only answers the signed-in version of this demo.', 'erro-limite': 'We hit the measuring limit for now. Try again later.',
    'erro-url': 'That address was not accepted: {m}.', 'erro-navegador': 'The site did not open in the measuring browser: {m}.',
    'erro-rede': 'Could not reach the meter. Check the connection and try again.', 'erro-sem-chave': 'The meter is not configured yet.',
}

# --------------------------------------------------------------------------
# portões de qualidade (o que cada mudança atravessa antes do site)
# --------------------------------------------------------------------------
PORTOES = {
'pt': dict(
    abertura='<p>Portões de qualidade</p><h2>Nada chega ao site sem passar por aqui.</h2><p>Os mesmos portões que a EadTech roda em todo projeto EDS. Os seis primeiros rodam a cada push e reprovam o build na hora. Os outros conferem o site publicado e a própria página que você está vendo. Filtre pelo momento em que cada um entra.</p>',
    itens=[
        ('ESLint no padrão Airbnb', 'push', '<p>Todo JavaScript segue o guia da Airbnb, o mesmo do boilerplate da Adobe. Variável esquecida, import sem extensão ou estilo fora do padrão param o build ali mesmo.</p>', 'npm run lint:js'),
        ('Modelos do Universal Editor (regras xwalk)', 'push', '<p>O plugin da Adobe confere definições, modelos e filtros de cada bloco: campo sem nome, filtro que aponta para componente inexistente, bloco com colunas demais para o autor. O que aparece no painel do editor nasce daqui.</p>', 'npm run lint:js'),
        ('Stylelint', 'push', '<p>CSS no padrão, classes em kebab-case e seletor sempre preso ao bloco, para um bloco nunca vazar no outro. A única exceção são as classes do Rybená.</p>', 'npm run lint:css'),
        ('Contrato de contraste por bloco', 'push', '<p>Bloco com cor própria precisa dizer como fica no alto contraste, com regra <code>html.contrast</code> dele mesmo, e sem <code>!important</code>. Bloco novo sem essa regra não entra. É o que faz o botão de acessibilidade valer para o site inteiro.</p>', 'npm run a11y:contrato'),
        ('Contrato Rybená (R1 a R8)', 'push', '<p>O Rybená, widget de Libras e voz usado por bancos e órgãos públicos, marca cada elemento com uma classe. O contrato barra o que corta essa ligação: <code>!important</code> (R1), trocar a lista de classes inteira (R2), gradiente que não sai nos modos de contraste (R3), texto em pseudo-elemento com cor fixa (R4), SVG com cor fixa (R5), CSP que bloqueie o Rybená (R6), política de referrer que esconda o domínio (R7) e câmera ou microfone negados (R8).</p>', 'npm run a11y:rybena'),
        ('Cabeçalhos de segurança A+', 'push', '<p>O arquivo de cabeçalhos precisa tirar A+ no critério do securityheaders.com, sem nenhum aviso, e já trazer COOP, COEP e CORP. A CSP parte da recomendada pela Adobe e libera só o que esta página usa: o player da Adobe, o medidor de cookies e o Rybená.</p>', 'npm run seguranca:contrato'),
        ('Cabeçalhos na entrega', 'entrega', '<p>Depois de publicado, lê o que o aem.page e o aem.live devolvem de verdade e compara com o repositório. Roda a cada push na main e toda segunda-feira. No aem.page o HSTS vem da própria plataforma; no domínio do cliente, a CDN entrega o valor do repositório.</p>', 'npm run seguranca:entrega'),
        ('Lighthouse no celular', 'entrega', '<p>O CI roda o Lighthouse na prévia a cada push na main e todo dia, e publica a nota com data. É ela que aparece no selo do topo e na seção EDS, sem número escrito à mão. O SEO é medido sem a auditoria de indexação, porque o aem.page não é indexado de propósito.</p>', 'lighthouse --form-factor=mobile (CI)'),
        ('Acessibilidade por modo e por bloco (axe)', 'navegador', '<p>Liga cada modo do widget (normal, alto contraste, tons de cinza, inversão, links, fonte maior e a combinação) no computador e no celular, roda o axe com WCAG 2.2 AA e separa o que achar por bloco. Também clica nos botões do widget para provar que funcionam.</p>', 'npm run a11y:modos'),
        ('Rybená no navegador', 'navegador', '<p>Carrega o script oficial do Rybená, liga onze modos pela API documentada e mede bloco a bloco: se cada texto recebeu a classe, se o contraste segura, se o filtro vale e se nada transborda.</p>', 'npm run a11y:rybena-navegador'),
        ('Painel de acessibilidade ao vivo', 'pagina', '<p>A página de acessibilidade mede agora, no seu navegador, o contraste do texto de cada bloco e se ele tem regra própria. Trocou o modo, a tabela mede de novo.</p>', ''),
        ('Zero terceiros antes do sim', 'pagina', '<p>O medidor de cookies mede esta demo com o mesmo navegador remoto que mede os outros sites: nenhum terceiro e nenhum cookie antes da escolha. A cascata de rede da seção de consentimento mostra o mesmo, ao vivo.</p>', ''),
        ('Leitura por agentes de IA', 'pagina', '<p>O bloco agentic busca o .plain.html desta página, que é o que um agente recebe, e confere conteúdo inteiro no HTML, títulos em ordem e metadados.</p>', ''),
    ],
    rotulos={'momentos': 'push=A cada push|entrega=Na entrega publicada|navegador=No navegador|pagina=Nesta página, ao vivo', 'todos': 'Todos', 'filtros-rotulo': 'Filtrar portões por momento', 'contador': '{n} portões', 'ok': '✓', 'nota': 'Os portões de push rodam no GitHub Actions a cada commit e barram o merge. Os de navegador rodam na main e sob demanda, com relatório por bloco guardado em cada execução.', 'editor-titulo': 'Textos da interface'},
),
'es': dict(
    abertura='<p>Controles de calidad</p><h2>Nada llega al sitio sin pasar por aquí.</h2><p>Los mismos controles que EadTech corre en todo proyecto EDS. Los seis primeros corren en cada push y reprueban el build en el acto. Los demás revisan el sitio publicado y la propia página que está viendo. Filtre por el momento en que entra cada uno.</p>',
    itens=[
        ('ESLint con la guía Airbnb', 'push', '<p>Todo el JavaScript sigue la guía de Airbnb, la misma del boilerplate de Adobe. Una variable olvidada, un import sin extensión o un estilo fuera de la norma detienen el build ahí mismo.</p>', 'npm run lint:js'),
        ('Modelos del Universal Editor (reglas xwalk)', 'push', '<p>El plugin de Adobe revisa definiciones, modelos y filtros de cada bloque: campo sin nombre, filtro que apunta a un componente que no existe, bloque con demasiadas columnas para el autor. Lo que aparece en el panel del editor nace aquí.</p>', 'npm run lint:js'),
        ('Stylelint', 'push', '<p>CSS según la norma, clases en kebab-case y selectores siempre dentro del bloque, para que un bloque nunca afecte a otro. La única excepción son las clases de Rybená.</p>', 'npm run lint:css'),
        ('Contrato de contraste por bloque', 'push', '<p>Un bloque con color propio debe decir cómo queda en alto contraste, con su propia regla <code>html.contrast</code> y sin <code>!important</code>. Un bloque nuevo sin esa regla no entra. Es lo que hace que el botón de accesibilidad valga para todo el sitio.</p>', 'npm run a11y:contrato'),
        ('Contrato Rybená (R1 a R8)', 'push', '<p>Rybená, widget de lengua de señas y voz usado por bancos y organismos públicos de Brasil, marca cada elemento con una clase. El contrato bloquea lo que corta ese vínculo: <code>!important</code> (R1), reemplazar toda la lista de clases (R2), degradado que no se apaga en los modos de contraste (R3), texto en pseudoelemento con color fijo (R4), SVG con color fijo (R5), CSP que bloquee Rybená (R6), política de referrer que oculte el dominio (R7) y cámara o micrófono denegados (R8).</p>', 'npm run a11y:rybena'),
        ('Cabeceras de seguridad A+', 'push', '<p>El archivo de cabeceras debe sacar A+ con el criterio de securityheaders.com, sin ningún aviso, y traer COOP, COEP y CORP. La CSP parte de la recomendada por Adobe y libera solo lo que esta página usa: el reproductor de Adobe, el medidor de cookies y Rybená.</p>', 'npm run seguranca:contrato'),
        ('Cabeceras en la entrega', 'entrega', '<p>Después de publicar, lee lo que aem.page y aem.live devuelven de verdad y lo compara con el repositorio. Corre en cada push a main y todos los lunes. En aem.page el HSTS lo pone la plataforma; en el dominio del cliente, la CDN entrega el valor del repositorio.</p>', 'npm run seguranca:entrega'),
        ('Lighthouse en el celular', 'entrega', '<p>El CI corre Lighthouse en la vista previa en cada push a main y todos los días, y publica la nota con fecha. Es la que aparece en el sello de arriba y en la sección EDS, sin número escrito a mano. El SEO se mide sin la auditoría de indexación, porque aem.page no se indexa a propósito.</p>', 'lighthouse --form-factor=mobile (CI)'),
        ('Accesibilidad por modo y por bloque (axe)', 'navegador', '<p>Activa cada modo del widget (normal, alto contraste, escala de grises, inversión, enlaces, letra más grande y la combinación) en computadora y celular, corre axe con WCAG 2.2 AA y separa lo que encuentra por bloque. También pulsa los botones del widget para probar que funcionan.</p>', 'npm run a11y:modos'),
        ('Rybená en el navegador', 'navegador', '<p>Carga el script oficial de Rybená, activa once modos por la API documentada y mide bloque a bloque: si cada texto recibió la clase, si el contraste se sostiene, si el filtro vale y si nada se desborda.</p>', 'npm run a11y:rybena-navegador'),
        ('Panel de accesibilidad en vivo', 'pagina', '<p>La página de accesibilidad mide ahora, en su navegador, el contraste del texto de cada bloque y si tiene regla propia. Cambió el modo, la tabla vuelve a medir.</p>', ''),
        ('Cero terceros antes del sí', 'pagina', '<p>El medidor de cookies mide esta demo con el mismo navegador remoto que mide los otros sitios: ningún tercero y ninguna cookie antes de la elección. La cascada de red de la sección de consentimiento muestra lo mismo, en vivo.</p>', ''),
        ('Lectura por agentes de IA', 'pagina', '<p>El bloque agentic busca el .plain.html de esta página, que es lo que recibe un agente, y revisa contenido completo en el HTML, títulos en orden y metadatos.</p>', ''),
    ],
    rotulos={'momentos': 'push=En cada push|entrega=En la entrega publicada|navegador=En el navegador|pagina=En esta página, en vivo', 'todos': 'Todos', 'filtros-rotulo': 'Filtrar controles por momento', 'contador': '{n} controles', 'ok': '✓', 'nota': 'Los controles de push corren en GitHub Actions en cada commit y bloquean el merge. Los de navegador corren en main y bajo demanda, con un informe por bloque guardado en cada ejecución.', 'editor-titulo': 'Textos de la interfaz'},
),
'en': dict(
    abertura='<p>Quality gates</p><h2>Nothing reaches the site without passing through here.</h2><p>The same gates EadTech runs on every EDS project. The first six run on every push and fail the build on the spot. The rest check the published site and the very page you are looking at. Filter by when each one runs.</p>',
    itens=[
        ('ESLint with the Airbnb guide', 'push', '<p>All JavaScript follows the Airbnb guide, the same one in the Adobe boilerplate. A forgotten variable, an import without an extension or off-standard style stops the build right there.</p>', 'npm run lint:js'),
        ('Universal Editor models (xwalk rules)', 'push', '<p>The Adobe plugin checks every block\'s definitions, models and filters: unnamed fields, filters pointing to components that do not exist, blocks with too many columns for an author. What shows up in the editor panel starts here.</p>', 'npm run lint:js'),
        ('Stylelint', 'push', '<p>Standard CSS, kebab-case classes and selectors always scoped to their block, so one block never leaks into another. Rybená classes are the only exception.</p>', 'npm run lint:css'),
        ('Per-block contrast contract', 'push', '<p>A block with its own colors must say how it looks in high contrast, with its own <code>html.contrast</code> rule and no <code>!important</code>. A new block without that rule does not get in. This is what makes the accessibility button work across the whole site.</p>', 'npm run a11y:contrato'),
        ('Rybená contract (R1 to R8)', 'push', '<p>Rybená, a sign language and voice widget used by Brazilian banks and public bodies, tags every element with a class. The contract blocks anything that breaks that link: <code>!important</code> (R1), replacing the whole class list (R2), gradients that stay on in contrast modes (R3), pseudo-element text with a fixed color (R4), SVG with a fixed color (R5), a CSP that blocks Rybená (R6), a referrer policy that hides the domain (R7) and denied camera or microphone (R8).</p>', 'npm run a11y:rybena'),
        ('A+ security headers', 'push', '<p>The headers file must score A+ by securityheaders.com criteria with no warnings at all, and already ship COOP, COEP and CORP. The CSP starts from the one Adobe recommends and allows only what this page uses: the Adobe player, the cookie meter and Rybená.</p>', 'npm run seguranca:contrato'),
        ('Headers on delivery', 'entrega', '<p>After publishing, reads what aem.page and aem.live actually return and compares it with the repository. Runs on every push to main and every Monday. On aem.page the platform sets HSTS itself; on the client domain the CDN serves the repository value.</p>', 'npm run seguranca:entrega'),
        ('Mobile Lighthouse', 'entrega', '<p>CI runs Lighthouse on the preview on every push to main and every day, and publishes the score with its date. That is what shows in the top badge and in the EDS section, with no number typed by hand. SEO is measured without the indexing audit, because aem.page is not indexed on purpose.</p>', 'lighthouse --form-factor=mobile (CI)'),
        ('Accessibility per mode and per block (axe)', 'navegador', '<p>Turns on every widget mode (normal, high contrast, grayscale, invert, links, larger text and the combination) on desktop and mobile, runs axe with WCAG 2.2 AA and groups findings by block. It also clicks the widget buttons to prove they work.</p>', 'npm run a11y:modos'),
        ('Rybená in the browser', 'navegador', '<p>Loads the official Rybená script, turns on eleven modes through the documented API and measures block by block: whether every text got the class, whether contrast holds, whether the filter applies and whether anything overflows.</p>', 'npm run a11y:rybena-navegador'),
        ('Live accessibility panel', 'pagina', '<p>The accessibility page measures, right now in your browser, the text contrast of every block and whether it has its own rule. Switch the mode and the table measures again.</p>', ''),
        ('Zero third parties before yes', 'pagina', '<p>The cookie meter measures this demo with the same remote browser it uses for other sites: no third parties and no cookies before the choice. The network waterfall in the consent section shows the same thing, live.</p>', ''),
        ('Read by AI agents', 'pagina', '<p>The agentic block fetches this page\'s .plain.html, which is what an agent receives, and checks full content in the HTML, ordered headings and metadata.</p>', ''),
    ],
    rotulos={'momentos': 'push=On every push|entrega=On delivery|navegador=In the browser|pagina=On this page, live', 'todos': 'All', 'filtros-rotulo': 'Filter gates by when they run', 'contador': '{n} gates', 'ok': '✓', 'nota': 'Push gates run in GitHub Actions on every commit and block the merge. Browser gates run on main and on demand, with a per-block report saved on every run.', 'editor-titulo': 'Interface texts'},
),
}
for _lg in ('pt', 'es', 'en'):
    T[_lg]['portoes'] = PORTOES[_lg]


# --------------------------------------------------------------------------
# mini site: uma página por assunto, agrupadas no menu
# (slug do IDS, grupo, nome no menu, h1, linha de abertura)
# --------------------------------------------------------------------------
GRUPOS = {
    'pt': {'rapido': 'Por que é rápido', 'confianca': 'Confiança', 'conteudo': 'Conteúdo e IA'},
    'es': {'rapido': 'Por qué es rápido', 'confianca': 'Confianza', 'conteudo': 'Contenido e IA'},
    'en': {'rapido': 'Why it is fast', 'confianca': 'Trust', 'conteudo': 'Content and AI'},
}
PAGINAS = {
    'pt': [
        ('metodo', 'rapido', 'Método', 'Método Migração Express', 'Uma semana no cliente, do kickoff ao site no ar. O que foi feito antes dela, a comparação com o caminho tradicional e o que a semana entrega.'),
        ('fases', 'rapido', 'Três fases', 'Carregamento em três fases', 'O que entra primeiro, o que espera e o que só carrega depois do consentimento. É por isso que o EDS é rápido no celular.'),
        ('eds', 'rapido', 'EDS por dentro', 'Edge Delivery Services por dentro', 'Recursos da plataforma rodando aqui: a nota do Lighthouse medida pelo CI, o índice de páginas, os cabeçalhos de segurança e uma função serverless chamada de verdade.'),
        ('acessibilidade', 'confianca', 'Acessibilidade', 'Acessibilidade por bloco', 'Cada bloco responde pelo próprio contraste, foco e leitura. O painel mede o site no seu navegador, agora.'),
        ('consentimento', 'confianca', 'Consentimento', 'Consentimento nativo', 'Nada de terceiro entra antes do sim. Veja a rede em tempo real e meça qualquer outro site com o medidor de cookies.'),
        ('portoes', 'confianca', 'Portões de qualidade', 'Portões de qualidade', 'O que roda a cada push, na entrega e no navegador antes de qualquer mudança chegar ao ar, e por que cada verificação existe.'),
        ('midia', 'conteudo', 'Assets e Dynamic Media', 'Assets e Dynamic Media', 'Uma imagem no DAM, vários recortes por IA e a entrega no tamanho certo para cada tela.'),
        ('agentic', 'conteudo', 'Agentes de IA', 'Pronto para agentes de IA', 'O que um agente recebe ao ler o site e as verificações que dizem se ele entende o conteúdo.'),
        ('autoria', 'conteudo', 'Autoria', 'Autoria no Universal Editor', 'Quem escreve publica: clica no texto, troca e publica. TI só entra quando precisa de bloco novo.'),
    ],
    'es': [
        ('metodo', 'rapido', 'Método', 'Método Migración Express', 'Una semana en el cliente, del kickoff al sitio en el aire. Lo que se hizo antes, la comparación con el camino tradicional y lo que entrega la semana.'),
        ('fases', 'rapido', 'Tres fases', 'Carga en tres fases', 'Lo que entra primero, lo que espera y lo que solo carga después del consentimiento. Por eso EDS es rápido en el móvil.'),
        ('eds', 'rapido', 'EDS por dentro', 'Edge Delivery Services por dentro', 'Recursos de la plataforma funcionando aquí: la nota de Lighthouse medida por el CI, el índice de páginas, las cabeceras de seguridad y una función serverless llamada de verdad.'),
        ('accesibilidad', 'confianca', 'Accesibilidad', 'Accesibilidad por bloque', 'Cada bloque responde por su propio contraste, foco y lectura. El panel mide el sitio en su navegador, ahora.'),
        ('consentimiento', 'confianca', 'Consentimiento', 'Consentimiento nativo', 'Nada de terceros entra antes del sí. Vea la red en tiempo real y mida cualquier otro sitio con el medidor de cookies.'),
        ('controles', 'confianca', 'Controles de calidad', 'Controles de calidad', 'Lo que corre en cada push, en la entrega y en el navegador antes de que un cambio llegue al aire, y por qué existe cada verificación.'),
        ('medios', 'conteudo', 'Assets y Dynamic Media', 'Assets y Dynamic Media', 'Una imagen en el DAM, varios recortes con IA y la entrega en el tamaño justo para cada pantalla.'),
        ('agentic', 'conteudo', 'Agentes de IA', 'Listo para agentes de IA', 'Lo que recibe un agente al leer el sitio y las verificaciones que dicen si entiende el contenido.'),
        ('autoria', 'conteudo', 'Autoría', 'Autoría en Universal Editor', 'Quien escribe publica: hace clic en el texto, cambia y publica. TI solo entra cuando hace falta un bloque nuevo.'),
    ],
    'en': [
        ('method', 'rapido', 'Method', 'The Express Migration method', 'One week at the client, from kickoff to the site live. What was done before it, how it compares with the traditional path and what the week delivers.'),
        ('fases', 'rapido', 'Three phases', 'Loading in three phases', 'What comes in first, what waits and what only loads after consent. That is why EDS is fast on mobile.'),
        ('eds', 'rapido', 'EDS inside', 'Edge Delivery Services, inside', 'Platform features running here: the Lighthouse score measured by CI, the page index, the security headers and a serverless function called for real.'),
        ('accessibility', 'confianca', 'Accessibility', 'Accessibility per block', 'Every block answers for its own contrast, focus and reading. The panel measures the site in your browser, right now.'),
        ('consent', 'confianca', 'Consent', 'Native consent', 'Nothing third-party loads before yes. Watch the network live and measure any other site with the cookie meter.'),
        ('gates', 'confianca', 'Quality gates', 'Quality gates', 'What runs on every push, on delivery and in the browser before any change goes live, and why each check exists.'),
        ('media', 'conteudo', 'Assets and Dynamic Media', 'Assets and Dynamic Media', 'One image in the DAM, several AI crops and delivery at the right size for every screen.'),
        ('agentic', 'conteudo', 'AI agents', 'Ready for AI agents', 'What an agent gets when it reads the site, and the checks that tell whether it understands the content.'),
        ('authoring', 'conteudo', 'Authoring', 'Authoring in Universal Editor', 'Whoever writes, publishes: click the text, change it, publish. IT only steps in when a new block is needed.'),
    ],
}
SITE = {
    'pt': {'paginas-eyebrow': 'O que tem em cada página', 'paginas-titulo': 'Nove páginas, cada uma com um recurso funcionando de verdade.',
           'paginas-texto': 'Comece pelo método ou vá direto ao que interessa. Todas as páginas usam o mesmo cabeçalho, o mesmo consentimento e o mesmo botão de acessibilidade.',
           'cta-eyebrow': 'Comece por aqui', 'cta-titulo': 'Uma semana no cliente. Veja o que vem antes dela.', 'cta-botao': 'Ver o método',
           'video-gate': '<p>Teste aqui</p><h2>O vídeo da capa, atrás do mesmo gate.</h2><p>Mude a escolha em Definições de cookies. Sem Mídia e vídeo, o player sai e a capa volta, sem recarregar a página. Com o sim, ele carrega na hora.</p>',
           'proximo': 'Próxima página', 'inicio': 'Voltar ao início', 'menu': 'Menu', 'mapa': 'Mapa do site', 'idiomas': 'Idiomas',
           'marca-texto': 'Demonstração de AEM Edge Delivery Services, Assets e Dynamic Media com consentimento nativo, acessibilidade por bloco e portões de qualidade.'},
    'es': {'paginas-eyebrow': 'Qué hay en cada página', 'paginas-titulo': 'Nueve páginas, cada una con un recurso funcionando de verdad.',
           'paginas-texto': 'Empiece por el método o vaya directo a lo que le interesa. Todas las páginas usan la misma cabecera, el mismo consentimiento y el mismo botón de accesibilidad.',
           'cta-eyebrow': 'Empiece por aquí', 'cta-titulo': 'Una semana en el cliente. Vea lo que viene antes.', 'cta-botao': 'Ver el método',
           'video-gate': '<p>Pruebe aquí</p><h2>El video de la portada, detrás del mismo gate.</h2><p>Cambie la elección en Configuración de cookies. Sin Medios y video, el player sale y vuelve la portada, sin recargar la página. Con el sí, carga al instante.</p>',
           'proximo': 'Página siguiente', 'inicio': 'Volver al inicio', 'menu': 'Menú', 'mapa': 'Mapa del sitio', 'idiomas': 'Idiomas',
           'marca-texto': 'Demostración de AEM Edge Delivery Services, Assets y Dynamic Media con consentimiento nativo, accesibilidad por bloque y controles de calidad.'},
    'en': {'paginas-eyebrow': 'What each page shows', 'paginas-titulo': 'Nine pages, each with one capability actually working.',
           'paginas-texto': 'Start with the method or go straight to what you need. Every page shares the same header, the same consent and the same accessibility button.',
           'cta-eyebrow': 'Start here', 'cta-titulo': 'One week at the client. See what comes before it.', 'cta-botao': 'See the method',
           'video-gate': '<p>Try it here</p><h2>The cover video, behind the same gate.</h2><p>Change your choice in Cookie settings. Without Media and video, the player leaves and the cover comes back, with no page reload. With a yes, it loads right away.</p>',
           'proximo': 'Next page', 'inicio': 'Back to home', 'menu': 'Menu', 'mapa': 'Site map', 'idiomas': 'Languages',
           'marca-texto': 'A demo of AEM Edge Delivery Services, Assets and Dynamic Media with native consent, accessibility per block and quality gates.'},
}


def href(t, slug=''):
    base = t['raiz'] or ''
    return f'{base}/{slug}' if slug else (base or '/')


IDS = {'pt': ['metodo', 'consentimento', 'fases', 'midia', 'eds', 'agentic', 'autoria', 'acessibilidade', 'portoes'],
       'es': ['metodo', 'consentimiento', 'fases', 'medios', 'eds', 'agentic', 'autoria', 'accesibilidad', 'controles'],
       'en': ['method', 'consent', 'fases', 'media', 'eds', 'agentic', 'authoring', 'accessibility', 'gates']}


def idiomas_html():
    return '<p><a href="/">PT</a></p><p><a href="/es">ES</a></p><p><a href="/en">EN</a></p>'


def blocos(t, ids):
    # título inteiro no texto; o trecho que gira e as outras palavras em campos próprios
    import re as _re
    _m = _re.search(r'<em>(.*?)</em>', t['hero_texto'])
    _palavras = [x.strip() for x in _m.group(1).split('|')] if _m else []
    _texto = t['hero_texto'].replace(_m.group(0), _palavras[0]) if _m else t['hero_texto']
    _selos = {k: v for k, v in t['hero_rotulos'].items() if k.startswith('selo-') and 'consentimento' not in k}
    hero = block('Hero', 'hero', {
        'text': _texto,
        'girarTrecho': _palavras[0] if _palavras else '',
        'girarPalavras': _palavras[1:],
        'girarIntervalo': 2.6,
    }, [(f'Selo · {k}', 'rotulo', {'chave': k, 'texto': v}) for k, v in _selos.items()], filt='hero')
    embed = block('Embed', 'embed', {
        'embed_placeholder': f'{AUTHOR_DAM}/poster-eds-flash-demo-capa.webp',
        'embed_placeholderAlt': t['hero_rotulos']['titulo-video'],
        'embed_uri': VIDEO,
    })
    vr = t['valor_rotulos']
    iceberg = block('Iceberg', 'iceberg', {**ab3(t['valor_iceberg']), 'pontaNumero': vr['ponta-numero'], 'pontaTexto': vr['ponta-texto'], 'legenda': vr['iceberg-legenda']},
                    [(f'Camada · {a}', 'iceberg-camada', {'titulo': a, 'texto': b, 'numero': int(c), 'unidade': d}) for a, b, c, d in t['camadas']], filt='iceberg')
    comparacao = block('Comparacao', 'comparacao', {**ab3(t['valor_comparacao']), 'caminhoA': vr['caminho-a'], 'caminhoB': vr['caminho-b'], 'trocarSozinho': True},
                       [(f'Critério · {a}', 'comparacao-criterio', {'titulo': a, 'texto': b, 'a': c, 'b': d}) for a, b, c, d in t['comparacoes']], filt='comparacao')
    entregas = block('Entregas', 'entregas', ab3(t['valor_entregas']),
                     [(f'Entrega · {a}', 'entregas-item', {'titulo': a, 'texto': b, 'numero': c, 'unidade': d}) for a, b, c, d in t['entregas']], filt='entregas')
    consent = block('Consent Live', 'consent-live', ab3(t['consent_abertura']), rotulos('rotulo', t['consent_rotulos']), filt='consent-live')
    fases = block('Fases', 'fases', ab3(t['fases_abertura']),
                  [(f'Fase · {ti}', 'fase', {'sigla': s, 'titulo': ti, 'texto': tx}) for i, (s, ti, tx) in enumerate(t['fases'])] + rotulos('rotulo', t['fases_rotulos']), filt='fases')
    dm = block('DM Showcase', 'dm-showcase', {'image': f'{AUTHOR_DAM}/smart-crop-eds-flash-demo.webp', 'imageAlt': 'Imagem de demonstração do smart crop', 'urlBase': '', 'original': '2400'},
               rotulos('rotulo', t['midia_rotulos']), filt='dm-showcase')
    bento = block('Bento', 'bento', {}, [(f'Célula · {ro or tp}', 'celula', {'tipo': tp, 'rotulo': ro, 'texto': tx, 'dados': da, 'largura': la}) for i, (tp, ro, tx, da, la) in enumerate(t['bento'])], filt='bento')
    agentic = block('Agentic', 'agentic', ab3(t['agentic_abertura']),
                    [(f'Verificação · {a[:48]}', 'verificacao', {'texto': a, 'estado': b}) for i, (a, b) in enumerate(t['verificacoes'])] + rotulos('rotulo', t['agentic_rotulos']), filt='agentic')
    passos = block('Passos', 'passos', ab3(t['passos_abertura']),
                   [(f'Passo · {b}', 'passo', {'icone': a, 'titulo': b, 'texto': c}) for i, (a, b, c) in enumerate(t['passos'])] + rotulos('rotulo', t['passos_rotulos']), filt='passos')
    medidor = block('Medidor Cookies', 'medidor-cookies', {**ab3(t['medidor_abertura']), 'endpoint': MEDIDOR}, rotulos('rotulo', t['medidor_rotulos']), filt='medidor-cookies')
    pt = t['portoes']
    portoes = block('Portoes', 'portoes', ab3(pt['abertura']),
                    [(f'Portão · {n}', 'portao', {'nome': n, 'quando': q, 'texto': tx, 'comando': c}) for n, q, tx, c in pt['itens']] + rotulos('rotulo', pt['rotulos']), filt='portoes')
    a11y = block('A11y Painel', 'a11y-painel', ab3(t['a11y_abertura']), rotulos('rotulo', t['a11y_painel_rotulos']), filt='a11y-painel')
    por_slug = {
        ids[0]: [section([('iceberg', iceberg), ('comparacao', comparacao), ('entregas', entregas)], id=ids[0], nome='Método', style='titulos-animados')],
        ids[7]: [section([('a11y', a11y)], id=ids[7], nome='Acessibilidade', style='titulos-animados')],
        ids[3]: [section([('abertura', text(t['midia_abertura'])), ('dm', dm)], id=ids[3], nome='Assets e Dynamic Media', style='titulos-animados')],
        ids[2]: [section([('fases', fases)], id=ids[2], nome='Três fases', style=['compacta', 'titulos-animados'])],
        ids[4]: [section([('abertura', text(t['eds_abertura'])), ('bento', bento)], id=ids[4], nome='EDS', style='titulos-animados')],
        ids[1]: [section([('consent', consent), ('video_texto', text(SITE[t['lang'][:2]]['video-gate'])), ('embed', embed), ('medidor', medidor)], id=ids[1], nome='Consentimento', style='titulos-animados')],
        ids[5]: [section([('agentic', agentic)], id=ids[5], nome='Agentic', style='titulos-animados')],
        ids[8]: [section([('portoes', portoes)], id=ids[8], nome='Portões de qualidade', style='titulos-animados')],
        ids[6]: [section([('passos', passos)], id=ids[6], nome='Autoria', style=['compacta', 'titulos-animados'])],
    }
    return hero, embed, por_slug


def props(t, titulo, descricao):
    raiz = t['raiz']
    return {
        'jcr:description': descricao,
        'lang': t['lang'],
        'nav': f'{raiz}/nav',
        'footer': f'{raiz}/footer',
        'cookie-consent': f'{raiz}/cookie-consent/padrao',
    }


def home(t, ids):
    hero, embed, _ = blocos(t, ids)
    lg = t['lang'][:2]
    st = SITE[lg]
    grupos = GRUPOS[lg]
    cartoes = block('Cards', 'cards', {}, [
        (f'Página · {nome}', 'card', {'text': f'<p>{grupos[g]}</p><h3><a href="{href(t, slug)}">{nome}</a></h3><p>{lead}</p>'})
        for slug, g, nome, h1, lead in PAGINAS[lg]
    ], filt='cards')
    primeira = PAGINAS[lg][0]
    sections = [
        section([('hero', hero), ('embed', embed), ('como', text(t['como']))], nome='Capa'),
        section([('abertura', text(f'<p>{st["paginas-eyebrow"]}</p><h2>{st["paginas-titulo"]}</h2><p>{st["paginas-texto"]}</p>')), ('paginas', cartoes)],
                id='paginas', nome='Páginas', style='titulos-animados'),
        section([('cta', text(f'<p>{st["cta-eyebrow"]}</p><h2>{st["cta-titulo"]}</h2><p><strong><a href="{href(t, primeira[0])}">{st["cta-botao"]}</a></strong></p>'))],
                nome='Faixa final', style='faixa-final'),
    ]
    return page(t['titulo'], sections, **props(t, t['titulo'], t['descricao']))


def subpagina(t, ids, i):
    lg = t['lang'][:2]
    st = SITE[lg]
    slug, g, nome, h1, lead = PAGINAS[lg][i]
    _, _, por_slug = blocos(t, ids)
    prox = PAGINAS[lg][(i + 1) % len(PAGINAS[lg])]
    topo = section([('grupo', text(f'<p>{GRUPOS[lg][g]}</p>')), ('titulo', node(TITLE_RT, title=h1, titleType='h1')), ('abertura', text(f'<p>{lead}</p>'))],
                   nome='Topo da página', style='pagina-topo')
    fim = section([('proximo', text(f'<p>{st["proximo"]}</p><p><a href="{href(t, prox[0])}">{prox[2]}</a></p><p>{prox[4]}</p><p><a href="{href(t)}">{st["inicio"]}</a></p>'))],
                  nome='Próxima página', style='faixa-final')
    return page(f'{nome} · {t["titulo"]}', [topo] + por_slug[slug] + [fim], **props(t, nome, lead))


def mapa_html(t, com_inicio=False):
    """Lista de grupos com as páginas de cada um (menu e rodapé)."""
    lg = t['lang'][:2]
    grupos = GRUPOS[lg]
    html = '<ul>'
    for g, rotulo in grupos.items():
        itens = ''.join(f'<li><a href="{href(t, slug)}">{nome}</a></li>' for slug, gg, nome, _, _ in PAGINAS[lg] if gg == g)
        html += f'<li><p>{rotulo}</p><ul>{itens}</ul></li>'
    return html + '</ul>'


def nav(t):
    aviso = block('Aviso', 'aviso', {'texto': t['aviso'], 'idiomas': idiomas_html()})
    marca = t['marca'].replace('<p><strong>', f'<p><a href="{href(t)}"><strong>', 1).replace('</em></p>', '</em></a></p>', 1)
    return page('nav', [
        section([('aviso', aviso)], nome='Aviso', style='faixa-aviso'),
        section([('marca', text(marca))], nome='Marca'),
        section([('links', text(mapa_html(t)))], nome='Menu'),
        section([('ferramentas', text(f'<p><a href="#definicoes-de-cookies">{t["cookies"]}</a></p>'))], nome='Ferramentas'),
        section([('acessibilidade', block('Acessibilidade', 'acessibilidade', {'texto': t['a11y_texto']}, rotulos('rotulo', t['a11y_rotulos']), filt='acessibilidade'))], nome='Acessibilidade', style='titulos-animados'),
    ])


def footer(t):
    lg = t['lang'][:2]
    st = SITE[lg]
    return page('footer', [
        section([('marca', text(t['marca'] + f'<p>{st["marca-texto"]}</p>'))], nome='Marca'),
        section([('mapa', text(f'<p>{st["mapa"]}</p>' + mapa_html(t)))], nome='Mapa do site'),
        section([('texto', text(t['rodape'])), ('link', text(t['rodape_link'])), ('idiomas', text(idiomas_html()))], nome='Base'),
    ])


def consent_doc(t):
    b = t['cc_banner']
    p = t['cc_prefs']
    g = t['cc_gate']
    secs = [
        section([('texto', text(f'<h2>{b[0]}</h2><p>{b[1]}</p><p><a href="#aceitar">{b[2]}</a></p><p><a href="#recusar">{b[3]}</a></p><p><a href="#preferencias">{b[4]}</a></p>'))], nome='Banner', papel='banner', **{'versao-politica': VERSAO}),
        section([('texto', text(f'<h2>{p[0]}</h2><p>{p[1]}</p><p><a href="#recusar">{p[2]}</a></p><p><a href="#salvar">{p[3]}</a></p><p><a href="#aceitar">{p[4]}</a></p>'))], nome='Preferências', papel='preferencias'),
    ]
    for codigo, opcional, nome, desc in t['cc_cats']:
        secs.append(section([('texto', text(f'<h3>{nome}</h3><p>{desc}</p>'))], nome=nome, papel='categoria', codigo=codigo, opcional=opcional))
    secs.append(section([('texto', text(f'<h2>{g[0]}</h2><p>{g[1]}</p><p><a href="#permitir">{g[2]}</a></p><p><a href="#abrir">{g[3]}</a></p>'))], nome='Gate', papel='gate'))
    origens = block('Consent Origens', 'consent-origens', {}, [
        ('origem_0', 'consent-origem', {'origem': 'video.tv.adobe.com', 'categoria': 'CC_MEDIA'}),
        ('origem_1', 'consent-origem', {'origem': 'youtube.com', 'categoria': 'CC_MEDIA'}),
        ('origem_2', 'consent-origem', {'origem': 'adobedtm.com', 'categoria': 'CC_ANALYTICS'}),
    ], filt='consent-origens')
    secs.append(section([('origens', origens)], nome='Origens', papel='origens'))
    cmp = block('Consent Origens', 'consent-origens', {}, [
        ('cmp_0', 'consent-origem', {'origem': 'C0001', 'categoria': 'CC_ESSENTIAL'}),
        ('cmp_1', 'consent-origem', {'origem': 'C0002', 'categoria': 'CC_ANALYTICS'}),
        ('cmp_2', 'consent-origem', {'origem': 'C0004', 'categoria': 'CC_MEDIA'}),
        ('cmp_3', 'consent-origem', {'origem': 'necessary', 'categoria': 'CC_ESSENTIAL'}),
        ('cmp_4', 'consent-origem', {'origem': 'statistics', 'categoria': 'CC_ANALYTICS'}),
        ('cmp_5', 'consent-origem', {'origem': 'marketing', 'categoria': 'CC_MEDIA'}),
        ('cmp_6', 'consent-origem', {'origem': 'tcf:1', 'categoria': 'CC_ESSENTIAL'}),
        ('cmp_7', 'consent-origem', {'origem': 'tcf:8', 'categoria': 'CC_ANALYTICS'}),
        ('cmp_8', 'consent-origem', {'origem': 'tcf:4', 'categoria': 'CC_MEDIA'}),
    ], filt='consent-origens')
    secs.append(section([('cmp', cmp)], nome='Mapa de CMP', papel='cmp'))
    return page('cookie-consent', secs)


def pagina_vazia(titulo):
    return page(titulo, [section([('texto', text('<p>—</p>'))])])


def gerar():
    out = {}
    for lg, t in T.items():
        raiz = f'/content/eds-flash-demo{t["raiz"]}'
        ids = IDS[lg]
        out[f'{raiz}/index' if lg == 'pt' else raiz] = home(t, ids)
        # filhas depois da mãe: o import com :replace apaga o que estiver embaixo
        for i, (slug, *_) in enumerate(PAGINAS[lg]):
            out[f'{raiz}/{slug}'] = subpagina(t, ids, i)
        out[f'{raiz}/nav'] = nav(t)
        out[f'{raiz}/footer'] = footer(t)
        if lg != 'pt':
            out[f'{raiz}/cookie-consent'] = pagina_vazia('cookie-consent')
        else:
            out[f'{raiz}/cookie-consent'] = pagina_vazia('cookie-consent')
        out[f'{raiz}/cookie-consent/padrao'] = consent_doc(t)
    return out


if __name__ == '__main__':
    print(json.dumps(gerar(), ensure_ascii=False, indent=1))
