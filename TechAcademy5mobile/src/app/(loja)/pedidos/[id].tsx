import { useCallback, useState } from "react";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { Botao } from "@/components/Botao";
import { EstadoLista } from "@/components/EstadoLista";
import { EtiquetaStatus } from "@/components/EtiquetaStatus";
import { useAuth } from "@/contexts/AuthContext";
import { buscarPedido, cancelarPedido } from "@/services/pedidos";
import { cores, espaco, fonte, formatarPreco, raio } from "@/theme";
import type { Pedido } from "@/types";

/** Status a partir dos quais o backend ainda aceita cancelar. */
const CANCELAVEIS = ["pendente", "pago", "em_preparacao"];

function resumirEndereco(pedido: Pedido): string {
  const e = pedido.endereco_entrega;

  if (!e) return `Endereço #${pedido.id_endereco_entrega}`;

  const partes = [e.numero, e.bairro, e.cidade, e.estado, e.cep].filter(Boolean);
  return partes.length > 0 ? partes.join(", ") : `Endereço #${pedido.id_endereco_entrega}`;
}

export default function DetalheMeuPedido() {
  const { token } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const idPedido = Number(id);

  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [cancelando, setCancelando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (!token) return;

    try {
      setPedido(await buscarPedido(token, idPedido));
      setErro(null);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível carregar o pedido.");
    } finally {
      setCarregando(false);
    }
  }, [idPedido, token]);

  useFocusEffect(
    useCallback(() => {
      void carregar();
    }, [carregar])
  );

  const confirmarCancelamento = () => {
    Alert.alert(
      "Cancelar pedido",
      "Os itens voltam para o estoque e o pedido não pode ser reaberto.",
      [
        { text: "Voltar", style: "cancel" },
        {
          text: "Cancelar pedido",
          style: "destructive",
          onPress: async () => {
            if (!token) return;

            setCancelando(true);

            try {
              await cancelarPedido(token, idPedido);
              router.back();
            } catch (e) {
              Alert.alert(
                "Não foi possível cancelar",
                e instanceof Error ? e.message : "Tente novamente."
              );
            } finally {
              setCancelando(false);
            }
          },
        },
      ]
    );
  };

  if (carregando || erro || !pedido) {
    return <EstadoLista carregando={carregando} erro={erro} aoTentarNovamente={carregar} />;
  }

  const status = pedido.status ?? "pendente";

  return (
    <ScrollView contentContainerStyle={estilos.conteudo}>
      <View style={estilos.cabecalho}>
        <Text style={estilos.numero}>Pedido #{pedido.id_pedido}</Text>
        <EtiquetaStatus status={status} />
      </View>

      <Text style={estilos.secao}>Entrega</Text>
      <View style={estilos.painel}>
        <Text style={estilos.endereco}>{resumirEndereco(pedido)}</Text>
      </View>

      <Text style={estilos.secao}>Itens</Text>
      <View style={estilos.painel}>
        {(pedido.itens ?? []).map((item) => (
          <View key={item.id_item} style={estilos.item}>
            <Text style={estilos.itemNome} numberOfLines={2}>
              {item.produto?.nome ?? `Produto #${item.id_produto}`}
            </Text>
            <Text style={estilos.itemQtd}>
              {item.quantidade} × {formatarPreco(Number(item.preco_unitario))}
            </Text>
          </View>
        ))}

        <View style={estilos.total}>
          <Text style={estilos.totalRotulo}>Total</Text>
          <Text style={estilos.totalValor}>{formatarPreco(Number(pedido.valor ?? 0))}</Text>
        </View>
      </View>

      {CANCELAVEIS.includes(status) ? (
        <View style={estilos.acao}>
          <Botao
            titulo="Cancelar pedido"
            variante="secundaria"
            carregando={cancelando}
            aoPressionar={confirmarCancelamento}
          />
        </View>
      ) : (
        <Text style={estilos.nota}>
          Pedidos com status &quot;{status}&quot; não podem mais ser cancelados.
        </Text>
      )}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  conteudo: {
    padding: espaco.md,
    paddingBottom: espaco.xl,
  },
  cabecalho: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: espaco.sm,
  },
  numero: {
    color: cores.texto,
    fontSize: fonte.destaque,
    fontWeight: "700",
  },
  secao: {
    color: cores.texto,
    fontSize: fonte.corpo,
    fontWeight: "700",
    marginTop: espaco.md,
    marginBottom: espaco.sm,
  },
  painel: {
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderWidth: 1,
    borderRadius: raio.md,
    paddingHorizontal: espaco.md,
  },
  endereco: {
    color: cores.texto,
    fontSize: fonte.corpo,
    paddingVertical: espaco.md,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: espaco.md,
    paddingVertical: 12,
    borderBottomColor: cores.borda,
    borderBottomWidth: 1,
  },
  itemNome: {
    flex: 1,
    color: cores.texto,
    fontSize: fonte.corpo,
  },
  itemQtd: {
    color: cores.textoFraco,
    fontSize: fonte.pequena,
  },
  total: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: espaco.md,
  },
  totalRotulo: {
    color: cores.texto,
    fontSize: fonte.corpo,
    fontWeight: "700",
  },
  totalValor: {
    color: cores.primaria,
    fontSize: fonte.corpo,
    fontWeight: "700",
  },
  acao: {
    marginTop: espaco.lg,
  },
  nota: {
    color: cores.textoFraco,
    fontSize: fonte.pequena,
    marginTop: espaco.lg,
    textAlign: "center",
  },
});
