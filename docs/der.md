# Diagrama entidade-relacionamento

Modelo físico do PC Forge: **10 tabelas**, sendo 6 do domínio da loja e 4 do controle de
acesso. Foi extraído dos models Sequelize em
[TechAcademy5back/src/models/](../TechAcademy5back/src/models/), que são a fonte de verdade —
o schema é criado por `sequelize.sync()`, sem migrations.

## Diagrama

```mermaid
erDiagram
    cliente     ||--o{ endereco       : cadastra
    cliente     ||--o{ pedido         : faz
    endereco    ||--o{ pedido         : "entrega em"
    pedido      ||--|{ itempedido     : contem
    produto     ||--o{ itempedido     : "figura em"
    categoria   ||--o{ produto        : classifica

    cliente     ||--o{ cliente_role   : possui
    role        ||--o{ cliente_role   : "atribuido a"
    role        ||--o{ role_permissao : concede
    permissao   ||--o{ role_permissao : "concedida por"

    cliente {
        int id_cliente PK
        varchar nome
        varchar email UK
        varchar senha "hash bcrypt"
        varchar telefone "nulo"
        varchar cpf "nulo, unico"
        boolean ativo "exclusao logica"
        boolean admin "espelho de roles"
    }

    endereco {
        int id_endereco PK
        int id_cliente FK
        varchar numero "nulo"
        varchar complemento "nulo"
        varchar bairro "nulo"
        varchar cidade "nulo"
        varchar estado "nulo"
        varchar cep "nulo"
    }

    categoria {
        int id_categoria PK
        varchar nome UK
        varchar descricao "nulo"
        boolean ativo "exclusao logica"
    }

    produto {
        int id_produto PK
        int id_categoria FK "nulo"
        varchar nome
        varchar descricao "nulo"
        decimal valor
        int estoque
        varchar imagem "nulo, nome do arquivo"
        boolean destaque
        boolean ativo "exclusao logica"
    }

    pedido {
        int id_pedido PK
        int id_cliente FK
        int id_endereco_entrega FK
        datetime data_pedido
        decimal valor "nulo, total fechado"
        varchar status "nulo"
        varchar metodo "nulo, forma de pagamento"
        datetime data_pagamento "nulo"
    }

    itempedido {
        int id_item PK
        int id_pedido FK
        int id_produto FK
        int quantidade "min 1"
        decimal preco_unitario "preco no momento da compra"
    }

    role {
        int id_role PK
        varchar nome UK "admin, cliente"
        varchar descricao "nulo"
    }

    permissao {
        int id_permissao PK
        varchar nome UK "formato recurso:acao"
        varchar recurso
        varchar acao
        varchar descricao "nulo"
    }

    cliente_role {
        int id_cliente PK,FK
        int id_role PK,FK
    }

    role_permissao {
        int id_role PK,FK
        int id_permissao PK,FK
    }
```

## Decisões de modelagem

**`itempedido.preco_unitario` é redundante de propósito.** O preço fica congelado no momento
da compra. Sem essa coluna, mudar o valor de um produto reescreveria retroativamente o total
de todos os pedidos antigos — o histórico deixaria de bater com o que o cliente pagou.

**Exclusão lógica em `cliente`, `produto` e `categoria`.** A coluna `ativo` desativa em vez de
apagar. Um produto que já figura em `itempedido` não pode sumir sem quebrar o pedido, e um
cliente desativado precisa manter o histórico. Por isso `DELETE /produtos/:id` chama
`desativarProduto`, não um `destroy`.

**`pedido` referencia o endereço, não o copia.** `id_endereco_entrega` é FK para `endereco`,
que por sua vez pertence a um `cliente`. É a razão de o checkout exigir endereço cadastrado
antes de criar o pedido.

**As duas junções do RBAC usam chave primária composta.** Em `cliente_role` e
`role_permissao` o par de FKs é a PK, então a restrição de não duplicar um vínculo mora no
banco, não na lógica do seed.

**`cliente.admin` convive com o RBAC.** É espelho de `roles.includes("admin")`, mantido
porque web e mobile leem esse campo. Está previsto remover quando as duas pontas passarem a
ler `roles` — ver a pendência em [rbac.md](rbac.md).

**`endereco` não tem logradouro.** O model traz número, complemento, bairro, cidade, estado e
CEP, herdados do schema original da loja web. É uma lacuna conhecida do modelo, não um
recorte deste documento.

## Cardinalidades

| Relação | Cardinalidade | Leitura |
|---|---|---|
| `cliente` → `endereco` | 1:N | um cliente cadastra vários endereços |
| `cliente` → `pedido` | 1:N | um cliente faz vários pedidos |
| `endereco` → `pedido` | 1:N | um endereço recebe vários pedidos |
| `pedido` → `itempedido` | 1:N (mínimo 1) | um pedido contém ao menos um item |
| `produto` → `itempedido` | 1:N | um produto figura em vários pedidos |
| `categoria` → `produto` | 1:N | uma categoria classifica vários produtos |
| `cliente` ↔ `role` | N:N via `cliente_role` | um cliente tem vários papéis |
| `role` ↔ `permissao` | N:N via `role_permissao` | um papel concede várias permissões |
