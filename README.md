# 🌾 Ruraliza — Frontend

Angular 22 (standalone, signals, SSR) para o RURALIZA: conecta produtores rurais a trabalhadores e prestadores de serviço no campo.

## Como rodar

Pré-requisitos: Node.js 20+ e o [backend](https://github.com/Ruraliza/ruraliza-backend) rodando em `http://localhost:3000/api`.

```bash
npm install
npm start        # ng serve → http://localhost:4200
npm test         # ng test (Vitest)
npm run build    # ng build
```

Todo perfil tem **senha**, definida no cadastro. Em **Entrar** você escolhe produtor ou trabalhador e informa e-mail e senha; os perfis de teste do backend são `produtor@exemplo.com` e `trabalhador@exemplo.com`, senha `ruraliza123`. Quem entrou fica em `sessionStorage`, junto com o **token de sessão** da API: o `authInterceptor` (`core/http/auth.interceptor.ts`) envia `Authorization: Bearer <token>` em toda chamada, e o token também vai em `?access_token=` nas atualizações ao vivo (o `EventSource` não manda cabeçalhos). Quando a API responde 401 com `WWW-Authenticate: Bearer` (sessão vencida ou inválida), a sessão é limpa e a pessoa volta ao login. Os guards só evitam abrir telas sem sessão: quem protege os dados é a API. Os dados vivem em memória no backend e somem quando ele reinicia.

**Trilhas de estudo** (`/trabalhador/trilhas`): o trabalhador filtra as trilhas pelas categorias dos serviços, vê descrição, carga horária e tutores antes de começar e estuda no player (`/trabalhador/trilhas/:id/aulas/:aula`): vídeo do YouTube/Vimeo e texto em Markdown simples (`shared/utils/markdown.ts`, que escapa todo HTML), com módulos e aulas numa barra lateral à direita (no celular, um painel retrátil). Ao concluir a última aula sai o certificado (`shared/domain/ui/certificate-view.ts`, A4 deitado; "Baixar PDF" usa a impressão do navegador). Qualquer pessoa valida um certificado em `/certificados/:código`, sem login.

**Área de sistema** (`/sistema`): para a equipe do Ruraliza (usuários de sistema), com login próprio em `/sistema/entrar` e sem cadastro público nem link no site. O cargo define o menu: **Administrador** vê e edita os usuários do app, remove fotos de perfil, perfis ou contas e cadastra e edita os membros da equipe (nome, e-mail e cargo, menos o próprio cargo) e supervisiona as trilhas de estudo (vê, edita e descontinua qualquer uma, e cria escolhendo os tutores); **Tutor** cria e edita as trilhas de estudo em `/sistema/trilhas` (dados gerais, tutores, módulos e aulas; publicar, descontinuar e reativar: trilha não se exclui), e só edita as trilhas de que é tutor (as dos colegas ficam em modo leitura). Todo usuário de sistema edita o próprio nome e e-mail em `/sistema/perfil`. Teste com `admin@exemplo.com` ou `tutor@exemplo.com`, senha `ruraliza123`. A sessão de sistema é separada da conta do app (`core/session/system-session.service.ts`).

## Senha

- **Cadastro:** senha (8 a 128 caracteres) e confirmação, com botão *Mostrar* (`shared/ui/password-reveal.ts`, regras em `shared/utils/password.ts`).
- **Esqueci minha senha** (`/entrar/esqueci-senha` → `/entrar/nova-senha`): a pessoa informa o e-mail e cria a nova senha. O envio do código por e-mail **ainda não existe**: a API devolve o token na resposta e a tela segue direto para a nova senha. O token vai pelo `state` da navegação (`features/auth/models/auth-prefill.ts`), não pela URL. Quando o e-mail existir, a segunda tela passa a pedir o código (ver `TODO(email)`).
- **Alterar senha com a conta aberta:** cartão *Senha* no Perfil (produtor e trabalhador), pedindo a senha atual, sem código por e-mail (`shared/domain/ui/password-change.ts`).

## Fluxo de teste

1. `/cadastro/produtor` → cadastre um produtor com senha (ou entre com o de teste em `/entrar`). Em **Perfil**, envie uma foto.
2. **Fazendas** → cadastre uma fazenda e adicione fotos (até 6; a primeira é a capa).
3. **＋ Novo serviço** → publique em 2 passos, com descrição e prazo para candidaturas (opcional).
4. Saia (Perfil → *Sair*) e entre como trabalhador. Em **Perfil**, preencha foto, apresentação, experiência, certificados e cursos.
5. **Vagas** → busque e filtre (texto, categoria, carga horária, data de publicação, ordem) → abra a vaga → *Candidatar-me* → confirme.
6. Volte ao produtor → **Serviços** (abas por situação, busca e filtros) → abra o serviço → veja o candidato → *Aceitar trabalhador*.
7. Com o serviço em andamento → *Conversar com …* (a conversa abre no aceite) → *Liberar pagamento* (simulação).
8. Depois do pagamento, os dois avaliam na tela do serviço. Para ver a avaliação cega e a conversa já prontas, entre como `produtor@exemplo.com` (serviço *Ordenha da manhã*: a Maria já avaliou) ou `trabalhador@exemplo.com` (conversa *Reforma do curral* com mensagem não lida). `pedro@exemplo.com` é candidato à vaga 1, para testar o caminho inteiro.

## Fotos, filtros e prazos

- **Fotos:** antes do envio, o navegador reduz a foto para no máximo 1000 px e converte para WebP (`shared/utils/images.ts`), o que economiza dados no celular. O backend repete o tratamento e é quem garante a regra. As URLs que a API devolve (`/api/images/...`) passam por `apiAsset()` para apontar ao servidor da API.
- **Filtros na URL:** os filtros de **Vagas** (`q`, `categoria`, `min`, `max`, `de`, `ate`, `ordem`) e de **Serviços** do produtor (`aba`, `q`, `categoria`, `fazenda`, `ordem`, `so`) ficam na query string. Voltar do detalhe mantém a busca e o link pode ser compartilhado. As vagas são filtradas no backend. Os serviços do produtor são filtrados no navegador, porque a lista é pequena; com o banco, dá para passar os filtros para a API.
- **Sem foto → emoji do campo:** avatar sem foto mostra um emoji escolhido pelo nome (sempre o mesmo para a mesma pessoa), card de vaga sem foto usa o emoji da categoria (Colheita 🌾, Plantio 🌱, Manejo de gado 🐄…) e fazenda sem foto usa um emoji de paisagem (`shared/domain/utils/farm-emoji.ts`). Os emojis são imagens no estilo do Facebook, em `public/emoji/<codepoints>.webp` (64 px, extraídas do pacote `emoji-datasource-facebook` 16.0.0). **Atenção:** o próprio pacote avisa que as imagens do Facebook não têm licença clara. Para trocar por Twemoji (CC-BY 4.0) ou Noto (Apache 2.0), basta substituir os arquivos mantendo os nomes.
- **Prazo (`expires_at`):** dia do calendário no horário de Brasília (`shared/domain/utils/expiry.ts`). Vaga vencida some da busca do trabalhador. O produtor a vê marcada como *Prazo encerrado* e pode renová-la editando a data.

## Avaliações e conversas

**Avaliação dupla** (`shared/domain/ui/service-reviews.ts`): depois do pagamento, o produtor avalia o trabalhador (pontualidade, empenho, qualidade) e o trabalhador avalia a fazenda (infraestrutura, condições de trabalho, fiel ao anúncio), com estrelas de 1 a 5 (`star-input.ts`, rádios nativos: funciona com teclado e leitor de tela) e comentário opcional. A nota recebida fica escondida até a pessoa avaliar também (ou o prazo de 14 dias acabar); a tela avisa quando o outro lado já avaliou.

- **Onde a nota aparece:** no card de cada candidato (com "Ver avaliações" e a ordem *Mais bem avaliados*), nas vagas e no detalhe da vaga (nota da fazenda, filtro *Avaliação da fazenda* e ordem *Fazendas mais bem avaliadas*, `?nota=` e `?ordem=rating` na URL), no perfil do trabalhador (*Sua reputação*) e na lista de fazendas do produtor.
- **Pendências:** o início de cada painel lista *Avalie seus últimos serviços* (`pending-reviews.ts`).
- O diálogo de avaliações (`reputation-dialog.ts`) mostra a média, uma barra por critério e os comentários, sem identificar quem escreveu.

**Conversas** (`/produtor/conversas` e `/trabalhador/conversas`): abrem quando o produtor aceita a candidatura, para combinar horário, ponto de encontro e o que levar sem expor o WhatsApp.

- **WhatsApp protegido** (`chat-phone-panel.ts`): cada um libera o próprio número; os dois só aparecem (com *Abrir no WhatsApp* e *Ligar*) quando os dois liberaram. Antes disso, número ou e-mail digitado sai oculto, e a tela avisa antes de enviar. A lista de candidatos também não mostra mais telefone nem e-mail.
- **Tempo real:** mensagens, pedidos de WhatsApp e o contador de não lidas do menu chegam por SSE (`LiveUpdatesService.chat()`/`chats()`; o `ChatInboxService` mantém a lista do painel aberto).
- **Feita para o campo:** respostas rápidas ("Estou a caminho.", "Cheguei na fazenda."), campo de 16 px (o iPhone não dá zoom), Enter envia, e sem sinal a mensagem fica *Não enviada* com um toque para reenviar.
- **Menu:** *Conversas* entrou no menu com o contador. No celular o trabalhador não tem mais *Vagas* e *Buscar* lado a lado (os dois abriam a mesma tela): fica *Buscar*, e *Vagas* continua na sidebar. O botão central do produtor aparece como *Novo* no menu de baixo.

## Menu das áreas logadas

O menu de baixo do celular segue a regra do Material e do iOS: **de 3 a 5 destinos**, com a ação principal no meio (com número ímpar, ela fica no centro de verdade). O `AppShell` (`core/layout/app-shell.ts`) exporta `MAX_BOTTOM_NAV_ITEMS` e `bottomNavItems()`, e cada layout tem o teste que confere a regra (`farmer-layout.spec.ts`, `worker-layout.spec.ts`, `system-layout.spec.ts`).

| Área | Menu de baixo (celular) | Só na sidebar (desktop) |
|---|---|---|
| Produtor | Início · Serviços · **Novo** · Conversas · Fazendas | Perfil |
| Trabalhador | Início · Candidaturas · **Buscar** · Conversas · Trilhas | Vagas (a mesma tela de Buscar), Perfil |
| Administrador | Início · Usuários · Trilhas · Equipe | Perfil |
| Tutor | Início · **Nova trilha** · Trilhas | Perfil |

No celular, o **perfil** fica no avatar (foto ou emoji) da **barra de cima**, junto da marca, que leva ao Início. Nome e foto do avatar vêm do `ProfileSummaryService` (`core/api`), que a página de perfil atualiza quando a pessoa troca o nome ou a foto. *Trocar de painel* e *Sair* continuam na página de perfil (no desktop, no fim da sidebar). As páginas que têm algo grudado no topo usam `--shell-top` (altura da barra de cima no celular; só a área do relógio no desktop).

## Estrutura

```text
src/
  styles/              tokens.css (brand system), base.css, layout.css
  app/
    app.routes.ts      rotas de topo: o único lugar que importa features (lazy)
    core/              singletons globais
      models/          tipos da API (o contrato que o check:contracts do backend confere) + status.ts
      api/             serviços HTTP usados por mais de uma feature: ProfileService, AccountService,
                       CategoryService, LiveUpdatesService, ReviewService, ChatService, ChatInboxService
      http/            authInterceptor, errorInterceptor + ApiError
      session/         CurrentUserService, SystemSessionService, guards (não são segurança)
      layout/          PublicLayout, AppShell (barra de cima + menu de baixo < 1024px / sidebar ≥ 1024px) e a UI que
                       depende de serviços do core (faixas do PWA, instalar, push, troca de painel, toasts)
      pwa/ maps/ toast/
    shared/            reaproveitável, sem saber de features
      ui/              Button, FormField, MaskedInput, ConfirmDialog, Skeleton, PhotoStrip... (sem domínio)
      utils/           CPF, máscaras, formatação pt-BR, RemoteData, fotos (images.ts), senha
      domain/ui/       UI de domínio usada por 2+ features: ServiceCard, StatusBadge, Avatar(Editor),
                       FarmMap, CategoryChip, PasswordChange, ResumeDialog, avaliações (RatingBadge,
                       StarInput, ReviewForm, ServiceReviews, ReputationDialog, PendingReviews) e
                       conversa (ChatList, ChatThread, ChatPhonePanel)
      domain/utils/    rascunho de vaga, prazos (expiry.ts), currículo, emoji do campo, critérios das
                       avaliações (review-criteria.ts), regras da conversa (chat.ts)
    features/          um domínio por pasta; uma feature nunca importa outra
      public/          landing (ui/ com as seções) e créditos das fotos
      auth/            cadastro, entrar, esqueci a senha, nova senha (data-access/AuthService)
      account/         segundo perfil da conta
      farmer/          área do produtor (lazy em /produtor): farmer.routes.ts, farmer-layout.ts,
                       pages/ (containers), ui/ (WorkerCard, LocationPicker, PhotoGridEditor),
                       data-access/FarmerService
      worker/          área do trabalhador (lazy em /trabalhador): mesma organização
      system/          área da equipe (lazy em /sistema): AdminService, SystemAuthService
```

Imports: dentro da mesma área (core, shared ou a mesma feature), relativos; entre áreas, pelos aliases do `tsconfig.json` (`@core/*`, `@shared/*`, `@features/*`, `@env/*`). `shared` pode usar serviços de infraestrutura do `core` (toast, loader do Google Maps, `ApiError`), nunca uma feature. O que duas features precisam vai para `core/api` (dados) ou `shared/domain` (UI e regras de tela).

Componentes: standalone, injeção com `inject()`, entradas e saídas com `input()`/`output()` e estado local com Signals (`RemoteData` para o que vem da API). No Angular 22 o `OnPush` já é o padrão de todo componente, então ele não é declarado.

## Renderização

Só a landing (`/`) é pré-renderizada no build. `/produtor/**`, `/trabalhador/**`, `/cadastro/**` e `/entrar/**` renderizam no browser, porque dependem do perfil atual, do `state` da navegação e de rotas com `:id`.

## App instalável (PWA)

O build de produção registra o service worker do Angular (`ngsw-config.json`), que guarda o app em cache. Em desenvolvimento (`ng serve`) ele não é registrado; para testar, faça o build e sirva `dist/ruraliza-frontend/browser`.

- **Cache:** o app (JS, CSS e `index.csr.html`, que serve para qualquer rota), as imagens e as fontes. A API não entra no cache: sem conexão o app abre, mostra a faixa de offline, e as chamadas falham.
- **Versão nova:** quando um deploy novo é baixado, aparece a faixa "Nova versão disponível" com o botão Atualizar.
- **Instalar:** o botão "Instalar app" aparece na landing e nas páginas de perfil quando o navegador permite. No iPhone ele explica o caminho pelo Compartilhar.
- **Notificações push:** são ativadas no perfil e valem para os dois perfis da conta. Precisam das chaves VAPID no `.env` do backend. A inscrição é reenviada ao backend sempre que alguém entra, e "Sair" a desativa neste aparelho. Como a sessão fica no `sessionStorage`, clicar numa notificação com o app fechado abre a tela de entrada.
- **Ícones:** `public/favicon.svg`, `favicon.ico`, `apple-touch-icon.png`, `public/icons/` (ícones do app, versão maskable e o badge monocromático das notificações) e `public/brand/` são gerados com `node scripts/generate-brand-assets.mjs`, a partir do desenho do símbolo que está no próprio script. Rode de novo se o logo mudar.

## Marca

O símbolo é o "R" em grade de 3×4 módulos, desenhado em SVG (menos de 400 bytes cada versão, nítido em qualquer tela). O componente `Logo` (`shared/ui/logo.ts`) desenha o símbolo inline com o wordmark:

| Versão | Arquivo | Onde aparece |
|---|---|---|
| Ícone do app (fundo verde, R branco, lima e laranja) | `favicon.svg`, `icone-app.svg` | aba do navegador, ícone do app instalado, tela inicial do iPhone, notificações |
| Verde (verde-escuro, verde e laranja) | `simbolo-verde.svg`, `tone="color"` | header com fundo branco, sidebar do painel |
| Colorido (quatro cores) | `simbolo-colorido.svg`, `tone="vivid"` | tela de carregamento do app (`index.html`) |
| Branco | `simbolo-branco.svg`, `tone="reverse"` | header transparente sobre a foto da landing, rodapé verde |
| Preto | `simbolo-preto.svg` | badge das notificações no Android (`icons/badge-96.png`, só o formato conta) |
