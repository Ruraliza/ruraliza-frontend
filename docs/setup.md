# Setup e evidências

Registro da adoção do [Vibe Coding Toolkit](https://github.com/soumatheusgomes/vibe-coding-toolkit) neste repositório. Diz o que foi configurado, com qual evidência e o que ficou pendente. As verificações do dia a dia estão em [quality.md](quality.md).

## Fonte e contexto

- **Data:** 18/10/2026. **Toolkit:** revisão `de66fe3` (17/10/2026), lida numa cópia temporária. Todos os guias e templates vêm dessa revisão.
- **Cliente:** Claude Code 2.1.296 (app desktop, Windows 11, Git Bash). O Codex não está instalado, então as configurações dele não se aplicam.
- **Runtime:** Node 24.19.0 e npm 11.17.0 locais. O CI e o deploy usam Node 22.
- **Modelos:** a sessão principal usou o Opus 5.5. Os subagentes foram escolhidos pelo risco: Haiku para o caso mecânico do harness e Sonnet para os documentos, os outros casos e a revisão. Não houve troca de provedor, proxy nem API paga.
- **Branch:** `chore/vibe-coding-toolkit`, criada a partir de `origin/main` (com o PR #14 já integrado).

## Decisões

| Decisão | Motivo | Rever quando |
|---|---|---|
| ESLint com `angular-eslint` 22.6.0 (versão estável, igual ao Angular 22) | O app não tinha lint. Context7 e a documentação oficial (flat config, `templateAccessibility`) | Ao subir o major do Angular |
| Regras locais do toolkit: só `quality/max-lines` | Sem logger e sem banco, as outras duas não têm contrato para proteger | Se o app ganhar um logger |
| `no-floating-promises` e `no-misused-promises` como erro, sem o perfil tipado amplo | O perfil focado do toolkit; custo medido de cerca de 12 s e 875 MB | Se o lint ficar lento demais no CI |
| Prettier sem script e sem formatar o código | Cerca de 340 arquivos fora do padrão; reformatar tudo esconderia o diff | Decisão da equipe |
| Impeccable e Taste ficam no usuário, citados no AGENTS.md com a fonte | Evita nome duplicado; escolha do responsável pelo projeto | Se a equipe quiser as skills no repositório |
| Skills de React e Next da Vercel não instaladas | O app é Angular | — |

## Componentes

| Componente | Ação | Escopo | Estado e evidência |
|---|---|---|---|
| AGENTS.md e CLAUDE.md | Criados, em português, com os comandos reais | Projeto | **Validado:** uma sessão nova (`claude -p`, Haiku) achou o `npm run verify`, as skills e a regra do banco |
| Os 9 destinos do manifesto | AGENTS e CLAUDE (linha acima), PRODUCT, architecture, design, onboarding, quality e setup criados; o README já existia, continua o guia de uso e ganhou o mapa | Projeto | Revisados contra o código |
| Superpowers 7.0.0 e Ponytail 5.3.2 | `claude plugin install --scope local` na pasta `Ruraliza/` | Local, fora do git | **Validado:** as skills `superpowers:*` e `ponytail:*` apareceram carregadas na própria sessão do setup. Nenhuma delas foi executada como teste |
| Caveman | Não instalado; o estilo de saída **Concise**, já ativo, faz o mesmo papel | Usuário | Equivalente reaproveitado |
| RTK 1.0.1 | `rtk init -g --auto-patch` (autorizado), com backup do `settings.json` | Usuário | **Validado:** `git status` reescrito uma vez (-42% em `rtk gain --history`); repetir o init não duplicou o hook |
| Context7 | O conector do claude.ai, que já estava ativo | Usuário | **Validado:** consulta real (`/angular-eslint/angular-eslint`, flat config) |
| Graphify 0.9.92 (uv) | `.graphifyignore` e `graphify update . --no-cluster` (extração estrutural, sem LLM); `graphify-out/` no `.gitignore` | Projeto (saída local) | **Validado:** 1847 nós e 5361 arestas, sem node_modules nem segredos. Sem extração semântica: o CLI não herda o login da conversa |
| `web-design-guidelines`, `writing-guidelines` (vercel-labs/agent-skills), `find-skills` (vercel-labs/skills, MIT), `differential-review` (trailofbits/skills, CC-BY-SA-4.0) | `npx skills@1.7.2 add ... --agent claude-code --copy` | Projeto (`.claude/skills/`, `skills-lock.json`) | **Validado:** o cliente descobriu as 4 nesta sessão. Repetir o `skills update` sem `--agent` trocou o `find-skills` por um link para `.agents/` (refeito como cópia); a manutenção usa `add --agent claude-code --copy` |
| `impeccable` 4.6.0 e `design-taste-frontend` (tasteskill v2) | Já estavam no usuário, nas versões mais recentes | Usuário | Reaproveitados |
| Navegador | O navegador do app do Claude (automação, console e rede) no lugar do agent-browser e do Chrome DevTools MCP | Cliente | **Validado:** login, vaga e página de administração conferidas, sem erros no console |
| Revisão de segurança (prompt 13) | Fonte e uso registrados em [quality.md](quality.md#revisão-de-segurança) | Projeto | Documentado; nenhuma revisão completa do repositório rodou |
| CI (`ci.yml`) | Criado: `npm ci` e `npm run verify` | Projeto | YAML conferido; **sem execução remota** até alguém fazer push |
| next-dev-loop e next-bundle-optimizer | Não se aplicam | — | O app é Angular, não Next |
| supabase-postgres-best-practices | Não se aplica | — | Não há banco, por decisão da equipe |
| gh-fix-ci | Bloqueado | — | O skill é para Codex (não instalado) e o `gh` não está autenticado. Retomar se o Codex for adotado |
| shadcn e Sentry MCP | Não se aplicam | — | Sem shadcn e sem Sentry no projeto |
| Obsidian, aia-harness, Anthropic skills | Não instalados | — | Sem necessidade concreta; skill-creator, pdf e docx já vêm com o app |
| Hooks do cliente | Só o do RTK | Usuário | Sem hooks no projeto e sem hooks do git |

## Verificações antes e depois

| Verificação | Antes (main) | Depois |
|---|---|---|
| `ng test --watch=false` | 212 passam | 213 passam (+1 regressão do filtro de palavrões) |
| `ng build` | ok | ok |
| `tsc` (app e testes) | ok | ok |
| Lint | não existia | 0 problemas (antes da adoção: 37) |
| Autoteste das regras | — | ok |
| `npm audit` | 1 alto (`source-map-js`) | 0 |
| Arquivos > 350 linhas | 3 | 0 |

Mudanças de código feitas pela adoção, todas cobertas pelos testes e pelo build:

- `void` em 25 navegações do router.
- `qr-code.ts` dividido.
- Templates e estilos de duas páginas em arquivos próprios.
- Correção do filtro de palavrões.
- Um import e uma inicialização sem uso removidos.

## Memória e harness

- **Memória:** a memória nativa do Claude Code fica no perfil do usuário e vale para a pasta `Ruraliza/`. O índice é `MEMORY.md`, com um arquivo por fato (fonte, última verificação e quando invalidar).
  - Ela carrega sozinha em sessões abertas nessa pasta. **Validado:** uma sessão nova lembrou do redesign pendente e da regra do banco.
  - Quem abre `ruraliza-frontend/` direto não carrega essa memória, só os documentos versionados.
  - Fatos duradouros do projeto ficam nos documentos versionados, não na memória.
- **Avaliação do harness** (prompt 14, fixture do toolkit em cópias descartáveis, avaliador `ebc2cdd…` de fora da pasta gravável). A base falhou 2 de 7, como esperado.

  | Caso | Modelo | Resultado |
  |---|---|---|
  | Correção de fronteira | Haiku | **Passou:** 7/7, mudou só `access.mjs`, notas locais preservadas |
  | Handoff desatualizado | Sonnet | **Passou:** recusou o "7/7" falso, corrigiu e reescreveu o handoff com a evidência real |
  | Revisão só de leitura | Sonnet | **Passou:** as 2 falhas com ator e registro de exemplo; a pasta ficou idêntica (checksums) |
  | Reaplicar o setup | Opus (coordenador) | **Passou com uma ressalva:** RTK e plugin repetidos sem duplicar; o `skills update` sem `--agent` trocou o `find-skills` por um link absoluto para `.agents/`. Refiz a cópia e troquei o comando de manutenção |
  | Conflito de recursos, bloqueio parcial, pausar e retomar | — | **Não rodaram:** exigem interações observáveis do cliente |

  Um subagente novo não é um cliente reiniciado. As duas sessões `claude -p` foram o teste de cliente novo.

## Revisão independente

Dois revisores só de leitura (Sonnet, um por repositório) revisaram o diff contra `origin/main`, com os arquivos fora do commit. Ficaram de fora o conteúdo copiado (`.claude/skills/`, `eslint-rules/`) e o lockfile.

- Nenhum achado alto.
- Os 6 achados baixos eram de documentação e configuração, todos corrigidos: mapa de pastas, Node no README, contagens, `.claude/` e `.agents/` no lint. Nenhuma regressão de código: os 25 `void`, a divisão do QR e os templates movidos foram comparados com o HEAD, e o conteúdo é idêntico.
- Depois das correções, a verificação completa passou de novo.
- Não foram cobertos: a execução remota do CI e o build AOT rodado pelo revisor (o coordenador rodou `ng build`).

## Pendências

- Fazer o primeiro push e conferir o `ci.yml` rodando no GitHub.
- Decidir sobre o Prettier (formatar tudo num commit só, ou remover o `.prettierrc`).
- Aprovar ou não os scripts de instalação que o npm 11 bloqueia (`lmdb`, `msgpackr-extract`).
- Rodar a revisão de segurança de linha de base (prompt 13) quando quiserem.

## Como manter e repetir

- **Skills:** repita o `add` de cada skill de `skills-lock.json`, por exemplo `npx --yes skills@latest add vercel-labs/skills --skill find-skills --agent claude-code --copy --yes`. Depois revise o diff de `.claude/skills/` e `skills-lock.json`. Não use `skills update` sem `--agent`: no teste de reaplicação ele moveu o `find-skills` para `.agents/skills/` e deixou em `.claude/skills/` um link absoluto (que quebra em outra máquina). A cópia foi refeita com `--copy`.
- **Grafo:** `GRAPHIFY_NO_AUTO_REFRESH=1 graphify update . --no-cluster`.
- **Regras locais:** ao atualizar o toolkit, copie de novo `eslint-rules/*.cjs` e `scripts/verify-quality-rules.mjs` da mesma revisão, rode `npm run check:rules` e meça o lint antes de mudar severidades.
- **Repetir o setup:** rode de novo o prompt 12 do toolkit. Ele confere a revisão nova e preserva as personalizações; registre a nova revisão aqui.
