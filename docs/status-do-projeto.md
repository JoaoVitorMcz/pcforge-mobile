# Status do projeto

Rastreamento de andamento da sprint: o que já fecha rubrica, o que falta, e por que as
decisões foram tomadas assim.

> **Este arquivo não é a entrega de Engenharia de Software.** Ela são os seis documentos da
> Fase D, listados abaixo — este aqui só rastreia o andamento. Não marque aqueles itens da
> rubrica como prontos por causa deste documento.

Última atualização: fim da Fase M1, o RBAC do backend e a base web do app (Fase M1.5).

## Placar da rubrica

| Disciplina | Item | Pts | Estado |
|---|---|---|---|
| Tech Forge | Multer recebendo e salvando imagens | 1,0 | ✅ |
| Tech Forge | Validação de extensão, tamanho e colisão de nomes | 1,0 | ✅ |
| Tech Forge | Controle funcional de usuário admin e usuário | 2,0 | 🟡 |
| Mobile | Arquitetura e padronização de projeto | 0,5 | ✅ |
| Mobile | Componentização e boas práticas (clean code) | 1,0 | ✅ |
| Mobile | CRUD completo: aplicativo × API × banco | 1,0 | ✅ |
| Mobile | Regra de negócio respeitada entre funcionalidades | 0,5 | 🟡 |
| Mobile | Usabilidade, compatibilidade entre dispositivos e segurança | 1,0 | ❌ |
| Engenharia | Contextualização e evolução do produto | 1,0 | ✅ |
| Engenharia | Diagrama entidade-relacionamento | 0,5 | ✅ |
| Engenharia | Requisitos funcionais e não funcionais | 1,0 | ✅ |
| Engenharia | 2 diagramas de caso de uso | 0,5 | ✅ |
| Engenharia | 2 diagramas de atividade | 0,5 | ✅ |
| Engenharia | 2 diagramas de sequência | 0,5 | ✅ |

**Total: 8,5 / 12,0**

Sobre os dois itens parciais:

- **Controle admin × usuário (2,0)** — backend, web e app já implementam, agora sobre RBAC
  com papéis e permissões ([docs/rbac.md](rbac.md)). Falta a demonstração de ponta a ponta
  e as evidências, previstas na Fase M2.
- **Regra de negócio (0,5)** — validação de formulário feita (CPF, e-mail, senha forte,
  campos obrigatórios de endereço). Faltam as regras de compra: estoque e checkout.

## Fases

### M1 — fundação do app · concluída

- Seed idempotente do banco (`TechAcademy5back/src/scripts/seed.ts`)
- `GET /admin/dashboard`, restrito a admin, com agregações de pedidos e estoque
- App Expo com Expo Router: login, cadastro, catálogo, perfil e dashboard do admin
- CRUD completo de endereços no app

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

### M2 — carrinho e pedidos

Fecha 0,5 de regra de negócio e os 2,0 de controle de acesso.

- [ ] Contexto de carrinho no app, portando `TechAcademy5front/src/context/CarrinhoContext.jsx`
- [ ] Tela de carrinho sobre `/itens-pedido`: adicionar, alterar quantidade, remover
- [ ] Checkout criando pedido via `POST /pedidos`, exigindo endereço cadastrado
- [ ] "Meus pedidos" com `GET /pedidos/cliente/:id` e cancelamento
- [ ] Regras de negócio: bloquear compra sem estoque, sem endereço e sem login
- [ ] Demonstração de ponta do controle de acesso: a mesma navegação vista por um
      cliente e por um admin

### M3 — validação e evidências

Fecha 1,0 de usabilidade, compatibilidade e segurança. A M1.5 adiantou parte disto, mas
**nenhum item fechou sozinho**:

- [ ] Rodar em Android e em um segundo aparelho ou emulador, registrando prints
      — a build web já dá uma segunda plataforma, faltam os prints e um aparelho real
- [ ] Tratar 401 com logout automático e 403 com mensagem clara
      — o login já distingue 401; falta o logout automático quando **qualquer outra**
      chamada devolver 401, e a mensagem dedicada de 403
- [x] Tratar falha de rede sem travar a tela — login trata `TypeError` de conexão e as
      listas usam `EstadoLista` com "Tentar novamente"
- [ ] Conferir que o token nunca aparece em log

### D — documentação de Engenharia · concluída

**4,0 pontos, o mesmo peso do app mobile inteiro.** Saíram dos models e das rotas que já
existiam, sem depender das outras fases.

- [x] [contextualizacao.md](contextualizacao.md) — problema, duas personas e as cinco etapas
      da evolução web → web + mobile + navegador
- [x] [der.md](der.md) — ER das 10 tabelas (6 do domínio + 4 do RBAC), com as decisões de
      modelagem e a tabela de cardinalidades
- [x] [requisitos.md](requisitos.md) — 8 grupos de requisitos funcionais mapeados rota a rota,
      com o nível de acesso de cada uma, e 5 grupos de não funcionais
- [x] [casos-de-uso.md](casos-de-uso.md) — cliente compra pelo app; admin gerencia a loja
- [x] [diagramas-atividade.md](diagramas-atividade.md) — checkout; upload com validação
- [x] [diagramas-sequencia.md](diagramas-sequencia.md) — login com JWT + RBAC; criar pedido
      App → API → MySQL

Todos em Markdown com Mermaid, que o GitHub renderiza direto. Os blocos foram validados com
`@mermaid-js/mermaid-cli`, então nenhum diagrama depende de o avaliador ter ferramenta extra.
Se o professor exigir imagem, `mmdc` exporta para PNG sem retrabalho.

## Decisões de arquitetura

- **O app mobile lê, a web escreve.** A criação e edição de produtos continua só na web,
  sem duplicar telas complexas de CRUD em duas plataformas; o app expõe ao admin o
  dashboard e consultas **somente leitura** de produtos e clientes. Substitui a regra
  anterior ("o app expõe só o dashboard"), que a M1.5 passou a contradizer.
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
- **`main` desatualizada.** Está 11 commits atrás da `dev`, e a distância cresce a cada
  entrega. **Não há merge a resolver**:
  depois de `bceb4e0` a `main` virou ancestral da `dev`, então atualizar é um
  fast-forward de risco zero.
  O que continua valendo é o estado do conteúdo dela hoje: sem CORS, com o teste de
  upload que apaga `uploads/` real e com `MYSQL_USER=root` no `.env.example` — ou seja,
  quem clonar a `main` não consegue nem subir o banco. Foi decisão consciente aguardar
  alinhamento da dupla, mas não deve ir para a entrega assim.
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
