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

Sem autenticação nesta fase: em **Entrar** você escolhe um perfil de teste (fica em `sessionStorage`). Os dados vivem em memória no backend e somem quando ele reinicia.

## Fluxo de teste

1. `/cadastro/produtor` → cadastre um produtor (ou use o de teste em `/entrar`). Em **Perfil**, envie uma foto.
2. **Fazendas** → cadastre uma fazenda e adicione fotos (até 6; a primeira é a capa).
3. **＋ Novo serviço** → publique em 2 passos, com descrição e prazo para candidaturas (opcional).
4. Troque de perfil (Perfil → *Trocar perfil de teste*) e entre como trabalhador. Em **Perfil**, preencha foto, apresentação, experiência, certificados e cursos.
5. **Vagas** → busque e filtre (texto, categoria, carga horária, data de publicação, ordem) → abra a vaga → *Candidatar-me* → confirme.
6. Volte ao produtor → **Serviços** (abas por situação, busca e filtros) → abra o serviço → veja o candidato → *Aceitar trabalhador*.
7. Com o serviço em andamento → *Liberar pagamento* (simulação).

## Fotos, filtros e prazos

- **Fotos:** antes do envio, o navegador reduz a foto para no máximo 1000 px e converte para WebP (`shared/utils/images.ts`), o que economiza dados no celular. O backend repete o tratamento e é quem garante a regra. As URLs que a API devolve (`/api/images/...`) passam por `apiAsset()` para apontar ao servidor da API.
- **Filtros na URL:** os filtros de **Vagas** (`q`, `categoria`, `min`, `max`, `de`, `ate`, `ordem`) e de **Serviços** do produtor (`aba`, `q`, `categoria`, `fazenda`, `ordem`, `so`) ficam na query string. Voltar do detalhe mantém a busca e o link pode ser compartilhado. As vagas são filtradas no backend. Os serviços do produtor são filtrados no navegador, porque a lista é pequena; com o banco, dá para passar os filtros para a API.
- **Prazo (`expires_at`):** dia do calendário no horário de Brasília (`shared/utils/expiry.ts`). Vaga vencida some da busca do trabalhador. O produtor a vê marcada como *Prazo encerrado* e pode renová-la editando a data.

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
    shared/ui/       Button, FormField, MaskedInput, StatusBadge, ServiceCard, ConfirmDialog,
                     Avatar, AvatarEditor, PhotoGridEditor, PhotoStrip...
    shared/utils/    CPF, máscaras, formatação pt-BR, RemoteData, fotos (images.ts), prazos (expiry.ts)
    layouts/         PublicLayout, AppShell (bottom nav < 1024px / sidebar ≥ 1024px)
    pages/public/    landing, cadastro, entrar
    pages/farmer/    área do produtor (lazy em /produtor)
    pages/worker/    área do trabalhador (lazy em /trabalhador)
```

## Renderização

Só a landing (`/`) é pré-renderizada no build. `/produtor/**`, `/trabalhador/**`, `/cadastro/**` e `/entrar` renderizam no browser, porque dependem do perfil atual e de rotas com `:id`.
