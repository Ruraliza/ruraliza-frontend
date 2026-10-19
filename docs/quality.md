# Qualidade

O que cada verificação prova, quando rodar e como revisar. As ferramentas de agente e as evidências da adoção estão em [setup.md](setup.md).

## Comandos

| Comando | O que prova | Quando rodar |
|---|---|---|
| `npm run lint` | ESLint com `typescript-eslint`, `angular-eslint` (incluindo `templateAccessibility`), promessas tratadas e nenhum arquivo acima de 350 linhas | Toda mudança de código |
| `npm run check:rules` | As regras locais de lint (`eslint-rules/`) funcionam: o autoteste do toolkit passa | Ao atualizar `eslint-rules/` |
| `npm run typecheck` | O app e os testes fecham no `tsc` | Toda mudança de código |
| `npx ng test --watch=false` | Os 213 testes Vitest (componentes, serviços, regras de menu, utilitários) | Toda mudança de código |
| `npm run build` | O build de produção com SSR e as rotas pré-renderizadas (`/`, `/creditos`, `/termos`, `/privacidade`) | Antes de entregar |
| `npm run verify` | Tudo acima, em ordem | Antes de pedir revisão |

O CI (`.github/workflows/ci.yml`) roda `npm ci` e `npm run verify` em cada PR e em cada push na `main`, com o Node 22 do `deploy.yml`. Ele não publica e não é exigido para fazer merge. Quem publica é o `deploy.yml`, no push na `main`.

`npm test` (`ng test`) fica observando os arquivos; em script ou CI use `--watch=false`.

## Regras de base

- Presets do ESLint, do `typescript-eslint` (`recommended`) e do `angular-eslint` (`tsRecommended`, `templateRecommended`, `templateAccessibility`), com o prefixo `app` nos seletores.
- `no-floating-promises` e `no-misused-promises` são erro. Navegação do router cujo resultado não importa vai com `void`.
- **350 linhas por arquivo** (`quality/max-lines`, copiada do Vibe Coding Toolkit): erro no código, aviso nos testes. Página grande separa template e estilo em `.html` e `.css`.
- Exceções pontuais, cada uma com o motivo no próprio código:
  - `Button` e `CategoryChip` são componentes de atributo (`button[appButton]`, `span[appCategoryChip]`) para manter o elemento nativo.
  - O fundo do `<dialog>` da aula fecha pelo clique; no teclado, o Esc nativo faz o mesmo.
- O que o lint não cobre (contraste, layout, movimento) é conferido no navegador e com as skills de design (veja [design.md](design.md)).
- `quality/no-direct-console` e `quality/no-direct-data-access` não se aplicam: o app não tem logger próprio nem cliente de banco.

## Adoção do lint (18/10/2026)

Medição antes de escolher as severidades, com 329 arquivos: 9,6 a 12,4 s e cerca de 875 MB de memória no Windows.

| Regra | Violações | O que foi feito |
|---|---|---|
| `@typescript-eslint/no-floating-promises` | 25, todas de navegação do router | `void` antes da chamada |
| `quality/max-lines` | 3 | `qr-code.ts` dividido (Reed-Solomon em `qr-reed-solomon.ts`); templates de `job-detail-page` e `admin-user-detail-page` em arquivos próprios |
| `@typescript-eslint/no-unused-vars` | 3 | 1 import removido; `ignoreRestSiblings` para `const { campo: _x, ...resto }` |
| `@angular-eslint/component-selector` | 2 | Exceção com motivo (componentes de atributo) |
| `no-useless-escape` | 1 | **Bug real:** o filtro de palavrões não achava frases com espaço. Corrigido, com teste de regressão |
| `no-useless-assignment` | 1 | Inicialização inútil removida |
| `template/click-events-have-key-events` e `interactive-supports-focus` | 1 + 1 | Exceção com motivo (fundo do `<dialog>`) |

Depois da adoção, o lint fica em zero problemas e todas as regras estão como erro. Nenhuma regra começou em aviso.

O Prettier (`.prettierrc`) não tem script: cerca de 340 arquivos estão fora do padrão dele (`npx prettier --check "src/**/*.{ts,html,css}"`, 18/10/2026). Formatar o código todo é uma decisão da equipe e deve vir num commit só de formatação.

## Estratégia de testes

- Componente, serviço ou utilitário novo ganha `*.spec.ts` ao lado. O comportamento é testado pelo que a pessoa vê e faz, não pela implementação.
- Correção de bug começa por um teste que falha e passa depois da correção.
- A regra do menu de baixo (3 a 5 itens) tem teste por layout; não a remova.
- Mudança visível também é conferida no navegador: celular (cerca de 375 px) e desktop, nos temas claro e escuro, com o console sem erros. O modo sem internet só funciona no build (`npm run build` servido como site estático); o `npm start` não registra o service worker.

## Dependências

- `npm audit` em 18/10/2026: zero avisos, depois do `npm audit fix` compatível que levou o `source-map-js` de 1.2.1 para 1.2.2.
- O npm 11 avisa sobre scripts de instalação não aprovados (`lmdb`, `msgpackr-extract`, dependências opcionais do build). O build passa sem eles. Aprovar esses scripts é uma decisão da equipe.

## Revisão depois de implementar

- O escopo da revisão segue o risco e o diff real: comportamento, regressões e testes, acessibilidade e experiência, segurança da sessão e contratos com a API.
- Mudança não trivial ganha revisão independente quando houver como fazê-la. Ela cobre a faixa exata de commits e o que está fora do commit, além dos componentes, serviços e testes afetados.
- Revisores só leem e devolvem cada achado com severidade, local, cenário de falha e evidência. Quem coordena confere os achados e remove duplicatas. As correções voltam para quem escreveu o código.
- Termina quando os achados relevantes estão resolvidos ou com destino explícito, as verificações afetadas passam e os riscos restantes estão registrados. Outra rodada só com evidência nova, risco aberto ou pedido explícito.
- Telas: `web-design-guidelines` e, para redesenho, `impeccable`. Sessão, token, cache sem internet e dados pessoais: `differential-review`.

## Revisão de segurança

Para uma revisão de linha de base do repositório inteiro ou de um diff exato, use o prompt 13 do toolkit. A fonte é `docs/prompts/13-security-review.md` em [soumatheusgomes/vibe-coding-toolkit](https://github.com/soumatheusgomes/vibe-coding-toolkit), na revisão `de66fe3`. O link abaixo é fixo nessa revisão, para o agente rodar exatamente o texto que foi revisado. Peça ao agente:

```text
Read https://raw.githubusercontent.com/soumatheusgomes/vibe-coding-toolkit/de66fe371a49f5a4d3b521759e5c401f390b6424/docs/prompts/13-security-review.md and execute the entire "Prompt" block in this repository. Use repository mode, preserve my current client/model/authentication, and save a redacted report outside the repository.
```

Para um diff, troque o modo por `Use diff mode, base=<ref>, head=<ref>, comparison=merge-base, dirty=exclude`.

- A revisão só lê: não corrige, não instala, não faz checkout e não acessa o site publicado.
- O relatório fica fora do repositório, numa pasta pessoal, com o mínimo de evidência e sem segredos. Achados sensíveis não entram em issues públicas.
- Corrigir os achados é uma tarefa separada, com teste de regressão.
- Uma revisão sem achados não prova que o projeto é seguro.

## Continuidade

Trabalho que atravessa sessões ganha um handoff no plano ou na tarefa que já existe:

- **Objetivo e aceite:** o resultado pedido e o critério observável.
- **Estado conferido:** a data, o commit e as mudanças locais.
- **Feito:** o que mudou e onde.
- **Evidência:** os comandos e resultados, com data, incluindo o que falhou e o que não rodou.
- **Falta:** a próxima ação, as dependências e os riscos.
- **Bloqueios:** a causa, o que depende dele e a condição para retomar.
- **Recursos:** processos, portas e pastas temporárias que ainda precisam de limpeza.

O handoff é contexto, não prova. Antes de retomar, confira arquivos, git, verificações e processos.

## Manutenção

Mudou um script, uma regra ou uma verificação? Atualize este documento na mesma mudança. As verificações são comandos explícitos: não há hook do git nem bloqueio de branch.
