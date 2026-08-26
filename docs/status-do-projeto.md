# Status do projeto

Rastreamento de andamento da sprint: o que já fecha rubrica, o que falta, e por que as
decisões foram tomadas assim.

> **Este arquivo não é a entrega de Engenharia de Software.** Contextualização, DER,
> requisitos e diagramas são artefatos separados, listados na Fase D como pendentes.
> Não marque aquele item da rubrica como pronto por causa deste documento.

Última atualização: fim da Fase M1.

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
| Engenharia | Contextualização e evolução do produto | 1,0 | ❌ |
| Engenharia | Diagrama entidade-relacionamento | 0,5 | ❌ |
| Engenharia | Requisitos funcionais e não funcionais | 1,0 | ❌ |
| Engenharia | 2 diagramas de caso de uso | 0,5 | ❌ |
| Engenharia | 2 diagramas de atividade | 0,5 | ❌ |
| Engenharia | 2 diagramas de sequência | 0,5 | ❌ |

**Total: 4,5 / 12,0**

Sobre os dois itens parciais:

- **Controle admin × usuário (2,0)** — backend, web e app já implementam. Falta a
  demonstração de ponta a ponta e as evidências, previstas na Fase M2.
- **Regra de negócio (0,5)** — validação de formulário feita (CPF, e-mail, senha forte,
  campos obrigatórios de endereço). Faltam as regras de compra: estoque e checkout.

## Fases

### M1 — fundação do app · concluída

- Seed idempotente do banco (`TechAcademy5back/src/scripts/seed.ts`)
- `GET /admin/dashboard`, restrito a admin, com agregações de pedidos e estoque
- App Expo com Expo Router: login, cadastro, catálogo, perfil e dashboard do admin
- CRUD completo de endereços no app

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

Fecha 1,0 de usabilidade, compatibilidade e segurança.

- [ ] Rodar em Android e em um segundo aparelho ou emulador, registrando prints
- [ ] Tratar 401 com logout automático e 403 com mensagem clara
- [ ] Tratar falha de rede sem travar a tela
- [ ] Conferir que o token nunca aparece em log

### D — documentação de Engenharia · pode correr em paralelo

**4,0 pontos, o mesmo peso do app mobile inteiro, por uma fração do esforço:** o DER,
os requisitos e os diagramas saem dos models e das rotas que já existem. É o melhor
custo-benefício em aberto e não depende de nenhuma das fases acima.

- [ ] `docs/contextualizacao.md`: problema, persona e a evolução web → web + mobile
- [ ] `docs/der.png`: a partir de `Cliente`, `Produto`, `Categoria`, `Pedido`,
      `Itempedido` e `Endereco`
- [ ] `docs/requisitos.md`: requisitos funcionais e não funcionais
- [ ] 2 diagramas de caso de uso — ex.: cliente compra pelo app; admin gerencia produtos na web
- [ ] 2 diagramas de atividade — ex.: fluxo de checkout; upload com validação de imagem
- [ ] 2 diagramas de sequência — ex.: login com JWT; criar pedido App → API → MySQL

## Decisões de arquitetura

- **A administração de produtos fica na web; o app mobile faz a jornada de compra e
  expõe só o dashboard ao admin.** Divide o trabalho da dupla sem duplicar telas
  complexas de CRUD em duas plataformas.
- **Expo Router com grupos de rota.** Torna o gate de admin declarativo: a área
  administrativa tem seu próprio layout com redirect, em vez de condicionais espalhadas
  pelas telas.
- **Controle de acesso em três camadas independentes.** A aba some para o cliente comum;
  o layout da área admin redireciona quem chega por navegação direta; a API responde 403
  pelo `adminMiddleware`. Esconder a aba, sozinho, não é proteção.
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
- **`main` desatualizada.** Está 9 commits atrás da `dev`. **Não há merge a resolver**:
  depois de `bceb4e0` a `main` virou ancestral da `dev`, então atualizar é um
  fast-forward de risco zero.
  O que continua valendo é o estado do conteúdo dela hoje: sem CORS, com o teste de
  upload que apaga `uploads/` real e com `MYSQL_USER=root` no `.env.example` — ou seja,
  quem clonar a `main` não consegue nem subir o banco. Foi decisão consciente aguardar
  alinhamento da dupla, mas não deve ir para a entrega assim.
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
