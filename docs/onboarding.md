# Preparação local

Guia de uso, telas e fluxo de teste: [README](../README.md). Produto: [PRODUCT.md](../PRODUCT.md). Código: [architecture.md](architecture.md).

## Pré-requisitos

- **Node.js:** o Angular CLI 22 declara `^22.22.3 || ^24.15.0 || >=26.0.0` (`engines` em `node_modules/@angular/cli/package.json`). Localmente foi observado o Node 24.19.0; o CI (`deploy.yml`) usa Node 22. Use 22 ou 24.
- **npm:** o `package.json` fixa `npm@11.19.0` em `packageManager`. Localmente foi observado o npm 11.17.0, sem problema registrado para instalar e rodar.
- **Backend** rodando ao lado (veja abaixo). Sem ele, as telas que dependem da API não carregam dados (suposição: não testado com o backend desligado).
- Não é preciso instalar o Angular CLI globalmente: os scripts usam o `ng` do projeto.

## Primeira execução

```bash
npm ci            # usa o package-lock.json
npm start         # ng serve (configuração development) → http://localhost:4200
```

Perfis de teste (senha `ruraliza123`, criados pelo seed do backend): `produtor@exemplo.com`, `trabalhador@exemplo.com`; da equipe, `admin@exemplo.com` e `tutor@exemplo.com` em `/sistema/entrar`. O passo a passo completo está no README, seção [Fluxo de teste](../README.md#fluxo-de-teste).

## Backend

O app espera a API em `http://localhost:3000/api`. Suba o backend irmão (`../ruraliza-backend`):

```bash
cd ../ruraliza-backend
npm run dev       # http://localhost:3000/api (reinicia ao salvar)
```

Os dados do backend ficam em memória, por decisão da equipe: ele recria os dados de teste a cada subida e tudo o que você criar some quando ele reinicia. Variáveis do backend (porta, VAPID, Google Maps, WhatsApp) estão no README e no `.env.example` dele. Mapa, push e avisos no WhatsApp só funcionam se o backend tiver essas chaves; sem elas, as rotas de configuração do backend respondem 503 (segundo o PRODUCT.md dele) e o recurso não liga.

## Ambientes

Não há `.env` no frontend. A URL da API vem de `src/environments/`:

| Arquivo | `apiUrl` | Quando vale |
|---|---|---|
| `environment.development.ts` | `http://localhost:3000/api` | `npm start` e `npm run watch` (configuração `development`) |
| `environment.ts` | `https://ruraliza-backend.onrender.com/api` | `npm run build` e o deploy (configuração `production`) |

Cuidado: o arquivo sem sufixo é o de **produção**; o de desenvolvimento entra por `fileReplacements` no `angular.json`. Para apontar para outra API, edite o arquivo da configuração certa (sem segredos: são valores públicos).

## Verificar

```bash
npm test          # ng test (Vitest + jsdom): não precisa do backend
npm run build     # ng build (production): SSR + prerender + service worker
```

`npm test` e `npm run build` não dependem de credenciais nem do backend. Para testar o modo instalável e sem internet, sirva a pasta `dist/ruraliza-frontend/browser` com um servidor estático: o service worker não é registrado em `npm start`. `npm run verify` roda lint, autoteste das regras, tipos, testes e build. Não há script de formatação: o `.prettierrc` existe, mas o código não foi todo formatado com ele (ver [quality.md](quality.md)).

## Deploy

Push na `main` publica no GitHub Pages com `--base-href /ruraliza-frontend/` (`.github/workflows/deploy.yml`). O fluxo só faz build; os testes não rodam nele. Detalhes em [architecture.md](architecture.md#build-e-deploy).

## Agentes

Leia o [AGENTS.md](../AGENTS.md). O [CLAUDE.md](../CLAUDE.md) importa as mesmas instruções. Consulte [setup.md](setup.md) para skills locais, integrações e escopos configurados. Para revisar interface, veja a seção de skills em [design.md](design.md).

## Problemas conhecidos

Só o que foi verificado:

