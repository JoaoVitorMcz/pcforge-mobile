# Diagramas de sequência

As duas conversas mais importantes entre as camadas: o login, que monta o token com papéis e
permissões, e a criação de pedido, que atravessa app, API e banco dentro de uma transação.

---

## Sequência 1 — Login com JWT e carga do RBAC

Cobre RF-01.4 e RNF-01.1 a RNF-01.4. O ponto central é o **`include` aninhado**: em uma única
consulta o Sequelize traz o cliente, seus papéis e as permissões de cada papel, e tudo isso é
achatado em duas listas de strings que viajam dentro do token.

```mermaid
sequenceDiagram
    autonumber
    actor U as Usuário
    participant App as App / Web
    participant API as POST /clientes/login
    participant Ctrl as cliente.controller
    participant DB as MySQL
    participant JWT as jsonwebtoken
    participant Store as SecureStore / localStorage

    U->>App: informa e-mail e senha
    App->>App: valida formato do e-mail<br/>e campos obrigatórios

    alt formulário inválido
        App-->>U: erro campo a campo, sem chamar a API
    else formulário válido
        App->>API: POST { email, senha }
        API->>Ctrl: loginCliente(req, res)

        Ctrl->>DB: findOne(cliente ativo)<br/>include roles → permissoes
        DB-->>Ctrl: cliente + roles + permissoes

        alt cliente não encontrado ou inativo
            Ctrl-->>App: 401 Credenciais invalidas
            App-->>U: "E-mail ou senha incorretos."
        else cliente encontrado
            Ctrl->>Ctrl: bcrypt.compare(senha, hash)

            alt senha incorreta
                Ctrl-->>App: 401 Credenciais invalidas
                Note over Ctrl,App: mesma mensagem do caso anterior:<br/>não revela se o e-mail existe
                App-->>U: "E-mail ou senha incorretos."
            else senha correta
                Ctrl->>Ctrl: extrairRbac() achata<br/>roles[] e permissoes[]
                Ctrl->>Ctrl: admin = cliente.admin<br/>|| roles.includes("admin")
                Ctrl->>JWT: sign({ id_cliente, email, admin,<br/>roles, permissoes }, segredo, 1d)
                JWT-->>Ctrl: token assinado
                Ctrl->>Ctrl: remove 'senha' do objeto<br/>que volta na resposta
                Ctrl-->>App: 200 { token, cliente }
                App->>Store: grava token e cliente
                App-->>U: entra na loja<br/>(aba admin só se admin)
            end
        end
    end
```

### Requisição seguinte, já com o token

```mermaid
sequenceDiagram
    autonumber
    participant App as App / Web
    participant Auth as authMiddleware
    participant Role as authorizeRole(['admin'])
    participant Ctrl as Controller

    App->>Auth: GET /admin/dashboard<br/>Authorization: Bearer token

    alt token ausente, inválido ou expirado
        Auth-->>App: 401 Token invalido ou expirado
    else token válido
        Auth->>Auth: req.cliente = payload decodificado
        Auth->>Role: next()

        alt papel fora da lista permitida
            Role-->>App: 403 Permissoes insuficientes
        else papel autorizado
            Role->>Ctrl: next()
            Ctrl-->>App: 200 com os indicadores
        end
    end
```

**A ordem é obrigatória.** `authorizeRole` lê `req.cliente`, que só existe depois de
`authMiddleware` rodar. Invertida, ele encontraria `undefined` — por isso começa com uma
guarda explícita que responde 401 em vez de estourar um `TypeError` e virar 500. Ver
[rbac.md](rbac.md).

---

## Sequência 2 — Criar pedido: App → API → MySQL

Cobre RF-04.1 a RF-04.3. A parte que importa é a **transação**: pedido, itens e baixa de
estoque precisam acontecer juntos ou nenhum acontece.

```mermaid
sequenceDiagram
    autonumber
    actor C as Cliente
    participant App as App mobile
    participant Auth as authMiddleware
    participant Ctrl as pedido.controller
    participant Prod as Produto
    participant TX as Transação
    participant DB as MySQL

    C->>App: confirma o checkout
    App->>App: valida carrinho não vazio<br/>e endereço escolhido
    App->>Auth: POST /pedidos<br/>{ itens[], id_endereco_entrega }

    alt token inválido
        Auth-->>App: 401
        App->>App: encerra a sessão
        App-->>C: leva ao login
    else token válido
        Auth->>Ctrl: next() com req.cliente

        Ctrl->>DB: busca os produtos dos itens
        DB-->>Ctrl: produtos com valor e estoque

        alt algum produto inativo ou inexistente
            Ctrl-->>App: 404 Produto nao encontrado
            App-->>C: informa o item indisponível
        else produtos válidos
            Ctrl->>Prod: confere estoque item a item

            alt estoque insuficiente
                Ctrl-->>App: 400 com o item e a quantidade disponível
                App-->>C: pede ajuste no carrinho
            else estoque suficiente
                Ctrl->>TX: inicia transação

                TX->>DB: INSERT em 'pedido'<br/>(id_cliente, id_endereco_entrega, status)
                DB-->>TX: id_pedido

                loop para cada item do carrinho
                    TX->>DB: INSERT em 'itempedido'<br/>(id_pedido, id_produto, quantidade,<br/>preco_unitario = valor atual)
                    TX->>DB: UPDATE produto<br/>SET estoque = estoque - quantidade
                end

                TX->>DB: UPDATE pedido SET valor = total

                alt alguma etapa falhou
                    TX->>DB: ROLLBACK
                    Note over TX,DB: nada é gravado:<br/>sem pedido órfão nem estoque errado
                    Ctrl-->>App: 500 Erro ao criar pedido
                    App-->>C: mantém o carrinho intacto
                else todas as etapas concluídas
                    TX->>DB: COMMIT
                    Ctrl-->>App: 201 com o pedido criado
                    App->>App: esvazia o carrinho
                    App-->>C: confirmação + "Meus pedidos"
                end
            end
        end
    end
```

### Por que a transação

Sem ela, três falhas ficam possíveis: pedido criado sem itens, itens criados sem baixa de
estoque, ou baixa de estoque sem pedido. Qualquer uma delas corrompe o histórico de um jeito
que nenhuma tela consegue explicar depois. O `ROLLBACK` garante que o carrinho do cliente
continue igual ao que era antes da tentativa.
