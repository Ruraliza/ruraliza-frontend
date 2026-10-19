# Design e acessibilidade

O CSS é a fonte da verdade dos valores. Este documento aponta onde estão e resume as regras; não copie cores, tamanhos ou espaçamentos para cá. Aparência e acessibilidade do ponto de vista de quem usa estão no [README](../README.md#aparência-e-acessibilidade); o público e as restrições, em [PRODUCT.md](../PRODUCT.md).

## Direção

Público: produtores e trabalhadores do campo, no celular, muitas vezes ao ar livre e com sinal fraco. Por isso o tema padrão é o claro, o contraste é alto e os alvos de toque são grandes. Idioma: pt-BR, texto simples e direto. O "R" em grade de 3×4 módulos continua sendo o logo (README, seção [Marca](../README.md#marca)).

**Redesign das áreas logadas (out/2026), "campo em fotos":** fundo branco, verde-floresta nos botões e na aba ativa, e dourado só no dinheiro. As vagas usam fotos reais e as ilustrações calorosas ficam só nos estados vazios. Cada tela tem **uma ação principal** e pouca informação, porque o público precisa de praticidade. As referências aprovadas e a decisão estão em `.impeccable/` (fora do git) e em `Pictures/Kie.ai/ruraliza-*.png`. A landing ainda usa o verde, o lima e o laranja de antes.

## Sistema existente

- **Tokens:** [`src/styles/tokens.css`](../src/styles/tokens.css) é o único lugar com valores de cor. Importado por `src/styles.css`, junto de `base.css`, `layout.css` e `motion.css`.
  - **Cores:**
    - Base: fundo, texto e linhas.
    - Marca: verde-floresta `--green-900`, `--gold-500` e `--gold-700` (o dourado do dinheiro; `.money` aplica a cor nos valores) e `--mint-100` para fundos suaves.
    - Semânticas: sucesso, aviso, erro e informação.
    - Aliases das áreas logadas: `--surface*`, `--mata*`, `--broto*`, `--ipe*` e `--money`.
    - O lima e o laranja ficam só na landing. Texto sobre dourado, lima ou laranja usa `--on-accent`.
  - **Temas por atributo no `<html>`** (aplicados pelo `PreferencesService`): `data-theme="dark"`, `data-contrast="high"` (também combinado com o escuro) e `data-text="large"`, que só muda o `font-size` da raiz.
  - **Tipografia:** uma família só, a Figtree, de 400 a 800 (Google Fonts em `index.html`), com títulos em 750/800. A escala é em `rem`, nas classes `.t-*` e nos títulos de `base.css`; por isso as letras maiores funcionam.
  - **Espaço e forma:** escala de espaços (`--space-*`), raios (`--radius-*`), sombras, anel de foco, curva de movimento, alturas da barra de cima, do menu de baixo e da sidebar.
- **Utilitários de layout** em `src/styles/layout.css`: `.container`, `.page`, `.stack*`, `.cluster`, `.card`, `.grid-cards`, `.grid-metrics`, `.form`, `.details`. `.prose` (markdown das aulas) fica em `base.css`.
- **Movimento:** `src/styles/motion.css` (revelação ao rolar, marca-texto lima da landing). `base.css` zera animações com `prefers-reduced-motion: reduce`.
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

## Padrões do redesign

- **Próxima ação** (`shared/domain/ui/next-step.ts`): o primeiro cartão do Início mostra uma coisa só para fazer agora, com um botão de largura total.
  - Trabalhador: o serviço em andamento ou as candidaturas enviadas.
  - Produtor: o serviço com mais candidatos.
  - Os blocos de números do Início saíram.
- **Foto da vaga:** é a foto da fazenda; sem ela, uma foto da categoria (`serviceCover` e `categoryPhoto` em `shared/domain/utils/farm-emoji.ts`). As fotos são do Unsplash, com créditos em `src/assets/images/landing/credits.json`. Há duas por categoria, quando existem, para vagas vizinhas não repetirem.
- **Ilustração dos estados vazios:** `<app-empty-state [art]="true">` mostra `src/assets/images/ilustracao-sede.webp` (gerada; prompt e origem em `ilustracao-sede.json`). Use só nas listas vazias principais.
- **Menu de baixo:** o item ativo fica em verde, com um traço curto embaixo. A ação central é um círculo verde de 60px.
- **Botões:** cantos de 14px e altura de 52px.

Ainda no visual anterior, a revisar depois: a landing e telas menos usadas (formulários longos, área da equipe). Elas já herdam as cores e a fonte novas pelos tokens.

## Skills de design para agentes

- **impeccable** e **design-taste-frontend:** skills de usuário (`~/.claude/skills`), fora do repositório. Servem para crítica, polimento e direção de redesign.
- **web-design-guidelines:** skill do projeto (`.claude/skills/web-design-guidelines`, registrada em `skills-lock.json`). Use para revisar interface e acessibilidade.
- Veja a lista e o escopo de instalação em [setup.md](setup.md).

## Manutenção

Mudança visual atualiza o `tokens.css` ou o componente, e este documento só quando uma regra mudar. Consulte as skills de design nas revisões de interface.
