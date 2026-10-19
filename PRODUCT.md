# Ruraliza — Frontend (produto)

Este documento diz o que o app entrega e quais limites ele tem hoje. Uso, telas e fluxo de teste estão no [README](README.md); código em [docs/architecture.md](docs/architecture.md); visual em [docs/design.md](docs/design.md). O backend tem o próprio [PRODUCT.md](../ruraliza-backend/PRODUCT.md) (o mesmo produto, visto pela API). Onde algo é suposição e não fato observado no repositório, o texto avisa.

## Problema e objetivo

O Ruraliza (AgTech) conecta produtores rurais a trabalhadores, prestadores de serviço e estudantes, para contratar serviços operacionais nas fazendas. Este repositório é o app web (Angular) que sustenta o caminho completo: publicar a vaga, candidatar-se, aceitar, conversar, pagar (simulado) e avaliar, mais trilhas de estudo com certificado e a segurança da plataforma (verificação, denúncias). O app é instalável (PWA).

## Quem usa

- **Produtor** (`/produtor`): cadastra fazendas, publica e gerencia serviços, analisa candidatos, libera o pagamento e avalia o trabalhador.
- **Trabalhador, prestador ou estudante** (`/trabalhador`): busca e recebe recomendações de vagas, se candidata, conversa, estuda trilhas, recebe certificados e avalia a fazenda.
- **Conta com os dois perfis:** a mesma pessoa troca de painel pela página de perfil.
- **Equipe** (`/sistema`, sem cadastro público): **Administrador** (usuários, equipe, trilhas, ajuda, patrocínios, moderação) e **Tutor** (trilhas de que é tutor). O cargo define o menu.
- **Visitante:** landing, termos, privacidade, ajuda, créditos e validação pública de certificados.

## Telas implementadas

Rotas reais em `src/app/app.routes.ts` e nos `*.routes.ts` de cada feature. O passo a passo de teste está no [README](README.md#fluxo-de-teste).

- **Público:** landing com montador de vaga, cadastro (com aceite dos termos), entrar, esqueci/nova senha, `/certificados/:code`, `/termos`, `/privacidade`, `/ajuda`, `/creditos`.
- **Produtor:** início, fazendas (fotos e mapa), serviços (abas, busca, filtros na URL), novo serviço em 2 passos, detalhe com candidatos, conversas, notificações, ajuda, perfil.
- **Trabalhador:** início, vagas e vagas para você, detalhe da vaga, candidaturas, conversas, trilhas e player de aulas, certificados, notificações, ajuda, perfil.
- **Sistema:** usuários, equipe, trilhas (editor), moderação, patrocínios, ajuda, perfil.
- **Transversais:** avaliação dupla e cega, conversa com WhatsApp protegido, tempo real por SSE, push, modo sem internet, tema/letras maiores/alto contraste.

## Restrições

Fatos observados:

- **Celular primeiro e uso no campo:** sinal fraco, sol forte. Daí o modo sem internet, o alto contraste e os campos de 16 px.
- **Menu de baixo de 3 a 5 destinos**, ação principal no meio (`MAX_BOTTOM_NAV_ITEMS`).
- **Tudo em português do Brasil** (rotas, textos, datas no horário de Brasília). Nomes de componentes em inglês.
- **Backend com dados em memória, por decisão da equipe** (sem banco por ora): tudo some quando ele reinicia.
- **Sessão em `sessionStorage`:** vale enquanto a aba está aberta. Reabrir o app sem sinal pede para entrar de novo.
- **Pagamento é simulado** e **e-mail não existe**: a API nunca devolve o código de redefinição, então em produção o "esqueci a senha" não tem como concluir (`TODO(email)`); em desenvolvimento, o código sai no terminal da API.
- Os guards só evitam abrir telas sem sessão; quem protege os dados é a API.

## Fora do escopo (hoje)

Pagamento real, envio de e-mail, banco de dados e fotos em bucket (backend), assinatura digital dos certificados, app nativo, tradução para outros idiomas e a nova identidade visual (só há direção, ver [docs/design.md](docs/design.md#redesign-planejado)).

## Decisões pendentes

- **Onde fica a sessão:** `sessionStorage` (hoje) ou o aparelho (`localStorage`). O custo de hoje é pedir login de novo ao reabrir o app, inclusive pelo clique numa notificação push. Impacto: modo sem internet e push. Próximo passo: a equipe decide, incluindo a validade do token na API.
- **Revisão jurídica** dos Termos e da Política (informada pela equipe; não há registro dela no repositório). Os textos são base para teste e não trazem razão social, CNPJ nem encarregado de dados.
- **E-mail ainda inexistente:** a segunda tela da recuperação de senha passará a pedir o código quando houver envio.
- **Emojis do Facebook em `public/emoji/`:** o pacote de origem avisa que a licença não é clara. Trocar por Twemoji ou Noto antes do lançamento é decisão da equipe.
- Suposição: a ordem dessas decisões ainda não foi definida.

## Critérios de aceite

Produto, com o teste existente (`npm test`) quando há:

| Resultado observável | Evidência |
|---|---|
| Menu de baixo de cada área cabe em 5 itens com a ação no meio | `farmer-layout.spec.ts`, `worker-layout.spec.ts`, `system-layout.spec.ts` |
| Token da conta vai nas rotas do app e o da equipe nas de `/admin`; 401 de sessão sai e volta ao login, 401 de senha errada não | `core/http/auth.interceptor.spec.ts` |
| Visitante vai para o login; conta sem o outro perfil vai à página que o cria | `core/session/require-role.guard.spec.ts`, `require-system.guard.spec.ts` |
| Prazo da vaga conta o dia de Brasília, não o UTC | `shared/domain/utils/expiry.spec.ts` |
| Senha de 8 a 128 caracteres; confirmação diferente é recusada | `shared/utils/password.spec.ts` |
| Telefone e e-mail digitados na conversa são detectados antes do envio | `shared/domain/utils/chat.spec.ts` |
| Ação feita sem sinal fica na fila, sai em ordem quando a rede volta e é descartada se a API recusar | `core/offline/offline-queue.service.spec.ts` |
| Um stream SSE por perfil, reconexão avisa a tela, página no cache de voltar/avançar fecha a conexão | `core/api/live-updates.service.spec.ts` |
| Tema, letras maiores e alto contraste valem na hora e ficam salvos na conta | `core/preferences/preferences.service.spec.ts` |
| Certificado confere o resumo SHA-256 e avisa quando os dados não batem | `certificate-validation-page.spec.ts`, `certificate-hash.spec.ts` |

Sem teste automatizado (conferir à mão com o fluxo do README): publicar em 2 passos, candidatar e aceitar, avaliação cega, filtros na URL, instalar o app. Técnico: `npm test` e `npm run build` passam (ver [docs/onboarding.md](docs/onboarding.md)).

## Próxima entrega

Suposição: decidir a sessão (`sessionStorage` x aparelho) e a revisão jurídica, que destravam o lançamento. A frente de design (redesign) está em planejamento, sem tarefa aberta.

## Manutenção

Atualize este documento quando mudar o objetivo, o escopo, as restrições ou os critérios de aceite, e junto do PRODUCT.md do backend quando o contrato mudar.
