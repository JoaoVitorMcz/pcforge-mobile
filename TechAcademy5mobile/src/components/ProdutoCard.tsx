import { StyleSheet, Text, View } from "react-native";
import { cores, espaco, fonte, formatarPreco, raio } from "@/theme";
import type { Produto } from "@/types";

const ESTOQUE_BAIXO = 5;

export function ProdutoCard({ produto }: { produto: Produto }) {
  const semEstoque = produto.estoque <= 0;

  return (
    <View style={estilos.card}>
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
});
