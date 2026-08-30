# Requisitos funcionais e não funcionais

Levantados a partir do que a API expõe hoje em
[TechAcademy5back/src/routes/](../TechAcademy5back/src/routes/) e do que as duas aplicações
consomem. A coluna **Acesso** reproduz a cadeia de middlewares real de cada rota.

Legenda de acesso:

- **Público** — sem token
- **Autenticado** — exige `authMiddleware`
- **Dono ou admin** — `selfOrAdminMiddleware`, que compara o `id` da URL com o do token
- **Admin** — `authorizeRole(["admin"])`

## Requisitos funcionais

### RF-01 · Cadastro e autenticação

| ID | Requisito | Rota | Acesso |
|---|---|---|---|
| RF-01.1 | O sistema deve permitir cadastrar um cliente com nome, e-mail, senha e CPF | `POST /clientes` | Público |
| RF-01.2 | O sistema deve validar e-mail, CPF e força da senha no cadastro | — | — |
| RF-01.3 | O sistema deve recusar e-mail ou CPF já cadastrados, com **409** | `POST /clientes` | Público |
| RF-01.4 | O sistema deve autenticar por e-mail e senha, devolvendo um JWT com papéis e permissões | `POST /clientes/login` | Público |
| RF-01.5 | O sistema deve permitir consultar e editar o próprio perfil | `GET·PUT /clientes/:id` | Dono ou admin |
| RF-01.6 | O sistema deve permitir desativar um cliente sem apagar o histórico | `DELETE /clientes/:id` | Dono ou admin |
| RF-01.7 | O sistema deve listar todos os clientes para o administrador | `GET /clientes` | Admin |

O primeiro administrador nasce do [seed](../TechAcademy5back/src/scripts/seed.ts):
`criarCliente` só aceita `admin: true` de quem já está autenticado como admin, então não há
como escalar privilégio pela API.

### RF-02 · Catálogo

| ID | Requisito | Rota | Acesso |
|---|---|---|---|
| RF-02.1 | O sistema deve listar os produtos ativos, com paginação opcional | `GET /produtos` | Público |
| RF-02.2 | O sistema deve listar os produtos em destaque | `GET /produtos/destaque` | Público |
| RF-02.3 | O sistema deve buscar produtos por nome | `GET /produtos/buscar` | Público |
| RF-02.4 | O sistema deve exibir os detalhes de um produto | `GET /produtos/:id` | Público |
| RF-02.5 | O sistema deve permitir criar, editar e desativar produtos | `POST·PUT·DELETE /produtos` | Admin |
| RF-02.6 | O sistema deve listar e detalhar categorias | `GET /categorias`, `GET /categorias/:id` | Público |
| RF-02.7 | O sistema deve permitir criar, editar e excluir categorias | `POST·PUT·DELETE /categorias` | Admin |
| RF-02.8 | O sistema deve exibir o estoque disponível na vitrine | — | Público |

### RF-03 · Imagens de produto

| ID | Requisito | Rota | Acesso |
|---|---|---|---|
| RF-03.1 | O sistema deve receber e armazenar a imagem de um produto | `POST /upload/imagem` | Admin |
| RF-03.2 | O sistema deve aceitar apenas `.jpg`, `.jpeg`, `.png`, `.webp` e `.gif`, validando **extensão e tipo MIME**, e recusar com **400** | `POST /upload/imagem` | Admin |
| RF-03.3 | O sistema deve recusar arquivos acima de **5 MB**, com **413** | `POST /upload/imagem` | Admin |
| RF-03.4 | O sistema deve gerar o nome do arquivo no servidor, de modo que dois envios com o mesmo nome original não se sobrescrevam | — | — |
| RF-03.5 | O sistema deve exibir uma imagem padrão quando o produto não tiver foto | — | Público |

### RF-04 · Pedidos

| ID | Requisito | Rota | Acesso |
|---|---|---|---|
| RF-04.1 | O sistema deve permitir criar um pedido a partir do carrinho | `POST /pedidos` | Autenticado |
| RF-04.2 | O sistema deve exigir um endereço de entrega cadastrado para criar o pedido | — | Autenticado |
| RF-04.3 | O sistema deve registrar o preço unitário vigente no momento da compra | — | — |
| RF-04.4 | O sistema deve listar os pedidos de um cliente | `GET /pedidos/cliente/:id_cliente` | Dono ou admin |
| RF-04.5 | O sistema deve permitir ao cliente cancelar o próprio pedido | `PATCH /pedidos/:id/cancelar` | Autenticado |
| RF-04.6 | O sistema deve listar todos os pedidos para o administrador | `GET /pedidos` | Admin |
| RF-04.7 | O sistema deve permitir ao administrador alterar o status de um pedido | `PATCH /pedidos/:id/status` | Admin |
| RF-04.8 | O sistema deve permitir gerenciar os itens de um pedido | `GET·POST·PATCH·DELETE /itens-pedido` | Autenticado |

### RF-05 · Endereços

| ID | Requisito | Rota | Acesso |
|---|---|---|---|
| RF-05.1 | O sistema deve permitir cadastrar um endereço | `POST /enderecos` | Autenticado |
| RF-05.2 | O sistema deve listar os endereços de um cliente | `GET /enderecos/cliente/:id_cliente` | Dono ou admin |
| RF-05.3 | O sistema deve permitir editar e excluir um endereço | `PUT·DELETE /enderecos/:id` | Autenticado |
| RF-05.4 | O sistema deve listar todos os endereços para o administrador | `GET /enderecos` | Admin |

### RF-06 · Painel administrativo

| ID | Requisito | Rota | Acesso |
|---|---|---|---|
| RF-06.1 | O sistema deve apresentar faturamento e total de pedidos | `GET /admin/dashboard` | Admin |
| RF-06.2 | O sistema deve apresentar a contagem de pedidos por status | `GET /admin/dashboard` | Admin |
| RF-06.3 | O sistema deve apresentar o total de clientes e produtos ativos | `GET /admin/dashboard` | Admin |
| RF-06.4 | O sistema deve destacar os produtos com estoque baixo | `GET /admin/dashboard` | Admin |

### RF-07 · Pagamento

| ID | Requisito | Rota | Acesso |
|---|---|---|---|
| RF-07.1 | O sistema deve iniciar um checkout externo para o pedido | `POST /pagamentos/mercado-pago/checkout` | Autenticado |
| RF-07.2 | O sistema deve confirmar o pagamento e registrar a data | `POST /pagamentos/mercado-pago/confirmar` | Autenticado |

### RF-08 · Controle de acesso

| ID | Requisito | Evidência |
|---|---|---|
| RF-08.1 | O sistema deve recusar requisição sem token válido, com **401** | `authMiddleware` |
| RF-08.2 | O sistema deve recusar usuário autenticado sem o papel exigido, com **403** | `authorizeRole` |
| RF-08.3 | O sistema deve permitir que uma rota declare mais de um papel aceito | `authorizeRole(["admin","editor"])` |
| RF-08.4 | O sistema deve impedir que um cliente leia ou altere dados de outro | `selfOrAdminMiddleware` |
| RF-08.5 | O app deve esconder a área administrativa de quem não é admin, e redirecionar quem chegar por navegação direta | `(loja)/admin/_layout.tsx` |

Detalhamento em [rbac.md](rbac.md).

## Requisitos não funcionais

### RNF-01 · Segurança

| ID | Requisito | Como é atendido |
|---|---|---|
| RNF-01.1 | Senhas nunca podem ser armazenadas em texto puro | `bcrypt` com 10 rounds |
| RNF-01.2 | A senha nunca pode voltar em resposta da API | Desestruturação `{ senha: _senha, ...resto }` nos controllers |
| RNF-01.3 | A autenticação deve ser stateless, com token expirando em 1 dia | JWT `expiresIn: "1d"` |
| RNF-01.4 | O segredo do JWT deve vir de variável de ambiente, nunca do código | `getJwtSecret()` |
| RNF-01.5 | A autorização deve ser verificada no servidor, não só na interface | Três camadas independentes; esconder a aba não é proteção |
| RNF-01.6 | O tráfego web deve ser servido por HTTPS | Nginx como proxy reverso ([mkcert.md](mkcert.md)) |
| RNF-01.7 | O token deve ser guardado em armazenamento seguro no dispositivo | `expo-secure-store` no nativo; `localStorage` só na build web de demonstração |
| RNF-01.8 | O upload não pode aceitar arquivo executável disfarçado de imagem | Validação de extensão **e** MIME, com `UploadValidationError` |

### RNF-02 · Confiabilidade

| ID | Requisito | Como é atendido |
|---|---|---|
| RNF-02.1 | A API deve ter cobertura automatizada de testes | 106 testes, 12 suítes (Jest + Supertest) |
| RNF-02.2 | Os testes não podem destruir dados reais | `UPLOAD_DIR` aponta para pasta temporária por suíte |
| RNF-02.3 | O fluxo crítico da web deve ter teste ponta a ponta | Playwright, executado no CI |
| RNF-02.4 | Popular o banco deve ser repetível sem duplicar registro | Seed idempotente com `findOrCreate` |
| RNF-02.5 | Falha de rede não pode travar a interface | Estado de erro com "Tentar novamente" em todas as listas |

### RNF-03 · Manutenibilidade

| ID | Requisito | Como é atendido |
|---|---|---|
| RNF-03.1 | O código deve ser tipado estaticamente | TypeScript com `strict` na API e no app |
| RNF-03.2 | O padrão de código deve ser verificável automaticamente | ESLint nos três projetos |
| RNF-03.3 | O histórico deve seguir um padrão de mensagens | Conventional Commits, com commitlint no `commit-msg` |
| RNF-03.4 | A regra de negócio não pode ser duplicada entre plataformas | Web e mobile consomem a mesma API |
| RNF-03.5 | Código, comentários e commits em português | Convenção do projeto |

### RNF-04 · Portabilidade e operação

| ID | Requisito | Como é atendido |
|---|---|---|
| RNF-04.1 | O ambiente deve subir com um comando, sem instalação manual de banco | `docker compose up` (MySQL, backend, frontend, Nginx) |
| RNF-04.2 | A porta do MySQL não deve ser publicada no host | Acesso só pela rede interna do Compose |
| RNF-04.3 | O app deve funcionar na máquina de qualquer integrante sem editar arquivo | URL da API deduzida do host do dev server do Expo |
| RNF-04.4 | O app deve rodar em Android e em navegador a partir do mesmo código | Expo + `react-native-web` |
| RNF-04.5 | A configuração sensível deve ficar fora do versionamento | `.env` derivado de `.env.example` |

### RNF-05 · Usabilidade

| ID | Requisito | Como é atendido |
|---|---|---|
| RNF-05.1 | Erros de formulário devem ser sinalizados campo a campo | `CampoTexto` com prop `erro` |
| RNF-05.2 | A causa da falha de login deve ser distinguível para o usuário | Mensagens distintas para 401 e para falha de conexão |
| RNF-05.3 | Listas devem indicar carregamento, erro e vazio de forma consistente | Componente `EstadoLista` |
| RNF-05.4 | Elementos interativos devem ter rótulo de acessibilidade | `accessibilityLabel` e `accessibilityRole` |
