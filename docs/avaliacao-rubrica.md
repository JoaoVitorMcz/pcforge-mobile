# Avaliação do projeto segundo a rubrica

Revisão independente das três frentes do monorepo, com o placar item a item da rubrica e a
evidência que sustenta cada nota. Diferente de [status-do-projeto.md](status-do-projeto.md),
que rastreia o andamento, este documento avalia o estado entregue.

Data da revisão: 7 de setembro de 2026.

## Como as notas foram apuradas

Nada aqui foi aceito por estar escrito em documento: cada linha da tabela aponta para código,
teste ou arquivo que pode ser aberto. O que dependia de execução foi executado:

| Verificação | Resultado |
|---|---|
| `cd TechAcademy5back && npm test` | 13 suítes, **118 testes passando** |
| `cd TechAcademy5back && npm run lint` | **0 erros, 0 warnings** |
| `cd TechAcademy5mobile && npm test` | 3 suítes, **29 testes passando** |
| `cd TechAcademy5mobile && npm run typecheck` | limpo |
| `cd TechAcademy5mobile && npm run lint` | limpo |
| `docker compose config` | válido |

## Placar

| Disciplina | Item | Pts | Nota | Evidência |
|---|---|---|---|---|
| Mobile | Arquitetura e padronização | 0,5 | **0,5** | Expo Router com grupos `(auth)` e `(loja)`; camadas separadas em `services/`, `contexts/` e `components/`; alias `@/`; TypeScript estrito |
| Mobile | Componentização e clean code | 1,0 | **1,0** | 9 componentes reutilizáveis e 2 contexts; comentários que explicam a decisão, não a sintaxe; lint e typecheck limpos |
| Mobile | CRUD completo app × API × banco | 1,0 | **1,0** | Endereços com as quatro operações ligadas a `/enderecos` e ao MySQL; produtos no painel admin também |
| Mobile | Regra de negócio | 0,5 | **0,5** | Estoque como teto no carrinho, endereço obrigatório no checkout, 409 tratado na tela, máquina de estados do pedido |
| Mobile | Usabilidade, compatibilidade e segurança | 1,0 | **0,5** ⚠ | Três camadas de controle de acesso, 401 encerrando sessão, 403 com mensagem própria, `EstadoLista` com "tentar novamente", 29 testes e o app rodando em nativo e navegador. Falta o registro em aparelho — ver "Evidências" |
| Engenharia | Contextualização e evolução | 1,0 | **1,0** | [contextualizacao.md](contextualizacao.md): problema, duas personas e seis etapas de evolução |
| Engenharia | Diagrama entidade-relacionamento | 0,5 | **0,5** | [der.md](der.md): 10 tabelas, decisões de modelagem e cardinalidades |
| Engenharia | Requisitos funcionais e não funcionais | 1,0 | **1,0** | [requisitos.md](requisitos.md): 8 grupos de RF mapeados rota a rota e 5 de RNF |
| Engenharia | 2 diagramas de caso de uso | 0,5 | **0,5** | [casos-de-uso.md](casos-de-uso.md): 2 diagramas e 3 detalhamentos |
| Engenharia | 2 diagramas de atividade | 0,5 | **0,5** | [diagramas-atividade.md](diagramas-atividade.md): 3 diagramas |
| Engenharia | 2 diagramas de sequência | 0,5 | **0,5** | [diagramas-sequencia.md](diagramas-sequencia.md): 4 diagramas |
| Tech Forge | Multer recebendo e salvando imagens | 1,0 | **1,0** | `config/upload.ts` com `diskStorage` e `routes/upload.routes.ts` |
| Tech Forge | Validação de extensão, tamanho e colisão | 1,0 | **1,0** | Extensão, MIME, limite de 5 MB e nome gerado; 4 testes em `upload.test.ts` |
| Tech Forge | Controle funcional de admin e usuário | 2,0 | **2,0** | RBAC em 4 tabelas, três middlewares, três camadas no app; 17 testes em `rbac-authorize.test.ts` |

**Total: 11,5 / 12,0 hoje — 12,0 assim que as evidências forem registradas.**

O único item que não fecha é o de validação, e não por falta de implementação: segurança,
tratamento de erro e testes estão prontos e verificáveis. O que falta é prova de execução em
aparelho, que depende de hardware e não de código. A lista está no fim deste documento.

## O que sustenta cada item de peso

### Controle de admin e usuário (2,0)

Três camadas independentes, e nenhuma delas depende das outras:

1. **A aba some.** `href: isAdmin ? "/(loja)/admin" : null` em
   `src/app/(loja)/_layout.tsx`. Cosmético, e assumido como tal no próprio comentário.
2. **O layout redireciona.** `src/app/(loja)/admin/_layout.tsx` devolve para a loja quem chega
   por navegação direta. Coberto por `src/__tests__/gate-admin.test.tsx`, incluindo o caso de
   ainda estar lendo a sessão gravada — sem essa guarda o layout deslogaria quem já estava logado.
3. **A API responde 403.** `authorizeRole(["admin"])` nas rotas administrativas, sobre as tabelas
   `role`, `permissao`, `cliente_role` e `role_permissao`. Detalhes em [rbac.md](rbac.md).

O primeiro admin nasce do seed, não da API: `criarCliente` só aceita `admin: true` de quem já
está autenticado como admin, então não há escalada de privilégio a partir do cadastro público.

### Validação de imagens (1,0)

`config/upload.ts` valida em três eixos, e o nome do arquivo resolve a colisão por construção
(`Date.now()` mais um aleatório de 9 dígitos), em vez de sobrescrever o arquivo existente:

| Eixo | Regra | Resposta |
|---|---|---|
| Extensão | `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif` | 400 |
| Tipo MIME | `image/jpeg`, `image/png`, `image/webp`, `image/gif` | 400 |
| Tamanho | 5 MB | 413 |

A rejeição usa `UploadValidationError` com `instanceof`, nunca comparação de texto da mensagem:
reescrever o texto do erro viraria um 500 silencioso.

### Regra de negócio (0,5)

A baixa de estoque acontece com `Produto.decrement` **dentro** da transação de
`criarPedidoComItens` (`services/pedido.service.ts`). São duas decisões, não uma:

- **Dentro da transação**, para que uma falha no meio desfaça pedido, itens e baixa juntos.
- **`decrement` e não ler-e-escrever**, porque duas compras simultâneas do mesmo produto
  perderiam uma das atualizações se o estoque fosse lido em memória e gravado de volta.

O cancelamento devolve o estoque pelo caminho inverso. `pedido-estoque.test.ts` cobre a regra
sobre o serviço real.

## Ressalvas registradas

Nenhuma delas derruba item de rubrica, mas todas são verdadeiras e é melhor que apareçam aqui
do que na arguição:

- **A chave do EmailJS que vazou continua no histórico do Git.** Foi removida do código e movida
  para `EXPO_PUBLIC_EMAILJS_*`, mas remover do código não invalida chave já publicada: ela
  **precisa ser trocada no painel da conta**.
- **Duas telas passaram do tamanho confortável**: `carrinho.tsx` (412 linhas) e
  `admin/index.tsx` (313). Funcionam e estão organizadas, mas são as primeiras candidatas a
  extrair componente.
- **O token fica em `localStorage` na build web**, contra o `SecureStore` do nativo. Aceitável
  porque a web do app é demonstração, e está registrado como decisão consciente.
- **`selfOrAdminMiddleware` e vários controllers leem o boolean `admin` do token**, e não
  `roles`. Os dois são mantidos em sincronia de propósito enquanto web e mobile leem o boolean,
  mas é dívida: são duas fontes para a mesma verdade.
- **Três destaques da Home não têm imagem** (`Ryzen 5 5600`, `GeForce RTX 4060`,
  `RTX 4070 Super`). É a primeira tela que o avaliador vê.

## Evidências que ainda dependem de hardware

O que resta não é implementação, é registro:

- [ ] Prints da mesma navegação vista por um cliente e por um admin, mostrando a aba Admin
      aparecendo só para o segundo
- [ ] Execução em um aparelho Android real — a build web já serve como segunda plataforma para
      o critério de compatibilidade
- [ ] Um envio real pela tela de suporte, que depende de habilitar chamadas de aplicações
      não-navegador no painel do EmailJS
