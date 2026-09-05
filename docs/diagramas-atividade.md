# Diagramas de atividade

Os três fluxos com mais ramificação no PC Forge: o checkout, onde a regra de negócio decide
se a compra pode acontecer; o cancelamento, que desfaz a reserva de estoque; e o upload de
imagem, onde a validação decide se o arquivo entra.

---

## Atividade 1 — Checkout do pedido

Cobre RF-04.1 a RF-04.3. Do carrinho até o pedido gravado, com as três barreiras que podem
interromper: sessão, endereço e estoque.

```mermaid
flowchart TD
    inicio([Início]) --> abrir[Cliente abre o carrinho]
    abrir --> vazio{Carrinho<br/>tem itens?}

    vazio -->|Não| avisoVazio[Exibir 'Carrinho vazio'<br/>e sugerir o catálogo]
    avisoVazio --> fimVazio([Fim])

    vazio -->|Sim| total[Calcular total<br/>a partir dos itens]
    total --> logado{Cliente<br/>autenticado?}

    logado -->|Não| login[Redirecionar para o login]
    login --> autenticou{Autenticou?}
    autenticou -->|Não| fimLogin([Fim])
    autenticou -->|Sim| endereco

    logado -->|Sim| endereco{Tem endereço<br/>cadastrado?}

    endereco -->|Não| cadastrar[Abrir cadastro de endereço]
    cadastrar --> salvouEndereco{Endereço<br/>salvo?}
    salvouEndereco -->|Não| fimEndereco([Fim])
    salvouEndereco -->|Sim| escolher

    endereco -->|Sim| escolher[Cliente escolhe<br/>o endereço de entrega]
    escolher --> confirmar[Cliente confirma o pedido]

    confirmar --> enviar["POST /pedidos<br/>com itens e endereço"]

    enviar --> token{Token<br/>válido?}
    token -->|Não| erro401[Sessão expirada:<br/>encerrar sessão e pedir login]
    erro401 --> fimToken([Fim])

    token -->|Sim| estoque{Estoque suficiente<br/>para todos os itens?}
    estoque -->|Não| erroEstoque["Responder 409 com o produto<br/>e a quantidade disponível"]
    erroEstoque --> ajustar[Cliente ajusta o carrinho]
    ajustar --> total

    estoque -->|Sim| transacao[/Início da transação/]
    transacao --> criarPedido[Criar registro em 'pedido'<br/>vinculado ao cliente e ao endereço]
    criarPedido --> criarItens[Criar 'itempedido' com<br/>preco_unitario congelado]
    criarItens --> baixa[Dar baixa no estoque<br/>de cada produto]
    baixa --> deuCerto{Todas as etapas<br/>concluíram?}
    deuCerto -->|Não| rollback[/Desfazer a transação/]
    rollback --> semGravar["Nada gravado: sem pedido,<br/>sem itens, sem estoque descontado"]
    semGravar --> fimRollback([Fim])

    deuCerto -->|Sim| commit[/Confirmar a transação/]
    commit --> resposta[Responder 201<br/>com o pedido criado]
    resposta --> limpar[Esvaziar o carrinho]
    limpar --> exibir[Exibir confirmação<br/>e link para 'Meus pedidos']
    exibir --> fim([Fim])
```

### Duas decisões deste fluxo

**O preço é congelado no passo `criarItens`.** Sem `preco_unitario` gravado, uma mudança
futura no valor do produto reescreveria o total de todos os pedidos antigos. Ver
[der.md](der.md).

**A baixa de estoque mora dentro da transação.** Fora dela, uma falha depois do desconto
deixaria produto reservado por um pedido que não existe. O `decrement` faz um `UPDATE`
relativo (`estoque = estoque - N`), e não uma leitura seguida de escrita, que perderia
atualizações se dois pedidos chegassem ao mesmo tempo.

---

## Atividade 2 — Cancelamento de pedido

O caminho inverso da Atividade 1: o estoque volta.

```mermaid
flowchart TD
    inicio([Início]) --> pedir["PATCH /pedidos/:id/cancelar"]
    pedir --> existe{Pedido existe?}
    existe -->|Não| r404[Responder 404]
    r404 --> fim404([Fim])

    existe -->|Sim| dono{É do próprio cliente<br/>ou é admin?}
    dono -->|Não| r403[Responder 403]
    r403 --> fim403([Fim])

    dono -->|Sim| cancelavel{"Status permite cancelar?<br/>Não: enviado, entregue, cancelado"}
    cancelavel -->|Não| r409[Responder 409]
    r409 --> fim409([Fim])

    cancelavel -->|Sim| tx[/Início da transação/]
    tx --> itens[Carregar os itens do pedido]
    itens --> devolver[Devolver ao estoque a<br/>quantidade de cada item]
    devolver --> status[Marcar o pedido<br/>como cancelado]
    status --> commit[/Confirmar a transação/]
    commit --> r200[Responder 200]
    r200 --> fim([Fim])
```

A guarda de status é o que impede devolver estoque duas vezes: um pedido já cancelado é
recusado com **409** antes de qualquer `increment`.

---

## Atividade 3 — Upload de imagem de produto

Cobre RF-03.1 a RF-03.4. Implementado em
[config/upload.ts](../TechAcademy5back/src/config/upload.ts) e coberto pela suíte
`upload.test.ts`.

```mermaid
flowchart TD
    inicio([Início]) --> selecionar[Administrador seleciona<br/>a imagem no formulário]
    selecionar --> enviar["POST /upload/imagem<br/>multipart/form-data"]

    enviar --> auth{authMiddleware:<br/>token válido?}
    auth -->|Não| r401[Responder 401<br/>Token inválido ou expirado]
    r401 --> fim401([Fim])

    auth -->|Sim| role{"authorizeRole(['admin']):<br/>é administrador?"}
    role -->|Não| r403[Responder 403<br/>Permissões insuficientes]
    r403 --> fim403([Fim])

    role -->|Sim| recebeu{Algum arquivo<br/>foi enviado?}
    recebeu -->|Não| r400vazio[Responder 400<br/>Nenhuma imagem enviada]
    r400vazio --> fim400v([Fim])

    recebeu -->|Sim| ext{"Extensão permitida?<br/>.jpg .jpeg .png .webp .gif"}
    ext -->|Não| erroExt[Lançar UploadValidationError<br/>'Extensão não permitida']
    erroExt --> r400[Responder 400<br/>com a causa]
    r400 --> fim400([Fim])

    ext -->|Sim| mime{"Tipo MIME permitido?<br/>image/jpeg png webp gif"}
    mime -->|Não| erroMime[Lançar UploadValidationError<br/>'Tipo de arquivo não permitido']
    erroMime --> r400

    mime -->|Sim| tamanho{Tamanho<br/>até 5 MB?}
    tamanho -->|Não| erroTamanho[Multer lança<br/>LIMIT_FILE_SIZE]
    erroTamanho --> r413[Responder 413<br/>Arquivo muito grande]
    r413 --> fim413([Fim])

    tamanho -->|Sim| nome["Gerar nome no servidor:<br/>timestamp + aleatório + extensão"]
    nome --> gravar[Gravar em UPLOAD_DIR]
    gravar --> url["Montar a URL /uploads/nome"]
    url --> r201[Responder 201<br/>com a URL]
    r201 --> associar[Administrador salva o produto<br/>com a URL da imagem]
    associar --> fim([Fim])
```

### Duas decisões deste fluxo

**Extensão e MIME são checados separadamente.** Um `.exe` renomeado para `.jpg` passa na
primeira barreira e é barrado na segunda; um `.jpg` legítimo servido com MIME errado é barrado
na segunda. Checar só um dos dois deixa uma das duas portas aberta.

**O nome é gerado no servidor, nunca reaproveitado do envio.** `timestamp + aleatório` garante
que dois uploads de `foto.jpg` virem arquivos distintos, em vez de o segundo sobrescrever o
primeiro. É o que o teste de colisão verifica.

> O erro de validação é distinguido por `instanceof UploadValidationError`, nunca por
> comparação de texto da mensagem — reescrever o texto viraria um 500 silencioso.
