# Status do projeto

Rastreamento de andamento da sprint: o que já fecha rubrica, o que falta, e por que as
decisões foram tomadas assim.

> **Este arquivo não é a entrega de Engenharia de Software.** Ela são os seis documentos da
> Fase D, listados abaixo — este aqui só rastreia o andamento. Não marque aqueles itens da
> rubrica como prontos por causa deste documento.

Última atualização: o app virou o painel administrativo (Fase P), com as correções da auditoria.

## Placar da rubrica

| Disciplina | Item | Pts | Estado |
|---|---|---|---|
| Tech Forge | Multer recebendo e salvando imagens | 1,0 | ✅ |
| Tech Forge | Validação de extensão, tamanho e colisão de nomes | 1,0 | ✅ |
| Tech Forge | Controle funcional de usuário admin e usuário | 2,0 | ✅ |
| Mobile | Arquitetura e padronização de projeto | 0,5 | ✅ |
| Mobile | Componentização e boas práticas (clean code) | 1,0 | ✅ |
| Mobile | CRUD completo: aplicativo × API × banco | 1,0 | ✅ |
| Mobile | Regra de negócio respeitada entre funcionalidades | 0,5 | ✅ |
| Mobile | Usabilidade, compatibilidade entre dispositivos e segurança | 1,0 | ❌ |
| Engenharia | Contextualização e evolução do produto | 1,0 | ✅ |
| Engenharia | Diagrama entidade-relacionamento | 0,5 | ✅ |
| Engenharia | Requisitos funcionais e não funcionais | 1,0 | ✅ |
| Engenharia | 2 diagramas de caso de uso | 0,5 | ✅ |
| Engenharia | 2 diagramas de atividade | 0,5 | ✅ |
| Engenharia | 2 diagramas de sequência | 0,5 | ✅ |

**Total: 11,0 / 12,0**

O único item em aberto é **usabilidade, compatibilidade e segurança (1,0)**, da Fase M3: falta
rodar num aparelho real, registrar as evidências e tratar 401 fora do login.

O que fechou nesta fase:

- **Controle admin × usuário (2,0)** — o app inteiro é restrito: o login recusa quem não é
  admin antes de gravar a sessão, o layout do painel redireciona quem chega por deep link e a
  API responde 403. `authorizePermission` passou a valer em rotas reais, então as tabelas
  `permissao` e `role_permissao` sustentam decisão ([rbac.md](rbac.md)).
- **CRUD completo (1,0)** — passou a ser o de **Produtos**, no painel. O de Endereços saiu
  junto com as telas de cliente.
- **Regra de negócio (0,5)** — validação do formulário de produto (preço maior que zero,
  estoque inteiro e não negativo), máquina de estados do pedido e, no backend, a baixa e a
  devolução de estoque, que **não existiam**.

## Fases

### M1 — fundação do app · concluída

- Seed idempotente do banco (`TechAcademy5back/src/scripts/seed.ts`)
- `GET /admin/dashboard`, restrito a admin, com agregações de pedidos e estoque
- App Expo com Expo Router: login, cadastro, catálogo, perfil e dashboard do admin
- CRUD completo de endereços no app

> As telas de cliente desta fase (cadastro, catálogo, perfil, endereços) foram **removidas na
> Fase P**, quando o app virou painel administrativo. O CRUD da rubrica passou a ser o de
> produtos.

### M1.5 — base web do app · concluída

Trabalho do Henrique, commit `9d77847`. O app Expo passou a rodar também no navegador:

- `react-native-web` + `react-dom`, com o app servido como página
- Sessão por plataforma: `SecureStore` no nativo, `localStorage` na build web
  (`SecureStore` encosta no Keychain/Keystore, que não existem no browser)
- `services/config.ts` deduz a API pelo hostname do navegador, tratando `pcforge.local`
- Login com validação por campo, mensagem específica para 401 e para falha de conexão
- Três telas administrativas **somente leitura**: produtos, clientes e configurações
- Dashboard virou hub, com atalhos para as telas novas
- 26 imagens de produto renomeadas para ASCII e servidas ao container da web por volume

Correções aplicadas depois, na `fix/regressoes-base-mobile`: as quatro telas admin vieram
com componentes e `StyleSheet` inteiros em uma única linha e foram reformatadas; o dashboard
tinha perdido faturamento, total de pedidos e o painel de pedidos por status, todos
restaurados; o `tsconfig.json` tinha perdido `.expo/types` do `include`; e as 26 imagens
antigas com espaço e acento no nome ficaram duplicadas com as novas — foram removidas, o
`placeholder.png` que faltava foi criado e o seed passou a preencher `imagem`.

### P — o app vira o painel administrativo · concluída

Mudança de escopo: o aplicativo é **exclusivamente para administradores**. A compra fica na
loja web, então saíram cadastro, vitrine, perfil e o CRUD de endereços. `(loja)/admin/*`
achatou para o grupo `(painel)/*` e a guarda de admin subiu para o layout do grupo.

- [x] CRUD de produtos no app: criar, editar e desativar, com formulário compartilhado
- [x] Upload de imagem pela galeria do aparelho (`expo-image-picker`)
- [x] Gestão de pedidos: lista com filtro por status e detalhe com mudança de status
- [x] Login recusa quem não é admin, antes de gravar a sessão
- [x] Limpeza dos órfãos: `services/enderecos.ts`, `ProdutoCard`, validações de CPF e CEP

**Auditoria das fases anteriores.** Nove problemas encontrados e corrigidos:

| # | Problema | Correção |
|---|---|---|
| 1 | Os PRs foram para a `main`, não para a `dev` | `dev` alinhada por fast-forward |
| 2 | **Estoque nunca era baixado** — 1 unidade vendia infinitas vezes | Débito na transação e devolução no cancelamento |
| 3 | **Só o seed escrevia em `cliente_role`** — cadastro pela API ficava sem permissões | `criarCliente` vincula o papel; seed corrige o retroativo |
| 4 | `itempedido` não validava estoque | Ajuste pela diferença de quantidade |
| 5 | Status de pedido sem máquina de estados: `entregue` voltava a `pendente` | Transições validadas, com 409 |
| 6 | A regra de estoque não tinha teste | `pedido-estoque.test.ts`, sobre o serviço real |
| 7 | Os diagramas descreviam baixa de estoque inexistente, e 400 onde era 409 | Corrigidos, e agora verdadeiros |
| 8 | `authorizePermission` e `adminMiddleware` eram código morto | O primeiro entrou em rotas reais; o segundo saiu |
| 9 | `models/index.js` e `config/config.js`, scaffolding do sequelize-cli | Removidos |

O item 2 é o mais grave: era a regra de negócio que a rubrica cobra, e não existia.

### M3 — validação e evidências

Único item de rubrica em aberto: **1,0 de usabilidade, compatibilidade e segurança**. É a fase
que falta.

- [ ] Rodar em Android e em um segundo aparelho ou emulador, registrando prints
      — a build web já dá uma segunda plataforma, faltam os prints e um aparelho real
- [ ] Tratar 401 com logout automático e 403 com mensagem clara
      — o login já distingue 401; falta o logout automático quando **qualquer outra**
      chamada devolver 401, e a mensagem dedicada de 403
- [x] Tratar falha de rede sem travar a tela — login trata `TypeError` de conexão e as
      listas usam `EstadoLista` com "Tentar novamente"
- [ ] Conferir que o token nunca aparece em log
- [ ] **Evidências do controle de acesso**: a mesma navegação vista por um admin e por um
      cliente, mostrando que o cliente nem passa do login

### D — documentação de Engenharia · concluída

**4,0 pontos, o mesmo peso do app mobile inteiro.** Saíram dos models e das rotas que já
existiam, sem depender das outras fases.

- [x] [contextualizacao.md](contextualizacao.md) — problema, as duas personas com a sua
      plataforma, e as seis etapas da evolução até o app virar painel
- [x] [der.md](der.md) — ER das 10 tabelas (6 do domínio + 4 do RBAC), com as decisões de
      modelagem e a tabela de cardinalidades
- [x] [requisitos.md](requisitos.md) — 8 grupos de requisitos funcionais mapeados rota a rota,
      com o nível de acesso e **a plataforma** de cada um, e 5 grupos de não funcionais
- [x] [casos-de-uso.md](casos-de-uso.md) — cliente compra na web; admin opera pelo app
- [x] [diagramas-atividade.md](diagramas-atividade.md) — checkout; cancelamento com devolução
      de estoque; upload com validação
- [x] [diagramas-sequencia.md](diagramas-sequencia.md) — login com JWT + RBAC; criar pedido
      Web → API → MySQL; admin muda o status pelo app

Todos em Markdown com Mermaid, que o GitHub renderiza direto. Os blocos foram validados com
`@mermaid-js/mermaid-cli`, então nenhum diagrama depende de o avaliador ter ferramenta extra.
Se o professor exigir imagem, `mmdc` exporta para PNG sem retrabalho.

## Decisões de arquitetura

- **A web atende o cliente; o app administra a loja.** Cada plataforma serve uma persona, e
  nenhuma regra de negócio vive em duas. Substitui as duas regras anteriores ("o app expõe só
  o dashboard" e "o app lê, a web escreve"): duplicar a jornada de compra dava o mesmo
  trabalho duas vezes e não resolvia o problema de quem **opera** a loja e precisa fazer isso
  longe do computador — o estoque acaba no depósito, não no escritório.
- **O app roda em nativo e no navegador a partir do mesmo código.** `react-native-web`
  dá uma segunda plataforma para a demonstração sem manter dois projetos. O custo é a
  sessão precisar de dois back-ends de armazenamento — daí o `localStorage` na web.
- **Expo Router com grupos de rota.** Torna o gate de admin declarativo: a área
  administrativa tem seu próprio layout com redirect, em vez de condicionais espalhadas
  pelas telas.
- **Controle de acesso em três camadas independentes.** A aba some para o cliente comum;
  o layout da área admin redireciona quem chega por navegação direta; a API responde 403
  pelo `authorizeRole`. Esconder a aba, sozinho, não é proteção.
- **RBAC com papéis e permissões, não um boolean.** As tabelas `role`, `permissao`,
  `cliente_role` e `role_permissao` seguem o modelo clássico, e `authorizeRole([...])` é
  uma função de ordem superior: cada rota declara quais papéis aceita. O boolean `admin`
  continua espelhado no token porque web e mobile leem esse campo — trocar as três camadas
  de uma vez seria risco sem ganho. Detalhes em [docs/rbac.md](rbac.md).
- **O CRUD da rubrica é o de Endereços.** É o mais limpo de demonstrar (quatro operações
  óbvias) e as rotas já existiam no backend.
- **A URL da API é deduzida do host do dev server do Expo.** O app funciona na máquina de
  qualquer pessoa da dupla sem ninguém editar arquivo.
- **Monorepo com os três projetos lado a lado.** Mantém `docker-compose.yml`, `.env` e CI
  centralizados, e preserva o histórico da evolução do produto.
- **O primeiro admin nasce do seed, não da API.** `criarCliente` só permite marcar
  `admin: true` para quem já está autenticado como admin, então não há como sair do zero
  pela API.

## Pendências abertas

- **Bloco de E2E em `.husky/pre-push` (linhas 13-20).** Remover: o E2E roda no CI, então
  não se perde cobertura, e o hook trava o push enquanto espera o dev server do CRA
  subir.
- **Os PRs vão para a `main` por engano.** O GitHub sugere `main` como base porque é o branch
  padrão do repositório, e foi para lá que a última leva foi. A `dev` já foi alinhada por
  fast-forward, mas **é preciso trocar a base para `dev` a cada PR** — ou mudar o branch
  padrão do repositório no GitHub, que resolve de vez.

- **O boolean `admin` convive com o RBAC.** O token carrega `roles` e `admin` ao mesmo
  tempo, e `extrairRoles` deriva um do outro nos dois sentidos. É proposital: web e mobile
  ainda leem `admin`. Remover o boolean quando as duas pontas passarem a ler `roles` —
  enquanto os dois existirem, os dois precisam concordar.
- **O token fica em `localStorage` na build web.** Qualquer script da página consegue lê-lo,
  ao contrário do `SecureStore` usado no nativo. É aceitável porque a web do app é só
  demonstração e o entregável avaliado é o nativo — mas não deve virar o caminho padrão.
- **Push direto na `dev` no commit `9d77847`.** O fluxo desta seção pede uma branch por
  tarefa integrando de volta na `dev`. Um commit squashed sem corpo também dificulta
  revisar e reverter em partes. Combinar com a dupla antes da próxima entrega.
- **A cópia da máquina de estados no app pode divergir do backend.** `TRANSICOES` em
  `services/pedidos.ts` espelha `TRANSICOES_DE_STATUS` do controller. É proposital — a tela
  só oferece o que a API aceita — mas mudar um lado exige mudar o outro. A API continua sendo
  quem decide, então a divergência causa botão a mais ou a menos, nunca dado errado.
- **Acesso do celular pela LAN nunca testado num aparelho real.** O bundle compila e a
  API responde pelo IP da máquina, mas ninguém abriu o app em um telefone. Se não
  conectar, o primeiro suspeito é o firewall: o Wi-Fi está no perfil **Público**, onde o
  Windows bloqueia conexões de entrada por padrão — não o código.

## Fluxo de trabalho da dupla

- Ramificar **sempre da `dev`**, nunca da `main`
- `git pull` antes de começar qualquer tarefa
- Uma branch por tarefa, integrando de volta na `dev`
- Antes de abrir uma branch, conferir aqui o que já está feito

Ramificar da `main` ou de uma cópia local desatualizada produz trabalho duplicado e
conflito em arquivos que já haviam sido corrigidos.
