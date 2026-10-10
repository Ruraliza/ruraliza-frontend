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

Todo perfil tem **senha**, definida no cadastro. Em **Entrar** você escolhe produtor ou trabalhador e informa e-mail e senha; os perfis de teste do backend são `produtor@exemplo.com` e `trabalhador@exemplo.com`, senha `ruraliza123`. Quem entrou fica em `sessionStorage`. A API ainda não emite token de sessão, então o guard das áreas não é segurança. Os dados vivem em memória no backend e somem quando ele reinicia.

## Senha

- **Cadastro:** senha (8 a 128 caracteres) e confirmação, com botão *Mostrar* (`shared/ui/password-reveal.ts`, regras em `shared/utils/password.ts`).
- **Esqueci minha senha** (`/entrar/esqueci-senha` → `/entrar/nova-senha`): a pessoa informa o e-mail e cria a nova senha. O envio do código por e-mail **ainda não existe**: a API devolve o token na resposta e a tela segue direto para a nova senha. O token vai pelo `state` da navegação (`pages/public/auth-prefill.ts`), não pela URL. Quando o e-mail existir, a segunda tela passa a pedir o código (ver `TODO(email)`).
- **Alterar senha com a conta aberta:** cartão *Senha* no Perfil (produtor e trabalhador), pedindo a senha atual, sem código por e-mail (`shared/ui/password-change.ts`).

## Fluxo de teste

1. `/cadastro/produtor` → cadastre um produtor com senha (ou entre com o de teste em `/entrar`). Em **Perfil**, envie uma foto.
2. **Fazendas** → cadastre uma fazenda e adicione fotos (até 6; a primeira é a capa).
3. **＋ Novo serviço** → publique em 2 passos, com descrição e prazo para candidaturas (opcional).
4. Saia (Perfil → *Sair*) e entre como trabalhador. Em **Perfil**, preencha foto, apresentação, experiência, certificados e cursos.
5. **Vagas** → busque e filtre (texto, categoria, carga horária, data de publicação, ordem) → abra a vaga → *Candidatar-me* → confirme.
6. Volte ao produtor → **Serviços** (abas por situação, busca e filtros) → abra o serviço → veja o candidato → *Aceitar trabalhador*.
7. Com o serviço em andamento → *Liberar pagamento* (simulação).

## Fotos, filtros e prazos

- **Fotos:** antes do envio, o navegador reduz a foto para no máximo 1000 px e converte para WebP (`shared/utils/images.ts`), o que economiza dados no celular. O backend repete o tratamento e é quem garante a regra. As URLs que a API devolve (`/api/images/...`) passam por `apiAsset()` para apontar ao servidor da API.
- **Filtros na URL:** os filtros de **Vagas** (`q`, `categoria`, `min`, `max`, `de`, `ate`, `ordem`) e de **Serviços** do produtor (`aba`, `q`, `categoria`, `fazenda`, `ordem`, `so`) ficam na query string. Voltar do detalhe mantém a busca e o link pode ser compartilhado. As vagas são filtradas no backend. Os serviços do produtor são filtrados no navegador, porque a lista é pequena; com o banco, dá para passar os filtros para a API.
- **Sem foto → emoji do campo:** avatar sem foto mostra um emoji escolhido pelo nome (sempre o mesmo para a mesma pessoa), card de vaga sem foto usa o emoji da categoria (Colheita 🌾, Plantio 🌱, Manejo de gado 🐄…) e fazenda sem foto usa um emoji de paisagem (`shared/utils/farm-emoji.ts`). Os emojis são imagens no estilo do Facebook, em `public/emoji/<codepoints>.webp` (64 px, extraídas do pacote `emoji-datasource-facebook` 16.0.0). **Atenção:** o próprio pacote avisa que as imagens do Facebook não têm licença clara. Para trocar por Twemoji (CC-BY 4.0) ou Noto (Apache 2.0), basta substituir os arquivos mantendo os nomes.
- **Prazo (`expires_at`):** dia do calendário no horário de Brasília (`shared/utils/expiry.ts`). Vaga vencida some da busca do trabalhador. O produtor a vê marcada como *Prazo encerrado* e pode renová-la editando a data.

## Estrutura

```text
src/
  styles/            tokens.css (brand system), base.css, layout.css
  models/            tipos da API + status.ts (tradução, cor e ícone de cada status)
  app/
    core/api/        AuthService, FarmerService, WorkerService, CategoryService (único lugar com HttpClient)
    core/http/       errorInterceptor + ApiError (mensagens claras, repassa o erro)
    core/session/    CurrentUserService (quem entrou) + guard requireRole (não é segurança)
    core/toast/      ToastService
    shared/ui/       Button, FormField, MaskedInput, StatusBadge, ServiceCard, ConfirmDialog,
                     Avatar, AvatarEditor, PhotoGridEditor, PhotoStrip...
    shared/utils/    CPF, máscaras, formatação pt-BR, RemoteData, fotos (images.ts), prazos (expiry.ts)
    layouts/         PublicLayout, AppShell (bottom nav < 1024px / sidebar ≥ 1024px)
    pages/public/    landing, cadastro, entrar, esqueci a senha, nova senha
    pages/farmer/    área do produtor (lazy em /produtor)
    pages/worker/    área do trabalhador (lazy em /trabalhador)
```

## Renderização

Só a landing (`/`) é pré-renderizada no build. `/produtor/**`, `/trabalhador/**`, `/cadastro/**` e `/entrar/**` renderizam no browser, porque dependem do perfil atual, do `state` da navegação e de rotas com `:id`.
