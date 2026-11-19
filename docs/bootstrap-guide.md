# Guia do Bootstrap no Sanfelice Studio

Versão: **Bootstrap 5.3.9**, carregado pelo CDN jsDelivr.

## 1. Onde o Bootstrap é carregado

| Arquivo | CSS | JS (bundle) | Por quê |
|---|---|---|---|
| `index.html`, `portraits.html`, `editorials.html`, `projects.html` | ✅ | ✅ | grid da galeria + o Modal do lightbox (precisa do JS) |
| `aboutme.html`, `contact.html` | ✅ | — | só usam CSS (grid e utilitários), nenhum componente com JS |

- **CSS:** fica no `<head>`, **antes** do `assets/css/style.css`. Assim o nosso CSS pode sobrescrever o do Bootstrap quando precisar.
- **JS:** fica no fim do `<body>`, antes do `assets/js/components.js`, que usa `bootstrap.Modal`.
- **Comentários:** todo link tem um comentário `<!-- Bootstrap 5.3.9 ... -->` explicando o que é.

## 2. Breakpoints (o que significam sm / md / lg / xl)

As classes com breakpoint valem **a partir** daquela largura de tela, ou seja, para cima. A classe sem breakpoint vale em qualquer tela.

| Sufixo | A partir de | Exemplo de aparelho |
|---|---|---|
| *(nenhum)* | 0px | celular |
| `sm` | 576px | celular deitado |
| `md` | 768px | tablet |
| `lg` | 992px | notebook |
| `xl` | 1200px | desktop |
| `xxl` | 1400px | telas grandes |

Exemplo: `col-12 col-lg-6` quer dizer coluna inteira (12 de 12) no celular e no tablet, e meia coluna (6 de 12) a partir de 992px.

## 3. Grid (linhas e colunas)

| Classe | O que faz | Onde |
|---|---|---|
| `row` | cria uma linha flex que segura as colunas | galerias, Contact (card e campos), footer |
| `col` | coluna que divide o espaço igualmente | cada foto das galerias |
| `col-12` | ocupa a largura toda (12/12) | blocos do footer e do Contact no celular |
| `col-6` | metade (6/12) em qualquer tela | Nome / Sobrenome no Contact |
| `col-lg-6` | metade a partir de 992px | mapa e formulário do Contact; Email e Assunto |
| `col-lg-5` / `col-lg-2` | 5/12 e 2/12 a partir de 992px | footer: newsletter (5), logo (2), contato (5) |
| `row-cols-2` | 2 colunas por linha | galerias no celular |
| `row-cols-md-3` | 3 colunas por linha a partir de 768px | galerias no tablet e no desktop |
| `g-3` / `g-lg-4` | espaço entre colunas (1rem; 1,5rem a partir de 992px) | galerias |
| `gx-4` / `gx-lg-5` | espaço só na horizontal | campos do Contact / card do Contact e footer |
| `gy-3` / `gy-4` | espaço só na vertical (quando as colunas empilham) | campos do Contact / card do Contact |
| `align-items-center` | centraliza as colunas na vertical | footer |

### Ordem das colunas (`order-*`)

| Classe | O que faz | Onde |
|---|---|---|
| `order-1`, `order-2`, `order-3` | ordem visual no celular | Contact: formulário primeiro e mapa depois. Footer: logo, contato e newsletter |
| `order-lg-1`, `order-lg-2`, `order-lg-3` | ordem a partir de 992px | Contact: mapa à esquerda e formulário à direita. Footer: newsletter, logo e contato |

O HTML não muda de lugar; só a ordem na tela muda.

## 4. Posição: é `absolute` ou `relative`?

Usamos as classes de posição do Bootstrap direto no HTML, então dá pra ver isso no próprio elemento.

| Classe | CSS que aplica | Elementos |
|---|---|---|
| `position-relative` | `position: relative` | `.hero` (topo das páginas), `.hero__content`, `.about-hero`, `.contact-page-main`, `.gallery-card` |
| `position-absolute` | `position: absolute` | os "+" dos cantos (`.hero__plus`, `.about-hero__plus`), o link "scroll down" (`.hero-scroll`), o vídeo e o efeito do Home (`.hero__video`, `.hero__fx`), a etiqueta da foto (`.gallery-card__label`) |

**Regra:** um elemento `position-absolute` se posiciona em relação ao pai mais próximo que tenha `position-relative`. Por isso os "+" ficam presos nos cantos do `.hero`.

As **distâncias** (top, left etc.) desses elementos continuam no `style.css`, porque são valores próprios do design (por exemplo `calc(var(--menu-h) + 2rem)`). Os utilitários do Bootstrap (`top-0`, `start-50`…) não chegam nesses valores.

### Navbar fixo: `fixed-top`

| Classe | CSS que aplica | Onde |
|---|---|---|
| `fixed-top` | `position: fixed; top: 0; right: 0; left: 0; z-index: 1030` | `<header class="header fixed-top">` em `components/navbar.html` |

O navbar fica preso no topo da tela durante a rolagem.
- **No topo da página:** é transparente.
- **Depois que a página rola:** o `components.js` adiciona a classe `.is-scrolled` (nossa, não do Bootstrap) e o navbar ganha fundo escuro.
- **O `z-index: 1030`** deixa o navbar acima do conteúdo e abaixo do lightbox, que é um Modal com `z-index` 1055.

## 5. Outros utilitários

| Classe | O que faz | Onde |
|---|---|---|
| `d-block` | `display: block` | fotos das galerias |
| `w-100` / `h-100` | largura e altura 100% | fotos das galerias (preenchem o card) |
| `object-fit-cover` | a foto cobre o card sem distorcer (corta as sobras) | fotos das galerias |
| `visually-hidden` | esconde da tela mas o leitor de tela lê | rótulos "First Name", "Last Name", "Email address" |

## 6. Componente com JavaScript: Modal

O **lightbox** das galerias é o componente **Modal** do Bootstrap. Ele é criado pelo `assets/js/components.js` com `new bootstrap.Modal(...)`.

| Classe / atributo | O que faz |
|---|---|
| `modal`, `fade` | a janela e a animação de aparecer |
| `modal-dialog`, `modal-dialog-centered` | a caixa, centralizada na vertical |
| `modal-content` | o conteúdo (foto e legenda) |
| `btn-close` + `data-bs-dismiss="modal"` | o botão × que fecha |
| `data-bs-theme="dark"` | deixa o × branco (tema escuro do Bootstrap) |

## 7. Rolagem

| Recurso | De onde vem | O que faz |
|---|---|---|
| Rolagem suave nos links internos (`#work`, `#top`) | **Bootstrap Reboot**: `scroll-behavior: smooth` | a página desliza até a seção em vez de pular. Só vale pra quem não pediu "reduzir movimento" |
| `scroll-padding-top` | nosso `style.css` | os links internos e o encaixe param logo abaixo do navbar fixo |
| Encaixe das seções (`html.snap`) | nosso `style.css`: `scroll-snap-type: y proximity` | a página "assenta" no começo do hero ou da galeria quando a rolagem para perto deles |
| Fotos que aparecem ao rolar | nosso `style.css`: `animation-timeline: view()` | fade e subida leve das fotos da galeria, ligados à rolagem e sem JavaScript. Navegadores sem suporte e quem pediu menos movimento veem as fotos normais |

## 8. O que NÃO é Bootstrap (pra não confundir)

Estas classes são nossas, definidas no `style.css`:

- `site-container`: o container do site (largura máxima 1400px e margens próprias). Tinha o nome `container`, igual ao do Bootstrap, e foi renomeado para não confundir.
- `gallery-grid`, `gallery-card`, `gallery-card__label`: o visual dos cards da galeria (borda, cantos, etiqueta). Antes era `card`, que é o nome de um componente do Bootstrap, então foi renomeado.
- `hero`, `about-hero`, `contact-card`, `footer-*`, `service-card` etc.: o visual de cada seção.

**Regra do projeto:** o **Bootstrap cuida do layout** (grid, ordem, posição, utilitários e o Modal). O **`style.css` cuida do visual** (cores, fontes, bordas, espaçamentos do design).
