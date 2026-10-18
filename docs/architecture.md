# Código e arquitetura

Este documento é o mapa do que existe. Detalhes de uso, telas e regras de cada fluxo estão no [README](../README.md) (seção "Estrutura" e as demais); o produto, em [PRODUCT.md](../PRODUCT.md).

## Stack real

| Peça | Versão instalada | Observação |
|---|---|---|
| Angular (standalone, signals) | 22.2.0 | Sem NgModules; `OnPush` já é o padrão no Angular 22 |
| `@angular/ssr` + Express 5 | 22.2.0 | Builder `@angular/build:application`, `outputMode: "server"`, entrada `src/server.ts` |
| Service worker (`@angular/service-worker`) | 22.2.0 | Config em `ngsw-config.json`; só ativo fora do modo dev |
| TypeScript | 6.0.3 | Aliases `@core/*`, `@shared/*`, `@features/*`, `@env/*` (`tsconfig.json`) |
| Testes | Vitest 5.0.2 + jsdom 30 | `npm test` roda `ng test` (`@angular/build:unit-test`) |
| Estilo | CSS puro com tokens | `src/styles/*.css`; sem Tailwind nem biblioteca de componentes |
| Mapas | `@angular/google-maps` | A chave vem do backend (`core/maps/google-maps-loader.service.ts`) |
| Gerenciador | npm 11.19 (`packageManager`) | Há `package-lock.json` |

Dados e persistência ficam no backend (`../ruraliza-backend`), em memória por decisão da equipe: o frontend não tem banco nem ORM. O lint é ESLint com `angular-eslint` (`npm run lint`); o `.prettierrc` existe, mas sem script no `package.json` (ver [quality.md](quality.md)).

## Mapa do código

```text
src/
  main.ts, main.server.ts, server.ts   entradas do browser, do SSR e do Express
  styles.css -> styles/                tokens.css, base.css, layout.css, motion.css
  environments/                        environment.ts (produção) e environment.development.ts
  app/
    app.routes.ts / app.routes.server.ts   rotas e modo de renderização
    app.config.ts / app.config.server.ts   providers (router, hidratação, HTTP, service worker) / SSR
    core/       singletons globais
      api/        serviços HTTP usados por 2+ features (perfil, conta, conversas, notificações, SSE...)
      http/       authInterceptor, errorInterceptor, ApiError
      layout/     PublicLayout, AppShell, faixas do PWA, instalar, push, toasts
      models/     tipos do contrato da API (conferidos pelo check:contracts do backend)
      offline/    cache das respostas e fila de ações sem sinal
      preferences/ pwa/ maps/ toast/   tema e leitura; update, push, conectividade; mapa; avisos
      session/    CurrentUserService, SystemSessionService, guards, roles
    shared/     reaproveitável, sem conhecer features
      ui/           componentes sem domínio (Button, FormField, Icon, Logo...)
      utils/        CPF, máscaras, formatação pt-BR, RemoteData, fotos, senha, markdown, QR
      domain/ui/    UI de domínio usada por 2+ features (ServiceCard, avaliações, conversa...)
      domain/utils/ prazos, rascunho de vaga, currículo, emoji do campo, regras da conversa
    features/   um domínio por pasta; uma feature nunca importa outra
      public/ auth/ account/ farmer/ worker/ system/   (pages/, ui/, data-access/ conforme a área)
public/                 manifest, ícones, brand, emoji (copiados para a raiz do build)
scripts/                generate-brand-assets.mjs, fetch-landing-photos.mjs (rodados à mão), verify-quality-rules.mjs (autoteste do lint)
eslint-rules/           regras locais de lint copiadas do Vibe Coding Toolkit (eslint.config.mjs as usa)
.claude/skills/         skills de agente do projeto (skills-lock.json diz a fonte de cada uma)
.github/workflows/      ci.yml (verificações) e deploy.yml (GitHub Pages)
docs/                   produto, arquitetura, design, primeira execução, qualidade e setup
```

Regra de imports e de componentes: README, seção [Estrutura](../README.md#estrutura). O `app.routes.ts` é o único lugar que importa features (com `loadComponent`/`loadChildren`).

## Rotas e renderização

- **Público** (dentro do `PublicLayout`): `/`, `/cadastro`, `/entrar` (+ `esqueci-senha`, `nova-senha`), `/certificados[/:code]`, `/creditos`, `/termos`, `/privacidade`, `/ajuda`, `/sistema/entrar`, `/conta/novo-perfil/:papel` (exige sessão).
- **Áreas logadas, lazy:** `/produtor` (`requireRole('farmer')`), `/trabalhador` (`requireRole('worker')`), `/sistema` (`requireSystemSignedIn`). Rotas antigas de cadastro redirecionam para `/cadastro?papel=`; o resto cai em `/`.
- **Prerender no build** (`app.routes.server.ts`): `/`, `/creditos`, `/termos`, `/privacidade`. Conferido em `dist/ruraliza-frontend/browser/` (pastas `termos`, `creditos`, `privacidade`).
- **Renderiza no browser (`RenderMode.Client`):** `produtor/**`, `trabalhador/**`, `cadastro/**`, `conta/**`, `sistema/**` e o coringa `**` (inclui `/entrar/**`, `/ajuda` e `/certificados/**`), porque dependem da sessão, do `state` da navegação ou de `:id`.
- Hidratação com replay de eventos e incremental (`app.config.ts`). Código que usa `sessionStorage`, `EventSource` ou `caches` checa `isPlatformBrowser`.

## Acesso à API

- **URL:** `environment.apiUrl`. `environment.ts` é o de **produção** (`https://ruraliza-backend.onrender.com/api`); a configuração `development` do `angular.json` o troca por `environment.development.ts` (`http://localhost:3000/api`). `ng serve` usa `development` por padrão; `ng build`, `production`.
- **Interceptors** (ordem em `app.config.ts`): `errorInterceptor` por fora (vira `ApiError` e toast, exceto `SILENT_ERRORS`), `authInterceptor` (Bearer; token da equipe nas rotas `/admin` e `/auth/system/`; 401 com `WWW-Authenticate: Bearer` limpa a sessão e volta ao login) e `offlineCacheInterceptor` por dentro.
- **Imagens:** a API devolve `/api/images/...`; `apiAsset()` (`shared/utils/images.ts`) aponta para o servidor da API.
- **Estado de tela:** `RemoteData` (`shared/utils/remote-data.ts`) + Signals nos componentes.
- **Sessão:** `CurrentUserService` e `SystemSessionService` guardam usuário e token em `sessionStorage` (chaves `ruraliza.currentUser`, `ruraliza.sessionToken`).

## Tempo real e modo sem internet

- **SSE** (`core/api/live-updates.service.ts`): um stream por perfil (`/farmers/:id/live`, `/workers/:id/live`) dividido entre conversas do menu, sino e candidaturas, por causa do limite de 6 conexões por servidor em HTTP/1.1. Só a conversa aberta e os candidatos de um serviço têm stream próprio. O evento diz "mudou, busque de novo". O token vai em `?access_token=` (o `EventSource` não manda cabeçalhos).
- **Cópia das respostas** (`core/offline/offline-cache.*`): GETs de `/farmers/`, `/workers/`, `/chats/`, `/reviews/`, `/categories` e `/help` vão para o Cache Storage (`ruraliza-offline-v1`) e voltam quando a rede falha (status 0). Streams, `/verification` e a área do sistema nunca. Sair da conta ou trocar de conta apaga tudo.
- **Fila** (`offline-queue.service.ts`): ações repetíveis sem efeito duplo (hoje, concluir aula) em `localStorage` (`ruraliza.offlineQueue`), enviadas na ordem quando o sinal volta.
- **PWA:** `ngsw-config.json` faz prefetch do app (`index.csr.html`, JS, CSS) e carga preguiçosa de imagens e fontes. Faixa de versão nova, instalar e push em `core/pwa` e `core/layout`. Detalhes: README, seção [App instalável](../README.md#app-instalável-pwa).

## Build e deploy

- `npm run build` gera `dist/ruraliza-frontend/{browser,server}`. Orçamentos de produção: 500 kB (aviso) e 1 MB (erro) no bundle inicial; 4 kB e 8 kB por estilo de componente.
- `.github/workflows/deploy.yml`: em push na `main`, Node 22, `npm ci`, `ng build --configuration production --base-href /ruraliza-frontend/`, copia `index.html` para `404.html` e publica `dist/ruraliza-frontend/browser` no GitHub Pages. O fluxo não roda testes; quem verifica é o `ci.yml` (ver [quality.md](quality.md)).
- O servidor Express (`serve:ssr:ruraliza-frontend`) existe, mas o que o deploy publica é só a pasta `browser`, estática.

## Decisões

| Decisão | Motivo | Revisar quando |
|---|---|---|
| Features lazy, uma nunca importa outra | Bundle inicial pequeno; fronteiras claras | Duas features precisarem do mesmo código: mover para `core/api` ou `shared/domain` |
| Só a landing e 3 páginas estáticas prerenderizadas | O resto depende de sessão e `:id` | Houver página pública nova que precise de SEO |
| Sessão em `sessionStorage` | Aparelho dividido no campo; menos dado esquecido | Decisão de produto sobre sessão no aparelho (ver PRODUCT.md) |
| Respostas em Cache Storage, apagadas ao sair | Sinal fraco no campo, sem vazar dados entre contas | Dado sensível novo entrar em `CACHEABLE` |
| Um stream SSE por perfil | Limite de 6 conexões em HTTP/1.1 | O backend servir HTTP/2 (pendente, segundo o backend) |
| CSS puro com tokens, sem framework | Marca própria; tema e contraste por atributos no `<html>` | O redesign pedir sistema de componentes novo |
| Guards não são segurança | Quem protege os dados é a API | Nunca: só a API autoriza |

## Manutenção

Atualize este mapa quando mudarem pastas, dependências relevantes, contratos ou fronteiras. Registre só comportamento verificado.
