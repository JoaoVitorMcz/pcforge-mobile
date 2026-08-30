# Diagramas de sequência

As duas conversas mais importantes entre as camadas: o login, que monta o token com papéis e
permissões, e a criação de pedido, que atravessa loja, API e banco dentro de uma transação.

---

## Sequência 1 — Login com JWT e carga do RBAC

Cobre RF-01.4 e RNF-01.1 a RNF-01.4. O ponto central é o **`include` aninhado**: em uma única
consulta o Sequelize traz o cliente, seus papéis e as permissões de cada papel, e tudo isso é
achatado em duas listas de strings que viajam dentro do token.

```mermaid
sequenceDiagram
    autonumber
    actor U as Usuário
    participant App as App ou Web
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

        Ctrl->>DB: findOne(cliente ativo)<br/>include roles -> permissoes
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
                Ctrl->>Ctrl: admin = cliente.admin<br/>ou roles inclui "admin"
                Ctrl->>JWT: sign({ id_cliente, email, admin,<br/>roles, permissoes }, segredo, 1d)
                JWT-->>Ctrl: token assinado
                Ctrl->>Ctrl: remove 'senha' do objeto<br/>que volta na resposta
                Ctrl-->>App: 200 { token, cliente }

                alt aplicativo e a conta não é admin
                    App-->>U: "Acesso restrito: este aplicativo<br/>é o painel administrativo."
                    Note over App,Store: a sessão não é gravada:<br/>não existe estado logado<br/>de quem não pode usar o app
                else pode entrar
                    App->>Store: grava token e cliente
                    App-->>U: entra no painel (app)<br/>ou na loja (web)
                end
            end
        end
    end
```

> **O papel do cliente nasce no cadastro.** `criarCliente` vincula o novo cliente ao papel
> `cliente` em `cliente_role`, senão o token sairia com `permissoes` vazio e qualquer rota
> protegida por `authorizePermission` recusaria a compra.

### Requisição seguinte, já com o token

```mermaid
sequenceDiagram
    autonumber
    participant App as App ou Web
    participant Auth as authMiddleware
    participant Role as autorização
    participant Ctrl as Controller

    App->>Auth: requisição + Authorization: Bearer token

    alt token ausente, inválido ou expirado
        Auth-->>App: 401 Token invalido ou expirado
    else token válido
        Auth->>Auth: req.cliente = payload decodificado
        Auth->>Role: next()

        alt papel ou permissão insuficiente
            Role-->>App: 403 Permissoes insuficientes
        else autorizado
            Role->>Ctrl: next()
            Ctrl-->>App: 200 / 201 com o recurso
        end
    end
```

**A ordem é obrigatória.** `authorizeRole` e `authorizePermission` leem `req.cliente`, que só
existe depois de `authMiddleware` rodar. Invertida, encontrariam `undefined` — por isso ambos
começam com uma guarda explícita que responde 401 em vez de estourar um `TypeError` e virar
500. Ver [rbac.md](rbac.md).

---

## Sequência 2 — Criar pedido: loja web → API → MySQL

Cobre RF-04.1 a RF-04.4. A parte que importa é a **transação**: pedido, itens e baixa de
estoque acontecem juntos ou nenhum acontece.

```mermaid
sequenceDiagram
    autonumber
    actor C as Cliente
    participant Web as Loja web
    participant Auth as authMiddleware
    participant Perm as authorizePermission
    participant Svc as pedido.service
    participant TX as Transação
    participant DB as MySQL

    C->>Web: confirma o checkout
    Web->>Web: valida carrinho não vazio<br/>e endereço escolhido
    Web->>Auth: POST /pedidos<br/>{ itens[], id_endereco_entrega }

    alt token inválido
        Auth-->>Web: 401
        Web->>Web: encerra a sessão
        Web-->>C: leva ao login
    else token válido
        Auth->>Perm: next() com req.cliente

        alt sem a permissão pedido:criar
            Perm-->>Web: 403
        else autorizado
            Perm->>Svc: criarPedidoComItens()

            Svc->>DB: busca os produtos ativos dos itens
            DB-->>Svc: produtos com valor e estoque

            alt algum produto inativo ou inexistente
                Svc-->>Web: 404 Produtos nao encontrados
                Web-->>C: informa o item indisponível
            else produtos válidos
                Svc->>Svc: soma as quantidades do<br/>mesmo produto e confere estoque

                alt estoque insuficiente
                    Svc-->>Web: 409 com o produto e o disponível
                    Web-->>C: pede ajuste no carrinho
                else estoque suficiente
                    Svc->>DB: valida que o endereço é do cliente

                    alt endereço de outro cliente
                        Svc-->>Web: 403
                    else endereço válido
                        Svc->>TX: inicia transação

                        TX->>DB: INSERT em 'pedido'<br/>status pendente, valor total
                        DB-->>TX: id_pedido
                        TX->>DB: bulkCreate em 'itempedido'<br/>preco_unitario congelado

                        loop para cada produto do pedido
                            TX->>DB: UPDATE produto<br/>SET estoque = estoque - quantidade
                        end

                        alt alguma etapa falhou
                            TX->>DB: ROLLBACK
                            Note over TX,DB: nada é gravado: sem pedido órfão,<br/>sem estoque descontado a mais
                            Svc-->>Web: 500 Erro ao criar pedido
                            Web-->>C: mantém o carrinho intacto
                        else todas concluídas
                            TX->>DB: COMMIT
                            Svc-->>Web: 201 com o pedido criado
                            Web->>Web: esvazia o carrinho
                            Web-->>C: confirmação + "Meus pedidos"
                        end
                    end
                end
            end
        end
    end
```

### Por que a transação

Sem ela, quatro falhas ficam possíveis: pedido criado sem itens, itens criados sem baixa de
estoque, baixa de estoque sem pedido, ou baixa parcial quando o segundo item falha. Qualquer
uma corrompe o histórico de um jeito que nenhuma tela consegue explicar depois. O `ROLLBACK`
garante que o estoque e o carrinho continuem exatamente como estavam antes da tentativa.

---

## Sequência 3 — Admin muda o status do pedido, pelo app

Cobre RF-06.5. Mostra as duas validações da máquina de estados: a do app, que decide o que
oferecer, e a da API, que decide o que aceitar.

```mermaid
sequenceDiagram
    autonumber
    actor A as Administrador
    participant App as Painel (app)
    participant Auth as authMiddleware
    participant Role as authorizeRole(['admin'])
    participant Ctrl as pedido.controller
    participant DB as MySQL

    A->>App: abre o pedido
    App->>Auth: GET /pedidos/:id
    Auth->>Ctrl: next()
    Ctrl->>DB: carrega pedido, itens, cliente e endereço
    DB-->>Ctrl: pedido detalhado
    Ctrl-->>App: 200

    App->>App: consulta a tabela de transições<br/>e monta os botões do estado atual
    Note over App: "entregue" e "cancelado" são finais:<br/>nenhum botão é oferecido

    A->>App: escolhe o novo status
    App->>Auth: PATCH /pedidos/:id/status
    Auth->>Role: next()

    alt não é admin
        Role-->>App: 403
    else é admin
        Role->>Ctrl: next()
        Ctrl->>DB: carrega o pedido
        Ctrl->>Ctrl: a transição atual -> destino<br/>é permitida?

        alt transição inválida
            Ctrl-->>App: 409 com as transições válidas
            Note over App,Ctrl: só acontece se o pedido mudou<br/>por outra via desde que a tela abriu
            App-->>A: alerta com a mensagem da API
        else transição válida
            Ctrl->>DB: UPDATE status<br/>(e data_pagamento, se virou "pago")
            Ctrl-->>App: 200
            App->>App: recarrega o pedido
            App-->>A: novo status na tela
        end
    end
```

A tabela de transições existe nos dois lados de propósito: no app para **não oferecer** o que
seria recusado, e na API porque é ela quem **decide**. A cópia no cliente é conveniência de
interface, nunca a regra.
