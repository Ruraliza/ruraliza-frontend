# 🌾 Ruraliza — Frontend

Angular 22 (standalone, signals, SSR) para o RURALIZA: conecta produtores rurais a trabalhadores e prestadores de serviço no campo.

## Como rodar

Pré-requisitos: Node.js 20+ e o [backend](https://github.com/Henrique549/ruraliza-backend) rodando em `http://localhost:3000/api`.

```bash
npm install
npm start        # ng serve → http://localhost:4200
npm test         # ng test (Vitest)
npm run build    # ng build
```

Sem autenticação nesta fase: em **Entrar** você escolhe um perfil de teste (fica em `sessionStorage`). Os dados vivem em memória no backend e somem quando ele reinicia.

## Fluxo de teste

1. `/cadastro/produtor` → cadastre um produtor (ou use o de teste em `/entrar`).
2. **Fazendas** → cadastre uma fazenda.
3. **＋ Novo serviço** → publique em 2 passos.
4. Troque de perfil (Perfil → *Trocar perfil de teste*) e entre como trabalhador.
5. **Vagas** → abra a vaga → *Candidatar-me*.
6. Volte ao produtor → **Serviços** → abra o serviço → *Aceitar trabalhador*.
7. Com o serviço em andamento → *Liberar pagamento* (simulação).

## Estrutura

```text
src/
  styles/            tokens.css (brand system), base.css, layout.css
  models/            tipos da API + status.ts (tradução, cor e ícone de cada status)
  app/
    core/api/        FarmerService, WorkerService, CategoryService (único lugar com HttpClient)
    core/http/       errorInterceptor + ApiError (mensagens claras, repassa o erro)
    core/session/    CurrentUserService (perfil de teste) + guard requireRole (não é segurança)
    core/toast/      ToastService
    shared/ui/       Button, FormField, MaskedInput, StatusBadge, ServiceCard, ConfirmDialog...
    shared/utils/    CPF, máscaras, formatação pt-BR, RemoteData (carregando/erro/sucesso)
    layouts/         PublicLayout, AppShell (bottom nav < 1024px / sidebar ≥ 1024px)
    pages/public/    landing, cadastro, entrar
    pages/farmer/    área do produtor (lazy em /produtor)
    pages/worker/    área do trabalhador (lazy em /trabalhador)
```

## Renderização

Só a landing (`/`) é pré-renderizada no build. `/produtor/**`, `/trabalhador/**`, `/cadastro/**` e `/entrar` renderizam no browser, porque dependem do perfil atual e de rotas com `:id`.
