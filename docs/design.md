# Design e acessibilidade

O CSS é a fonte da verdade dos valores. Este documento aponta onde estão e resume as regras; não copie cores, tamanhos ou espaçamentos para cá. Aparência e acessibilidade do ponto de vista de quem usa estão no [README](../README.md#aparência-e-acessibilidade); o público e as restrições, em [PRODUCT.md](../PRODUCT.md).

## Direção

Público: produtores e trabalhadores do campo, no celular, muitas vezes ao ar livre e com sinal fraco. Por isso o tema padrão é o claro, o contraste é alto e os alvos de toque são grandes. Idioma: pt-BR, texto simples e direto. A marca é verde, lima e laranja, com o "R" em grade de 3×4 módulos (README, seção [Marca](../README.md#marca)).

## Sistema existente

- **Tokens:** [`src/styles/tokens.css`](../src/styles/tokens.css) é o único lugar com valores de cor. Importado por `src/styles.css`, junto de `base.css`, `layout.css` e `motion.css`.
  - **Cores:** base (fundo, texto, linhas), marca (verde, lima, laranja e versões suaves), semânticas (sucesso, aviso, erro, informação) e aliases usados pelas áreas logadas (`--surface*`, `--mata*`, `--broto*`, `--ipe*`). Texto sobre lima ou laranja usa `--on-accent`.
  - **Temas por atributo no `<html>`** (aplicados pelo `PreferencesService`): `data-theme="dark"`, `data-contrast="high"` (também combinado com o escuro) e `data-text="large"`, que só muda o `font-size` da raiz.
  - **Tipografia:** duas famílias (display e sans, via Google Fonts em `index.html`) e uma escala em `rem` nas classes `.t-*` e nos títulos de `base.css`. Letras maiores funcionam porque tudo é `rem`.
  - **Espaço e forma:** escala de espaços (`--space-*`), raios (`--radius-*`), sombras, anel de foco, curva de movimento, alturas da barra de cima, do menu de baixo e da sidebar.
- **Utilitários de layout** em `src/styles/layout.css`: `.container`, `.page`, `.stack*`, `.cluster`, `.card`, `.grid-cards`, `.grid-metrics`, `.form`, `.details`. `.prose` (markdown das aulas) fica em `base.css`.
- **Movimento:** `src/styles/motion.css` (revelação ao rolar, marca-texto lima). `base.css` zera animações com `prefers-reduced-motion: reduce`.
- **Componentes sem domínio** (`src/app/shared/ui/`): `button`, `confirm-dialog`, `empty-state`, `error-state`, `form-field`, `icon`, `logo`, `masked-input`, `metric-card`, `password-reveal`, `photo-crop-dialog`, `photo-picker`, `photo-strip`, `progress-bar`, `qr-code`, `segmented-control`, `skeleton`, `switch-field`.
- **UI de domínio** (`src/app/shared/domain/ui/`): `service-card`, `status-badge`, `avatar`, `avatar-editor`, `category-chip`, `farm-map`, `star-input`, `rating-badge`, `review-form`, `service-reviews`, `reputation-dialog`, `pending-reviews`, `chat-list`, `chat-thread`, `chat-phone-panel`, `notification-list`, `help-center`, `certificate-view`, `verification-card`, `report-dialog`, `sponsor-card`, entre outros.
- **Cascas** (`src/app/core/layout/`): `public-layout`, `app-shell` (barra de cima, menu de baixo, sidebar), `shell-topbar`, `pwa-banners`, `install-app-button`, `push-toggle`, `role-switch-button`, `display-preferences`, `toast-container`.
- **Ícones e marca:** `shared/ui/icon.ts` e `logo.ts` desenham SVG inline; os arquivos de marca em `public/brand/` e `public/icons/` são gerados por `scripts/generate-brand-assets.mjs`.

## Interação e acessibilidade (o que já existe)

- **Foco visível:** `:focus-visible` usa `--focus-ring`, com variações para escuro e alto contraste.
- **Campos:** 48 px de altura mínima e 16 px de fonte (o iPhone não dá zoom), borda de campo com contraste ≥ 3:1. `aria-invalid="true"` pinta a borda de erro.
- **Alvos de toque:** links e botões de navegação com mínimo de 44 px (por exemplo `.back-link`, barra de cima).
- **Estrelas de avaliação:** `star-input.ts` usa rádios nativos dentro de `fieldset`: funciona com teclado e leitor de tela.
- **Avisos:** o `toast-container` usa `role="status"` (educado) e `role="alert"` (urgente).
- **Movimento reduzido:** respeitado em `base.css`; a rolagem suave só liga em `no-preference`.
- **Letras maiores e alto contraste:** por conta, com atalho **Aa**; texto ≥ 4,5:1 e bordas de campo ≥ 3:1 conferidos nos temas (comentário em `tokens.css`).
- **Sem piscar no tema escuro:** script em `index.html` lê `localStorage` antes do app carregar.
- **Impressão:** `@media print` esconde as cascas e deixa só o certificado (`.no-print`).
- **Menu de baixo:** de 3 a 5 destinos, regra testada em `farmer-layout.spec.ts`, `worker-layout.spec.ts` e `system-layout.spec.ts`.
- **Validação:** erro ao lado do campo (`FormField`); operações assíncronas mostram progresso (`Skeleton`, `ProgressBar`, estados do `Button`) e resultado (toast, `ErrorState`, `EmptyState`).
- **Lint de acessibilidade:** `npm run lint` aplica as regras `templateAccessibility` do `angular-eslint` (rótulos, foco, eventos de teclado) a todos os templates. Exceção registrada: o fundo do painel de conteúdo da aula (`lesson-page.ts`), que fecha pelo clique e pelo Esc nativo do `<dialog>`.

## Layout e revisão

- **Ponto de virada principal: 1024px.** Abaixo, barra de cima e menu de baixo; a partir dele, sidebar. Container em `layout.css` ganha mais respiro a partir de 768px.
- **Outros pontos usados em componentes** (grep em `src/**/*.css` e nos `styles` dos componentes): 480, 720, 900 e 1100px de largura mínima; 339, 359, 479, 639 e 767px de largura máxima para telas muito estreitas.
- **Estados existentes:** carregamento (`Skeleton`), vazio (`EmptyState`), erro (`ErrorState`), sem internet (faixa do PWA com a data da cópia) e "Não enviada" na conversa.
- **Revisões feitas:** não há registro de revisão de interface no repositório.
- Suposição: os pontos de virada abaixo de 1024px foram escolhidos caso a caso; nenhum token os define.

## Redesign planejado

Direção apenas, **nada implementado**: um redesign visual está em planejamento. Até lá, mudanças de interface seguem os tokens e componentes acima. Quando houver redesign, os tokens continuam sendo o ponto único de troca; registre aqui a decisão e atualize o `tokens.css`.

## Skills de design para agentes

- **impeccable** e **design-taste-frontend:** skills de usuário (`~/.claude/skills`), fora do repositório. Servem para crítica, polimento e direção de redesign.
- **web-design-guidelines:** skill do projeto (`.claude/skills/web-design-guidelines`, registrada em `skills-lock.json`). Use para revisar interface e acessibilidade.
- Veja a lista e o escopo de instalação em [setup.md](setup.md).

## Manutenção

Mudança visual atualiza o `tokens.css` ou o componente, e este documento só quando uma regra mudar. Consulte as skills de design nas revisões de interface.
