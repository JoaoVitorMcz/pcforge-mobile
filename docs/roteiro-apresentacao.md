# Roteiro da apresentação — PC Forge

Apresentação de 10 a 15 minutos, com demo ao vivo. Este documento é para consultar no celular
ou no segundo monitor: os blocos estão minutados, os caminhos de arquivo são exatos e as
perguntas prováveis já vêm com resposta.

**A ideia central da fala, em uma frase:** *o PC Forge é uma loja de componentes onde o cliente
vê o estoque antes de decidir e quem opera a loja tem um painel — e as duas experiências
convivem no mesmo aplicativo porque o controle de acesso separa uma da outra em três camadas.*

---

## Parte 1 — Checklist, 20 minutos antes

| ✓ | O quê | Como |
|---|---|---|
| ☐ | Banco e API no ar | `docker compose up -d mysql backend` |
| ☐ | Dados populados | `docker compose exec backend npm run seed` |
| ☐ | App aberto e **deslogado**, na tela de login | `cd TechAcademy5mobile && npm start` |
| ☐ | Segundo terminal limpo, para rodar os testes ao vivo | — |
| ☐ | **Rode os testes uma vez para aquecer o cache** — a primeira execução leva ~33 s, as seguintes ~3 s | `cd TechAcademy5back && npx jest upload` |
| ☐ | As 6 abas do VSCode abertas, na ordem da Parte 3 | — |
| ☐ | Notificações do sistema silenciadas | — |
| ☐ | Este roteiro aberto no celular | — |

**Contas do seed**, as duas com senha `Senha@123`:

- `admin@pcforge.com` — administrador
- `cliente@pcforge.com` — cliente comum

> ⚠ **Se você ensaiar a demo, zere o banco antes de apresentar.** Comprar no ensaio baixa o
> estoque de verdade, e o seed **não repõe**: ele usa `findOrCreate`, que não toca em produto que
> já existe. Sem zerar, o Water Cooler não estará mais com 3 em estoque amanhã e o momento-chave
> do bloco 3 não acontece.
>
> ```bash
> docker compose down -v          # apaga o volume mysql_data
> docker compose up -d mysql backend
> docker compose exec backend npm run seed
> ```
>
> Faça isso **de manhã, antes de sair**, e confira que o Water Cooler voltou a 3 e o Headset a 1.
>
> **O carrinho é caso à parte:** ele fica gravado no aparelho, por cliente, e **sair da conta não
> o apaga** — ao entrar de novo, ele volta. Para começar com o carrinho vazio, abra a tela do
> carrinho e remova os itens (ou finalize um pedido, que também limpa).

**Plano B.** Se a demo travar, não insista mais que 20 segundos: diga *"vou mostrar pelo
código, que é onde a regra está mesmo"* e pule para o bloco 5. O roteiro foi montado para que
os blocos 5, 6 e 7 se sustentem sem o app rodando.

---

## Parte 2 — Roteiro minutado

### Bloco 1 · O problema e as duas personas · 1,5 min

> **Fecha:** Contextualização (1,0)
> **Na tela:** nada ainda, ou `docs/contextualizacao.md`

Quem monta um PC decide em várias categorias ao mesmo tempo, e cada decisão depende das outras.
Em marketplace generalista isso esbarra em três atritos:

1. **Catálogo indiferenciado** — componente misturado com produto de outra área.
2. **Disponibilidade opaca** — o estoque só aparece no fim, e a compra falha tarde.
3. **Vitrine sem operação** — a loja mostra o produto, mas quem opera não tem onde ver
   faturamento, pedidos por status e o que está acabando.

O PC Forge ataca os três. E tem **duas personas que não se misturam**: o cliente, que compra, e
o administrador, que opera. *"Essa separação não é cosmética — ela é o controle de acesso, e é o
que eu vou mostrar em três camadas daqui a pouco."*

⏱ **Não passe de 1,5 min aqui.** É a parte mais fácil de falar demais.

---

### Bloco 2 · Arquitetura · 1,5 min

> **Fecha:** Arquitetura e padronização (0,5)
> **Na tela:** `docs/contextualizacao.md`, o diagrama da seção "Arquitetura hoje"

Monorepo com três aplicações sobre a **mesma API**:

| Pasta | O que é |
|---|---|
| `TechAcademy5back/` | API Express 5 + TypeScript, Sequelize, MySQL 8, JWT, Multer |
| `TechAcademy5front/` | Web React 19 — loja e painel |
| `TechAcademy5mobile/` | App Expo SDK 57 + Expo Router |

Três pontos, e só esses:

- **Monorepo de propósito**: um `docker-compose.yml`, um `.env`, um CI. E preserva o histórico
  da evolução do produto, que é item da rubrica de Engenharia.
- **Camadas no app**: `services/` fala com a API, `contexts/` guarda estado global,
  `components/` é o que se repete na tela. Nenhuma tela chama `fetch` direto.
- **Expo Router com grupos de rota**: `(auth)` e `(loja)` — o que torna o gate de admin
  declarativo, em vez de espalhar `if (isAdmin)` pelas telas.

---

### Bloco 3 · Demo do cliente · 3 min ⭐

> **Fecha:** CRUD completo (1,0) + Regra de negócio (0,5)
> **Na tela:** o app

Este é o bloco mais importante da apresentação. **Não corte, não apresse.**

| # | Passo | O que dizer enquanto faz |
|---|---|---|
| 1 | Login com `cliente@pcforge.com` | "Cliente comum. Repare na barra de baixo." |
| 2 | Aponte a barra de abas | "Home, Peças, Periféricos, Suporte. **Não existe aba Admin.**" |
| 3 | Home → busque **"Water"** no campo de busca | "Cada card já mostra **3 em estoque**. O estoque aparece na vitrine, antes de decidir — era o atrito nº 2." |
| 4 | Toque em **Adicionar ao carrinho** 3 vezes | O botão vira `No carrinho (1) · adicionar mais`, depois `(2)`, e na terceira **`Estoque no limite (3)`**, desabilitado. "Ele não deixa nem pedir mais do que existe." ← **momento-chave** |
| 5 | Periféricos → busque **"Headset"** | "Esse tem estoque 1. Adiciono uma vez e o botão já trava." |
| 6 | Abra o carrinho (ícone no cabeçalho) | "Ajusto quantidade, removo item, vejo o total." |
| 7 | Tente finalizar **sem endereço** | "Ele exige endereço de entrega. É regra de negócio, não validação de formulário." |
| 8 | "Cadastrar endereço" → CEP `01001000` | "Bairro, cidade e estado vêm sozinhos, pelo ViaCEP." ⚠ **único passo que precisa de internet** — sem rede, digite os campos na mão e siga |
| 9 | Salve, volte, escolha o endereço, **Finalizar** | "Pedido criado." |
| 10 | Perfil → **Meus endereços** | "Listo, edito e excluo. **Esse é o CRUD completo da rubrica**: as quatro operações, do app até o MySQL." |
| 11 | Perfil → **Meus pedidos** → abra o pedido | "E o cliente acompanha o que comprou." |

> **Dois detalhes de navegação, para não hesitar ao vivo:** não existe tela de detalhe do
> produto — o próprio card mostra estoque, preço e o botão, então **busque, não tente abrir o
> produto**. E **perfil e carrinho ficam nos dois ícones do cabeçalho**, não na barra de abas.

**Se ele interromper no passo 4** perguntando "e se o estoque mudar enquanto ele decide?" — é a
melhor pergunta possível. Responda na hora: *"O carrinho é a primeira barreira, mas quem decide
é o backend. Se o estoque mudou nesse meio-tempo, o checkout volta 409 e a tela mostra o nome do
produto que faltou."*

---

### Bloco 4 · Demo do admin · 3 min ⭐

> **Fecha:** Multer (1,0) + Validação de imagens (1,0)
> **Na tela:** o app

| # | Passo | O que dizer enquanto faz |
|---|---|---|
| 1 | Saia e entre como `admin@pcforge.com` | "Mesma tela de login, mesmo app." |
| 2 | **Pare e aponte a barra de abas** | "Agora apareceu a aba **Admin**. Mesmo código, mesma build — muda o papel de quem entrou." ← **momento-chave** |
| 3 | Aba Admin → dashboard | "Faturamento, pedidos, produtos e clientes ativos, e estoque baixo — o atrito nº 3." |
| 4 | Produtos → **Novo produto** | "CRUD de produtos, com upload da galeria do aparelho." |
| 5 | Toque em **Imagem** → escolha uma foto | "Isso é o Multer recebendo e gravando o arquivo." |
| 6 | Preencha, salve, veja na lista | — |
| 7 | Pedidos → abra o pedido criado no bloco 3 | "Mesmo pedido que acabei de fazer como cliente." |
| 8 | Mude o status: pendente → pago | "E repare no que **não** aparece como opção: a tela só oferece as transições que a API aceita." |
| 9 | Leve até "entregue" (ou abra um já entregue) | A tela diz: *"entregue é um estado final: o pedido não muda mais."* "É uma máquina de estados — `entregue` e `cancelado` são terminais." |

O passo 2 é o que fecha os **2,0 pontos** de controle de admin e usuário. Faça uma pausa real
ali — é o único momento em que o professor vê a rubrica sendo cumprida com os próprios olhos.

> **A validação da imagem não dá para demonstrar pelo app**: o seletor de galeria do celular só
> deixa escolher imagem, então não há como tentar enviar um `.exe` pela tela.
>
> Mostre assim, em dois passos: **abra `TechAcademy5back/src/__tests__/upload.test.ts`** — os
> quatro casos estão escritos ali e leem como a própria rubrica:
>
> - *Extensão inválida (exe) deve retornar 400*
> - *Tamanho excedido deve retornar 413*
> - *Colisão de nome: dois uploads com mesmo originalname geram nomes diferentes*
> - *Upload válido retorna 201 e URL começa com `/uploads/`*
>
> E então rode, que leva uns 3 segundos com o cache quente:
>
> ```bash
> cd TechAcademy5back && npx jest upload
> ```
>
> Diga: *"a validação é no servidor, e está coberta por teste — não é só a tela escondendo o
> botão."*

---

### Bloco 5 · O controle de acesso, em três camadas · 2 min ⭐

> **Fecha:** Controle funcional de admin e usuário (2,0)
> **Na tela:** VSCode

*"A aba sumiu para o cliente. Mas esconder um botão não é segurança, é aparência. Então são três
camadas, e cada uma funciona sozinha."*

**Camada 1 — a aba some.** `TechAcademy5mobile/src/app/(loja)/_layout.tsx`, linha 86:

```tsx
href: isAdmin ? "/(loja)/admin" : null
```

*"Isso é conforto visual. Se fosse só isso, bastava digitar a rota."*

**Camada 2 — o layout redireciona.** `TechAcademy5mobile/src/app/(loja)/admin/_layout.tsx`,
linha 16:

```tsx
if (!isAdmin) return <Redirect href="/(loja)" />;
```

*"Quem chega por navegação direta ou deep link cai aqui e volta para a loja."*

**Camada 3 — a API responde 403.** `TechAcademy5back/src/config/auth.middleware.ts`, linha 65,
aplicado nas rotas assim:

```ts
router.post("/", authMiddleware, authorizeRole(["admin"]), ProdutoController.criarProduto);
```

*"Essa é a que importa. O app não participa da decisão: mesmo que alguém chame pelo Postman, sem
o papel a API recusa."*

Feche com o modelo: *"E o papel não é um booleano. São quatro tabelas — `role`, `permissao`,
`cliente_role` e `role_permissao`. RBAC clássico: o cliente recebe papéis, e o papel é que
carrega as permissões."*

---

### Bloco 6 · As decisões de código · 2 min

> **Fecha:** Componentização e clean code (1,0)
> **Na tela:** VSCode

Três trechos. Se o tempo apertar, **mostre só o primeiro** — é o mais forte.

**1. A baixa de estoque mora dentro da transação.**
`TechAcademy5back/src/services/pedido.service.ts`, linha 202:

```ts
await Produto.decrement("estoque", {
  by: item.quantidade,
  where: { id_produto: item.id_produto },
  transaction,
});
```

*"Duas decisões aqui, não uma. **Dentro da transação**, para que uma falha no meio desfaça
pedido, itens e baixa juntos. E **`decrement`**, que gera um `UPDATE estoque = estoque - N` no
banco em vez de ler o estoque em memória e escrever de volta — se duas pessoas comprarem ao
mesmo tempo, ler-e-escrever perde uma das atualizações."*

> Vale contar: **isso não existia.** Numa auditoria do próprio projeto eu descobri que o estoque
> nunca era baixado — uma unidade vendia infinitas vezes. Era justamente a regra de negócio que
> a rubrica cobra.

**2. A validação do upload, em três eixos.** `TechAcademy5back/src/config/upload.ts`:

| Eixo | Regra | Resposta |
|---|---|---|
| Extensão | `.jpg .jpeg .png .webp .gif` | 400 |
| Tipo MIME | `image/jpeg image/png image/webp image/gif` | 400 |
| Tamanho | 5 MB | 413 |

*"E o nome do arquivo gravado não é o nome enviado: é timestamp mais aleatório. Dois uploads de
'foto.png' viram arquivos diferentes — colisão resolvida por construção, não por sorte."*

**3. O carrinho guarda o mínimo.** `TechAcademy5mobile/src/contexts/CarrinhoContext.tsx`,
linha 85:

*"Persisto só id e quantidade, e re-hidrato contra o catálogo ao abrir. Se eu guardasse o
produto inteiro, o cliente voltaria dias depois vendo preço velho."*

---

### Bloco 7 · Engenharia, testes e o que falta · 1,5 min

> **Fecha:** Documentação de Engenharia (4,0) + Validação (1,0)
> **Na tela:** a pasta `docs/` e o terminal

**Documentação** — seis documentos em Markdown com Mermaid, que o GitHub renderiza direto:

| Documento | O que tem |
|---|---|
| `contextualizacao.md` | Problema, duas personas, seis etapas de evolução |
| `der.md` | ER de 10 tabelas, decisões de modelagem e cardinalidades |
| `requisitos.md` | 8 grupos de RF mapeados rota a rota, 5 de RNF |
| `casos-de-uso.md` | 2 diagramas + 3 detalhamentos |
| `diagramas-atividade.md` | 3 diagramas: checkout, cancelamento, upload |
| `diagramas-sequencia.md` | 4 diagramas: login com JWT, criar pedido, mudar status |

**Testes** — se der tempo, rode ao vivo; é rápido e causa impressão:

```bash
cd TechAcademy5back && npm test    # 118 testes
cd TechAcademy5mobile && npm test  #  29 testes
```

*"147 testes no total. Os do app cobrem exatamente o que a rubrica pede: a regra de estoque do
carrinho e o gate de admin."*

**Feche pelo que falta**, não pelo que está pronto:

> *"O que falta não é código, é evidência: rodar num aparelho físico e registrar os prints. A
> build web já me dá uma segunda plataforma, mas print de aparelho real eu ainda não tenho."*

Terminar admitindo uma lacuna com precisão vale mais do que terminar dizendo que está tudo
pronto. Mostra que você sabe onde o projeto está.

---

## Parte 3 — Os 6 arquivos, na ordem de uso

Deixe estes abertos no VSCode **antes** de começar, nesta ordem. As linhas foram conferidas
neste commit — se você mexer no código antes de amanhã, confira de novo.

| # | Arquivo | Linha | Para quê |
|---|---|---|---|
| 1 | `TechAcademy5mobile/src/app/(loja)/_layout.tsx` | 86 | Camada 1 — a aba some |
| 2 | `TechAcademy5mobile/src/app/(loja)/admin/_layout.tsx` | 16 | Camada 2 — o redirect |
| 3 | `TechAcademy5back/src/config/auth.middleware.ts` | 65 | Camada 3 — o 403 |
| 4 | `TechAcademy5back/src/services/pedido.service.ts` | 202 | Estoque na transação |
| 5 | `TechAcademy5back/src/config/upload.ts` | 29 e 53 | Validação do Multer |
| 6 | `TechAcademy5back/src/__tests__/upload.test.ts` | 36 a 83 | Os 4 casos de validação |

---

## Parte 4 — Perguntas do professor

A resposta curta é a que se fala. O arquivo é para abrir **só se ele pedir prova**.

### Segurança e controle de acesso

**"Esconder a aba é segurança?"**
Não, é conforto visual — e eu trato como tal. A proteção são as outras duas camadas: o redirect
do layout e o 403 da API. Se eu só escondesse a aba, bastava digitar a rota.

**"O que impede o cliente de chamar `POST /produtos` direto pelo Postman?"**
O `authorizeRole(["admin"])` na rota. O token dele carrega `roles: ["cliente"]`, a rota exige
`admin`, e volta 403. O aplicativo não participa dessa decisão.

**"E se ele editar o token e colocar `admin: true`?"**
A assinatura quebra. O `jwt.verify` confere o payload contra o segredo do servidor; payload
alterado sem a chave não passa e vira 401. Forjar exigiria o `JWT_SECRET`, que não sai do
ambiente do servidor.

**"Por que RBAC e não um booleano `admin`?"**
Booleano só responde "é admin ou não". RBAC separa **quem você é** (papel) de **o que você
pode** (permissão). Criar um papel "estoquista", que mexe em produto mas não em cliente, vira
linha em tabela — não exige tocar em nenhuma rota.

**"Mas o booleano `admin` ainda existe no token. Por quê?"**
Dívida consciente, e documentada. A web e o app ainda leem esse campo; trocar as três camadas de
uma vez, perto da entrega, seria risco sem ganho. Os dois são mantidos em sincronia por uma
função só (`extrairRoles`), e o próximo passo é as duas pontas lerem `roles`.

**"Onde fica o token no celular?"**
No `SecureStore`, que encosta no Keychain do iOS e no Keystore do Android. Na build web ele cai
para `localStorage`, porque `SecureStore` não existe no navegador — e isso é uma fraqueza
conhecida: qualquer script da página lê. Por isso a web do app é demonstração; o entregável
avaliado é o nativo.

**"O que acontece quando o token expira?"**
Qualquer 401 encerra a sessão e devolve para o login. O token vale um dia.

### Regra de negócio e dados

**"O estoque pode ficar negativo?"**
No fluxo normal não: o pedido valida antes e responde 409 se faltar, e a baixa é um `decrement`
atômico. **Resposta completa:** a validação acontece antes de a transação abrir, então sob
concorrência pesada existe uma janela entre conferir e debitar. Fechar de vez pede um
`SELECT ... FOR UPDATE` ou uma constraint `estoque >= 0` no banco — é a próxima coisa que eu
faria.

> Esta é a pergunta mais perigosa do conjunto, e a resposta honesta é a mais forte: mostra que
> você conhece o limite do que construiu. **Não diga que é impossível.**

**"E se duas pessoas comprarem a última unidade ao mesmo tempo?"**
O `decrement` vira `UPDATE estoque = estoque - N` no banco, então as duas atualizações não se
perdem, que é o erro clássico de ler em memória e escrever de volta. A janela que sobra é a da
resposta acima.

**"Por que o carrinho é local e não uma entidade da API?"**
Porque `POST /pedidos` aceita os itens no corpo. Um carrinho no servidor exigiria criar o pedido
antes de o cliente decidir comprar, e encheria a tabela de rascunhos.

**"Por que o pedido tem máquina de estados?"**
Porque sem ela um pedido "entregue" voltava para "pendente" e um "cancelado" podia ser revivido.
Era um bug real. Agora `entregue` e `cancelado` são terminais, e transição inválida recebe 409.

**"O cliente pode ver o pedido de outro cliente?"**
Não. Todos os controllers de recurso do cliente — endereço, pedido e item de pedido — conferem a
propriedade antes de responder, e devolvem 403.

### Upload de imagens

**"Como você garante que o arquivo é mesmo uma imagem?"**
Valido três coisas: extensão, tipo MIME declarado e tamanho. **Sendo honesto:** eu não leio os
*magic bytes* do arquivo, então alguém poderia renomear um `.exe` para `.png` e declarar
`image/png`. O que me protege no escopo é que o arquivo vai para uma pasta servida como estático
e nunca é executado. Em produção eu somaria verificação de assinatura do arquivo.

**"E se dois usuários enviarem arquivos com o mesmo nome?"**
Não colidem: o nome gravado não é o nome enviado. É `Date.now()` mais um aleatório de nove
dígitos, mantendo só a extensão. Tem teste cobrindo exatamente isso.

**"E um arquivo de 100 MB?"**
O Multer corta em 5 MB e o handler devolve 413. O arquivo não chega a ser gravado inteiro.

**"Por que o upload acontece ao escolher a foto, e não ao salvar o produto?"**
Para o erro de imagem aparecer na hora, em vez de derrubar o salvamento depois de o formulário
inteiro estar preenchido.

### Projeto e processo

**"Qual é o CRUD completo que você está apresentando?"**
Endereços. As quatro operações, do aplicativo até o MySQL, passando pela API. É o mais limpo de
demonstrar, e é o que eu mostrei no bloco do cliente.

**"Como você testou?"**
118 testes no backend e 29 no app, rodando no CI a cada push. Os do app cobrem a regra de
estoque do carrinho e o gate de admin. Posso rodar agora, leva dez segundos.

**"Por que Expo e não React Native puro?"**
Build nativa sem depender de Android Studio e Xcode configurados, e o mesmo código roda no
navegador via `react-native-web` — o que me deu uma segunda plataforma para o critério de
compatibilidade, sem manter dois projetos.

**"Como o aplicativo descobre o endereço da API?"**
Deduz do host do próprio dev server do Expo. Assim funciona na máquina de qualquer pessoa da
dupla sem ninguém editar arquivo.

**"O que o app tem que a web não tem?"**
Nada exclusivo, e é proposital. O que justifica o app não é a funcionalidade, é **onde a pessoa
está**: o estoque acaba no depósito, não na mesa do escritório.

**"O que você faria diferente?"**
Duas coisas, nessa ordem: fechar a janela de concorrência do estoque com constraint no banco, e
remover o booleano `admin` do token assim que web e mobile lerem `roles`.

### Três perguntas cuja resposta certa é "não fiz"

Treine estas. Admitir com precisão pontua mais do que improvisar.

| Pergunta | Resposta |
|---|---|
| "Testou em aparelho físico?" | "Ainda não. Rodei na build web e no emulador; o print em aparelho real é exatamente o que falta para eu fechar o item de validação." |
| "Tem refresh token?" | "Não. O token vale um dia e expira seco — qualquer 401 desloga. Para o escopo acadêmico é suficiente; em produção seria um refresh com rotação." |
| "Validou a assinatura do arquivo enviado?" | "Não, valido extensão e MIME declarado. Sei que é contornável, e sei qual seria a correção." |

---

## Parte 5 — Cartão de emergência

**Contas** · `admin@pcforge.com` e `cliente@pcforge.com` · senha `Senha@123`

**Comandos**

```bash
docker compose up -d mysql backend
docker compose exec backend npm run seed
cd TechAcademy5back && npx jest upload   # os 4 casos de validação
cd TechAcademy5back && npm test          # 118
cd TechAcademy5mobile && npm test        #  29
```

**Números que você pode precisar**

| | |
|---|---|
| Testes | 118 backend + 29 app = **147** |
| Tabelas no banco | 10 (6 de domínio + 4 de RBAC) |
| Requisitos | 8 grupos funcionais + 5 não funcionais |
| Catálogo do seed | 35 produtos em 11 categorias, 30 com foto |
| Diagramas | 2 caso de uso, 3 atividade, 4 sequência, 1 DER |

**Produtos da demo**

| Produto | Onde | Estoque | Para quê |
|---|---|---|---|
| Water Cooler Corsair H100i RGB | Home (destaque) | 3 | Teto de estoque no carrinho |
| Headset 7.1 Surround | Periféricos | 1 | Bloqueio imediato na segunda adição |

**Se o tempo estourar**, corte nesta ordem: bloco 6 (código), depois bloco 7 (documentação).
**Nunca corte** os blocos 3, 4 e 5 — são 5,5 pontos da rubrica.

**Se travar**, respire e diga: *"vou mostrar pelo código, que é onde a regra está mesmo."*
