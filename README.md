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

**Área de sistema** (`/sistema`): para a equipe do Ruraliza (usuários de sistema), com login próprio em `/sistema/entrar` e sem cadastro público nem link no site. O cargo define o menu: **Administrador** vê e edita os usuários do app, remove fotos de perfil, perfis ou contas e cadastra e edita os membros da equipe (nome, e-mail e cargo, menos o próprio cargo); **Tutor** (trilhas de estudo) ainda só vê o início. Todo usuário de sistema edita o próprio nome e e-mail em `/sistema/perfil`. Teste com `admin@exemplo.com`, senha `ruraliza123`. A sessão de sistema é separada da conta do app (`core/session/system-session.service.ts`).

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
      layout/          PublicLayout, AppShell (bottom nav < 1024px / sidebar ≥ 1024px) e a UI que
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
- **Ícones:** `public/icons/` é gerado de `public/favicon.svg` com `node scripts/generate-pwa-icons.mjs`. Rode de novo se o logo mudar.
