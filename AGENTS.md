# Ruraliza: app (frontend)

Instruções para agentes de IA. São curtas de propósito: os detalhes estão nos documentos do mapa abaixo.

## Produto e stack

- **Produto e escopo:** [PRODUCT.md](PRODUCT.md). **Telas, fluxos e regras de uso:** [README.md](README.md).
- **Stack:** Angular 22 (standalone, signals, SSR e pré-renderização), TypeScript 6, npm 11, Vitest via `ng test` e service worker (`ngsw`). O CSS é próprio, com tokens em `src/styles/tokens.css` (sem Tailwind).
- **API:** `../ruraliza-backend` em http://localhost:3000/api. Os dados ficam em memória lá, por decisão da equipe.
- **Mapa:** [docs/architecture.md](docs/architecture.md) (estrutura e decisões), [docs/design.md](docs/design.md) (sistema visual e acessibilidade), [docs/onboarding.md](docs/onboarding.md) (primeira execução), [docs/quality.md](docs/quality.md) (verificações e revisão), [docs/setup.md](docs/setup.md) (ferramentas de agente e evidências).

## Comandos

- Instalar: `npm ci`
- Desenvolver: `npm start` (http://localhost:4200, com a API rodando)
- Lint (TypeScript e templates, incluindo acessibilidade): `npm run lint`
- Autoteste das regras locais de lint: `npm run check:rules`
- Tipos: `npm run typecheck`
- Testes: `npx ng test --watch=false` (`npm test` fica observando os arquivos)
- Build: `npm run build`
- Verificação completa: `npm run verify` (lint, regras, tipos, testes e build)

## Como trabalhar aqui

- Leia o código e as instruções relevantes antes de editar. Separe o que observou, o que supôs, o que decidiu e a evidência.
- Defina o critério de aceite e o comando que o prova antes de implementar. Correção de bug começa reproduzindo o bug num teste.
- Faça a menor mudança completa. Reaproveite componentes de `shared/ui` e `shared/domain/ui`, os tokens e os utilitários de layout antes de criar novos.
- Valores visuais só existem em `src/styles/*.css`. Use os tokens e não fixe cores nem tamanhos em componentes.
- Preserve a acessibilidade: foco visível, teclado, rótulos, contraste nos temas claro, escuro e de alto contraste, letras maiores (tudo em `rem`) e `prefers-reduced-motion`.
- O menu de baixo tem de 3 a 5 itens; os testes `*-layout.spec.ts` conferem a regra.
- Página grande separa o template e o estilo em `.html` e `.css` (o padrão de páginas como `service-detail-page`). Nenhum arquivo passa de 350 linhas.
- Promessas do router vão com `void` quando o resultado não importa: o lint acusa promessas soltas.
- Mudou uma tela, um fluxo ou uma regra? Confira no navegador (celular e desktop) e atualize o documento responsável na mesma mudança.
- Publicar, enviar mensagens, gastar dinheiro e ações destrutivas só com autorização. O merge na `main` publica no GitHub Pages (`deploy.yml`).
- Não adicione bloqueio de push na `main`, exigência de branch ou worktree, nem hooks `pre-commit` ou `pre-push`.

## Continuidade

- Um bloqueio para só o que depende dele; o resto autorizado continua.
- Ao retomar um trabalho, confira os arquivos, o `git status`, as verificações e os processos de verdade antes de confiar num resumo anterior.
- Trabalho que atravessa sessões ganha um handoff curto no plano ou na tarefa (modelo em [docs/quality.md](docs/quality.md#continuidade)). Progresso temporário não vira memória permanente.

## Ferramentas de agente

Plugins, hooks e conectores ficam na máquina de cada pessoa, não no repositório: use o que estiver instalado e, se faltar, siga o processo normal. Os detalhes, as versões e a evidência de cada ferramenta estão em [docs/setup.md](docs/setup.md).

- **Superpowers:** use as skills de processo (brainstorming, planos, depuração sistemática) na proporção do pedido. Instrução explícita e execução já autorizada valem mais que aprovações repetidas.
- **Ponytail (`full`):** a menor solução completa, sem cortar validação, segurança, acessibilidade nem tratamento de erro. `stop ponytail` desliga.
- **Conversa concisa:** responda curto, no idioma de quem pede. Código, documentos e commits usam redação normal.
- **Context7:** consulte a documentação atual (Angular, angular-eslint, Vitest), um conceito por vez. Nunca envie código privado, segredos ou dados pessoais.
- **RTK:** o hook do Claude Code reescreve os comandos suportados; não prefixe de novo. Use `rtk proxy <comando>` quando precisar da saída completa.
- **Graphify:** `graphify query "..."` responde perguntas de estrutura a partir de `graphify-out/graph.json`, gerado localmente sem LLM (fica fora do git e pode estar desatualizado ou não existir num clone novo). Atualize com `GRAPHIFY_NO_AUTO_REFRESH=1 graphify update . --no-cluster` e confirme no código o que o grafo sugerir.
- **Navegador:** confira telas no navegador do app do Claude (ou no Claude in Chrome) com `npm start` e a API locais. Nunca use produção nem sessões pessoais.
- **Skills do projeto** (`.claude/skills/`, fontes em `skills-lock.json`):
  - `web-design-guidelines`: revisão de interface (acessibilidade, foco, formulários, estados).
  - `writing-guidelines`: revisão de textos e documentação.
  - `differential-review`: diffs que mexem em sessão, token, permissões ou dados pessoais.
  - `find-skills`: quando faltar uma capacidade concreta.
- **Skills de design no usuário** (fora do repositório; instale se quiser usar):
  - `impeccable` ([pbakaus/impeccable](https://github.com/pbakaus/impeccable)): criticar, auditar, polir e redesenhar telas.
  - `design-taste-frontend` ([Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill)): direção de arte para páginas públicas, como a landing; não serve para telas do app.

  Antes de redesenhar, leia [docs/design.md](docs/design.md) e os tokens: as skills sugerem, mas quem decide é o sistema do projeto.

## Delegação e revisão

- Delegue a subagentes só quando isolar contexto, especializar ou paralelizar compensar. Para buscas e tarefas mecânicas, prefira um modelo leve. Segurança, dados e revisão crítica pedem um modelo à altura do risco.
- Cada tarefa delegada recebe objetivo, contexto mínimo, arquivos permitidos, critério de aceite e as verificações. Cada arquivo tem um só autor. Revisores só leem. O coordenador confere o diff e roda as verificações.
- Duas tarefas em paralelo não usam a mesma porta, a mesma pasta de build nem o mesmo `ng serve`.
- A revisão segue o risco e o diff real, como está em [docs/quality.md](docs/quality.md#revisão-depois-de-implementar).
