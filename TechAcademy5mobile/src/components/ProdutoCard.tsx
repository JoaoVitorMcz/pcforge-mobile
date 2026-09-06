import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useCarrinho } from "@/contexts/CarrinhoContext";
import { urlDaImagem } from "@/services/imagens";
import { cores, espaco, fonte, formatarPreco, raio } from "@/theme";
import type { Produto } from "@/types";

const ESTOQUE_BAIXO = 5;

export function ProdutoCard({ produto }: { produto: Produto }) {
  const { itens, adicionar } = useCarrinho();

  const semEstoque = produto.estoque <= 0;
  const noCarrinho =
    itens.find((item) => item.produto.id_produto === produto.id_produto)?.quantidade ?? 0;
  // Primeira barreira da regra de estoque: nao deixa nem pedir mais do que ha.
  // A decisao final e do backend, que responde 409 no checkout.
  const limiteAtingido = noCarrinho >= produto.estoque;
  const bloqueado = semEstoque || limiteAtingido;

  return (
    <View style={estilos.card}>
      {urlDaImagem(produto.imagem) ? (
        <View style={estilos.molduraImagem}>
          <Image
            source={{ uri: urlDaImagem(produto.imagem) ?? undefined }}
            style={estilos.imagem}
            resizeMode="contain"
          />
        </View>
      ) : (
        <View style={[estilos.molduraImagem, estilos.imagemVazia]}>
          <Text style={estilos.imagemTexto}>PC Forge</Text>
        </View>
      )}
      <View style={estilos.cabecalho}>
        <Text style={estilos.nome} numberOfLines={2}>
          {produto.nome}
        </Text>
        {produto.destaque && <Text style={estilos.selo}>Destaque</Text>}
      </View>

      {!!produto.descricao && (
        <Text style={estilos.descricao} numberOfLines={2}>
          {produto.descricao}
        </Text>
      )}

      <View style={estilos.rodape}>
        <Text style={estilos.preco}>{formatarPreco(produto.valor)}</Text>
        <Text
          style={[
            estilos.estoque,
            semEstoque && estilos.estoqueEsgotado,
            !semEstoque && produto.estoque < ESTOQUE_BAIXO && estilos.estoqueBaixo,
          ]}
        >
          {semEstoque ? "Esgotado" : `${produto.estoque} em estoque`}
        </Text>
      </View>

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityState={{ disabled: bloqueado }}
        accessibilityLabel={`Adicionar ${produto.nome} ao carrinho`}
        style={[estilos.acao, bloqueado && estilos.acaoBloqueada]}
        disabled={bloqueado}
        onPress={() => adicionar(produto)}
      >
        <Text style={[estilos.acaoTexto, bloqueado && estilos.acaoTextoBloqueado]}>
          {semEstoque
            ? "Indisponível"
            : limiteAtingido
              ? `Estoque no limite (${noCarrinho})`
              : noCarrinho > 0
                ? `No carrinho (${noCarrinho}) · adicionar mais`
                : "Adicionar ao carrinho"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const estilos = StyleSheet.create({
  card: {
    backgroundColor: cores.superficie,
    borderRadius: raio.md,
    borderWidth: 1,
    borderColor: cores.borda,
    padding: espaco.md,
    marginBottom: espaco.md,
  },
  molduraImagem: {
    width: "100%",
    height: 180,
    marginBottom: espaco.md,
    borderRadius: raio.md,
    borderWidth: 1,
    borderColor: cores.borda,
    backgroundColor: cores.fundo,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  imagem: {
    width: "100%",
    height: "100%",
  },
  imagemVazia: {
    alignItems: "center",
    justifyContent: "center",
  },
  imagemTexto: {
    color: cores.textoFraco,
    fontSize: fonte.pequena,
  },
  cabecalho: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: espaco.sm,
  },
  nome: {
    flex: 1,
    color: cores.texto,
    fontSize: fonte.corpo,
    fontWeight: "600",
  },
  selo: {
    color: cores.primaria,
    fontSize: fonte.pequena,
    borderWidth: 1,
    borderColor: cores.primaria,
    borderRadius: raio.sm,
    paddingHorizontal: espaco.sm,
    paddingVertical: 2,
    overflow: "hidden",
  },
  descricao: {
    color: cores.textoFraco,
    fontSize: fonte.pequena,
    marginTop: espaco.xs,
  },
  rodape: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: espaco.md,
  },
  preco: {
    color: cores.primaria,
    fontSize: fonte.titulo,
    fontWeight: "700",
  },
  estoque: {
    color: cores.textoFraco,
    fontSize: fonte.pequena,
  },
  estoqueBaixo: {
    color: cores.alerta,
  },
  estoqueEsgotado: {
    color: cores.perigo,
  },
  acao: {
    marginTop: espaco.md,
    height: 44,
    borderRadius: raio.md,
    backgroundColor: cores.primaria,
    alignItems: "center",
    justifyContent: "center",
  },
  acaoBloqueada: {
    backgroundColor: cores.superficieClara,
    borderWidth: 1,
    borderColor: cores.borda,
  },
  acaoTexto: {
    color: cores.fundo,
    fontSize: fonte.pequena,
    fontWeight: "700",
  },
  acaoTextoBloqueado: {
    color: cores.textoFraco,
  },
});
